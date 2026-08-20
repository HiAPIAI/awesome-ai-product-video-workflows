import fs from 'node:fs';
import path from 'node:path';
import {parseDocument} from 'yaml';
import type {DemoV1} from '../contracts/types.js';
import {DemoValidationError, type ValidationIssue} from './errors.js';
import {resolveAsset, type ResolvedAsset} from './paths.js';
import {validateSourceSchema} from './schema.js';

const MAX_SOURCE_BYTES = 1024 * 1024;
const forbiddenKeys = new Set(['__proto__', 'prototype', 'constructor']);

export interface ValidatedDemo {
  demo: DemoV1;
  sourcePath: string;
  sourceDirectory: string;
  sourceBuffer: Buffer;
  assets: ResolvedAsset[];
}

export function validateDemoFile(file: string): ValidatedDemo {
  const sourcePath = path.resolve(file);
  const sourceDirectory = path.dirname(sourcePath);
  const sourceBuffer = readSource(sourcePath);
  const parsed = parseYaml(sourceBuffer.toString('utf8'));
  const schema = validateSourceSchema(parsed);
  if (!schema.valid) throw new DemoValidationError(schema.issues);
  const value = schema.value;

  const issues: ValidationIssue[] = [];
  const resolvedAssets: ResolvedAsset[] = [];
  checkUnique(value.assets, 'assets', issues);
  checkUnique(value.scenes, 'scenes', issues);
  checkUnique(value.audio ?? [], 'audio', issues);
  checkUnique(value.outputs, 'outputs', issues);
  checkUnique(value.hiapi?.enhancements ?? [], 'hiapi.enhancements', issues);

  const assetById = new Map(value.assets.map((asset) => [asset.id, asset]));
  for (const [index, asset] of value.assets.entries()) {
    try {
      resolvedAssets.push(resolveAsset(sourceDirectory, asset));
    } catch (error) {
      issues.push({path: `/assets/${index}/path`, message: errorMessage(error)});
    }
  }

  if (value.brand.logoAssetId) {
    const logo = assetById.get(value.brand.logoAssetId);
    if (!logo) issues.push({path: '/brand/logoAssetId', message: `references unknown asset ${value.brand.logoAssetId}`});
    else if (logo.type !== 'image') issues.push({path: '/brand/logoAssetId', message: 'must reference an image asset'});
  }

  const sortedScenes = [...value.scenes].sort((left, right) => left.startFrame - right.startFrame || left.id.localeCompare(right.id));
  let previousEnd = 0;
  for (const scene of sortedScenes) {
    const index = value.scenes.indexOf(scene);
    const endFrame = scene.startFrame + scene.durationFrames;
    if (endFrame > value.canvas.durationFrames) {
      issues.push({path: `/scenes/${index}`, message: `ends at frame ${endFrame}, beyond canvas duration ${value.canvas.durationFrames}`});
    }
    if (scene.startFrame < previousEnd) {
      issues.push({path: `/scenes/${index}/startFrame`, message: `overlaps the previous scene ending at frame ${previousEnd}`});
    }
    previousEnd = Math.max(previousEnd, endFrame);
    for (const field of ['assetId', 'secondaryAssetId'] as const) {
      const assetId = scene[field];
      if (!assetId) continue;
      const asset = assetById.get(assetId);
      if (!asset) issues.push({path: `/scenes/${index}/${field}`, message: `references unknown asset ${assetId}`});
      else if (!['image', 'video'].includes(asset.type)) issues.push({path: `/scenes/${index}/${field}`, message: 'must reference an image or video asset'});
    }
    for (const [clickIndex, frame] of (scene.cursor?.clickFrames ?? []).entries()) {
      if (frame >= scene.durationFrames) issues.push({path: `/scenes/${index}/cursor/clickFrames/${clickIndex}`, message: 'must be relative to and inside the scene duration'});
    }
    for (const [calloutIndex, callout] of (scene.callouts ?? []).entries()) {
      if (callout.startFrame + callout.durationFrames > scene.durationFrames) {
        issues.push({path: `/scenes/${index}/callouts/${calloutIndex}`, message: 'extends beyond the scene duration'});
      }
    }
  }

  for (const [index, track] of (value.audio ?? []).entries()) {
    const asset = assetById.get(track.assetId);
    if (!asset) issues.push({path: `/audio/${index}/assetId`, message: `references unknown asset ${track.assetId}`});
    else if (asset.type !== 'audio') issues.push({path: `/audio/${index}/assetId`, message: 'must reference an audio asset'});
    if (track.startFrame >= value.canvas.durationFrames) issues.push({path: `/audio/${index}/startFrame`, message: 'must be inside the canvas duration'});
  }

  const outputNames = new Set<string>();
  for (const [index, output] of value.outputs.entries()) {
    const normalized = output.fileName.toLowerCase();
    if (outputNames.has(normalized)) issues.push({path: `/outputs/${index}/fileName`, message: 'duplicates another output filename'});
    outputNames.add(normalized);
  }

  if (value.hiapi) {
    if (!value.hiapi.enabled && value.hiapi.enhancements.length > 0) {
      issues.push({path: '/hiapi/enhancements', message: 'must be empty when HiAPI enhancements are disabled'});
    }
    if (value.hiapi.enabled && value.hiapi.enhancements.length === 0) {
      issues.push({path: '/hiapi/enhancements', message: 'must contain at least one enhancement when enabled'});
    }
    for (const [index, enhancement] of value.hiapi.enhancements.entries()) {
      for (const assetId of enhancement.inputAssetIds ?? []) {
        if (!assetById.has(assetId)) issues.push({path: `/hiapi/enhancements/${index}/inputAssetIds`, message: `references unknown asset ${assetId}`});
      }
      if ((enhancement.inputAssetIds?.length ?? 0) > 0) {
        issues.push({path: `/hiapi/enhancements/${index}/inputAssetIds`, message: 'asset-backed HiAPI enhancements are reserved for a later contract; demo-v1 supports prompt-only non-UI enhancements'});
      }
    }
  }

  if (issues.length) throw new DemoValidationError(issues);
  return {demo: value, sourcePath, sourceDirectory, sourceBuffer, assets: resolvedAssets};
}

