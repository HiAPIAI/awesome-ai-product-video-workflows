import test from "node:test";
import assert from "node:assert/strict";
import { runProcess } from "../scripts/lib/process.mjs";

test("captured child output is complete when the process closes", async () => {
  const size = 2 * 1024 * 1024;
  const result = await runProcess(process.execPath, [
    "--eval",
    `process.stdout.write("x".repeat(${size})); process.stderr.write("complete")`,
  ], "large-output child", { capture: true });
  assert.equal(result.stdout.length, size);
  assert.equal(result.stdout.at(-1), "x");
  assert.equal(result.stderr, "complete");
});
