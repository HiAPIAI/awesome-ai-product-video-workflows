import fs from 'node:fs';
import path from 'node:path';
import {canonicalJson, sha256} from '../contracts/canonical.js';
import {isPlainObject} from '../contracts/canonical.js';
import type {PendingJournal} from './types.js';

const PENDING_RETRY_WINDOW_MS = 23 * 60 * 60 * 1000;

export interface PendingJournalInput {
  endpoint: string;
  preflightToken: string;
  requestHash: string;
  apiIdentityBinding: string;
}

export function ensureOutputDirectory(directory: string): string {
  const absolute = path.resolve(directory);
  if (path.parse(absolute).root === absolute) throw new Error('Refusing to use a filesystem root as the output directory.');
  fs.mkdirSync(absolute, {recursive: true});
  const stat = fs.lstatSync(absolute);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('Output directory must be a real directory, not a symbolic link.');
  return absolute;
}

export function bindApiIdentity(apiKey: string, preflightToken: string): string {
  assertSha256(preflightToken, 'preflight token');
  return sha256(`hiapi-api-identity-v1\0${preflightToken}\0${apiKey}`);
}

export function pendingJournalPath(outputDirectory: string, preflightToken: string): string {
  assertSha256(preflightToken, 'preflight token');
  return path.join(outputDirectory, `preflight-${preflightToken}.pending.json`);
}

export function ensurePendingJournal(file: string, input: PendingJournalInput, now = Date.now()): {journal: PendingJournal; reused: boolean} {
  if (!Number.isFinite(now)) throw new Error('Pending-journal clock is invalid.');
  assertSha256(input.preflightToken, 'preflight token');
  assertSha256(input.requestHash, 'request hash');
  assertSha256(input.apiIdentityBinding, 'API identity binding');
  if (fs.existsSync(file)) {
    const existing = readPendingJournal(file);
    if (existing.preflightToken !== input.preflightToken || existing.endpoint !== input.endpoint || existing.requestHash !== input.requestHash) {
      throw new Error('Existing pending journal does not match this endpoint and exact request.');
    }
    if (existing.apiIdentityBinding !== input.apiIdentityBinding) {
      throw new Error('Existing pending journal belongs to a different API credential. Reconcile task history and billing before retrying.');
    }
    const firstAttempt = Date.parse(existing.firstAttemptAt);
    const age = now - firstAttempt;
    if (!Number.isFinite(firstAttempt) || age < 0 || age >= PENDING_RETRY_WINDOW_MS) {
      throw new Error('Pending submission is outside the 23-hour idempotency retry window. Reconcile task history and billing before resubmitting.');
    }
    return {journal: existing, reused: true};
  }
  const journal: PendingJournal = {
    schemaVersion: 'hiapi-pending-v1',
    state: 'pending_submit',
    ...input,
    firstAttemptAt: new Date(now).toISOString(),
    retrySafeUntil: new Date(now + PENDING_RETRY_WINDOW_MS).toISOString(),
  };
  fs.mkdirSync(path.dirname(file), {recursive: true});
  try {
    fs.writeFileSync(file, `${canonicalJson(journal, 2)}\n`, {encoding: 'utf8', flag: 'wx'});
    return {journal, reused: false};
  } catch (error) {
    if (isNodeError(error) && error.code === 'EEXIST') return ensurePendingJournal(file, input, now);
    throw error;
  }
}

export function writeJsonArtifact(file: string, value: unknown): string {
  const content = `${canonicalJson(value, 2)}\n`;
  if (fs.existsSync(file)) {
    if (fs.readFileSync(file, 'utf8') === content) return file;
    throw new Error(`Refusing to replace a different HiAPI artifact: ${path.basename(file)}`);
  }
  fs.mkdirSync(path.dirname(file), {recursive: true});
  const temporary = `${file}.tmp-${process.pid}`;
  try {
    fs.writeFileSync(temporary, content, {encoding: 'utf8', flag: 'wx'});
    fs.linkSync(temporary, file);
  } catch (error) {
    if (isNodeError(error) && error.code === 'EEXIST' && fs.existsSync(file) && fs.readFileSync(file, 'utf8') === content) return file;
    throw error;
  } finally {
    fs.rmSync(temporary, {force: true});
  }
  return file;
}

function readPendingJournal(file: string): PendingJournal {
  let value: unknown;
  try {
    value = JSON.parse(fs.readFileSync(file, 'utf8')) as unknown;
  } catch (error) {
    throw new Error(`Unable to read pending journal: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!isPlainObject(value)
    || value.schemaVersion !== 'hiapi-pending-v1'
    || value.state !== 'pending_submit'
    || typeof value.endpoint !== 'string'
    || typeof value.preflightToken !== 'string'
    || typeof value.requestHash !== 'string'
    || typeof value.apiIdentityBinding !== 'string'
    || typeof value.firstAttemptAt !== 'string'
    || typeof value.retrySafeUntil !== 'string') {
    throw new Error('Pending journal is malformed. Reconcile task history and billing before resubmitting.');
  }
  return value as unknown as PendingJournal;
}

function assertSha256(value: string, label: string): void {
  if (!/^[a-f0-9]{64}$/.test(value)) throw new Error(`Invalid ${label}.`);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}
