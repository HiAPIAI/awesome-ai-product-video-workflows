#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "./lib/args.mjs";
import { loadShotSpec, validateShotSpec } from "./lib/spec.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let requested;
try {
  ({ positionals: requested } = parseArgs(process.argv.slice(2), new Set(), new Set()));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
const files = requested.length ? requested.map((file) => path.resolve(file)) : discoverExamples();
let failed = false;
for (const file of files) {
  try {
    const { spec } = loadShotSpec(file);
    const result = validateShotSpec(spec);
    const label = path.relative(root, file).split(path.sep).join("/");
    result.warnings.forEach((warning) => console.warn(`WARN ${label}: ${warning}`));
    if (result.errors.length) {
      failed = true;
      console.error(`FAIL ${label}\n${result.errors.map((error) => `  - ${error}`).join("\n")}`);
    } else {
      console.log(`PASS ${label}`);
    }
  } catch (error) {
    failed = true;
    console.error(`FAIL ${file}: ${error.message}`);
  }
}
if (failed) process.exitCode = 1;

function discoverExamples() {
  const directory = path.join(root, "examples");
  return fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(directory, entry.name, "shot.json"))
    .filter(fs.existsSync)
    .sort();
}
