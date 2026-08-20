import path from "node:path";
import { canonicalJson, readJson, sha256 } from "./io.mjs";

const primitives = new Set(["cube", "sphere", "cylinder", "cone"]);
const materialPresets = new Set(["matte", "painted-metal", "brushed-metal", "glass", "liquid", "rubber", "fabric", "skin", "hazmat", "emissive", "desert", "dust"]);
const renderEngines = new Set(["workbench", "cycles"]);
const lightTypes = new Set(["area", "point", "sun", "spot"]);
const outputResolutions = new Set(["480p", "720p", "1080p", "4k"]);
const aspectRatios = new Set(["16:9", "9:16", "1:1", "4:3", "3:4", "21:9", "adaptive"]);
const maximumCoordinate = 10000;
const maximumRotation = 36000;
const maximumKeyframes = 256;
const maximumListItems = 32;
const maximumPixelFrames = 1_000_000_000;

export function loadShotSpec(file) {
  const absolute = path.resolve(file);
  return { file: absolute, spec: readJson(absolute) };
}

export function validateShotSpec(spec) {
  const errors = [];
  const warnings = [];
  const fail = (location, message) => errors.push(`${location}: ${message}`);

  if (!plainObject(spec)) return { errors: ["root: expected an object."], warnings };
  rejectUnknown(spec, new Set(["$schema", "version", "id", "title", "intent", "duration", "fps", "resolution", "world", "objects", "camera", "seedance"]), "root", fail);
  if (spec.$schema !== undefined) stringBetween(spec.$schema, 1, 500, "$schema", fail);
  if (spec.version !== 1) fail("version", "must equal 1.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(spec.id || "")) fail("id", "must be a lowercase kebab-case identifier.");
  stringBetween(spec.title, 3, 160, "title", fail);
  stringBetween(spec.intent, 20, 2000, "intent", fail);
  integerRange(spec.duration, 4, 15, "duration", fail);
  integerRange(spec.fps, 12, 60, "fps", fail);

  if (!plainObject(spec.resolution)) {
    fail("resolution", "must be an object.");
  } else {
    rejectUnknown(spec.resolution, new Set(["width", "height"]), "resolution", fail);
    integerRange(spec.resolution.width, 256, 4096, "resolution.width", fail);
    integerRange(spec.resolution.height, 256, 4096, "resolution.height", fail);
    if (Number.isInteger(spec.resolution.width) && spec.resolution.width % 2 !== 0) fail("resolution.width", "must be even for H.264/yuv420p encoding.");
    if (Number.isInteger(spec.resolution.height) && spec.resolution.height % 2 !== 0) fail("resolution.height", "must be even for H.264/yuv420p encoding.");
    if (Number.isInteger(spec.resolution.width) && Number.isInteger(spec.resolution.height) && Number.isInteger(spec.duration) && Number.isInteger(spec.fps)
      && spec.resolution.width * spec.resolution.height * spec.duration * spec.fps > maximumPixelFrames) {
      fail("resolution", `exceeds the ${maximumPixelFrames.toLocaleString("en-US")} pixel-frame render budget; lower resolution, duration, or fps.`);
    }
  }

  validateWorld(spec.world, fail);
  validateObjects(spec.objects, spec.duration, spec.fps, fail, warnings);
  validateCamera(spec.camera, spec.duration, spec.fps, fail, warnings);
  validateSeedance(spec.seedance, fail);
  validateAspectRatio(spec.resolution, spec.seedance?.aspectRatio, fail);
  return { errors, warnings };
}

function validateWorld(world, fail) {
  if (!plainObject(world)) return fail("world", "must be an object.");
  rejectUnknown(world, new Set(["background", "groundColor", "groundSize", "lighting", "render", "lights"]), "world", fail);
  color(world.background, "world.background", fail);
  color(world.groundColor, "world.groundColor", fail);
  vector(world.groundSize, 2, "world.groundSize", fail, (value) => value > 0 && value <= maximumCoordinate);
  stringBetween(world.lighting, 5, 1000, "world.lighting", fail);
  if (world.render !== undefined) {
    if (!plainObject(world.render)) {
      fail("world.render", "must be an object.");
    } else {
      rejectUnknown(world.render, new Set(["engine", "samples", "volumeDensity"]), "world.render", fail);
      if (!renderEngines.has(world.render.engine)) fail("world.render.engine", `must be one of ${[...renderEngines].join(", ")}.`);
      integerRange(world.render.samples, 1, 128, "world.render.samples", fail);
      if (world.render.volumeDensity !== undefined) numberRange(world.render.volumeDensity, 0, 0.05, "world.render.volumeDensity", fail);
    }
  }
  if (world.lights !== undefined) validateLights(world.lights, fail);
}

function validateLights(lights, fail) {
  if (!Array.isArray(lights) || lights.length > 16) return fail("world.lights", "must contain at most 16 lights.");
  const ids = new Set();
  lights.forEach((light, index) => {
    const at = `world.lights[${index}]`;
    if (!plainObject(light)) return fail(at, "must be an object.");
    rejectUnknown(light, new Set(["id", "type", "color", "energy", "location", "rotation", "size", "spotSize"]), at, fail);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(light.id || "")) fail(`${at}.id`, "must be lowercase kebab-case.");
    if (ids.has(light.id)) fail(`${at}.id`, `duplicates "${light.id}".`);
    ids.add(light.id);
    if (!lightTypes.has(light.type)) fail(`${at}.type`, `must be one of ${[...lightTypes].join(", ")}.`);
    color(light.color, `${at}.color`, fail);
    numberRange(light.energy, 0, 100000, `${at}.energy`, fail);
    position(light.location, `${at}.location`, fail);
    vector(light.rotation, 3, `${at}.rotation`, fail, (value) => Math.abs(value) <= maximumRotation);
    if (light.size !== undefined) numberRange(light.size, Number.EPSILON, 1000, `${at}.size`, fail);
    if (light.spotSize !== undefined) numberRange(light.spotSize, 1, 179, `${at}.spotSize`, fail);
  });
}

