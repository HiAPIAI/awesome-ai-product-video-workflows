import fs from 'node:fs';
import path from 'node:path';
import type {AssetSpec} from '../contracts/types.js';

const MAX_ASSET_BYTES = 128 * 1024 * 1024;
const unsafeWindowsName = /^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i;

export interface ResolvedAsset {
  spec: AssetSpec;
  absolutePath: string;
  relativePath: string;
  buffer: Buffer;
  bytes: number;
}

export function resolveAsset(rootDirectory: string, spec: AssetSpec): ResolvedAsset {
  const relativePath = normalizeRelativeAssetPath(spec.path);
  const absolutePath = path.resolve(rootDirectory, ...relativePath.split('/'));
  assertContained(rootDirectory, absolutePath, `Asset ${spec.id}`);

  let linkStat: fs.Stats;
  try {
    linkStat = fs.lstatSync(absolutePath);
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      throw new Error(`Asset ${spec.id} does not exist: ${relativePath}`);
    }
    throw error;
  }
  if (linkStat.isSymbolicLink()) throw new Error(`Asset ${spec.id} must not be a symbolic link.`);
  if (!linkStat.isFile()) throw new Error(`Asset ${spec.id} is not a regular file: ${relativePath}`);
  if (linkStat.size <= 0) throw new Error(`Asset ${spec.id} is empty: ${relativePath}`);
  if (linkStat.size > MAX_ASSET_BYTES) throw new Error(`Asset ${spec.id} exceeds the 128 MiB local safety limit.`);

  const realRoot = fs.realpathSync(rootDirectory);
  const realFile = fs.realpathSync(absolutePath);
  assertContained(realRoot, realFile, `Asset ${spec.id}`);
  const buffer = readStableFile(realFile, linkStat.size);
  return {spec, absolutePath: realFile, relativePath, buffer, bytes: buffer.length};
}

export function normalizeRelativeAssetPath(value: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Asset path is empty.');
  const raw = value.trim();
  if (/^[A-Za-z]:[\\/]/.test(raw) || raw.startsWith('/') || raw.startsWith('\\\\') || path.isAbsolute(raw)) {
    throw new Error('Asset paths must be project-relative.');
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.includes('://') || raw.includes('?') || raw.includes('#')) {
    throw new Error('Asset paths must not be URLs, data URIs, or signed links.');
  }
  if (/\0|[\x00-\x1f\x7f]/.test(raw)) throw new Error('Asset path contains control characters.');

  const parts = raw.replaceAll('\\', '/').split('/');
  if (parts.some((part) => !part || part === '.' || part === '..')) {
    throw new Error('Asset paths must not contain empty, current-directory, or parent-directory segments.');
  }
  if (parts.some((part) => unsafeWindowsName.test(part) || /[<>:"|?*]/.test(part) || /[ .]$/.test(part))) {
    throw new Error('Asset path contains a reserved or ambiguous Windows path segment.');
  }
  return parts.join('/');
}

function readStableFile(file: string, expectedBytes: number): Buffer {
  const descriptor = fs.openSync(file, 'r');
  try {
    const before = fs.fstatSync(descriptor);
    if (!before.isFile() || before.size !== expectedBytes) throw new Error(`Asset changed before it could be read: ${file}`);
    const buffer = fs.readFileSync(descriptor);
    const after = fs.fstatSync(descriptor);
    if (buffer.length !== before.size || after.size !== before.size || after.mtimeMs !== before.mtimeMs) {
      throw new Error(`Asset changed while it was being read: ${file}`);
    }
    return buffer;
  } finally {
    fs.closeSync(descriptor);
  }
}

function assertContained(root: string, target: string, label: string): void {
  const relative = path.relative(root, target);
  if (!relative || relative === '.') return;
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`${label} resolves outside the demo directory.`);
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}
