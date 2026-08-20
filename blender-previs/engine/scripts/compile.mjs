#!/usr/bin/env node
import path from "node:path";
import { parseArgs } from "./lib/args.mjs";
import { acquireArtifactLock, writeCompiledArtifacts } from "./lib/artifacts.mjs";
import { compileShotSpec, loadShotSpec } from "./lib/spec.mjs";

try {
  const { options, positionals } = parseArgs(
    process.argv.slice(2),
    new Set(["check"]),
    new Set(["check", "out-dir"]),
  );
  if (positionals.length !== 1) throw new Error("Usage: node scripts/compile.mjs <shot.json> [--out-dir build/<id>] [--check]");
  const { file, spec } = loadShotSpec(positionals[0]);
  const result = compileShotSpec(spec);
  if (options.check) {
    console.log(`PASS ${spec.id}: source ${result.hashes.source.slice(0, 12)}, request ${result.hashes.request.slice(0, 12)}`);
    result.warnings.forEach((warning) => console.warn(`WARN ${warning}`));
  } else {
    const output = path.resolve(options["out-dir"] || path.join("build", spec.id));
    const releaseLock = acquireArtifactLock(output, spec.id);
    try {
      writeCompiledArtifacts({ output, sourceFile: file, result });
    } finally {
      releaseLock();
    }
    console.log(`Compiled ${spec.id} to ${output}`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