function validateObjects(objects, duration, fps, fail, warnings) {
  if (!Array.isArray(objects) || objects.length === 0 || objects.length > 64) {
    fail("objects", "must contain between 1 and 64 objects.");
    return;
  }
  const ids = new Set();
  objects.forEach((object, index) => {
    const at = `objects[${index}]`;
    if (!plainObject(object)) return fail(at, "must be an object.");
    rejectUnknown(object, new Set(["id", "primitive", "role", "dimensions", "color", "materialPreset", "bevel", "smooth", "keyframes"]), at, fail);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(object.id || "")) fail(`${at}.id`, "must be lowercase kebab-case.");
    if (ids.has(object.id)) fail(`${at}.id`, `duplicates "${object.id}".`);
    ids.add(object.id);
    if (!primitives.has(object.primitive)) fail(`${at}.primitive`, `must be one of ${[...primitives].join(", ")}.`);
    stringBetween(object.role, 5, 500, `${at}.role`, fail);
    vector(object.dimensions, 3, `${at}.dimensions`, fail, (value) => value > 0 && value <= maximumCoordinate);
    color(object.color, `${at}.color`, fail);
    if (object.materialPreset !== undefined && !materialPresets.has(object.materialPreset)) fail(`${at}.materialPreset`, `must be one of ${[...materialPresets].join(", ")}.`);
    if (object.bevel !== undefined) numberRange(object.bevel, 0, 1, `${at}.bevel`, fail);
    if (object.smooth !== undefined && typeof object.smooth !== "boolean") fail(`${at}.smooth`, "must be a boolean.");
    validateKeyframes(object.keyframes, duration, fps, `${at}.keyframes`, fail, warnings, object.role);
  });
}

