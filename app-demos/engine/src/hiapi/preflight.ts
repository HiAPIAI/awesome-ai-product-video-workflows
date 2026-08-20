import fs from 'node:fs';
import path from 'node:path';
import {canonicalJson, isPlainObject, sha256} from '../contracts/canonical.js';
import type {HiapiRequest} from '../contracts/types.js';
import {assertSafeBaseUrl} from './security.js';
import type {PreparedHiapiRequest} from './types.js';

const MAX_REQUEST_FILE_BYTES = 1024 * 1024;
const identifier = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const forbiddenKeys = new Set(['__proto__', 'prototype', 'constructor']);
const credentialKey = /^(?:authorization|cookie|api[-_]?key|access[-_]?token|password|secret)$/i;

export function readHiapiRequestFile(file: string): HiapiRequest {
  const absolute = path.resolve(file);
  let stat: fs.Stats;
  try {
    stat = fs.lstatSync(absolute);
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') throw new Error(`HiAPI request file does not exist: ${path.basename(file)}`);
    throw error;
  }
  if (stat.isSymbolicLink()) throw new Error('HiAPI request file must not be a symbolic link.');
  if (!stat.isFile()) throw new Error('HiAPI request path must be a regular file.');
  if (stat.size <= 0 || stat.size > MAX_REQUEST_FILE_BYTES) throw new Error('HiAPI request file must be between 1 byte and 1 MiB.');
  let value: unknown;
  try {
    value = JSON.parse(fs.readFileSync(absolute, 'utf8')) as unknown;
  } catch (error) {
    throw new Error(`Unable to parse HiAPI request JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  return validateHiapiRequest(value);
}

export function validateHiapiRequest(value: unknown): HiapiRequest {
  if (!isPlainObject(value)) throw new Error('HiAPI request must be a JSON object.');
  const allowedKeys = new Set(['id', 'endpoint', 'model', 'purpose', 'inputAssetIds', 'body']);
  for (const key of Object.keys(value)) if (!allowedKeys.has(key)) throw new Error(`HiAPI request contains unknown field ${key}.`);
  if (typeof value.id !== 'string' || !identifier.test(value.id) || value.id.length > 80) throw new Error('HiAPI request id must be lowercase kebab-case.');
  if (value.endpoint !== '/v1/tasks') throw new Error('HiAPI request endpoint must be /v1/tasks.');
  if (typeof value.model !== 'string' || !value.model.trim() || value.model.length > 120) throw new Error('HiAPI request model is invalid.');
  if (!['background', 'intro', 'transition', 'outro'].includes(String(value.purpose))) throw new Error('HiAPI request purpose is invalid.');
  if ('inputAssetIds' in value && (!Array.isArray(value.inputAssetIds) || value.inputAssetIds.length > 0)) {
    throw new Error('demo-v1 HiAPI requests must be prompt-only and cannot contain inputAssetIds.');
  }
  if (!isPlainObject(value.body) || Object.keys(value.body).length === 0) throw new Error('HiAPI request body must be a non-empty object.');
  assertNoCredentials(value.body, '/body');
  if (value.body.model !== value.model) throw new Error('HiAPI request body.model must match the compiled request model.');
  if (!isPlainObject(value.body.input) || typeof value.body.input.prompt !== 'string' || !value.body.input.prompt.trim()) {
    throw new Error('demo-v1 HiAPI request body requires a non-empty input.prompt.');
  }
  return value as unknown as HiapiRequest;
}

export function prepareHiapiRequest(request: HiapiRequest, baseUrlValue = 'https://api.hiapi.ai'): PreparedHiapiRequest {
  const baseUrl = assertSafeBaseUrl(baseUrlValue);
  const endpoint = `${baseUrl}${request.endpoint}`;
  const bodyJson = canonicalJson(request.body);
  const bodyBytes = Buffer.byteLength(bodyJson);
  if (bodyBytes > MAX_REQUEST_FILE_BYTES) throw new Error('HiAPI request body exceeds the 1 MiB local safety limit.');
  const requestHash = sha256(bodyJson);
  const preflightToken = sha256(canonicalJson({endpoint, method: 'POST', body: request.body}));
  return {
    request,
    baseUrl,
    endpoint,
    preflightToken,
    requestHash,
    summary: {
      endpoint,
      method: 'POST',
      requestId: request.id,
      model: request.model,
      purpose: request.purpose,
      bodyBytes,
      bodySha256: requestHash,
    },
  };
}

function assertNoCredentials(value: unknown, pointer: string): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoCredentials(item, `${pointer}/${index}`));
    return;
  }
  if (!isPlainObject(value)) return;
  for (const [key, item] of Object.entries(value)) {
    if (forbiddenKeys.has(key) || credentialKey.test(key)) throw new Error(`HiAPI request must not contain credentials at ${pointer}/${key}.`);
    assertNoCredentials(item, `${pointer}/${key}`);
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}
