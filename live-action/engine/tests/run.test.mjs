import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { buildPayload, parseCliArgs } from "../scripts/run.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runner = path.join(root, "scripts", "run.mjs");
const catalog = JSON.parse(fs.readFileSync(path.join(root, "data", "workflows.json"), "utf8"));

function runCli(args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [runner, ...args], {
      cwd: root,
      env: {
        ...process.env,
        HIAPI_API_KEY: "test-key",
        HIAPI_REQUEST_TIMEOUT_MS: "500",
        HIAPI_MAX_RETRIES: "3",
        HIAPI_RETRY_BASE_MS: "5",
        HIAPI_POLL_INTERVAL_MS: "5",
        HIAPI_TIMEOUT_MS: "3000",
        ...extraEnv,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`CLI timed out: ${args.join(" ")}`));
    }, 10000);
    child.on("error", reject);
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
  });
}

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

async function withServer(handler, callback) {
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const origin = `http://127.0.0.1:${address.port}`;
  try {
    return await callback(origin);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

function mediaPairsFor(workflow) {
  const pairs = [];
  for (const [key, value] of Object.entries(workflow.media ?? {})) {
    if (Array.isArray(value)) pairs.push(`${key}=https://example.com/${key}.bin`);
    else pairs.push(`${key}=https://example.com/${key}.jpg`);
  }
  return pairs;
}

test("strict CLI parsing rejects unknown options before a live request", async () => {
  assert.throws(() => parseCliArgs(["night-corridor-suspense", "--dry-rnu"]), /Unknown option/);
  const result = await runCli(["night-corridor-suspense", "--dry-rnu"]);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /Unknown option: --dry-rnu/);
  assert.doesNotMatch(result.stderr, /HIAPI_API_KEY/);
  assert.throws(
    () => parseCliArgs(["night-corridor-suspense", "--dry-run", "--output-dir", "outputs"]),
    /--dry-run cannot be combined with --output-dir/,
  );
});

test("dry-run stays offline even when live API environment is invalid", async () => {
  const result = await runCli(["night-corridor-suspense", "--dry-run", "--quiet"], {
    HIAPI_API_KEY: "",
    HIAPI_API_ORIGIN: "not-a-url",
  });
  assert.equal(result.code, 0, result.stderr);
});

test("all catalog workflows build requests for their declared media mode", () => {
  for (const workflow of catalog.workflows) {
    const payload = buildPayload(workflow, "en", mediaPairsFor(workflow));
    assert.equal(payload.model, "seedance-2.0");
    assert.equal(payload.input.duration, workflow.duration);
  }
});

test("runtime media overrides cannot mix generation modes", () => {
  const textWorkflow = catalog.workflows.find((workflow) => workflow.mode === "text-to-video");
  const imageWorkflow = catalog.workflows.find((workflow) => workflow.mode === "image-to-video");
  assert.throws(
    () => buildPayload(textWorkflow, "en", ["first_frame_url=https://example.com/frame.jpg"]),
    /text-to-video does not accept/,
  );
  assert.throws(
    () => buildPayload(imageWorkflow, "en", ["reference_image_urls=https://example.com/frame.jpg"]),
    /image-to-video does not accept/,
  );
});

test("live runner retries transient failures, preserves idempotency, and archives output", async (t) => {
  const archiveRoot = fs.mkdtempSync(path.join(os.tmpdir(), "seedance-runner-test-"));
  t.after(() => fs.rmSync(archiveRoot, { recursive: true, force: true }));
  const outputBytes = Buffer.from("fake-mp4-output");
  let postCount = 0;
  let getCount = 0;
  const idempotencyKeys = [];

  await withServer((req, res) => {
    if (req.method === "POST" && req.url === "/v1/tasks") {
      postCount += 1;
      idempotencyKeys.push(req.headers["idempotency-key"]);
      req.resume();
      if (postCount === 1) return json(res, 503, { message: "temporary submit failure" });
      return json(res, 200, { code: 200, data: { taskId: "task-retry" } });
    }
    if (req.method === "GET" && req.url === "/v1/tasks/task-retry") {
      getCount += 1;
      if (getCount === 1) return req.socket.destroy();
      if (getCount === 2) return json(res, 200, { code: 200, data: { taskId: "task-retry", status: "handling" } });
      return json(res, 200, {
        code: 200,
        data: {
          taskId: "task-retry",
          status: "success",
          output: [{ type: "video", url: `http://${req.headers.host}/artifact.mp4?token=output-secret`, expireAt: 123 }],
        },
      });
    }
    if (req.method === "GET" && req.url.startsWith("/artifact.mp4")) {
      res.writeHead(200, { "Content-Type": "video/mp4", "Content-Length": outputBytes.length });
      return res.end(outputBytes);
    }
    json(res, 404, { message: "not found" });
  }, async (origin) => {
    const result = await runCli([
      "rain-window-reunion",
      "--media",
      `first_frame_url=${origin}/input.jpg?token=media-secret`,
      "--output-dir",
      archiveRoot,
    ], { HIAPI_API_ORIGIN: origin });
    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /submit retry 1/);
    assert.match(result.stdout, /poll retry 1/);
    assert.match(result.stdout, /status: handling/);
    assert.match(result.stdout, /status: success/);
  });

  assert.equal(postCount, 2);
  assert.equal(new Set(idempotencyKeys).size, 1);
  assert.equal(getCount, 3);
  const taskDir = path.join(archiveRoot, "task-retry");
  assert.deepEqual(fs.readFileSync(path.join(taskDir, "output-1.mp4")), outputBytes);
  assert.ok(fs.existsSync(path.join(taskDir, "request.json")));
  const request = fs.readFileSync(path.join(taskDir, "request.json"), "utf8");
  const savedTask = fs.readFileSync(path.join(taskDir, "task.json"), "utf8");
  assert.doesNotMatch(request, /media-secret/);
  assert.doesNotMatch(savedTask, /output-secret/);
  const manifest = JSON.parse(fs.readFileSync(path.join(taskDir, "manifest.json"), "utf8"));
  assert.equal(manifest.workflow_id, "rain-window-reunion");
  assert.doesNotMatch(manifest.files[0].source_url, /output-secret/);
  assert.equal(manifest.files[0].sha256, createHash("sha256").update(outputBytes).digest("hex"));
});

