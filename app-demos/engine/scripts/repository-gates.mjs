import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {access, readFile} from 'node:fs/promises';
import path from 'node:path';
import {Ajv2020} from 'ajv/dist/2020.js';
import {parse} from 'yaml';

const root = process.cwd();
const campaign = 'awesome-ai-app-demo-video-workflows';
const publicDocs = [
  'README.md',
  'README.zh-CN.md',
  'CONTRIBUTING.md',
  'NOTICE.md',
  'SECURITY.md',
  'llms.txt',
  'docs/setup.md',
  'docs/authoring.md',
  'docs/acceptance-matrix.md',
  'docs/schema-reference.md',
  'docs/hiapi-safety.md',
  'docs/launch-kit.md',
  'examples/README.md',
];
const requiredFiles = [
  'AGENTS.md',
  'LICENSE',
  ...publicDocs,
  'assets/cover.svg',
  'data/workflows.json',
  'schemas/demo-v1.schema.json',
  'schemas/compiled-demo-v1.schema.json',
  'src/contracts/types.ts',
  'src/cli/doctor.ts',
  'src/cli/validate.ts',
  'src/cli/compile.ts',
  'src/cli/render.ts',
  'src/cli/generate.ts',
  '.github/workflows/ci.yml',
];

await Promise.all(requiredFiles.map((file) => access(path.join(root, file))));

const readText = (file) => readFile(path.join(root, file), 'utf8');
const readJson = async (file) => JSON.parse(await readText(file));
const unique = (values, label) => {
  assert.equal(new Set(values).size, values.length, `${label} must be unique`);
};
const assertSafeRelativePath = (value, label) => {
  assert.equal(path.isAbsolute(value), false, `${label} must be relative: ${value}`);
  assert.equal(/^[a-z][a-z\d+.-]*:/i.test(value), false, `${label} must be local: ${value}`);
  assert.equal(value.split(/[\\/]/).includes('..'), false, `${label} must not traverse: ${value}`);
};
const assertReference = (ids, value, label) => {
  if (value !== undefined) assert(ids.has(value), `${label} references missing asset: ${value}`);
};
const assertPointInsideCanvas = (point, canvas, label) => {
  assert(point.x >= 0 && point.x <= canvas.width, `${label} x coordinate is outside the canvas`);
  assert(point.y >= 0 && point.y <= canvas.height, `${label} y coordinate is outside the canvas`);
};
const greatestCommonDivisor = (left, right) => right === 0 ? left : greatestCommonDivisor(right, left % right);
const aspectRatio = ({width, height}) => {
  const divisor = greatestCommonDivisor(width, height);
  return `${width / divisor}:${height / divisor}`;
};

const packageJson = await readJson('package.json');
assert.deepEqual(Object.keys(packageJson.scripts).sort(), [
  'compile',
  'doctor',
  'generate',
  'render',
  'test',
  'test:repo',
  'test:unit',
  'typecheck',
  'validate',
]);
assert.equal(packageJson.engines.node, '>=20.18');
assert.equal(packageJson.license, 'MIT');

const [sourceSchema, compiledSchema, catalog] = await Promise.all([
  readJson('schemas/demo-v1.schema.json'),
  readJson('schemas/compiled-demo-v1.schema.json'),
  readJson('data/workflows.json'),
]);
assert.equal(sourceSchema.properties.schemaVersion.const, 'demo-v1');
assert.equal(compiledSchema.properties.schemaVersion.const, 'compiled-demo-v1');
assert.equal(catalog.schemaVersion, 'workflow-catalog-v1');
assert.equal(catalog.workflows.length, 5, 'the v1 catalog must contain exactly five workflows');
unique(catalog.workflows.map(({id}) => id), 'workflow IDs');
unique(catalog.workflows.map(({path: workflowPath}) => workflowPath), 'workflow paths');

const ajv = new Ajv2020({allErrors: true, strict: true});
const validateSource = ajv.compile(sourceSchema);
const svgFiles = new Set(['assets/cover.svg']);

