import fs from "node:fs";
import path from "node:path";
import { sha256File } from "./io.mjs";

const maximumTraceBytes = 64 * 1024 * 1024;

export function readAndValidateMotionTrace(output, compiled) {
  const file = path.join(output, "motion-trace.json");
  if (!fs.existsSync(file)) throw new Error("Blender completed without motion-trace.json.");
  const bytes = fs.statSync(file).size;
  if (bytes === 0 || bytes > maximumTraceBytes) {
    throw new Error(`Blender motion trace must contain 1 to ${maximumTraceBytes} bytes.`);
  }
  let payload;
  try {
    payload = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    throw new Error("Blender motion trace is not valid JSON.");
  }
  const summary = validateMotionTrace(payload, compiled);
  return {
    file: "motion-trace.json",
    bytes,
    sha256: sha256File(file),
    ...summary,
  };
}

export function validateMotionTrace(trace, compiled) {
  if (!plainObject(trace) || trace.version !== 1) throw new Error("Blender motion trace must use version 1.");
  if (trace.shotId !== compiled.id) throw new Error(`Blender motion trace belongs to ${trace.shotId || "<unknown>"}, expected ${compiled.id}.`);
  const timeline = compiled.timeline;
  const expectedCount = timeline.frameEnd - timeline.frameStart + 1;
  if (trace.fps !== timeline.fps || trace.frameStart !== timeline.frameStart || trace.frameEnd !== timeline.frameEnd || trace.frameCount !== expectedCount) {
    throw new Error("Blender motion trace timeline does not match compiled.json.");
  }
  const expectedObjectIds = compiled.objects.map((object) => object.id);
  if (!sameStringArray(trace.objectIds, expectedObjectIds)) {
    throw new Error("Blender motion trace objectIds do not match compiled.json.");
  }
  if (!Array.isArray(trace.frames) || trace.frames.length !== expectedCount) {
    throw new Error(`Blender motion trace contains ${Array.isArray(trace.frames) ? trace.frames.length : 0} of ${expectedCount} expected frames.`);
  }

  const cameraLocations = [];
  const lenses = [];
  trace.frames.forEach((record, index) => {
    const expectedFrame = timeline.frameStart + index;
    const expectedTime = round(index / timeline.fps);
    if (!plainObject(record) || record.frame !== expectedFrame) {
      throw new Error(`Blender motion trace record ${index} does not describe frame ${expectedFrame}.`);
    }
    if (!Number.isFinite(record.timeSeconds) || Math.abs(record.timeSeconds - expectedTime) > 0.000001) {
      throw new Error(`Blender motion trace frame ${expectedFrame} has an invalid timeSeconds value.`);
    }
    validateCamera(record.camera, expectedFrame);
    validateObjects(record.objects, expectedObjectIds, expectedFrame);
    cameraLocations.push(record.camera.location);
    lenses.push(record.camera.lensMm);
  });

  return {
    frameCount: expectedCount,
    objectCount: expectedObjectIds.length,
    camera: {
      pathDistance: round(pathDistance(cameraLocations)),
      minimumLensMm: Math.min(...lenses),
      maximumLensMm: Math.max(...lenses),
      startLocation: cameraLocations[0],
      endLocation: cameraLocations.at(-1),
    },
  };
}

function validateCamera(camera, frame) {
  if (!plainObject(camera)) throw new Error(`Blender motion trace frame ${frame} has no camera record.`);
  finiteVector(camera.location, `frame ${frame} camera.location`);
  finiteVector(camera.target, `frame ${frame} camera.target`);
  unitVector(camera.forward, `frame ${frame} camera.forward`);
  unitVector(camera.up, `frame ${frame} camera.up`);
  finiteNumber(camera.lensMm, `frame ${frame} camera.lensMm`, 12, 300);
  finiteNumber(camera.horizontalFovDeg, `frame ${frame} camera.horizontalFovDeg`, Number.EPSILON, 180);
  finiteNumber(camera.distanceToTarget, `frame ${frame} camera.distanceToTarget`, 0.001, 20000);
}

function validateObjects(objects, expectedIds, frame) {
  if (!Array.isArray(objects) || objects.length !== expectedIds.length) {
    throw new Error(`Blender motion trace frame ${frame} has an invalid object count.`);
  }
  objects.forEach((object, index) => {
    if (!plainObject(object) || object.id !== expectedIds[index]) {
      throw new Error(`Blender motion trace frame ${frame} object ${index} does not match ${expectedIds[index]}.`);
    }
    finiteVector(object.location, `frame ${frame} object ${object.id}.location`);
    finiteVector(object.rotationEulerDeg, `frame ${frame} object ${object.id}.rotationEulerDeg`);
  });
}

function finiteVector(value, label) {
  if (!Array.isArray(value) || value.length !== 3 || value.some((item) => !Number.isFinite(item))) {
    throw new Error(`Blender motion trace ${label} must contain three finite numbers.`);
  }
}

function unitVector(value, label) {
  finiteVector(value, label);
  const length = Math.sqrt(value.reduce((sum, item) => sum + (item ** 2), 0));
  if (Math.abs(length - 1) > 0.00001) throw new Error(`Blender motion trace ${label} must be normalized.`);
}

function finiteNumber(value, label, minimum, maximum) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`Blender motion trace ${label} must be between ${minimum} and ${maximum}.`);
  }
}

function pathDistance(points) {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += Math.sqrt(points[index].reduce((sum, value, axis) => sum + ((value - points[index - 1][axis]) ** 2), 0));
  }
  return total;
}

function sameStringArray(value, expected) {
  return Array.isArray(value) && value.length === expected.length && value.every((item, index) => item === expected[index]);
}

function plainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function round(value) {
  return Number(value.toFixed(6));
}
