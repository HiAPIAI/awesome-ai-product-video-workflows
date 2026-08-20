import path from 'node:path';
import {DemoValidationError, formatValidationError} from '../compiler/errors.js';

export function fail(error: unknown): never {
  const message = error instanceof DemoValidationError
    ? formatValidationError(error)
    : error instanceof Error
      ? error.message
      : String(error);
  console.error(redactEnvironmentSecret(message));
  process.exit(1);
}

export function displayPath(file: string): string {
  const relative = path.relative(process.cwd(), path.resolve(file));
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative)
    ? relative.replaceAll('\\', '/')
    : path.basename(file);
}

function redactEnvironmentSecret(value: string): string {
  const apiKey = process.env.HIAPI_API_KEY?.trim();
  return apiKey ? value.replaceAll(apiKey, '[REDACTED]') : value;
}
