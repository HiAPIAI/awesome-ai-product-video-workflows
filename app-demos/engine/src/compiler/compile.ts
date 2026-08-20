import fs from 'node:fs';
import path from 'node:path';
import {canonicalJson, sha256} from '../contracts/canonical.js';
import type {CompiledDemoV1, CompiledScene, HiapiRequest, SceneSpec} from '../contracts/types.js';
import {DemoValidationError} from './errors.js';
import {validateCompiledSchema} from './schema.js';
import {validateDemoFile} from './validate.js';

export interface CompileResult {
  compiled: CompiledDemoV1;
  json: string;
  packageAssets: Array<{relativePath: string; buffer: Buffer}>;
}

export function compileDemoFile(file: string): CompileResult {
  const validated = validateDemoFile(file);
  const {demo} = validated;
  const assets = validated.assets
    .map(({spec, relativePath, buffer, bytes}) => ({
      ...spec,
      path: relativePath,
      sha256: sha256(buffer),
      bytes,
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
  const scenes = demo.scenes
    .map(normalizeScene)
    .sort((left, right) => left.startFrame - right.startFrame || left.id.localeCompare(right.id));
  const hiapiRequests: HiapiRequest[] = demo.hiapi?.enabled
    ? demo.hiapi.enhancements.map((enhancement) => ({
        id: enhancement.id,
        endpoint: '/v1/tasks' as const,
        model: enhancement.model,
        purpose: enhancement.purpose,
        body: {
          model: enhancement.model,
          input: {prompt: enhancement.prompt},
        },
      })).sort((left, right) => left.id.localeCompare(right.id))
    : [];

  const compiled: CompiledDemoV1 = {
    schemaVersion: 'compiled-demo-v1',
    source: {
      schemaVersion: 'demo-v1',
      path: path.basename(validated.sourcePath),
      sha256: sha256(validated.sourceBuffer),
    },
    project: {...demo.project},
    canvas: {...demo.canvas, durationSeconds: demo.canvas.durationFrames / demo.canvas.fps},
    brand: {...demo.brand},
    assets,
    scenes,
    audio: [...(demo.audio ?? [])].sort((left, right) => left.startFrame - right.startFrame || left.id.localeCompare(right.id)),
    outputs: [...demo.outputs].sort((left, right) => left.id.localeCompare(right.id)),
    hiapiRequests,
  };
  const schema = validateCompiledSchema(compiled);
  if (!schema.valid) throw new DemoValidationError(schema.issues, 'Compiled demo failed its output schema.');
  const packageAssets = validated.assets
    .map(({relativePath, buffer}) => ({relativePath, buffer: Buffer.from(buffer)}))
    .sort((left, right) => left.relativePath.localeCompare(right.relativePath));
  return {compiled, json: `${canonicalJson(compiled, 2)}\n`, packageAssets};
}

export function writeCompiledDemo(result: CompileResult, outputDirectory: string): string[] {
  const targetDirectory = path.resolve(outputDirectory);
  if (path.parse(targetDirectory).root === targetDirectory) throw new Error('Refusing to use a filesystem root as the compile output directory.');
  fs.mkdirSync(targetDirectory, {recursive: true});
  const written = [writeIdempotent(path.join(targetDirectory, 'compiled-demo-v1.json'), result.json)];
  for (const asset of result.packageAssets) {
    written.push(writeIdempotent(path.join(targetDirectory, ...asset.relativePath.split('/')), asset.buffer));
  }
  for (const request of result.compiled.hiapiRequests) {
    written.push(writeIdempotent(path.join(targetDirectory, `hiapi-request-${request.id}.json`), `${canonicalJson(request, 2)}\n`));
  }
  return written;
}

function normalizeScene(scene: SceneSpec): CompiledScene {
  return {
    ...scene,
    endFrame: scene.startFrame + scene.durationFrames,
    fit: scene.fit ?? 'contain',
    from: {x: 0, y: 0, scale: 1, opacity: 1, ...scene.from},
    to: {x: 0, y: 0, scale: 1, opacity: 1, ...scene.to},
    easing: scene.easing ?? 'ease-in-out',
    callouts: scene.callouts ?? [],
    transitionIn: scene.transitionIn ?? 'none',
    transitionOut: scene.transitionOut ?? 'none',
  };
}

function writeIdempotent(file: string, content: string | Buffer): string {
  const bytes = typeof content === 'string' ? Buffer.from(content, 'utf8') : content;
  if (fs.existsSync(file)) {
    const existing = fs.readFileSync(file);
    if (existing.equals(bytes)) return file;
    throw new Error(`Refusing to replace a different compiled artifact: ${file}`);
  }
  fs.mkdirSync(path.dirname(file), {recursive: true});
  const temporary = `${file}.tmp-${process.pid}`;
  try {
    fs.writeFileSync(temporary, bytes, {flag: 'wx'});
    fs.renameSync(temporary, file);
  } finally {
    fs.rmSync(temporary, {force: true});
  }
  return file;
}