for (const entry of catalog.workflows) {
  assert(['spec-only', 'verified'].includes(entry.status), `${entry.id} must use a supported catalog status`);
  assert.equal(entry.path, `examples/${entry.id}`, `${entry.id} path must match its ID`);
  assertSafeRelativePath(entry.path, `${entry.id} catalog path`);

  const exampleRoot = path.resolve(root, entry.path);
  const relativeExampleRoot = path.relative(root, exampleRoot);
  assert(!relativeExampleRoot.startsWith('..') && !path.isAbsolute(relativeExampleRoot));
  const requiredExampleFiles = ['demo.yaml', 'README.md', 'review-checklist.md'];
  await Promise.all(requiredExampleFiles.map((file) => access(path.join(exampleRoot, file))));
  const [exampleReadme, reviewChecklist] = await Promise.all([
    readFile(path.join(exampleRoot, 'README.md'), 'utf8'),
    readFile(path.join(exampleRoot, 'review-checklist.md'), 'utf8'),
  ]);
  assert(exampleReadme.includes('## Expected rhythm'), `${entry.id} README needs an expected-rhythm section`);
  assert(reviewChecklist.includes('- [ ]'), `${entry.id} needs an actionable review checklist`);

  const demo = parse(await readFile(path.join(exampleRoot, 'demo.yaml'), 'utf8'));
  assert.equal(validateSource(demo), true, `${entry.id} schema errors: ${JSON.stringify(validateSource.errors)}`);
  assert.equal(demo.project.id, entry.id, `${entry.id} project ID must match catalog`);
  assert.equal(demo.canvas.durationFrames / demo.canvas.fps, entry.durationSeconds, `${entry.id} duration must match catalog`);
  assert.equal(demo.hiapi?.enabled, false, `${entry.id} must keep HiAPI disabled before integrated review`);

  const assetIds = demo.assets.map(({id}) => id);
  unique(assetIds, `${entry.id} asset IDs`);
  const assetIdSet = new Set(assetIds);
  for (const asset of demo.assets) {
    assert(asset.license?.trim(), `${entry.id}/${asset.id} must record a license`);
    assertSafeRelativePath(asset.path, `${entry.id} asset path`);
    const resolvedAsset = path.resolve(exampleRoot, asset.path);
    const relativeAsset = path.relative(exampleRoot, resolvedAsset);
    assert(!relativeAsset.startsWith('..') && !path.isAbsolute(relativeAsset), `${entry.id} asset escapes example: ${asset.path}`);
    await access(resolvedAsset);
    if (path.extname(resolvedAsset).toLowerCase() === '.svg') {
      svgFiles.add(path.relative(root, resolvedAsset).replaceAll('\\', '/'));
    }
  }

  unique(demo.scenes.map(({id}) => id), `${entry.id} scene IDs`);
  const orderedScenes = [...demo.scenes].sort((left, right) => left.startFrame - right.startFrame);
  let expectedStartFrame = 0;
  for (const scene of orderedScenes) {
    assert.equal(scene.startFrame, expectedStartFrame, `${entry.id}/${scene.id} must follow the preceding scene without a gap or overlap`);
    assert(scene.startFrame + scene.durationFrames <= demo.canvas.durationFrames, `${entry.id}/${scene.id} exceeds canvas duration`);
    assertReference(assetIdSet, scene.assetId, `${entry.id}/${scene.id}`);
    assertReference(assetIdSet, scene.secondaryAssetId, `${entry.id}/${scene.id}`);
    if (scene.cursor) {
      assertPointInsideCanvas(scene.cursor.from, demo.canvas, `${entry.id}/${scene.id} cursor.from`);
      assertPointInsideCanvas(scene.cursor.to, demo.canvas, `${entry.id}/${scene.id} cursor.to`);
    }
    for (const clickFrame of scene.cursor?.clickFrames ?? []) {
      assert(clickFrame < scene.durationFrames, `${entry.id}/${scene.id} click frame is outside its scene`);
    }
    for (const callout of scene.callouts ?? []) {
      assertPointInsideCanvas(callout.at, demo.canvas, `${entry.id}/${scene.id} callout`);
      assert(callout.startFrame + callout.durationFrames <= scene.durationFrames, `${entry.id}/${scene.id} callout is outside its scene`);
    }
    expectedStartFrame += scene.durationFrames;
  }
  assert.equal(expectedStartFrame, demo.canvas.durationFrames, `${entry.id} scenes must fill the canvas duration`);

  assertReference(assetIdSet, demo.brand.logoAssetId, `${entry.id} brand`);
  unique((demo.audio ?? []).map(({id}) => id), `${entry.id} audio IDs`);
  for (const track of demo.audio ?? []) assertReference(assetIdSet, track.assetId, `${entry.id}/${track.id}`);
  unique(demo.outputs.map(({id}) => id), `${entry.id} output IDs`);
  assert.deepEqual(
    [...new Set(demo.outputs.map(aspectRatio))].sort(),
    [...entry.aspectRatios].sort(),
    `${entry.id} output aspect ratios must match catalog`,
  );
  for (const enhancement of demo.hiapi?.enhancements ?? []) {
    for (const inputAssetId of enhancement.inputAssetIds ?? []) {
      assertReference(assetIdSet, inputAssetId, `${entry.id}/${enhancement.id}`);
    }
  }

  if (entry.id === 'saas-feature-launch') {
    const audioAssets = new Map(demo.assets.filter(({type}) => type === 'audio').map((asset) => [asset.id, asset]));
    assert.equal(audioAssets.get('background-music')?.path, 'assets/audio/bgm/bgm_003.wav');
    assert.equal(audioAssets.get('background-music')?.license, 'MIT');
    assert.equal(audioAssets.get('ui-click')?.path, 'assets/audio/sfx/sfx_001.wav');
    assert.equal(audioAssets.get('ui-click')?.license, 'MIT');
    assert.equal(audioAssets.get('result-chime')?.path, 'assets/audio/sfx/sfx_002.wav');
    assert.equal(audioAssets.get('result-chime')?.license, 'MIT');
    await access(path.join(exampleRoot, 'assets/audio/generate.mjs'));
    const lockedAudioHashes = new Map([
      ['assets/audio/bgm/bgm_003.wav', '35566352a71b74f082409aa5c175651620779715ec988f6adcb14e0bda1e8a9e'],
      ['assets/audio/sfx/sfx_001.wav', 'c6ed2607be9069a6b34bc2e4c7efec4fc4902da7b71301ce3bb3a983749329e8'],
      ['assets/audio/sfx/sfx_002.wav', 'd0ab469c31956b498dedb9a5359306ba834b9d61d71c20b554abbe5f6a27c379'],
    ]);
    for (const [assetPath, expectedHash] of lockedAudioHashes) {
      const bytes = await readFile(path.join(exampleRoot, assetPath));
      assert.equal(createHash('sha256').update(bytes).digest('hex'), expectedHash, `${assetPath} hash changed`);
    }
    assert.equal(JSON.stringify(demo).includes('bgm_001'), false, 'rejected bgm_001 must not be referenced');
    assert.equal(JSON.stringify(demo).includes('bgm_002'), false, 'rejected bgm_002 must not be referenced');
    assert.deepEqual(demo.audio, [
      {id: 'music-bed', assetId: 'background-music', startFrame: 0, volume: 1.3, fadeInFrames: 12, fadeOutFrames: 24},
      {id: 'dashboard-click', assetId: 'ui-click', startFrame: 62, volume: 1.25},
      {id: 'builder-click', assetId: 'ui-click', startFrame: 174, volume: 1.25},
      {id: 'result-confirmation', assetId: 'result-chime', startFrame: 210, volume: 1.25},
    ], 'SaaS sample audio plan must stay frozen');
  }
}

