import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { installTarget } from "../scripts/install.mjs";

test("stages a replacement and preserves the existing .env", () => {
  const root = mkdtempSync(join(tmpdir(), "video-workflows-install-"));
  const destination = join(root, "skills", "awesome-ai-product-video-workflows");
  mkdirSync(destination, { recursive: true });
  writeFileSync(join(destination, ".env"), "PRIVATE=keep\n");
  writeFileSync(join(destination, "old.txt"), "old\n");

  installTarget({ directory: join(root, "skills") }, {
    id: "test-success",
    clone: (staging) => {
      mkdirSync(staging, { recursive: true });
      writeFileSync(join(staging, "new.txt"), "new\n");
    },
  });

  assert.equal(readFileSync(join(destination, ".env"), "utf8"), "PRIVATE=keep\n");
  assert.equal(readFileSync(join(destination, "new.txt"), "utf8"), "new\n");
  assert.equal(existsSync(join(destination, "old.txt")), false);
});

test("restores the previous install when staging fails", () => {
  const root = mkdtempSync(join(tmpdir(), "video-workflows-install-"));
  const destination = join(root, "skills", "awesome-ai-product-video-workflows");
  mkdirSync(destination, { recursive: true });
  writeFileSync(join(destination, "old.txt"), "old\n");

  assert.throws(() => installTarget({ directory: join(root, "skills") }, {
    id: "test-failure",
    clone: () => { throw new Error("network unavailable"); },
  }), /network unavailable/);

  assert.equal(readFileSync(join(destination, "old.txt"), "utf8"), "old\n");
  assert.equal(existsSync(`${destination}.staging-test-failure`), false);
});
