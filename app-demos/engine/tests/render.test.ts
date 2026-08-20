import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {access, mkdtemp, readdir, readFile, rm, stat, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';
import sharp from 'sharp';
import {buildFfmpegComposition} from '../src/compositions/ffmpeg-composition.js';
import {interpolateFrame} from '../src/compositions/frame-math.js';
import {
  mapPointThroughVisual,
  screenRect,
  titleTextLayout,
  visualFitTransform,
  visualFocusPoint,
} from '../src/compositions/layout.js';
import type {CompiledDemoV1} from '../src/contracts/types.js';
import {parseRenderArguments} from '../src/cli/render.js';
import {resolveAndVerifyAssets} from '../src/media/assets.js';
import {rasterizeSvgAssets} from '../src/media/rasterize.js';
import {renderProject} from '../src/render/renderer.js';

async function command(executable: string, args: readonly string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(executable, args, {stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true});
    let stderr = '';
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk;
    });
    child.once('error', reject);
    child.once('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${executable} exited with ${code}: ${stderr}`));
    });
  });
}

async function assetRecord(path: string): Promise<{sha256: string; bytes: number}> {
  const [contents, metadata] = await Promise.all([readFile(path), stat(path)]);
  return {sha256: createHash('sha256').update(contents).digest('hex'), bytes: metadata.size};
}

async function renderWorkDirectories(path: string): Promise<string[]> {
  try {
    return (await readdir(path, {withFileTypes: true}))
      .filter((entry) => entry.isDirectory() && entry.name.startsWith('.render-work-'))
      .map((entry) => entry.name);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return [];
    throw error;
  }
}

async function extractFrame(videoPath: string, frame: number, destination: string): Promise<void> {
  await command('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    videoPath,
    '-vf',
    `select=eq(n\\,${frame})`,
    '-frames:v',
    '1',
    '-fps_mode',
    'passthrough',
    '-threads',
    '1',
    destination,
  ]);
}

interface PixelImage {
  data: Buffer;
  width: number;
  height: number;
  channels: number;
}

async function readPixels(path: string): Promise<PixelImage> {
  const {data, info} = await sharp(path).removeAlpha().raw().toBuffer({resolveWithObject: true});
  return {data, width: info.width, height: info.height, channels: info.channels};
}

function isDark(image: PixelImage, x: number, y: number): boolean {
  const offset = (y * image.width + x) * image.channels;
  return (image.data[offset] ?? 255) < 100 && (image.data[offset + 1] ?? 255) < 100 &&
    (image.data[offset + 2] ?? 255) < 100;
}

function darkBounds(image: PixelImage): {minX: number; minY: number; maxX: number; maxY: number} {
  let minX = image.width;
  let minY = image.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      if (!isDark(image, x, y)) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  assert.ok(maxX >= 0 && maxY >= 0, 'expected the rendered frame to contain dark text pixels');
  return {minX, minY, maxX, maxY};
}

function countDarkPixels(image: PixelImage, startY: number, endY: number): number {
  let count = 0;
  for (let y = Math.max(0, startY); y < Math.min(image.height, endY); y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      if (isDark(image, x, y)) count += 1;
    }
  }
  return count;
}

function longestDarkRun(image: PixelImage, x: number, startY: number, endY: number): number {
  let longest = 0;
  let current = 0;
  for (let y = startY; y <= endY; y += 1) {
    if (isDark(image, x, y)) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }
  return longest;
}

function hasAccentPixelNear(image: PixelImage, x: number, y: number, radius: number): boolean {
  for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
    for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
      if (offsetX * offsetX + offsetY * offsetY > radius * radius) continue;
      const pixelX = Math.round(x + offsetX);
      const pixelY = Math.round(y + offsetY);
      if (pixelX < 0 || pixelX >= image.width || pixelY < 0 || pixelY >= image.height) continue;
      const offset = (pixelY * image.width + pixelX) * image.channels;
      const red = image.data[offset] ?? 0;
      const green = image.data[offset + 1] ?? 255;
      const blue = image.data[offset + 2] ?? 255;
      if (red > 150 && green < 140 && blue < 140 && red - green > 45) return true;
    }
  }
  return false;
}

test('frame interpolation is deterministic and bounded by frame progress', () => {
  assert.equal(interpolateFrame(0, 100, 0, 11, 'linear'), 0);
  assert.equal(interpolateFrame(0, 100, 5, 11, 'linear'), 50);
  assert.equal(interpolateFrame(0, 100, 10, 11, 'linear'), 100);
  assert.equal(interpolateFrame(0, 100, 20, 11, 'ease-out'), 100);
});

