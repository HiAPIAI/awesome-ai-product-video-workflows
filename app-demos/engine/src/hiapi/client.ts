import {canonicalJson, isPlainObject} from '../contracts/canonical.js';
import {normalizeTaskId, redactText, sanitizeValue} from './security.js';
import type {HiapiClientConfig, PollConfig} from './types.js';

const SUCCESS_STATUSES = new Set(['success', 'completed']);
const FAILURE_STATUSES = new Set(['fail', 'failed', 'error', 'canceled', 'cancelled']);
const ACTIVE_STATUSES = new Set(['pending', 'queued', 'submitted', 'handling', 'processing', 'running', 'archiving', 'in_progress']);
const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);
const AMBIGUOUS_SUBMISSION_STATUSES = new Set([408, 409, 422, 425, 429]);
const MAX_JSON_RESPONSE_BYTES = 2 * 1024 * 1024;

export class HiapiHttpError extends Error {
  readonly statusCode: number;
  readonly response: unknown;

  constructor(statusCode: number, message: string, response: unknown) {
    super(message);
    this.name = 'HiapiHttpError';
    this.statusCode = statusCode;
    this.response = response;
  }
}

export class HiapiTaskFailureError extends Error {
  readonly taskResponse: unknown;

  constructor(message: string, taskResponse: unknown) {
    super(message);
    this.name = 'HiapiTaskFailureError';
    this.taskResponse = taskResponse;
  }
}

export class HiapiPollTimeoutError extends Error {
  readonly taskId: string;

  constructor(taskId: string, timeoutMs: number) {
    super(`Polling task ${taskId} timed out after ${timeoutMs} milliseconds. Resume with --resume ${taskId}.`);
    this.name = 'HiapiPollTimeoutError';
    this.taskId = taskId;
  }
}

export async function createTask(body: Record<string, unknown>, config: HiapiClientConfig & {idempotencyKey: string}): Promise<{taskId: string; response: unknown; duplicate: boolean}> {
  assertIdempotencyKey(config.idempotencyKey);
  try {
    const response = await requestJson(`${config.baseUrl}/v1/tasks`, {
      method: 'POST',
      apiKey: config.apiKey,
      idempotencyKey: config.idempotencyKey,
      body: canonicalJson(body),
      timeoutMs: config.timeoutMs ?? 60_000,
    });
    return {taskId: normalizeTaskId(extractTaskId(response)), response, duplicate: false};
  } catch (error) {
    if (error instanceof HiapiHttpError && error.statusCode === 409) {
      const duplicateTaskId = extractTaskId(error.response);
      if (duplicateTaskId) return {taskId: normalizeTaskId(duplicateTaskId), response: error.response, duplicate: true};
    }
    throw error;
  }
}

export async function getTask(taskIdValue: string, config: HiapiClientConfig & {retries?: number}): Promise<unknown> {
  const taskId = normalizeTaskId(taskIdValue);
  const retries = finiteInteger(config.retries ?? 2, 0, 5, 'request retries');
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await requestJson(`${config.baseUrl}/v1/tasks/${encodeURIComponent(taskId)}`, {
        method: 'GET',
        apiKey: config.apiKey,
        timeoutMs: config.timeoutMs ?? 60_000,
      });
    } catch (error) {
      lastError = error;
      const retryable = !(error instanceof HiapiHttpError) || RETRYABLE_STATUSES.has(error.statusCode);
      if (!retryable || attempt === retries) throw error;
      await delay(Math.min(1000, 100 * (attempt + 1)));
    }
  }
  throw lastError;
}

export async function waitForTask(taskIdValue: string, config: PollConfig, onUpdate: (status: string) => void = () => {}): Promise<unknown> {
  const taskId = normalizeTaskId(taskIdValue);
  const pollIntervalMs = finiteInteger(config.pollIntervalMs ?? 5000, 10, 60_000, 'poll interval');
  const pollTimeoutMs = finiteInteger(config.pollTimeoutMs ?? 20 * 60_000, 50, 24 * 60 * 60_000, 'poll timeout');
  const deadline = Date.now() + pollTimeoutMs;
  let unknownStatuses = 0;
  while (Date.now() < deadline) {
    const remaining = deadline - Date.now();
    let response: unknown;
    try {
      response = await getTask(taskId, {...config, timeoutMs: Math.max(1, Math.min(config.timeoutMs ?? 60_000, remaining))});
    } catch (error) {
      throw new Error(`${errorMessage(error)} Resume with --resume ${taskId}.`);
    }
    const status = extractStatus(response);
    onUpdate(status);
    if (SUCCESS_STATUSES.has(status)) return response;
    if (FAILURE_STATUSES.has(status)) {
      throw new HiapiTaskFailureError(`HiAPI task ${taskId} failed: ${extractFailureMessage(response)}.`, response);
    }
    if (ACTIVE_STATUSES.has(status)) unknownStatuses = 0;
    else {
      unknownStatuses += 1;
      if (unknownStatuses >= 3) throw new Error(`HiAPI task ${taskId} returned unknown status "${status}" three times. Resume after checking API compatibility.`);
    }
    const waitMs = Math.min(pollIntervalMs, deadline - Date.now());
    if (waitMs > 0) await delay(waitMs);
  }
  throw new HiapiPollTimeoutError(taskId, pollTimeoutMs);
}

