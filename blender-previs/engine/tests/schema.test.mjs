import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import { validateShotSpec } from "../scripts/lib/spec.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema = readJson(path.join(root, "schemas", "shot-spec.schema.json"));
const validateSchema = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
const warehouse = readJson(path.join(root, "examples", "warehouse-pursuit", "shot.json"));

test("the public Draft 2020-12 schema accepts every committed example", () => {
  const examples = path.join(root, "examples");
  for (const entry of fs.readdirSync(examples, { withFileTypes: true }).filter((item) => item.isDirectory())) {
    const spec = readJson(path.join(examples, entry.name, "shot.json"));
    assert.equal(validateSchema(spec), true, `${entry.name}: ${formatErrors(validateSchema.errors)}`);
  }
});

test("schema and runtime both reject representative boundary violations", () => {
  const cases = [
    ["unknown root property", (spec) => { spec.unexpected = true; }],
    ["unknown nested property", (spec) => { spec.camera.keyframes[0].unexpected = true; }],
    ["odd H.264 width", (spec) => { spec.resolution.width = 641; }],
    ["out-of-range coordinate", (spec) => { spec.objects[0].keyframes[0].location[0] = 10001; }],
    ["unsupported material preset", (spec) => { spec.objects[0].materialPreset = "unbounded-shader"; }],
    ["excessive Cycles samples", (spec) => { spec.world.render = { engine: "cycles", samples: 129 }; }],
    ["unsafe camera aperture", (spec) => { spec.camera.fStop = 0.2; }],
    ["too many continuity locks", (spec) => { spec.seedance.continuity = Array.from({ length: 33 }, (_, index) => `continuity lock ${index}`); }],
  ];

  for (const [label, mutate] of cases) {
    const spec = structuredClone(warehouse);
    mutate(spec);
    assert.equal(validateSchema(spec), false, `${label}: schema unexpectedly accepted fixture`);
    assert.notEqual(validateShotSpec(spec).errors.length, 0, `${label}: runtime unexpectedly accepted fixture`);
  }
});

test("runtime validation adds cross-field rules that the public schema cannot express", () => {
  const spec = structuredClone(warehouse);
  spec.objects[0].keyframes[1].time = 0.001;
  assert.equal(validateSchema(spec), true, formatErrors(validateSchema.errors));
  assert.match(validateShotSpec(spec).errors.join("\n"), /maps to frame 1/);
});

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function formatErrors(errors) {
  return (errors || []).map((error) => `${error.instancePath || "/"} ${error.message}`).join("; ");
}