test('render CLI keeps the frozen argument names', () => {
  assert.deepEqual(parseRenderArguments(['--compiled', 'compiled.json', '--out-dir', 'rendered']), {
    compiledPath: 'compiled.json',
    outputDirectory: 'rendered',
  });
  assert.throws(() => parseRenderArguments(['--input', 'compiled.json']), /Unknown or incomplete/);
});

test('keeps long headings, body copy, and callouts inside landscape and portrait safe areas', () => {
  const compiled: CompiledDemoV1 = {
    schemaVersion: 'compiled-demo-v1',
    source: {schemaVersion: 'demo-v1', path: 'demo.yaml', sha256: '0'.repeat(64)},
    project: {id: 'responsive-text', title: 'Responsive text'},
    canvas: {width: 1920, height: 1080, fps: 30, durationFrames: 90, durationSeconds: 3},
    brand: {
      background: '#F3F5F7',
      foreground: '#171A1F',
      accent: '#2D8CFF',
      fontFamily: 'Arial',
    },
    assets: [],
    scenes: [
      {
        id: 'responsive-title',
        kind: 'title',
        startFrame: 0,
        endFrame: 90,
        durationFrames: 90,
        heading: 'Automations, without the busywork across every product release',
        body: 'Build, test, and ship a customer journey from one deterministic canvas.',
        callouts: [
          {
            text: 'Priority and owner now share one scan line',
            at: {x: 1910, y: 1070},
            startFrame: 0,
            durationFrames: 30,
          },
        ],
      },
    ],
    audio: [],
    outputs: [
      {id: 'landscape', width: 1920, height: 1080, fps: 30, fileName: 'landscape.mp4'},
      {id: 'portrait', width: 1080, height: 1920, fps: 30, fileName: 'portrait.mp4'},
    ],
    hiapiRequests: [],
  };

  for (const output of compiled.outputs) {
    const composition = buildFfmpegComposition({
      compiled,
      output,
      assets: new Map(),
      textDirectory: join('layout', output.id),
      cursorPath: 'cursor.rgba',
      cursorSize: 64,
      fontPath: 'font.ttf',
    });
    const headingText = composition.textFiles.find((file) => file.path.includes('responsive-title-heading'));
    const headingFilter = composition.filterGraph
      .split(';\n')
      .find((filter) => filter.includes('responsive-title-heading'));
    const bodyFilter = composition.filterGraph
      .split(';\n')
      .find((filter) => filter.includes('responsive-title-body'));
    const calloutBox = composition.filterGraph
      .split(';\n')
      .find((filter) => filter.includes('[calloutBox'));
    const calloutSource = composition.filterGraph
      .split(';\n')
      .find((filter) => filter.includes('[calloutSource'));
    assert.ok(headingText);
    assert.ok(headingFilter);
    assert.ok(bodyFilter);
    assert.ok(calloutBox);
    assert.ok(calloutSource);

    const headingMatch = headingFilter.match(/fontsize=(\d+):line_spacing=(\d+):x=.*:y=(\d+)/u);
    const bodyMatch = bodyFilter.match(/fontsize=(\d+):line_spacing=(\d+):x=.*:y=(\d+)/u);
    const boxMatch = calloutSource.match(/:s=(\d+)x(\d+):r=/u);
    assert.ok(headingMatch);
    assert.ok(bodyMatch);
    assert.ok(boxMatch);

    const headingLines = headingText.contents.split('\n');
    const headingSize = Number(headingMatch[1]);
    const headingSpacing = Number(headingMatch[2]);
    const headingY = Number(headingMatch[3]);
    const bodySize = Number(bodyMatch[1]);
    const bodyY = Number(bodyMatch[3]);
    const headingHeight = headingLines.length * headingSize + (headingLines.length - 1) * headingSpacing;
    assert.ok(headingLines.length >= (output.id === 'portrait' ? 4 : 3));
    assert.ok(bodyY >= headingY + headingHeight + Math.max(24, Math.round(bodySize * 0.65)));

    const [boxWidth, boxHeight] = boxMatch.slice(1).map(Number) as [number, number];
    const safeMargin = Math.max(12, Math.round(Math.min(output.width, output.height) * 0.025));
    assert.match(calloutBox, new RegExp(`overlay=x='max\\(${safeMargin},min\\(${output.width - safeMargin - boxWidth},`));
    assert.match(calloutBox, new RegExp(`:y='max\\(${safeMargin},min\\(${output.height - safeMargin - boxHeight},`));
  }
});