export function isDefinitiveSubmissionFailure(error: unknown): boolean {
  if (!(error instanceof HiapiHttpError)) return false;
  return error.statusCode >= 400 && error.statusCode < 500 && !AMBIGUOUS_SUBMISSION_STATUSES.has(error.statusCode);
}

export function extractTaskId(response: unknown): unknown {
  if (!isPlainObject(response)) return null;
  for (const key of ['taskId', 'task_id', 'id']) {
    const value = response[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  for (const key of ['data', 'task', 'result']) {
    const nested = response[key];
    const value = extractTaskId(nested);
    if (value) return value;
  }
  return null;
}

export function extractStatus(response: unknown): string {
  const candidates = nestedObjects(response);
  for (const item of candidates) {
    for (const key of ['status', 'state', 'task_status']) {
      const value = item[key];
      if (typeof value === 'string' && value.trim()) return value.trim().toLowerCase();
    }
  }
  return 'unknown';
}

export function extractOutputUrl(response: unknown): string | null {
  const objects = nestedObjects(response);
  for (const item of objects) {
    const type = typeof item.type === 'string' ? item.type.toLowerCase() : '';
    if (type === 'video') {
      const value = firstUrl(item);
      if (value) return value;
    }
  }
  for (const item of objects) {
    const value = firstUrl(item);
    if (value && /^https?:\/\/[^\s]+\.mp4(?:[?#].*)?$/i.test(value)) return value;
  }
  return null;
}

interface RequestOptions {
  method: 'GET' | 'POST';
  apiKey: string;
  idempotencyKey?: string;
  body?: string;
  timeoutMs: number;
}

async function requestJson(url: string, options: RequestOptions): Promise<unknown> {
  const timeoutMs = finiteInteger(options.timeoutMs, 1, 10 * 60_000, 'request timeout');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${options.apiKey}`,
        ...(options.idempotencyKey ? {'Idempotency-Key': options.idempotencyKey} : {}),
        ...(options.body ? {'Content-Type': 'application/json'} : {}),
      },
      ...(options.body === undefined ? {} : {body: options.body}),
      redirect: 'error',
      signal: controller.signal,
    });
    const length = Number(response.headers.get('content-length'));
    if (Number.isFinite(length) && length > MAX_JSON_RESPONSE_BYTES) {
      throw new Error(`HiAPI response exceeds ${MAX_JSON_RESPONSE_BYTES} bytes.`);
    }
    const bytes = await readBoundedBody(response, MAX_JSON_RESPONSE_BYTES);
    let parsed: unknown = {};
    if (bytes.length > 0) {
      try {
        parsed = JSON.parse(bytes.toString('utf8')) as unknown;
      } catch {
        throw new Error('HiAPI returned invalid JSON.');
      }
    }
    const sanitized = sanitizeValue(parsed, [options.apiKey]);
    if (!response.ok) {
      throw new HiapiHttpError(response.status, `HiAPI HTTP ${response.status}: ${responseMessage(sanitized)}`, sanitized);
    }
    return sanitized;
  } catch (error) {
    if (error instanceof HiapiHttpError) throw error;
    if (controller.signal.aborted) throw new Error(`HiAPI request timed out after ${timeoutMs} milliseconds.`);
    throw new Error(redactText(`HiAPI request failed: ${errorMessage(error)}`, [options.apiKey]));
  } finally {
    clearTimeout(timer);
  }
}

async function readBoundedBody(response: Response, maxBytes: number): Promise<Buffer> {
  if (!response.body) return Buffer.alloc(0);
  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      const chunk = Buffer.from(value);
      total += chunk.length;
      if (total > maxBytes) throw new Error(`HiAPI response exceeds ${maxBytes} bytes.`);
      chunks.push(chunk);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  return Buffer.concat(chunks, total);
}

function responseMessage(response: unknown): string {
  if (!isPlainObject(response)) return 'request rejected';
  const candidates = [response.message, response.error, isPlainObject(response.error) ? response.error.message : undefined];
  return candidates.find((value): value is string => typeof value === 'string' && Boolean(value.trim())) ?? 'request rejected';
}

function extractFailureMessage(response: unknown): string {
  for (const item of nestedObjects(response)) {
    const code = typeof item.code === 'string' ? item.code : '';
    const message = typeof item.message === 'string' ? item.message : typeof item.error === 'string' ? item.error : '';
    if (code || message) return [code, message].filter(Boolean).join(' - ');
  }
  return `terminal status ${extractStatus(response)}`;
}

function nestedObjects(value: unknown, depth = 0): Record<string, unknown>[] {
  if (depth > 12) return [];
  if (Array.isArray(value)) return value.flatMap((item) => nestedObjects(item, depth + 1));
  if (!isPlainObject(value)) return [];
  return [value, ...Object.values(value).flatMap((item) => nestedObjects(item, depth + 1))];
}

function firstUrl(item: Record<string, unknown>): string | null {
  for (const key of ['url', 'video_url', 'videoUrl', 'download_url', 'downloadUrl']) {
    const value = item[key];
    if (typeof value === 'string' && /^https?:\/\//i.test(value)) return value;
  }
  return null;
}

function assertIdempotencyKey(value: string): void {
  if (!/^[a-f0-9]{64}$/.test(value)) throw new Error('HiAPI submission requires the exact 64-character preflight token as its idempotency key.');
}

function finiteInteger(value: number, minimum: number, maximum: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) throw new Error(`Invalid ${label}; expected an integer from ${minimum} to ${maximum}.`);
  return value;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
