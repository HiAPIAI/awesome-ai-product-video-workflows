import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {Ajv2020, type AnySchema} from 'ajv/dist/2020.js';
import type {CompiledDemoV1} from '../contracts/types.js';
import {assertSafeRelativePath} from '../media/assets.js';

export interface LoadedCompiledDemo {
  compiled: CompiledDemoV1;
  path: string;
  sha256: string;
}

export async function loadCompiledDemo(path: string): Promise<LoadedCompiledDemo> {
  const absolutePath = resolve(path);
  const [contents, schemaContents] = await Promise.all([
    readFile(absolutePath),
    readFile(new URL('../../schemas/compiled-demo-v1.schema.json', import.meta.url), 'utf8'),
  ]);
  let value: unknown;
  try {
    value = JSON.parse(contents.toString('utf8')) as unknown;
  } catch (error) {
    throw new Error(`Compiled demo is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }

  const schema = JSON.parse(schemaContents) as AnySchema;
  const validate = new Ajv2020({allErrors: true, strict: true}).compile<CompiledDemoV1>(schema);
  if (!validate(value)) {
    const details = validate.errors?.map((error) => `${error.instancePath || '/'} ${error.message ?? ''}`).join('; ');
    throw new Error(`Compiled demo does not match compiled-demo-v1: ${details ?? 'unknown validation error'}`);
  }
  const compiled = value as CompiledDemoV1;
  validateSemantics(compiled);
  return {
    compiled,
    path: absolutePath,
    sha256: createHash('sha256').update(contents).digest('hex'),
  };
}

function validateSemantics(compiled: CompiledDemoV1): void {
  const assetIds = new Set<string>();
  for (const asset of compiled.assets) {
    if (assetIds.has(asset.id)) throw new Error(`Compiled demo contains duplicate asset id ${asset.id}.`);
    assetIds.add(asset.id);
  }

  const outputIds = new Set<string>();
  const outputNames = new Set<string>();
  for (const output of compiled.outputs) {
    assertSafeRelativePath(output.fileName, `outputs.${output.id}.fileName`);
    if (!output.fileName.toLowerCase().endsWith('.mp4')) {
      throw new Error(`Output ${output.id} must use an .mp4 file name.`);
    }
    if (output.width % 2 !== 0 || output.height % 2 !== 0) {
      throw new Error(`Output ${output.id} dimensions must be even for yuv420p encoding.`);
    }
    if (outputIds.has(output.id)) throw new Error(`Compiled demo contains duplicate output id ${output.id}.`);
    if (outputNames.has(output.fileName)) {
      throw new Error(`Compiled demo contains duplicate output file name ${output.fileName}.`);
    }
    outputIds.add(output.id);
    outputNames.add(output.fileName);
  }

  for (const scene of compiled.scenes) {
    if (scene.endFrame !== scene.startFrame + scene.durationFrames) {
      throw new Error(`Scene ${scene.id} endFrame does not equal startFrame + durationFrames.`);
    }
    if (scene.endFrame > compiled.canvas.durationFrames) {
      throw new Error(`Scene ${scene.id} extends beyond canvas.durationFrames.`);
    }
    for (const id of [scene.assetId, scene.secondaryAssetId]) {
      if (id && !assetIds.has(id)) throw new Error(`Scene ${scene.id} references unknown asset ${id}.`);
    }
  }
  for (const track of compiled.audio) {
    if (!assetIds.has(track.assetId)) throw new Error(`Audio track ${track.id} references unknown asset ${track.assetId}.`);
  }
}