test('renders repeatable landscape and portrait H.264/AAC outputs with review artifacts', async () => {
  const fixtureDirectory = await mkdtemp(join(tmpdir(), 'app-demo-render-fixture-'));
  try {
    const firstImage = join(fixtureDirectory, 'screen-a.svg');
    const secondImage = join(fixtureDirectory, 'screen-b.svg');
    const audioPath = join(fixtureDirectory, 'tone.wav');
    const landscapeSvg = await readFile(new URL('./fixtures/render/landscape-ui.svg', import.meta.url));
    const portraitSvg = await readFile(new URL('./fixtures/render/portrait-ui.svg', import.meta.url));
    await Promise.all([writeFile(firstImage, landscapeSvg), writeFile(secondImage, portraitSvg)]);
    await command('ffmpeg', [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-f',
      'lavfi',
      '-i',
      'sine=frequency=660:sample_rate=48000:duration=1',
      '-c:a',
      'pcm_s16le',
      audioPath,
    ]);
    const [firstRecord, secondRecord, audioRecord] = await Promise.all([
      assetRecord(firstImage),
      assetRecord(secondImage),
      assetRecord(audioPath),
    ]);
    const compiled: CompiledDemoV1 = {
      schemaVersion: 'compiled-demo-v1',
      source: {schemaVersion: 'demo-v1', path: 'demo.yaml', sha256: '0'.repeat(64)},
      project: {id: 'render-acceptance', title: 'Render acceptance'},
      canvas: {width: 576, height: 324, fps: 24, durationFrames: 24, durationSeconds: 1},
      brand: {
        background: '#E8EDF2',
        foreground: '#111418',
        accent: '#E5484D',
        fontFamily: 'Arial',
      },
      assets: [
        {id: 'screen-a', type: 'image', path: 'screen-a.svg', ...firstRecord},
        {id: 'screen-b', type: 'image', path: 'screen-b.svg', ...secondRecord},
        {id: 'tone', type: 'audio', path: 'tone.wav', durationSeconds: 1, ...audioRecord},
      ],
      scenes: [
        {
          id: 'title',
          kind: 'title',
          startFrame: 0,
          endFrame: 6,
          durationFrames: 6,
          heading: 'Automations, without the busywork',
          body: 'Build, test, and ship a customer journey from one canvas.',
          transitionIn: 'fade',
        },
        {
          id: 'screen',
          kind: 'screen',
          startFrame: 6,
          endFrame: 18,
          durationFrames: 12,
          assetId: 'screen-a',
          heading: 'Screenshot pan and crop',
          body: 'UI pixels stay local and unchanged',
          fit: 'contain',
          from: {x: -12, y: 4, scale: 0.96, opacity: 1},
          to: {x: 12, y: -4, scale: 1.08, opacity: 1},
          easing: 'ease-out',
          transitionIn: 'slide-left',
          cursor: {from: {x: 120, y: 100}, to: {x: 420, y: 220}, clickFrames: [6]},
          callouts: [
            {text: 'Local callout', at: {x: 300, y: 60}, startFrame: 4, durationFrames: 5},
          ],
        },
        {
          id: 'comparison',
          kind: 'comparison',
          startFrame: 18,
          endFrame: 22,
          durationFrames: 4,
          assetId: 'screen-a',
          secondaryAssetId: 'screen-b',
          fit: 'cover',
          transitionIn: 'scale',
        },
        {
          id: 'outro',
          kind: 'outro',
          startFrame: 22,
          endFrame: 24,
          durationFrames: 2,
          heading: 'Done',
        },
      ],
      audio: [{id: 'music', assetId: 'tone', startFrame: 0, volume: 0.2, fadeInFrames: 2, fadeOutFrames: 2}],
      outputs: [
        {id: 'landscape', width: 576, height: 324, fps: 24, fileName: 'landscape.mp4'},
        {id: 'portrait', width: 324, height: 576, fps: 24, fileName: 'portrait.mp4'},
      ],
      hiapiRequests: [],
    };
    const compiledPath = join(fixtureDirectory, 'compiled.json');
    await writeFile(compiledPath, `${JSON.stringify(compiled, null, 2)}\n`, 'utf8');
    const compiledBeforeRender = await readFile(compiledPath, 'utf8');

    const verifiedAssets = await resolveAndVerifyAssets(compiled, compiledPath, fixtureDirectory);
    assert.deepEqual(
      [...verifiedAssets.values()].filter((asset) => asset.verifiedSvg).map((asset) => asset.path),
      ['screen-a.svg', 'screen-b.svg'],
    );
    await writeFile(firstImage, 'the verified SVG source changed before rasterization', 'utf8');
    const preparedDirectory = join(fixtureDirectory, 'prepared-assets');
    const preparedAssets = await rasterizeSvgAssets(verifiedAssets, preparedDirectory);
    await writeFile(firstImage, landscapeSvg);
    for (const id of ['screen-a', 'screen-b']) {
      const original = compiled.assets.find((asset) => asset.id === id);
      const prepared = preparedAssets.get(id);
      assert.ok(original);
      assert.ok(prepared);
      assert.match(prepared.absolutePath, /\.png$/u);
      assert.equal(prepared.path, original.path);
      assert.equal(prepared.sha256, original.sha256);
      assert.equal(prepared.bytes, original.bytes);
    }
    assert.deepEqual(
      ['screen-a', 'screen-b'].map((id) => {
        const asset = preparedAssets.get(id)!;
        return [asset.width, asset.height];
      }),
      [[640, 360], [360, 640]],
    );
    const composition = buildFfmpegComposition({
      compiled,
      output: compiled.outputs[0]!,
      assets: preparedAssets,
      textDirectory: join(fixtureDirectory, 'composition-text'),
      cursorPath: join(fixtureDirectory, 'cursor.rgba'),
      cursorSize: 64,
      fontPath: join(fixtureDirectory, 'font.ttf'),
    });
    const pngInputs = composition.inputArgs.filter((argument) => argument.endsWith('.png'));
    assert.equal(composition.inputArgs.some((argument) => argument.endsWith('.svg')), false);
    assert.equal(pngInputs.length, 3);
    assert.equal(pngInputs.every((argument) => argument.startsWith(preparedDirectory)), true);

    const firstOutput = join(fixtureDirectory, 'render-one');
    const secondOutput = join(fixtureDirectory, 'render-two');
    const firstReport = await renderProject({
      compiledPath,
      outputDirectory: firstOutput,
      workingDirectory: fixtureDirectory,
    });
    const secondReport = await renderProject({
      compiledPath,
      outputDirectory: secondOutput,
      workingDirectory: fixtureDirectory,
    });

    assert.equal(firstReport.animationClock, 'frame-number');
    assert.equal(firstReport.criticalUiPipeline, 'deterministic-local-layers');
    assert.equal(firstReport.generativeUiPasses, 0);
    assert.deepEqual(
      firstReport.outputs.map((output) => output.aspectRatio),
      ['16:9', '9:16'],
    );
    for (const [index, output] of firstReport.outputs.entries()) {
      assert.equal(output.validation.videoCodec, 'h264');
      assert.equal(output.validation.pixelFormat, 'yuv420p');
      assert.equal(output.validation.frameCount, 24);
      assert.equal(output.validation.durationSeconds, 1);
      assert.equal(output.validation.audioCodec, 'aac');
      assert.equal(output.features.screenshotTransform, true);
      assert.equal(output.features.crop, true);
      assert.equal(output.features.deviceFrame, true);
      assert.equal(output.features.cursor, true);
      assert.equal(output.features.clickRipple, true);
      assert.equal(output.features.callout, true);
      assert.equal(output.features.caption, true);
      assert.equal(output.features.transition, true);
      assert.equal(output.sha256, secondReport.outputs[index]?.sha256);
      assert.deepEqual(output.review.frameSha256, secondReport.outputs[index]?.review.frameSha256);
      await access(join(firstOutput, output.file));
      await access(join(firstOutput, output.review.contactSheet));
    }
    const checklist = await readFile(join(firstOutput, 'review-checklist.md'), 'utf8');
    assert.match(checklist, /No generative pass redrew UI or text/);
    await access(join(firstOutput, 'render-report.json'));
    assert.deepEqual(await renderWorkDirectories(firstOutput), []);
    assert.deepEqual(await renderWorkDirectories(secondOutput), []);
    assert.equal(await readFile(compiledPath, 'utf8'), compiledBeforeRender);
    assert.deepEqual(
      JSON.parse(await readFile(compiledPath, 'utf8')).assets.map((asset: {path: string}) => asset.path),
      ['screen-a.svg', 'screen-b.svg', 'tone.wav'],
    );

    for (const output of compiled.outputs) {
      const titleFrame = join(fixtureDirectory, `${output.id}-title.png`);
      await extractFrame(join(firstOutput, output.fileName), 3, titleFrame);
      const pixels = await readPixels(titleFrame);
      const layout = titleTextLayout(output.width, output.height, compiled.scenes[0]!.heading!, compiled.scenes[0]!.body);
      const bounds = darkBounds(pixels);
      assert.ok(bounds.minX >= Math.floor((output.width - layout.safeWidth) / 2) - 3);
      assert.ok(bounds.maxX <= Math.ceil((output.width + layout.safeWidth) / 2) + 3);
      assert.ok(bounds.minY >= layout.safeTop - 3);
      assert.ok(bounds.maxY <= layout.safeBottom + 3);
      assert.ok(layout.bodyY);
      const gapDarkPixels = countDarkPixels(
        pixels,
        layout.headingY + layout.heading.height + 3,
        layout.bodyY - 3,
      );
      assert.ok(
        gapDarkPixels <= Math.ceil(output.width * 0.1),
        `expected only negligible H.264 edge ringing between heading and body, found ${gapDarkPixels} pixels`,
      );
    }

    const portraitScreenFrame = join(fixtureDirectory, 'portrait-screen.png');
    await extractFrame(join(firstOutput, 'portrait.mp4'), 12, portraitScreenFrame);
    const portraitPixels = await readPixels(portraitScreenFrame);
    const portraitRect = screenRect(324, 576, compiled.canvas.width / compiled.canvas.height);
    const centerX = Math.floor(portraitPixels.width / 2);
    assert.ok(longestDarkRun(portraitPixels, centerX, portraitRect.y, portraitRect.y + portraitRect.height - 1) < 24);
    assert.equal(isDark(portraitPixels, centerX, portraitRect.y + 20), false);
    assert.equal(isDark(portraitPixels, centerX, portraitRect.y + portraitRect.height - 21), false);

    const screenScene = compiled.scenes[1]!;
    const localClick = screenScene.cursor!.clickFrames![0]!;
    const focus = visualFocusPoint(
      [screenScene.cursor!.from, screenScene.cursor!.to, screenScene.callouts![0]!.at],
      640,
      360,
    );
    const visualTransform = visualFitTransform(640, 360, portraitRect, 'cover', focus);
    const sourceClick = {
      x: interpolateFrame(
        screenScene.cursor!.from.x,
        screenScene.cursor!.to.x,
        localClick,
        screenScene.durationFrames,
        screenScene.easing!,
      ),
      y: interpolateFrame(
        screenScene.cursor!.from.y,
        screenScene.cursor!.to.y,
        localClick,
        screenScene.durationFrames,
        screenScene.easing!,
      ),
    };
    const visualScale = interpolateFrame(
      screenScene.from!.scale!,
      screenScene.to!.scale!,
      localClick,
      screenScene.durationFrames,
      screenScene.easing!,
    );
    const expectedClick = mapPointThroughVisual(sourceClick, visualTransform, visualScale, {
      x: interpolateFrame(-12, 12, localClick, screenScene.durationFrames, screenScene.easing!) * (324 / 576),
      y: interpolateFrame(4, -4, localClick, screenScene.durationFrames, screenScene.easing!) * (576 / 324),
    });
    assert.equal(
      hasAccentPixelNear(portraitPixels, expectedClick.x, expectedClick.y, 24),
      true,
      `expected click ripple near (${expectedClick.x.toFixed(1)}, ${expectedClick.y.toFixed(1)})`,
    );

    const tamperedSvg = landscapeSvg.toString('utf8').replace('#f4f6f8', '#f5f6f8');
    assert.equal(Buffer.byteLength(tamperedSvg), landscapeSvg.length);
    await writeFile(firstImage, tamperedSvg, 'utf8');
    const tamperedOutput = join(fixtureDirectory, 'render-tampered');
    await assert.rejects(
      renderProject({
        compiledPath,
        outputDirectory: tamperedOutput,
        workingDirectory: fixtureDirectory,
      }),
      /SHA-256 differs/,
    );
    assert.deepEqual(await renderWorkDirectories(tamperedOutput), []);
  } finally {
    await rm(fixtureDirectory, {recursive: true, force: true});
  }
});
