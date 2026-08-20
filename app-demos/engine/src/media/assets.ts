import {createHash} from 'node:crypto';
import {access, readFile, stat} from 'node:fs/promises';
import {isAbsolute, dirname, extname, relative, resolve} from 'node:path';
import type {CompiledAsset, CompiledDemoV1} from '../contracts/types.js';

export interface ResolvedAsset extends CompiledAsset {
  absolutePath: string;
  verifiedSvg?: Buffer;
}
function isInside(root: string, target: string): boolean {
  const pathFromRoot = relative(root, target);
  return pathFromRoot === '' || (!pathFromRoot.startsWith('..') && !isAbsolute(pathFromRoot));
}

export function assertSafeRelativePath(value: string, label: string): void {
  if (
    value.length === 0 ||
    isAbsolute(value) ||
    /^[a-z][a-z0-9+.-]*:/i.test(value) ||
    value.split(/[\\/]+/).includes('..')
  ) {
    throw new Error(`${label} must be a project-relative local path: ${value}`);
  }
}

async function firstExisting(candidates: readonly string[]): Promise<string | undefined> {
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Continue through deterministic project-root candidates.
    }
  }
  return undefined;
}

export async function resolveAndVerifyAssets(
  compiled: CompiledDemoV1,
  compiledPath: string,
  workingDirectory: string,
): Promise<Map<string, ResolvedAsset>> {
  const compiledDirectory = dirname(compiledPath);
  assertSafeRelativePath(compiled.source.path, 'source.path');
  const sourceDirectoryCandidates = [
    dirname(resolve(compiledDirectory, compiled.source.path)),
    dirname(resolve(workingDirectory, compiled.source.path)),
  ];
  const roots = [compiledDirectory, ...sourceDirectoryCandidates, workingDirectory];
  const resolvedAssets = new Map<string, ResolvedAsset>();

  for (const asset of compiled.assets) {
    assertSafeRelativePath(asset.path, `assets.${asset.id}.path`);
    const candidates = roots.map((root) => resolve(root, asset.path)).filter((candidate, index, all) => {
      return all.indexOf(candidate) === index && roots.some((root) => isInside(root, candidate));
    });
    const absolutePath = await firstExisting(candidates);
    if (!absolutePath) {
      throw new Error(`Asset ${asset.id} was not found at any project-relative candidate: ${asset.path}`);
    }

    const [contents, metadata] = await Promise.all([readFile(absolutePath), stat(absolutePath)]);
    const sha256 = createHash('sha256').update(contents).digest('hex');
    if (metadata.size !== asset.bytes) {
      throw new Error(`Asset ${asset.id} byte size differs from the compiled manifest.`);
    }
    if (sha256 !== asset.sha256) {
      throw new Error(`Asset ${asset.id} SHA-256 differs from the compiled manifest.`);
    }
    const verifiedSvg = asset.type === 'image' && extname(asset.path).toLowerCase() === '.svg'
      ? {verifiedSvg: contents}
      : {};
    resolvedAssets.set(asset.id, {...asset, absolutePath, ...verifiedSvg});
  }

  return resolvedAssets;
}
