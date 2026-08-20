import assert from "node:assert/strict";
import test from "node:test";
import { validateMotionTrace } from "../scripts/lib/motion-trace.mjs";

const compiled = {
  id: "trace-test",
  timeline: { fps: 24, frameStart: 1, frameEnd: 2 },
  objects: [{ id: "lead" }, { id: "background" }],
};

function validTrace() {
  return {
    version: 1,
    shotId: "trace-test",
    fps: 24,
    frameStart: 1,
    frameEnd: 2,
    frameCount: 2,
    objectIds: ["lead", "background"],
    frames: [
      frameRecord(1, 0, [0, 0, 0], 35),
      frameRecord(2, 0.041667, [3, 4, 0], 50),
    ],
  };
}

function frameRecord(frame, timeSeconds, location, lensMm) {
  return {
    frame,
    timeSeconds,
    camera: {
      location,
      target: [0, 1, 0],
      forward: [0, 1, 0],
      up: [0, 0, 1],
      lensMm,
      horizontalFovDeg: 54.4,
      distanceToTarget: 5,
    },
    objects: [
      { id: "lead", location: [1, 2, 3], rotationEulerDeg: [0, 0, 0] },
      { id: "background", location: [-1, 0, 2], rotationEulerDeg: [0, 45, 0] },
    ],
  };
}

test("motion trace validates exact frames and summarizes the evaluated camera path", () => {
  const summary = validateMotionTrace(validTrace(), compiled);
  assert.deepEqual(summary, {
    frameCount: 2,
    objectCount: 2,
    camera: {
      pathDistance: 5,
      minimumLensMm: 35,
      maximumLensMm: 50,
      startLocation: [0, 0, 0],
      endLocation: [3, 4, 0],
    },
  });
});

test("motion trace rejects missing frames and timeline drift", () => {
  const trace = validTrace();
  trace.frames.pop();
  assert.throws(() => validateMotionTrace(trace, compiled), /1 of 2 expected frames/);

  const wrongTime = validTrace();
  wrongTime.frames[1].timeSeconds = 0.04;
  assert.throws(() => validateMotionTrace(wrongTime, compiled), /invalid timeSeconds/);
});

test("motion trace rejects malformed camera orientation and object order", () => {
  const direction = validTrace();
  direction.frames[0].camera.forward = [0, 2, 0];
  assert.throws(() => validateMotionTrace(direction, compiled), /camera.forward must be normalized/);

  const objects = validTrace();
  objects.frames[1].objects.reverse();
  assert.throws(() => validateMotionTrace(objects, compiled), /object 0 does not match lead/);
});
