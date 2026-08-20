import assert from 'node:assert/strict';
import test from 'node:test';
import {buildFfmpegComposition} from '../src/compositions/ffmpeg-composition.js';
import {
  mapPointThroughVisual,
  screenRect,
  titleTextLayout,
  visualFitTransform,
  visualFocusPoint,
} from '../src/compositions/layout.js';
import type {CompiledDemoV1} from '../src/contracts/types.js';
import type {ResolvedAsset} from '../src/media/assets.js';

const heading = 'Automations, without the busywork';
const body = 'Build, test, and ship a customer journey from one canvas.';

test('title text stays complete and bounded with body positioned after its actual lines', () => {
  const landscape = titleTextLayout(1920, 1080, heading, body);
  const portrait = titleTextLayout(1080, 1920, heading, body);

  for (const layout of [landscape, portrait]) {
    assert.equal(layout.heading.text.replaceAll('\n', ' '), heading);
    assert.equal(layout.body?.text.replaceAll('\n', ' '), body);
    assert.ok(layout.heading.maximumLineWidth <= layout.safeWidth);
    assert.ok((layout.body?.maximumLineWidth ?? 0) <= layout.safeWidth);
    assert.ok(layout.headingY >= layout.safeTop);
    assert.ok(layout.bodyY);
    assert.ok(layout.body);
    assert.ok(layout.bodyY >= layout.headingY + layout.heading.height + 12);
    assert.ok(layout.bodyY + layout.body.height <= layout.safeBottom);
  }

  assert.equal(landscape.heading.lineCount, 2);
  assert.equal(portrait.heading.lineCount, 3);
  assert.ok(portrait.body!.lineCount >= landscape.body!.lineCount);
});

test('portrait screen viewport uses a focused 4:5 frame for a landscape canvas', () => {
  assert.deepEqual(screenRect(1920, 1080, 16 / 9), {x: 173, y: 130, width: 1574, height: 820});
  const portrait = screenRect(1080, 1920, 16 / 9);
  assert.deepEqual(portrait, {x: 65, y: 367, width: 950, height: 1186});
  assert.ok(Math.abs(portrait.width / portrait.height - 0.8) < 0.002);
  const completePortrait = screenRect(1080, 1920, 16 / 10, false);
  assert.deepEqual(completePortrait, {x: 65, y: 663, width: 950, height: 594});
  assert.ok(Math.abs(completePortrait.width / completePortrait.height - 16 / 10) < 0.002);
});

