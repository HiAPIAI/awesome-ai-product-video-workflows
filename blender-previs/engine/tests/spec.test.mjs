import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { compileShotSpec, validateShotSpec } from "../scripts/lib/spec.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const warehouse = JSON.parse(fs.readFileSync(path.join(root, "examples", "warehouse-pursuit", "shot.json"), "utf8"));

test("all example shot specs validate", () => {
  const exampleRoot = path.join(root, "examples");
  for (const entry of fs.readdirSync(exampleRoot, { withFileTypes: true }).filter((item) => item.isDirectory())) {
    const spec = JSON.parse(fs.readFileSync(path.join(exampleRoot, entry.name, "shot.json"), "utf8"));
    assert.deepEqual(validateShotSpec(spec).errors, [], entry.name);
  }
});

test("compilation is deterministic and binds the previs placeholder", () => {
  const first = compileShotSpec(warehouse);
  const second = compileShotSpec(structuredClone(warehouse));
  assert.deepEqual(first.hashes, second.hashes);
  assert.equal(first.request.input.reference_video_urls[0], "{{PREVIS_VIDEO}}");
  assert.match(first.prompt, /Replace every proxy shape/);
  assert.match(first.prompt, /rotation \[0, 0, -5\] degrees/);
  assert.match(first.prompt, /26mm lens/);
  assert.equal(first.compiled.timeline.frameEnd, 144);
  assert.equal(first.compiled.camera.keyframes.at(-1).frame, 144);
});

test("invalid timing and duplicate ids fail before Blender", () => {
  const invalid = cloneWarehouse();
  invalid.duration = 16;
  invalid.objects[1].id = invalid.objects[0].id;
  invalid.objects[0].keyframes[1].time = 0;
  const result = validateShotSpec(invalid);
  assert.ok(result.errors.some((error) => error.startsWith("duration:")));
  assert.ok(result.errors.some((error) => error.includes("duplicates")));
  assert.ok(result.errors.some((error) => error.includes("strictly increasing")));
});

test("unknown fields are rejected at root and nested schema boundaries", () => {
  const invalid = cloneWarehouse();
  invalid.unexpectedRoot = true;
  invalid.world.unexpectedWorld = true;
  invalid.objects[0].unexpectedObject = true;
  invalid.objects[0].keyframes[0].unexpectedKeyframe = true;
  invalid.camera.unexpectedCamera = true;
  invalid.camera.keyframes[0].unexpectedCameraKeyframe = true;
  invalid.seedance.unexpectedSeedance = true;

  const errors = validateShotSpec(invalid).errors;
  for (const location of [
    "root.unexpectedRoot",
    "world.unexpectedWorld",
    "objects[0].unexpectedObject",
    "objects[0].keyframes[0].unexpectedKeyframe",
    "camera.unexpectedCamera",
    "camera.keyframes[0].unexpectedCameraKeyframe",
    "seedance.unexpectedSeedance",
  ]) {
    assert.ok(errors.some((error) => error.startsWith(`${location}:`)), location);
  }
});

test("H.264 dimensions must be even and the previs ratio must match Seedance", () => {
  const odd = cloneWarehouse();
  odd.resolution = { width: 641, height: 359 };
  const oddErrors = validateShotSpec(odd).errors;
  assert.ok(oddErrors.some((error) => error.startsWith("resolution.width:") && error.includes("even")));
  assert.ok(oddErrors.some((error) => error.startsWith("resolution.height:") && error.includes("even")));

  const conflicting = cloneWarehouse();
  conflicting.seedance.aspectRatio = "9:16";
  assert.ok(validateShotSpec(conflicting).errors.some((error) => error.startsWith("seedance.aspectRatio:") && error.includes("does not match")));

  conflicting.seedance.aspectRatio = "adaptive";
  assert.deepEqual(validateShotSpec(conflicting).errors, []);
});

test("object and camera keyframes must map to distinct render frames", () => {
  const invalid = cloneWarehouse();
  invalid.objects[0].keyframes[1].time = 0.001;
  invalid.camera.keyframes[1].time = 0.001;
  const errors = validateShotSpec(invalid).errors;
  assert.ok(errors.some((error) => error.startsWith("objects[0].keyframes[1].time:") && error.includes("maps to frame 1")));
  assert.ok(errors.some((error) => error.startsWith("camera.keyframes[1].time:") && error.includes("maps to frame 1")));
});

test("null keyframes return located validation errors instead of throwing", () => {
  const invalid = cloneWarehouse();
  invalid.objects[0].keyframes[0] = null;
  invalid.camera.keyframes[0] = null;
  let result;
  assert.doesNotThrow(() => {
    result = validateShotSpec(invalid);
  });
  assert.ok(result.errors.some((error) => error.startsWith("objects[0].keyframes[0]:")));
  assert.ok(result.errors.some((error) => error.startsWith("camera.keyframes[0]:")));
});

test("valid-looking dimensions are rejected when the total render budget is unsafe", () => {
  const expensive = cloneWarehouse();
  expensive.duration = 15;
  expensive.fps = 60;
  expensive.resolution = { width: 4096, height: 4096 };
  expensive.seedance.aspectRatio = "adaptive";
  const errors = validateShotSpec(expensive).errors;
  assert.ok(errors.some((error) => error.startsWith("resolution:") && error.includes("pixel-frame render budget")));
});

test("omitted object rotation inherits the preceding authored rotation without aliasing", () => {
  const inherited = cloneWarehouse();
  const keyframes = inherited.objects[0].keyframes;
  keyframes[0].rotation = [1, 2, 3];
  delete keyframes[1].rotation;
  delete keyframes[2].rotation;

  const compiled = compileShotSpec(inherited).compiled.objects[0].keyframes;
  assert.deepEqual(compiled.map((keyframe) => keyframe.rotation), [[1, 2, 3], [1, 2, 3], [1, 2, 3]]);
  assert.notStrictEqual(compiled[0].rotation, compiled[1].rotation);
  assert.notStrictEqual(compiled[1].rotation, compiled[2].rotation);
  assert.equal(keyframes[1].rotation, undefined);
});

test("implausible proxy speeds produce a warning without blocking stunts", () => {
  const fast = cloneWarehouse();
  fast.objects[0].keyframes[1].location = [100, 0, 0.9];
  const result = validateShotSpec(fast);
  assert.equal(result.errors.length, 0);
  assert.ok(result.warnings.some((warning) => warning.includes("m/s")));
});

test("large Euler steps remain legal but explain Blender's unwrapped rotation semantics", () => {
  const rotating = cloneWarehouse();
  rotating.objects[0].keyframes[0].rotation = [0, 0, 350];
  rotating.objects[0].keyframes[1].rotation = [0, 0, 10];
  const result = validateShotSpec(rotating);
  assert.equal(result.errors.length, 0);
  assert.ok(result.warnings.some((warning) => warning.includes("unwrapped Euler")));
});

function cloneWarehouse() {
  return structuredClone(warehouse);
}