function readSource(file: string): Buffer {
  let stat: fs.Stats;
  try {
    stat = fs.lstatSync(file);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') throw new Error(`Demo file does not exist: ${file}`);
    throw error;
  }
  if (stat.isSymbolicLink()) throw new Error('Demo file must not be a symbolic link.');
  if (!stat.isFile()) throw new Error(`Demo path is not a regular file: ${file}`);
  if (stat.size <= 0) throw new Error('Demo file is empty.');
  if (stat.size > MAX_SOURCE_BYTES) throw new Error('Demo file exceeds the 1 MiB source limit.');
  return fs.readFileSync(file);
}

function parseYaml(text: string): unknown {
  const document = parseDocument(text, {uniqueKeys: true, merge: false});
  if (document.errors.length) {
    throw new DemoValidationError(document.errors.map((error) => ({path: '/', message: error.message.split('\n')[0] ?? 'invalid YAML'})), 'Unable to parse demo YAML.');
  }
  let value: unknown;
  try {
    value = document.toJS({maxAliasCount: 0}) as unknown;
  } catch (error) {
    throw new DemoValidationError([{path: '/', message: errorMessage(error)}], 'Unable to parse demo YAML.');
  }
  assertSafeObjectKeys(value, '/');
  return value;
}

function assertSafeObjectKeys(value: unknown, pointer: string): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertSafeObjectKeys(item, `${pointer}${index}/`));
    return;
  }
  if (value === null || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value)) {
    if (forbiddenKeys.has(key)) throw new DemoValidationError([{path: pointer, message: `contains forbidden object key ${key}`}]);
    assertSafeObjectKeys(item, `${pointer}${key}/`);
  }
}

function checkUnique(items: Array<{id: string}>, label: string, issues: ValidationIssue[]): void {
  const seen = new Set<string>();
  items.forEach((item, index) => {
    if (seen.has(item.id)) issues.push({path: `/${label}/${index}/id`, message: `duplicates id ${item.id}`});
    seen.add(item.id);
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