test('filtergraph converts scene-local callout and click frames and focuses portrait screens', () => {
  const compiled: CompiledDemoV1 = {
    schemaVersion: 'compiled-demo-v1',
    source: {schemaVersion: 'demo-v1', path: 'demo.yaml', sha256: '0'.repeat(64)},
    project: {id: 'sample-timing', title: 'Sample timing'},
    canvas: {width: 1920, height: 1080, fps: 30, durationFrames: 330, durationSeconds: 11},
    brand: {background: '#F3F5F7', foreground: '#171A1F', accent: '#2D8CFF', fontFamily: 'Arial'},
    assets: [
      {
        id: 'overview',
        type: 'image',
        path: 'overview.png',
        sha256: '1'.repeat(64),
        bytes: 1,
        width: 1440,
        height: 900,
      },
      {
        id: 'builder',
        type: 'image',
        path: 'builder.png',
        sha256: '2'.repeat(64),
        bytes: 1,
        width: 1440,
        height: 900,
      },
      {
        id: 'results',
        type: 'image',
        path: 'results.png',
        sha256: '3'.repeat(64),
        bytes: 1,
        width: 1440,
        height: 900,
      },
    ],
    scenes: [
      {
        id: 'dashboard-context',
        kind: 'screen',
        startFrame: 45,
        endFrame: 135,
        durationFrames: 90,
        assetId: 'overview',
        fit: 'contain',
        cursor: {from: {x: 330, y: 250}, to: {x: 515, y: 330}, clickFrames: [62]},
      },
      {
        id: 'build-automation',
        kind: 'screen',
        startFrame: 135,
        endFrame: 255,
        durationFrames: 120,
        assetId: 'builder',
        fit: 'contain',
        cursor: {from: {x: 580, y: 460}, to: {x: 1110, y: 575}, clickFrames: [84]},
        callouts: [
          {
            text: 'Test every branch before publishing',
            at: {x: 1080, y: 380},
            startFrame: 42,
            durationFrames: 56,
          },
        ],
      },
      {
        id: 'prove-impact',
        kind: 'screen',
        startFrame: 255,
        endFrame: 300,
        durationFrames: 45,
        assetId: 'results',
        fit: 'contain',
      },
    ],
    audio: [],
    outputs: [{id: 'vertical', width: 1080, height: 1920, fps: 30, fileName: 'vertical.mp4'}],
    hiapiRequests: [],
  };
  const assets = new Map<string, ResolvedAsset>([
    [
      'overview',
      {...compiled.assets[0]!, absolutePath: 'C:\\fixtures\\overview.png'},
    ],
    [
      'builder',
      {...compiled.assets[1]!, absolutePath: 'C:\\fixtures\\builder.png'},
    ],
    [
      'results',
      {...compiled.assets[2]!, absolutePath: 'C:\\fixtures\\results.png'},
    ],
  ]);
  const composition = buildFfmpegComposition({
    compiled,
    output: compiled.outputs[0]!,
    assets,
    textDirectory: 'C:\\fixtures\\text',
    cursorPath: 'C:\\fixtures\\cursor.rgba',
    cursorSize: 64,
    fontPath: 'C:\\fixtures\\font.ttf',
  });

  assert.match(composition.filterGraph, /enable='between\(n,177,232\)'\[calloutBox/u);
  assert.match(composition.filterGraph, /\(n-107\)/u);
  assert.match(composition.filterGraph, /\(n-219\)/u);
  assert.doesNotMatch(composition.filterGraph, /between\(n,42,97\)/u);
  assert.doesNotMatch(composition.filterGraph, /\(n-84\)/u);
  assert.equal((composition.filterGraph.match(/crop=w=950:h=1186/gu) ?? []).length, 2);
  assert.match(composition.filterGraph, /iw\*0\.641204-ow\/2/u);
  assert.equal(composition.filterGraph.includes('pad=950:1186'), false);
  assert.equal(composition.filterGraph.includes('pad=950:594'), true);

  const builderPoints = [
    compiled.scenes[1]!.cursor!.from,
    compiled.scenes[1]!.cursor!.to,
    compiled.scenes[1]!.callouts![0]!.at,
  ];
  const rect = screenRect(1080, 1920, 1440 / 900);
  const focus = visualFocusPoint(builderPoints, 1440, 900);
  const transform = visualFitTransform(1440, 900, rect, 'cover', focus);
  const mappedControl = mapPointThroughVisual(compiled.scenes[1]!.cursor!.to, transform);
  assert.ok(mappedControl.x >= rect.x && mappedControl.x <= rect.x + rect.width);
  assert.ok(mappedControl.y >= rect.y && mappedControl.y <= rect.y + rect.height);
});

test('comparison callouts retain canvas-space placement without binding to the left asset', () => {
  const compiled: CompiledDemoV1 = {
    schemaVersion: 'compiled-demo-v1',
    source: {schemaVersion: 'demo-v1', path: 'demo.yaml', sha256: '0'.repeat(64)},
    project: {id: 'comparison-callout', title: 'Comparison callout'},
    canvas: {width: 1920, height: 1080, fps: 30, durationFrames: 90, durationSeconds: 3},
    brand: {background: '#F3F5F7', foreground: '#171A1F', accent: '#C7564A', fontFamily: 'Arial'},
    assets: [
      {id: 'before', type: 'image', path: 'before.png', width: 1920, height: 1080, sha256: '1'.repeat(64), bytes: 1},
      {id: 'after', type: 'image', path: 'after.png', width: 1920, height: 1080, sha256: '2'.repeat(64), bytes: 1},
    ],
    scenes: [
      {
        id: 'comparison',
        kind: 'comparison',
        startFrame: 0,
        endFrame: 90,
        durationFrames: 90,
        assetId: 'before',
        secondaryAssetId: 'after',
        callouts: [{text: 'After state', at: {x: 1400, y: 420}, startFrame: 10, durationFrames: 30}],
      },
    ],
    audio: [],
    outputs: [{id: 'landscape', width: 1920, height: 1080, fps: 30, fileName: 'comparison.mp4'}],
    hiapiRequests: [],
  };
  const assets = new Map<string, ResolvedAsset>([
    ['before', {...compiled.assets[0]!, absolutePath: 'C:\\fixtures\\before.png'}],
    ['after', {...compiled.assets[1]!, absolutePath: 'C:\\fixtures\\after.png'}],
  ]);
  const composition = buildFfmpegComposition({
    compiled,
    output: compiled.outputs[0]!,
    assets,
    textDirectory: 'C:\\fixtures\\text',
    cursorPath: 'C:\\fixtures\\cursor.rgba',
    cursorSize: 64,
    fontPath: 'C:\\fixtures\\font.ttf',
  });
  const calloutBox = composition.filterGraph.split(';\n').find((filter) => filter.includes('[calloutBox'));
  assert.ok(calloutBox);
  assert.match(calloutBox, /\+\(1400\)\*1/u);
});
