import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import {
  acquireArtifactLock,
  cleanRenderArtifacts,
  createArtifactStaging,
  promoteStagedArtifacts,
  publishFileAtomically,
  validateFrameSequence,
  verifyVideoProbe,
  writeCompiledArtifacts,
} from "../scripts/lib/artifacts.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("compile and render share one canonical artifact writer", () => {
  withTemporaryDirectory((directory) => {
    const sourceFile = path.join(directory, "shot.json");
    const output = path.join(directory, "output");
    fs.writeFileSync(sourceFile, "{}\n");
    const result = {
      compiled: { version: 1, id: "test-shot" },
      request: { model: "seedance-2.0" },
      prompt: "A deterministic prompt.",
      hashes: { source: "source", compiled: "compiled", request: "request" },
      warnings: ["review this"],
    };
    const releaseLock = acquireArtifactLock(output, "test-shot");
    const manifest = writeCompiledArtifacts({ output, sourceFile, result, cwd: directory });
    releaseLock();
    assert.deepEqual(manifest.files, ["compiled.json", "prompt.txt", "seedance.request.json"]);
    assert.equal(manifest.source, "shot.json");
    assert.equal(JSON.parse(fs.readFileSync(path.join(output, "manifest.json"))).hashes.compiled, "compiled");
    assert.equal(fs.readFileSync(path.join(output, "prompt.txt"), "utf8"), "A deterministic prompt.\n");
  });
});

test("render cleanup removes only allow-listed generated artifacts", () => {
  withTemporaryDirectory((directory) => {
    const releaseLock = acquireArtifactLock(directory, "test-shot");
    fs.mkdirSync(path.join(directory, "frames"));
    fs.mkdirSync(path.join(directory, "review"));
    fs.writeFileSync(path.join(directory, "frames", "frame_0001.png"), "frame");
    fs.writeFileSync(path.join(directory, "review", "contact-sheet.png"), "sheet");
    fs.writeFileSync(path.join(directory, "previs.mp4"), "video");
    fs.writeFileSync(path.join(directory, "motion-trace.json"), "trace");
    fs.writeFileSync(path.join(directory, "previs.tmp-123.mp4"), "temporary");
    fs.writeFileSync(path.join(directory, "production-notes.txt"), "keep me");
    const removed = cleanRenderArtifacts(directory, "test-shot");
    assert.ok(removed.includes("frames/"));
    assert.ok(removed.includes("review/"));
    assert.ok(removed.includes("previs.mp4"));
    assert.ok(removed.includes("motion-trace.json"));
    assert.equal(fs.readFileSync(path.join(directory, "production-notes.txt"), "utf8"), "keep me");
    releaseLock();
  });
});

test("artifact ownership refuses unsafe directories and locks concurrent writers", () => {
  withTemporaryDirectory((directory) => {
    const unsafe = path.join(directory, "unsafe");
    fs.mkdirSync(unsafe);
    fs.writeFileSync(path.join(unsafe, "manifest.json"), "user file");
    assert.throws(() => acquireArtifactLock(unsafe, "test-shot"), /non-empty unowned output directory/);

    const output = path.join(directory, "owned");
    const releaseLock = acquireArtifactLock(output, "test-shot");
    assert.throws(() => acquireArtifactLock(output, "test-shot"), /locked by process/);
    releaseLock();
    assert.throws(() => acquireArtifactLock(output, "different-shot"), /not owned by shot/);
  });
});

test("expired live-PID locks are reclaimed instead of blocking forever after PID reuse", () => {
  withTemporaryDirectory((directory) => {
    const first = acquireArtifactLock(directory, "test-shot");
    first();
    fs.writeFileSync(path.join(directory, ".codex-previs-output.lock"), JSON.stringify({
      version: 1,
      pid: process.pid,
      shotId: "test-shot",
      token: "stale-token",
      createdAt: new Date(Date.now() - (25 * 60 * 60 * 1000)).toISOString(),
    }));
    const recovered = acquireArtifactLock(directory, "test-shot");
    recovered();
    assert.equal(fs.existsSync(path.join(directory, ".codex-previs-output.lock")), false);
  });
});