function validateKeyframes(keyframes, duration, fps, at, fail, warnings, role) {
  if (!Array.isArray(keyframes) || keyframes.length === 0 || keyframes.length > maximumKeyframes) return fail(at, `must contain between 1 and ${maximumKeyframes} keyframes.`);
  let previous = -Infinity;
  let previousFrame = -Infinity;
  keyframes.forEach((keyframe, index) => {
    const point = `${at}[${index}]`;
    if (!plainObject(keyframe)) return fail(point, "must be an object.");
    rejectUnknown(keyframe, new Set(["time", "location", "rotation"]), point, fail);
    numberRange(keyframe.time, 0, duration, `${point}.time`, fail);
    if (Number.isFinite(keyframe.time) && keyframe.time <= previous) fail(`${point}.time`, "must be strictly increasing.");
    if (validTimeline(duration, fps, keyframe.time)) {
      const frame = frameAt(keyframe.time, duration, fps);
      if (frame <= previousFrame) fail(`${point}.time`, `maps to frame ${frame}, which is not after the previous keyframe at ${fps} fps.`);
      previousFrame = frame;
    }
    previous = keyframe.time;
    position(keyframe.location, `${point}.location`, fail);
    if (keyframe.rotation !== undefined) vector(keyframe.rotation, 3, `${point}.rotation`, fail, (value) => Math.abs(value) <= maximumRotation);
  });
  for (let index = 1; index < keyframes.length; index += 1) {
    const before = keyframes[index - 1];
    const after = keyframes[index];
    if (!plainObject(before) || !plainObject(after)) continue;
    if (!validVector(before.location, 3) || !validVector(after.location, 3)) continue;
    const seconds = after.time - before.time;
    if (seconds <= 0) continue;
    const speed = distance(before.location, after.location) / seconds;
    if (speed > 12) warnings.push(`${at}: "${role}" reaches ${speed.toFixed(1)} m/s; confirm this is intentional.`);
    if (validVector(before.rotation, 3) && validVector(after.rotation, 3)) {
      const largestRotationStep = Math.max(...after.rotation.map((value, axis) => Math.abs(value - before.rotation[axis])));
      if (largestRotationStep > 180) {
        warnings.push(`${at}: "${role}" changes rotation by ${largestRotationStep.toFixed(1)} degrees between keys; Blender uses authored, unwrapped Euler values, so use values such as 350 -> 370 when a short forward turn is intended.`);
      }
    }
  }
}

function validateCamera(camera, duration, fps, fail, warnings) {
  if (!plainObject(camera)) return fail("camera", "must be an object.");
  rejectUnknown(camera, new Set(["lensMm", "sensorWidthMm", "fStop", "rig", "keyframes"]), "camera", fail);
  numberRange(camera.lensMm, 12, 300, "camera.lensMm", fail);
  numberRange(camera.sensorWidthMm, 8, 70, "camera.sensorWidthMm", fail);
  if (camera.fStop !== undefined) numberRange(camera.fStop, 0.7, 32, "camera.fStop", fail);
  stringBetween(camera.rig, 3, 500, "camera.rig", fail);
  if (!Array.isArray(camera.keyframes) || camera.keyframes.length < 2 || camera.keyframes.length > maximumKeyframes) {
    fail("camera.keyframes", `must contain between 2 and ${maximumKeyframes} keyframes.`);
    return;
  }
  let previous = -Infinity;
  let previousFrame = -Infinity;
  camera.keyframes.forEach((keyframe, index) => {
    const at = `camera.keyframes[${index}]`;
    if (!plainObject(keyframe)) return fail(at, "must be an object.");
    rejectUnknown(keyframe, new Set(["time", "location", "target", "lensMm"]), at, fail);
    numberRange(keyframe.time, 0, duration, `${at}.time`, fail);
    if (Number.isFinite(keyframe.time) && keyframe.time <= previous) fail(`${at}.time`, "must be strictly increasing.");
    if (validTimeline(duration, fps, keyframe.time)) {
      const frame = frameAt(keyframe.time, duration, fps);
      if (frame <= previousFrame) fail(`${at}.time`, `maps to frame ${frame}, which is not after the previous keyframe at ${fps} fps.`);
      previousFrame = frame;
    }
    previous = keyframe.time;
    position(keyframe.location, `${at}.location`, fail);
    position(keyframe.target, `${at}.target`, fail);
    if (validVector(keyframe.location, 3) && validVector(keyframe.target, 3) && distance(keyframe.location, keyframe.target) < 0.001) {
      fail(`${at}.target`, "must be at least 0.001 scene units from the camera location.");
    }
    if (keyframe.lensMm !== undefined) numberRange(keyframe.lensMm, 12, 300, `${at}.lensMm`, fail);
  });
  const first = camera.keyframes[0]?.time;
  const last = camera.keyframes.at(-1)?.time;
  if (first !== 0) warnings.push("camera.keyframes: first camera keyframe should start at 0 seconds.");
  if (last !== duration) warnings.push(`camera.keyframes: last camera keyframe should end at ${duration} seconds.`);
}

