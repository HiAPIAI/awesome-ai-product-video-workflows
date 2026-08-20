import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {stringify} from 'yaml';
import {DemoValidationError} from '../src/compiler/errors.js';
import {validateDemoFile} from '../src/compiler/validate.js';

test('validates a local demo and resolves its existing assets', () => {
  withDemo((directory, source) => {
    const result = validateDemoFile(path.join(directory, 'demo.yaml'));
    assert.equal(result.demo.project.id, 'validation-demo');
    assert.equal(result.assets.length, 1);
    assert.equal(result.assets[0]?.relativePath, 'assets/screen.png');
    assert.deepEqual(result.assets[0]?.buffer, Buffer.from('fixture-image'));
  });
});

test('rejects unsafe, external, missing, and non-file asset paths', () => {
  const cases = [
    ['../outside.png', /parent-directory|project-relative|outside/i],
    ['C:\\Users\\person\\secret.png', /project-relative/i],
    ['https://example.test/image.png?signature=secret', /URLs|signed links/i],
    ['assets/screen.png:secret', /reserved|ambiguous/i],
    ['assets/missing.png', /does not exist/i],
    ['assets', /not a regular file/i],
  ] as const;
  for (const [assetPath, expected] of cases) {
    withDemo((directory, source) => {
      source.assets[0]!.path = assetPath;
      writeSource(directory, source);
      assertValidationIssue(() => validateDemoFile(path.join(directory, 'demo.yaml')), expected, assetPath);
    });
  }
});

test('reports source schema failures for wrong versions, unknown fields, and invalid scene shapes', () => {
  const mutations: Array<(source: DemoFixture) => void> = [
    (source) => { source.schemaVersion = 'demo-v2'; },
    (source) => { (source.project as Record<string, unknown>).unexpected = true; },
    (source) => { delete source.scenes[0]!.assetId; },
  ];
  for (const mutate of mutations) {
    withDemo((directory, source) => {
      mutate(source);
      writeSource(directory, source);
      assert.throws(() => validateDemoFile(path.join(directory, 'demo.yaml')), DemoValidationError);
    });
  }
});

test('rejects duplicate ids, unknown references, overlap, and timing overflow', () => {
  const mutations: Array<[string, (source: DemoFixture) => void, RegExp]> = [
    ['duplicate asset', (source) => source.assets.push({...source.assets[0]!}), /duplicates id/],
    ['unknown asset', (source) => { source.scenes[0]!.assetId = 'unknown'; }, /unknown asset/],
    ['canvas overflow', (source) => { source.scenes[0]!.durationFrames = 121; }, /beyond canvas duration/],
    ['scene overlap', (source) => source.scenes.push({id: 'second', kind: 'title', heading: 'Second', startFrame: 60, durationFrames: 60}), /overlaps/],
    ['cursor overflow', (source) => { source.scenes[0]!.cursor = {from: {x: 0, y: 0}, to: {x: 1, y: 1}, clickFrames: [120]}; }, /inside the scene duration/],
    ['callout overflow', (source) => { source.scenes[0]!.callouts = [{text: 'Late', at: {x: 20, y: 20}, startFrame: 119, durationFrames: 2}]; }, /beyond the scene duration/],
  ];
  for (const [label, mutate, expected] of mutations) {
    withDemo((directory, source) => {
      mutate(source);
      writeSource(directory, source);
      assertValidationIssue(() => validateDemoFile(path.join(directory, 'demo.yaml')), expected, label);
    });
  }
});

test('rejects YAML aliases and duplicate mapping keys', () => {
  withDemo((directory) => {
    const file = path.join(directory, 'demo.yaml');
    fs.writeFileSync(file, 'schemaVersion: demo-v1\nschemaVersion: demo-v1\n');
    assertValidationIssue(() => validateDemoFile(file), /Map keys must be unique|duplicate/i);
    fs.writeFileSync(file, 'schemaVersion: demo-v1\nproject: &project {id: x, title: X}\ncopy: *project\n');
    assertValidationIssue(() => validateDemoFile(file), /alias|Excessive alias count/i);
  });
});

interface DemoFixture {
  schemaVersion: string;
  project: {id: string; title: string};
  canvas: {width: number; height: number; fps: number; durationFrames: number};
  brand: {background: string; foreground: string; accent: string; fontFamily: string};
  assets: Array<{id: string; type: string; path: string}>;
  scenes: Array<Record<string, unknown>>;
  outputs: Array<{id: string; width: number; height: number; fps: number; fileName: string}>;
  hiapi: {enabled: boolean; enhancements: unknown[]};
}

function fixture(): DemoFixture {
  return {
    schemaVersion: 'demo-v1',
    project: {id: 'validation-demo', title: 'Validation Demo'},
    canvas: {width: 1280, height: 720, fps: 30, durationFrames: 120},
    brand: {background: '#FFFFFF', foreground: '#111111', accent: '#0066CC', fontFamily: 'Arial'},
    assets: [{id: 'screen', type: 'image', path: 'assets/screen.png'}],
    scenes: [{id: 'screen', kind: 'screen', startFrame: 0, durationFrames: 120, assetId: 'screen'}],
    outputs: [{id: 'main', width: 1280, height: 720, fps: 30, fileName: 'demo.mp4'}],
    hiapi: {enabled: false, enhancements: []},
  };
}

function withDemo(run: (directory: string, source: DemoFixture) => void): void {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'app-demo-validation-'));
  try {
    fs.mkdirSync(path.join(directory, 'assets'));
    fs.writeFileSync(path.join(directory, 'assets', 'screen.png'), 'fixture-image');
    const source = fixture();
    writeSource(directory, source);
    run(directory, source);
  } finally {
    fs.rmSync(directory, {recursive: true, force: true});
  }
}

function writeSource(directory: string, source: DemoFixture): void {
  fs.writeFileSync(path.join(directory, 'demo.yaml'), stringify(source));
}

function assertValidationIssue(run: () => unknown, expected: RegExp, label?: string): void {
  assert.throws(run, (error: unknown) => {
    assert.ok(error instanceof DemoValidationError, label);
    const details = error.issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n');
    assert.match(details, expected, label);
    return true;
  });
}