test("task recovery polls an existing task without submitting a new one", async () => {
  let postCount = 0;
  let getCount = 0;
  await withServer((req, res) => {
    if (req.method === "POST") postCount += 1;
    if (req.method === "GET" && req.url === "/v1/tasks/task-existing") {
      getCount += 1;
      return json(res, 200, { code: 200, data: { taskId: "task-existing", status: "success", output: [] } });
    }
    json(res, 404, { message: "not found" });
  }, async (origin) => {
    const result = await runCli(["--task-id", "task-existing"], { HIAPI_API_ORIGIN: origin });
    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /status: success/);
  });
  assert.equal(postCount, 0);
  assert.equal(getCount, 1);
});

test("poll exhaustion reports a recovery command instead of resubmitting", async () => {
  let postCount = 0;
  let getCount = 0;
  await withServer((req, res) => {
    if (req.method === "POST" && req.url === "/v1/tasks") {
      postCount += 1;
      req.resume();
      return json(res, 200, { code: 200, data: { taskId: "task-needs-resume" } });
    }
    if (req.method === "GET" && req.url === "/v1/tasks/task-needs-resume") {
      getCount += 1;
      return json(res, 503, { message: "still unavailable" });
    }
    json(res, 404, { message: "not found" });
  }, async (origin) => {
    const result = await runCli(["night-corridor-suspense"], {
      HIAPI_API_ORIGIN: origin,
      HIAPI_MAX_RETRIES: "1",
    });
    assert.equal(result.code, 1);
    assert.match(result.stdout, /taskId: task-needs-resume/);
    assert.match(result.stderr, /Resume without resubmitting: npm run generate -- --task-id task-needs-resume/);
  });
  assert.equal(postCount, 1);
  assert.equal(getCount, 2);
});
