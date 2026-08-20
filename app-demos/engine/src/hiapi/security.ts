import {isIP} from 'node:net';

const officialApiHosts = new Set(['api.hiapi.ai', 'apidev.hiapi.ai']);
const reservedWindowsName = /^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;

export function normalizeApiKey(value: string | undefined): string {
  const key = value?.trim();
  if (!key) throw new Error('HIAPI_API_KEY is not configured in this process. Never pass it in command arguments or paste it into chat.');
  if (/\s/.test(key)) throw new Error('HIAPI_API_KEY contains whitespace and cannot be used.');
  return key;
}

export function assertSafeBaseUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('HiAPI base URL is invalid.');
  }
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('HiAPI base URL must use HTTPS.');
  if (url.username || url.password) throw new Error('HiAPI base URL must not contain credentials.');
  if (url.pathname !== '/' || url.search || url.hash) throw new Error('HiAPI base URL must not contain a path, query, or fragment.');
  const host = normalizedHostname(url.hostname);
  if (url.protocol === 'http:' && !isLoopbackHost(host)) throw new Error('HiAPI base URL must use HTTPS except for an explicitly allowed local test server.');
  return `${url.protocol}//${url.host}`;
}

export function assertTrustedApiTarget(baseUrl: string, allowCustom: boolean): void {
  const url = new URL(assertSafeBaseUrl(baseUrl));
  const host = normalizedHostname(url.hostname);
  if (url.protocol === 'https:' && officialApiHosts.has(host)) return;
  if (allowCustom && ((url.protocol === 'http:' && isLoopbackHost(host)) || url.protocol === 'https:')) return;
  throw new Error('Paid submission is restricted to official HiAPI hosts. Use --allow-custom-base-url only for an explicitly trusted test endpoint.');
}

export function assertSafeDownloadUrl(value: string, allowLocal: boolean): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('HiAPI returned an invalid output URL.');
  }
  if (url.username || url.password) throw new Error('Output URL must not contain credentials.');
  const host = normalizedHostname(url.hostname);
  if (url.protocol === 'http:' && allowLocal && isLoopbackHost(host)) return url.href;
  if (url.protocol !== 'https:') throw new Error('Output download must use HTTPS.');
  if (isPrivateHost(host)) throw new Error('Output URL resolves to a local or private network address.');
  return url.href;
}

export function normalizeTaskId(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('HiAPI response is missing a task ID.');
  const taskId = value.trim();
  if (taskId.length > 128 || !/^[A-Za-z0-9_-]+$/.test(taskId)) throw new Error('HiAPI task ID contains unsafe characters.');
  if (reservedWindowsName.test(taskId)) throw new Error('HiAPI task ID is a reserved Windows filename.');
  return taskId;
}

export function redactText(value: string, secrets: readonly string[]): string {
  let redacted = value;
  for (const secret of secrets) {
    if (secret) redacted = redacted.replaceAll(secret, '[REDACTED]');
  }
  return redacted;
}

export function sanitizeValue(value: unknown, secrets: readonly string[], depth = 0): unknown {
  if (depth > 32) return '[TRUNCATED]';
  if (typeof value === 'string') return redactText(value, secrets);
  if (Array.isArray(value)) return value.map((item) => sanitizeValue(item, secrets, depth + 1));
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeValue(item, secrets, depth + 1)]));
}

function normalizedHostname(hostname: string): string {
  return hostname.replace(/^\[|\]$/g, '').replace(/\.$/, '').toLowerCase();
}

function isLoopbackHost(host: string): boolean {
  return host === 'localhost' || host === '::1' || host === '127.0.0.1' || host.startsWith('127.');
}

function isPrivateHost(host: string): boolean {
  if (isLoopbackHost(host) || host.endsWith('.localhost') || host === '0.0.0.0') return true;
  const family = isIP(host);
  if (family === 4) {
    const octets = host.split('.').map(Number);
    const first = octets[0] ?? -1;
    const second = octets[1] ?? -1;
    return first === 10
      || first === 127
      || (first === 169 && second === 254)
      || (first === 172 && second >= 16 && second <= 31)
      || (first === 192 && second === 168)
      || first === 0;
  }
  if (family === 6) {
    const lower = host.toLowerCase();
    return lower === '::1' || lower === '::' || lower.startsWith('fc') || lower.startsWith('fd') || /^fe[89ab]/.test(lower) || lower.startsWith('::ffff:');
  }
  return false;
}
