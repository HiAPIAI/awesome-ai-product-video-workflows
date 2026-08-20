import {createHash, randomUUID} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {assertSafeDownloadUrl} from './security.js';
import type {DownloadResult} from './types.js';

const DEFAULT_MAX_DOWNLOAD_BYTES = 1024 * 1024 * 1024;

export interface DownloadOptions {
  allowLocal?: boolean;
  timeoutMs?: number;
  maxBytes?: number;
}

export async function downloadOutput(urlValue: string, destinationValue: string, options: DownloadOptions = {}): Promise<DownloadResult> {
  const url = assertSafeDownloadUrl(urlValue, options.allowLocal ?? false);
  const destination = path.resolve(destinationValue);
  if (path.extname(destination).toLowerCase() !== '.mp4') throw new Error('Downloaded HiAPI output must use an .mp4 destination.');
  if (fs.existsSync(destination)) throw new Error(`Refusing to replace an existing downloaded output: ${path.basename(destination)}`);
  fs.mkdirSync(path.dirname(destination), {recursive: true});
  const maxBytes = finiteInteger(options.maxBytes ?? DEFAULT_MAX_DOWNLOAD_BYTES, 16, DEFAULT_MAX_DOWNLOAD_BYTES, 'download byte limit');
  const timeoutMs = finiteInteger(options.timeoutMs ?? 10 * 60_000, 50, 60 * 60_000, 'download timeout');
  const temporary = `${destination}.part-${randomUUID()}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let descriptor: number | undefined;
  try {
    const response = await fetch(url, {redirect: 'error', signal: controller.signal});
    if (!response.ok) throw new Error(`Output download failed with HTTP ${response.status}.`);
    const contentType = response.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase();
    if (contentType !== 'video/mp4' && contentType !== 'application/octet-stream') {
      throw new Error(`Output download returned unexpected Content-Type ${contentType ?? '(missing)'}.`);
    }
    const contentLength = Number(response.headers.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > maxBytes) throw new Error(`Output download exceeds ${maxBytes} bytes.`);
    if (!response.body) throw new Error('Output download returned an empty response body.');
    descriptor = fs.openSync(temporary, 'wx');
    const reader = response.body.getReader();
    const hash = createHash('sha256');
    let bytes = 0;
    let signature = Buffer.alloc(0);
    try {
      while (true) {
        const {done, value} = await reader.read();
        if (done) break;
        const chunk = Buffer.from(value);
        bytes += chunk.length;
        if (bytes > maxBytes) throw new Error(`Output download exceeds ${maxBytes} bytes.`);
        if (signature.length < 16) signature = Buffer.concat([signature, chunk]).subarray(0, 16);
        hash.update(chunk);
        fs.writeSync(descriptor, chunk);
      }
    } finally {
      await reader.cancel().catch(() => {});
    }
    fs.closeSync(descriptor);
    descriptor = undefined;
    if (bytes < 12 || signature.toString('ascii', 4, 8) !== 'ftyp') throw new Error('Downloaded output is not a recognizable MP4 file.');
    fs.linkSync(temporary, destination);
    fs.rmSync(temporary, {force: true});
    return {destination, bytes, sha256: hash.digest('hex')};
  } catch (error) {
    if (controller.signal.aborted) throw new Error(`Output download timed out after ${timeoutMs} milliseconds.`);
    if (isNodeError(error) && error.code === 'EEXIST') throw new Error(`Refusing to replace an existing downloaded output: ${path.basename(destination)}`);
    throw error;
  } finally {
    clearTimeout(timer);
    if (descriptor !== undefined) fs.closeSync(descriptor);
    fs.rmSync(temporary, {force: true});
  }
}

function finiteInteger(value: number, minimum: number, maximum: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) throw new Error(`Invalid ${label}.`);
  return value;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}