function validateSeedance(seedance, fail) {
  if (!plainObject(seedance)) return fail("seedance", "must be an object.");
  rejectUnknown(seedance, new Set(["model", "resolution", "aspectRatio", "generateAudio", "style", "continuity", "avoid", "seed"]), "seedance", fail);
  if (seedance.model !== "seedance-2.0") fail("seedance.model", "must equal seedance-2.0.");
  if (!outputResolutions.has(seedance.resolution)) fail("seedance.resolution", `must be one of ${[...outputResolutions].join(", ")}.`);
  if (!aspectRatios.has(seedance.aspectRatio)) fail("seedance.aspectRatio", `must be one of ${[...aspectRatios].join(", ")}.`);
  if (typeof seedance.generateAudio !== "boolean") fail("seedance.generateAudio", "must be a boolean.");
  stringBetween(seedance.style, 20, 2000, "seedance.style", fail);
  stringArray(seedance.continuity, 5, "seedance.continuity", fail);
  stringArray(seedance.avoid, 3, "seedance.avoid", fail);
  if (seedance.seed !== undefined) integerRange(seedance.seed, 0, 2147483647, "seedance.seed", fail);
}

export function compileShotSpec(spec) {
  const validation = validateShotSpec(spec);
  if (validation.errors.length) throw new Error(`Invalid shot spec:\n${validation.errors.map((error) => `- ${error}`).join("\n")}`);
  const frameEnd = spec.duration * spec.fps;
  const compiled = {
    version: 1,
    id: spec.id,
    title: spec.title,
    intent: spec.intent,
    timeline: { duration: spec.duration, fps: spec.fps, frameStart: 1, frameEnd },
    resolution: spec.resolution,
    world: spec.world,
    objects: spec.objects.map((object) => {
      let rotation = [0, 0, 0];
      return {
        ...object,
        keyframes: object.keyframes.map((keyframe) => {
          rotation = keyframe.rotation ? [...keyframe.rotation] : rotation;
          return { ...keyframe, frame: frameAt(keyframe.time, spec.duration, spec.fps), rotation: [...rotation] };
        }),
      };
    }),
    camera: {
      ...spec.camera,
      keyframes: spec.camera.keyframes.map((keyframe) => ({
        ...keyframe,
        frame: frameAt(keyframe.time, spec.duration, spec.fps),
        lensMm: keyframe.lensMm ?? spec.camera.lensMm,
      })),
    },
  };
  const prompt = compileSeedancePrompt(spec);
  const request = {
    model: spec.seedance.model,
    input: {
      prompt,
      reference_video_urls: ["{{PREVIS_VIDEO}}"],
      duration: spec.duration,
      resolution: spec.seedance.resolution,
      aspect_ratio: spec.seedance.aspectRatio,
      generate_audio: spec.seedance.generateAudio,
      ...(spec.seedance.seed === undefined ? {} : { seed: spec.seedance.seed }),
    },
  };
  const sourceHash = sha256(canonicalJson(spec));
  const compiledHash = sha256(canonicalJson(compiled));
  const requestHash = sha256(canonicalJson(request));
  return {
    compiled,
    prompt,
    request,
    warnings: validation.warnings,
    hashes: { source: sourceHash, compiled: compiledHash, request: requestHash },
  };
}