for (const svgFile of svgFiles) {
  const svg = await readText(svgFile);
  assert(svg.length > 500, `${svgFile} appears blank`);
  assert.match(svg, /<svg\b/);
  assert.match(svg, /<title(?:\s|>)/, `${svgFile} needs an accessible title`);
  assert.match(svg, /<desc(?:\s|>)/, `${svgFile} needs an accessible description`);
  assert.match(svg, /viewBox="[^"]+"/, `${svgFile} needs a stable viewBox`);
}

const readmes = await Promise.all(['README.md', 'README.zh-CN.md'].map(readText));
for (const {id} of catalog.workflows) {
  for (const readme of readmes) assert(readme.includes(`examples/${id}/`), `README must list ${id}`);
}

const acceptanceMatrix = await readText('docs/acceptance-matrix.md');
for (const {path: workflowPath} of catalog.workflows) {
  const demo = parse(await readText(`${workflowPath}/demo.yaml`));
  for (const output of demo.outputs) {
    assert(acceptanceMatrix.includes(`\`${output.fileName}\``), `acceptance matrix must list ${output.fileName}`);
  }
}

const publicText = (await Promise.all(publicDocs.map(readText))).join('\n');
const hiapiUrls = publicText.match(/https:\/\/(?:www\.)?hiapi\.ai\/[^\s)\]>'"`]+|https:\/\/docs\.hiapi\.ai\/[^\s)\]>'"`]+/g) ?? [];
assert(hiapiUrls.length > 0, 'public docs must include attributed HiAPI links');
for (const url of hiapiUrls) {
  assert(url.includes('utm_source='), `HiAPI URL lacks utm_source: ${url}`);
  assert(url.includes('utm_medium='), `HiAPI URL lacks utm_medium: ${url}`);
  assert(url.includes(`utm_campaign=${campaign}`), `HiAPI URL lacks campaign attribution: ${url}`);
  assert(url.includes('utm_content='), `HiAPI URL lacks utm_content: ${url}`);
}

const repositoryContent = [publicText, await readText('data/workflows.json')];
for (const {path: workflowPath} of catalog.workflows) {
  repositoryContent.push(await readText(`${workflowPath}/demo.yaml`));
}
const sensitiveText = repositoryContent.join('\n');
assert.doesNotMatch(sensitiveText, /\bsk-[A-Za-z0-9_-]{20,}\b/, 'possible API key found');
assert.doesNotMatch(sensitiveText, /[?&](?:X-Amz-Signature|Signature|sig|token)=[^\s&]+/i, 'possible signed URL found');

console.log(`Repository gates passed (${catalog.workflows.length} workflows, ${svgFiles.size} SVG assets, ${hiapiUrls.length} attributed HiAPI links).`);