test("staged render publication preserves the previous render until replacement is complete", () => {
  withTemporaryDirectory((directory) => {
    const releaseMain = acquireArtifactLock(directory, "test-shot");
    fs.writeFileSync(path.join(directory, "previs.mp4"), "old-video");
    fs.writeFileSync(path.join(directory, "production-notes.txt"), "keep me");
    const staging = createArtifactStaging(directory, "test-shot");
    fs.writeFileSync(path.join(staging.directory, "previs.mp4"), "new-video");
    assert.throws(
      () => promoteStagedArtifacts(staging.directory, directory, "test-shot"),
      /Staged render is incomplete/,
    );
    assert.equal(fs.readFileSync(path.join(directory, "previs.mp4"), "utf8"), "old-video");

    for (const name of [
      "compiled.json",
      "prompt.txt",
      "seedance.request.json",
      "manifest.json",
      "previs.blend",
      "motion-trace.json",
      "render-report.json",
      "review-report.json",
      "review-checklist.md",
      "handoff-manifest.json",
      "seedance-handoff.md",
    ]) {
      fs.writeFileSync(path.join(staging.directory, name), `new-${name}`);
    }
    fs.mkdirSync(path.join(staging.directory, "frames"));
    fs.mkdirSync(path.join(staging.directory, "review"));
    fs.writeFileSync(path.join(staging.directory, "frames", "frame_0001.png"), "frame");
    fs.writeFileSync(path.join(staging.directory, "review", "contact-sheet.png"), "sheet");
    promoteStagedArtifacts(staging.directory, directory, "test-shot");
    assert.equal(fs.readFileSync(path.join(directory, "previs.mp4"), "utf8"), "new-video");
    assert.equal(fs.readFileSync(path.join(directory, "production-notes.txt"), "utf8"), "keep me");
    assert.equal(fs.readFileSync(path.join(directory, "frames", "frame_0001.png"), "utf8"), "frame");
    staging.dispose();
    releaseMain();
  });
});

test("an interrupted promotion restores the previous artifact set on the next run", () => {
  withTemporaryDirectory((directory) => {
    const releaseMain = acquireArtifactLock(directory, "test-shot");
    const backup = path.join(directory, ".codex-previs-backup-1-00000000-0000-4000-8000-000000000000");
    fs.mkdirSync(backup);
    fs.writeFileSync(path.join(backup, "previs.mp4"), "old-video");
    fs.writeFileSync(path.join(directory, "previs.mp4"), "partial-new-video");
    fs.writeFileSync(path.join(backup, ".transaction.json"), JSON.stringify({
      version: 1,
      kind: "codex-blender-seedance-promotion",
      shotId: "test-shot",
      phase: "publishing-new",
      oldNames: ["previs.mp4"],
      newNames: ["previs.mp4"],
    }));
    const staging = createArtifactStaging(directory, "test-shot");
    assert.equal(fs.readFileSync(path.join(directory, "previs.mp4"), "utf8"), "old-video");
    assert.equal(fs.existsSync(backup), false);
    staging.dispose();
    releaseMain();
  });
});

test("frame validation requires a non-empty exact continuous sequence", () => {
  withTemporaryDirectory((directory) => {
    for (let frame = 1; frame <= 3; frame += 1) {
      fs.writeFileSync(path.join(directory, `frame_${String(frame).padStart(4, "0")}.png`), `frame-${frame}`);
    }
    const sequence = validateFrameSequence(directory, 1, 3);
    assert.equal(sequence.count, 3);
    assert.equal(sequence.middle.frame, 2);
    fs.rmSync(path.join(directory, "frame_0002.png"));
    assert.throws(() => validateFrameSequence(directory, 1, 3), /missing frame_0002/);
    fs.writeFileSync(path.join(directory, "frame_0002.png"), "frame-2");
    fs.writeFileSync(path.join(directory, "frame_0004.png"), "frame-4");
    assert.throws(() => validateFrameSequence(directory, 1, 3), /unexpected frame_0004/);
    fs.rmSync(path.join(directory, "frame_0004.png"));
    fs.writeFileSync(path.join(directory, "frame_0002.png"), "");
    assert.throws(() => validateFrameSequence(directory, 1, 3), /empty files/);
  });
});