export function compileSeedancePrompt(spec) {
  const movement = spec.objects.map((object) => {
    let rotation = [0, 0, 0];
    const path = object.keyframes.map((keyframe) => {
      rotation = keyframe.rotation ?? rotation;
      return `${keyframe.time}s position [${keyframe.location.join(", ")}], rotation [${rotation.join(", ")}] degrees`;
    }).join(" -> ");
    return `${object.role}: ${path}`;
  }).join("; ");
  const camera = spec.camera.keyframes.map((keyframe) => (
    `${keyframe.time}s position [${keyframe.location.join(", ")}], aim [${keyframe.target.join(", ")}], ${keyframe.lensMm ?? spec.camera.lensMm}mm lens`
  )).join("; ");
  return [
    spec.intent,
    `Visual direction: ${spec.seedance.style}`,
    `Lighting contract: ${spec.world.lighting}`,
    spec.world.render?.engine === "cycles"
      ? `Reference role: Video 1 is a cinematic Blender previs. Preserve its composition, spatial relationships, action order, action timing, camera path, lens rhythm, lighting contrast, and pacing while replacing simplified geometry with production-detail subjects and environment.`
      : `Reference role: Video 1 is a gray-box Blender previs. Use it only for composition, spatial relationships, action order, action timing, camera path, lens rhythm, and pacing. Replace every proxy shape, flat material, label, and gray-box surface with the described cinematic subjects and environment; never retain the primitive CGI appearance.`,
    `Blocking contract: ${movement}.`,
    `Camera contract: ${spec.camera.rig}, ${spec.camera.lensMm}mm base lens on a ${spec.camera.sensorWidthMm}mm sensor; ${camera}. Preserve screen direction and reveal timing rather than copying viewport shading.`,
    `Continuity locks: ${spec.seedance.continuity.join("; ")}.`,
    `Avoid: ${spec.seedance.avoid.join("; ")}.`,
    spec.seedance.generateAudio
      ? `Generate production audio that follows the visible actions and the ${spec.duration}-second beat structure; keep dialogue absent unless explicitly described.`
      : "Do not generate audio.",
  ].join("\n\n");
}

function plainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringBetween(value, minimum, maximum, at, fail) {
  const length = typeof value === "string" ? value.trim().length : -1;
  if (length < minimum || length > maximum) fail(at, `must be a string from ${minimum} to ${maximum} characters.`);
}

function stringArray(value, minimum, at, fail) {
  if (!Array.isArray(value) || value.length === 0 || value.length > maximumListItems || value.some((item) => typeof item !== "string" || item.trim().length < minimum || item.trim().length > 500)) {
    fail(at, `must contain 1 to ${maximumListItems} strings of ${minimum} to 500 characters.`);
  }
}

function integerRange(value, minimum, maximum, at, fail) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) fail(at, `must be an integer from ${minimum} to ${maximum}.`);
}

function numberRange(value, minimum, maximum, at, fail) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) fail(at, `must be a number from ${minimum} to ${maximum}.`);
}

function vector(value, length, at, fail, predicate = () => true) {
  if (!validVector(value, length) || value.some((item) => !predicate(item))) fail(at, `must contain ${length} valid numbers.`);
}

function validVector(value, length) {
  return Array.isArray(value) && value.length === length && value.every(Number.isFinite);
}

function color(value, at, fail) {
  vector(value, 3, at, fail, (item) => item >= 0 && item <= 1);
}

function position(value, at, fail) {
  vector(value, 3, at, fail, (item) => Math.abs(item) <= maximumCoordinate);
}

function rejectUnknown(value, allowed, at, fail) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) fail(`${at}.${key}`, "is not an allowed property.");
  }
}

function validTimeline(duration, fps, time) {
  return Number.isInteger(duration) && Number.isInteger(fps) && Number.isFinite(time) && time >= 0 && time <= duration;
}

function frameAt(time, duration, fps) {
  return Math.min(duration * fps, 1 + Math.round(time * fps));
}

function validateAspectRatio(resolution, aspectRatio, fail) {
  if (!plainObject(resolution) || aspectRatio === "adaptive" || !/^\d+:\d+$/.test(aspectRatio || "")) return;
  const [left, right] = aspectRatio.split(":").map(Number);
  if (!Number.isFinite(resolution.width) || !Number.isFinite(resolution.height)) return;
  const expected = left / right;
  const actual = resolution.width / resolution.height;
  if (Math.abs(actual - expected) / expected > 0.02) {
    fail("seedance.aspectRatio", `does not match the ${resolution.width}x${resolution.height} previs; use a matching ratio or adaptive.`);
  }
}

function distance(left, right) {
  return Math.sqrt(left.reduce((sum, value, index) => sum + ((value - right[index]) ** 2), 0));
}
