import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { buildSeedanceHandoffGuide, createSeedanceHandoff } from "../scripts/lib/handoff.mjs";

const compiled = { id: "product-slide", title: "Product\nSlide" };
const request = {
  model: "seedance-2.0",
  input: {
    duration: 4,
    resolution: "720p",
    aspect_ratio: "16:9",
    generate_audio: false,
  },
};
const video = { codec: "h264", width: 640, height: 360, fps: 24, frameCount: 96, sha256: "video-hash" };
const motionTrace = {
  camera: {
    pathDistance: 0.9,
    minimumLensMm: 35,
    maximumLensMm: 35,
    startLocation: [-0.45, -7.2, 2.55],
    endLocation: [0.45, -7.2, 2.55],
  },
};

test("manual Seedance handoff binds the reviewed Blender artifacts", () => {
  withTemporaryDirectory((directory) => {
    writeFixture(directory, "previs.mp4", "video");
    writeFixture(directory, "prompt.txt", "prompt");
    writeFixture(directory, "review/first-frame.png", "first");
    writeFixture(directory, "review/contact-sheet.png", "sheet");
    writeFixture(directory, "motion-trace.json", "trace");

    const manifest = createSeedanceHandoff({ output: directory, compiled, request, video, motionTrace });
    assert.equal(manifest.mode, "manual-seedance-upload");
    assert.equal(manifest.apiSubmissionDefault, false);
    assert.equal(manifest.files.length, 5);
    assert.ok(manifest.files.every((file) => file.bytes > 0 && /^[a-f0-9]{64}$/.test(file.sha256)));
    assert.deepEqual(manifest.camera, motionTrace.camera);

    const guide = fs.readFileSync(path.join(directory, "seedance-handoff.md"), "utf8");
    assert.match(guide, /Upload `previs\.mp4` as the primary Blender motion reference/);
    assert.match(guide, /4 seconds, 720p, 16:9, and audio off/);
    assert.match(guide, /API submission is optional and disabled by default/);
    assert.doesNotMatch(guide, /Product\nSlide/);
  });
});

test("handoff refuses to hide a missing review artifact", () => {
  withTemporaryDirectory((directory) => {
    writeFixture(directory, "previs.mp4", "video");
    writeFixture(directory, "prompt.txt", "prompt");
    writeFixture(directory, "review/first-frame.png", "first");
    writeFixture(directory, "motion-trace.json", "trace");
    assert.throws(
      () => createSeedanceHandoff({ output: directory, compiled, request, video, motionTrace }),
      /missing or empty review\/contact-sheet\.png/,
    );
  });
});

test("handoff guide keeps camera facts explicit", () => {
  const guide = buildSeedanceHandoffGuide(compiled, {
    generation: { duration: 4, resolution: "720p", aspectRatio: "16:9", generateAudio: false },
    camera: motionTrace.camera,
  });
  assert.match(guide, /\[-0\.45, -7\.2, 2\.55\] to \[0\.45, -7\.2, 2\.55\]/);
  assert.match(guide, /0\.9 scene units, 35-35mm/);
});

function writeFixture(directory, relative, value) {
  const file = path.join(directory, ...relative.split("/"));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value);
}

function withTemporaryDirectory(callback) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "blender-handoff-test-"));
  try {
    return callback(directory);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