test("FFprobe facts must match the exact render contract", () => {
  const payload = {
    streams: [{
      codec_name: "h264",
      pix_fmt: "yuv420p",
      width: 640,
      height: 360,
      avg_frame_rate: "24/1",
      r_frame_rate: "24/1",
      nb_read_frames: "144",
    }],
  };
  const expected = { width: 640, height: 360, fps: 24, frameCount: 144 };
  assert.deepEqual(verifyVideoProbe(payload, expected), {
    codec: "h264",
    pixelFormat: "yuv420p",
    width: 640,
    height: 360,
    fps: 24,
    frameCount: 144,
    durationSeconds: 6,
  });
  assert.throws(() => verifyVideoProbe(payload, { ...expected, frameCount: 96 }), /frame count 144/);
  assert.throws(() => verifyVideoProbe({ streams: [{ ...payload.streams[0], pix_fmt: "yuv444p" }] }, expected), /pixel format yuv444p/);
});

test("temporary video publication refuses overwrite with atomic no-clobber linking", () => {
  withTemporaryDirectory((directory) => {
    const temporary = path.join(directory, "previs.tmp-1.mp4");
    const destination = path.join(directory, "previs.mp4");
    fs.writeFileSync(temporary, "video");
    publishFileAtomically(temporary, destination);
    assert.equal(fs.existsSync(temporary), false);
    assert.equal(fs.readFileSync(destination, "utf8"), "video");
    fs.writeFileSync(temporary, "new-video");
    assert.throws(() => publishFileAtomically(temporary, destination), /Refusing to replace/);
  });
});

test("render dry-run reports commands without creating the output directory", () => {
  withTemporaryDirectory((directory) => {
    const output = path.join(directory, "must-not-exist");
    const result = spawnSync(process.execPath, [
      path.join(root, "scripts", "render.mjs"),
      path.join(root, "examples", "warehouse-pursuit", "shot.json"),
      "--out-dir", output,
      "--scene-only",
      "--dry-run",
    ], { cwd: root, encoding: "utf8", windowsHide: true });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).writesFiles, false);
    assert.equal(fs.existsSync(output), false);
  });
});

test("compile CLI claims and releases its output directory", () => {
  withTemporaryDirectory((directory) => {
    const output = path.join(directory, "compiled-output");
    const args = [
      path.join(root, "scripts", "compile.mjs"),
      path.join(root, "examples", "warehouse-pursuit", "shot.json"),
      "--out-dir", output,
    ];
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const result = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8", windowsHide: true });
      assert.equal(result.status, 0, result.stderr);
      assert.equal(fs.existsSync(path.join(output, ".codex-previs-output.lock")), false);
    }
    assert.equal(JSON.parse(fs.readFileSync(path.join(output, "manifest.json"))).id, "warehouse-pursuit");
  });
});

test("CLI entry points reject unknown options without exposing stack traces", () => {
  for (const script of ["compile.mjs", "render.mjs", "validate.mjs"]) {
    const result = spawnSync(process.execPath, [path.join(root, "scripts", script), "--unknown"], {
      cwd: root,
      encoding: "utf8",
      windowsHide: true,
    });
    assert.equal(result.status, 1, script);
    assert.match(result.stderr, /Unknown option --unknown/);
    assert.doesNotMatch(result.stderr, /\n\s+at /);
  }
});

function withTemporaryDirectory(callback) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "blender-artifacts-test-"));
  try {
    return callback(directory);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
