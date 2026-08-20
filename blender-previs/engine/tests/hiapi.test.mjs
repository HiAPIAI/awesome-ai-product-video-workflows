import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import {
  assertReviewedPrevis,
  assertSafeBaseUrl,
  assertTrustedApiTarget,
  bindApiIdentity,
  createTask,
  downloadOutput,
  ensurePendingJournal,
  extractOutputUrl,
  isDefinitiveSubmissionFailure,
  normalizeTaskId,
  prepareRequest,
  waitForTask,
} from "../scripts/lib/hiapi.mjs";
import { canonicalJson } from "../scripts/lib/io.mjs";

const template = {
  model: "seedance-2.0",
  input: {
    prompt: "Keep the camera and blocking from Video 1, replacing all proxy geometry.",
    reference_video_urls: ["{{PREVIS_VIDEO}}"],
    duration: 5,
    resolution: "720p",
    aspect_ratio: "16:9",
    generate_audio: false,
  },
};

const idempotencyKey = "a".repeat(64);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("preflight token binds request, endpoint, and stable MP4 bytes without logging base64", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "blender-seedance-test-"));
  try {
    const video = path.join(directory, "previs.mp4");
    fs.writeFileSync(video, minimalMp4(1));
    const first = prepareRequest(template, video, { embedMedia: true, baseUrl: "https://api.hiapi.ai" });
    const second = prepareRequest(template, video, { embedMedia: true, baseUrl: "https://api.hiapi.ai/" });
    const development = prepareRequest(template, video, { baseUrl: "https://apidev.hiapi.ai" });

    assert.equal(first.preflightToken, second.preflightToken);
    assert.notEqual(first.preflightToken, development.preflightToken);
    assert.equal(first.summary.endpoint, "https://api.hiapi.ai/v1/tasks");
    assert.equal(development.summary.endpoint, "https://apidev.hiapi.ai/v1/tasks");
    assert.match(first.payload.input.reference_video_urls[0], /^data:video\/mp4;base64,/);
    assert.doesNotMatch(JSON.stringify(first.summary), /base64/);

    fs.writeFileSync(video, minimalMp4(2));
    assert.notEqual(prepareRequest(template, video).preflightToken, first.preflightToken);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("paid review gate binds the exact request and video to completed human review", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "blender-seedance-review-test-"));
  try {
    const video = path.join(directory, "previs.mp4");
    const reportFile = path.join(directory, "review-report.json");
    fs.writeFileSync(video, minimalMp4(3));
    const prepared = prepareRequest(template, video);
    const report = {
      video: { sha256: prepared.summary.media.sha256 },
      requestHash: prepared.requestHash,
      automaticChecks: { status: "pass" },
      humanReviewComplete: true,
    };
    fs.writeFileSync(reportFile, JSON.stringify(report));
    assert.deepEqual(assertReviewedPrevis(reportFile, {
      videoSha256: prepared.summary.media.sha256,
      requestHash: prepared.requestHash,
    }), report);

    fs.writeFileSync(reportFile, JSON.stringify({ ...report, humanReviewComplete: false }));
    assert.throws(() => assertReviewedPrevis(reportFile, {
      videoSha256: prepared.summary.media.sha256,
      requestHash: prepared.requestHash,
    }), /Human review is incomplete/);

    fs.writeFileSync(reportFile, JSON.stringify({ ...report, requestHash: "0".repeat(64) }));
    assert.throws(() => assertReviewedPrevis(reportFile, {
      videoSha256: prepared.summary.media.sha256,
      requestHash: prepared.requestHash,
    }), /does not match the selected Seedance request/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("trusted API targets require an official host or explicit custom-target approval", () => {
  assert.equal(assertTrustedApiTarget("https://api.hiapi.ai/"), "https://api.hiapi.ai");
  assert.equal(assertTrustedApiTarget("https://apidev.hiapi.ai"), "https://apidev.hiapi.ai");
  assert.equal(assertTrustedApiTarget("http://[::1]:3000"), "http://[::1]:3000");
  assert.throws(() => assertTrustedApiTarget("https://proxy.example"), /custom HIAPI_BASE_URL/);
  assert.equal(assertTrustedApiTarget("https://proxy.example", true), "https://proxy.example");
  assert.throws(() => assertSafeBaseUrl("https://api.hiapi.ai/v1"), /without a path/);
  assert.throws(() => assertSafeBaseUrl("https://api.hiapi.ai?target=other"), /query parameters/);
  assert.throws(() => assertSafeBaseUrl("http://api.example.test"), /must use HTTPS/);
});

test("task creation sends the preflight token as Idempotency-Key and polls to success", async () => {
  let posts = 0;
  let gets = 0;
  let submittedKey;
  let submittedBody;
  const { server, baseUrl } = await startServer((request, response) => {
    response.setHeader("Content-Type", "application/json");
    if (request.method === "POST" && request.url === "/v1/tasks") {
      posts += 1;
      submittedKey = request.headers["idempotency-key"];
      const chunks = [];
      request.on("data", (chunk) => chunks.push(chunk));
      request.on("end", () => {
        submittedBody = Buffer.concat(chunks).toString("utf8");
        response.end(JSON.stringify({ data: { taskId: "task-test-1" } }));
      });
      return;
    }
    if (request.method === "GET" && request.url === "/v1/tasks/task-test-1") {
      gets += 1;
      response.end(JSON.stringify({
        data: {
          status: "success",
          output: [{ type: "video", url: "https://example.test/result.mp4" }],
        },
      }));
      return;
    }
    response.statusCode = 404;
    response.end(JSON.stringify({ message: "not found" }));
  });

  try {
    const created = await createTask(template, { baseUrl, apiKey: "test-key", idempotencyKey });
    const result = await waitForTask(created.taskId, {
      baseUrl,
      apiKey: "test-key",
      pollIntervalMs: 250,
      pollTimeoutMs: 1000,
    });
    assert.equal(posts, 1);
    assert.equal(gets, 1);
    assert.equal(submittedKey, idempotencyKey);
    assert.equal(submittedBody, canonicalJson(template));
    assert.equal(extractOutputUrl(result), "https://example.test/result.mp4");
  } finally {
    await stopServer(server);
  }
});

test("pending journal preserves its first attempt and expires before server idempotency", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "blender-seedance-journal-test-"));
  try {
    const file = path.join(directory, "preflight-token.pending.json");
    const journal = {
      endpoint: "https://api.hiapi.ai/v1/tasks",
      preflightToken: idempotencyKey,
      apiIdentityBinding: bindApiIdentity("account-a-key", idempotencyKey),
    };
    const started = Date.parse("2026-07-29T00:00:00.000Z");
    const created = ensurePendingJournal(file, journal, started);
    assert.equal(created.reused, false);
    assert.equal(created.journal.firstAttemptAt, "2026-07-29T00:00:00.000Z");
    const reused = ensurePendingJournal(file, journal, started + (22 * 60 * 60 * 1000));
    assert.equal(reused.reused, true);
    assert.equal(reused.journal.firstAttemptAt, created.journal.firstAttemptAt);
    assert.throws(
      () => ensurePendingJournal(file, {
        ...journal,
        apiIdentityBinding: bindApiIdentity("account-b-key", idempotencyKey),
      }, started + 1000),
      /different API credential/,
    );
    assert.throws(
      () => ensurePendingJournal(file, journal, started + (23 * 60 * 60 * 1000)),
      /outside the 23-hour idempotency retry window/,
    );
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("task creation rejects missing idempotency and unsafe task ids before persistence", async () => {
  await assert.rejects(
    createTask(template, { baseUrl: "http://127.0.0.1:9", apiKey: "test-key" }),
    /64-character preflight token/,
  );
  assert.equal(normalizeTaskId("  task-safe_123  "), "task-safe_123");
  for (const value of ["", "../escape", "..\\escape", "task.with.dot", "a".repeat(129), "CON", "nul", "COM1", "LPT9"]) {
    assert.throws(() => normalizeTaskId(value), /unsafe characters|missing|reserved Windows filename/);
  }

  const { server, baseUrl } = await startServer((_request, response) => {
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ data: { taskId: "../escape" } }));
  });
  try {
    await assert.rejects(
      createTask(template, { baseUrl, apiKey: "test-key", idempotencyKey }),
      /unsafe characters/,
    );
  } finally {
    await stopServer(server);
  }
});

test("task API responses are rejected before buffering unbounded JSON", async () => {
  const { server, baseUrl } = await startServer((_request, response) => {
    response.setHeader("Content-Type", "application/json");
    response.setHeader("Content-Length", String((2 * 1024 * 1024) + 1));
    response.end("{}");
  });
  try {
    await assert.rejects(
      createTask(template, { baseUrl, apiKey: "test-key", idempotencyKey }),
      /response exceeds 2097152 bytes/,
    );
  } finally {
    await stopServer(server);
  }
});

test("only deterministic client errors clear an ambiguous submission journal", () => {
  for (const statusCode of [400, 401, 403, 404, 405, 413, 415]) {
    assert.equal(isDefinitiveSubmissionFailure(Object.assign(new Error("rejected"), { statusCode })), true);
  }
  for (const statusCode of [408, 409, 422, 425, 429, 500, 503, undefined]) {
    assert.equal(isDefinitiveSubmissionFailure(Object.assign(new Error("ambiguous"), { statusCode })), false);
  }
});

test("output selection prefers a typed video over an earlier image artifact", () => {
  const response = {
    data: {
      status: "success",
      output: [
        { type: "image", url: "https://cdn.example/cover.jpg" },
        { type: "video", url: "https://cdn.example/final.mp4" },
      ],
    },
  };
  assert.equal(extractOutputUrl(response), "https://cdn.example/final.mp4");

  const unsupportedFallback = {
    data: {
      output: [
        { url: "https://cdn.example/cover.jpg" },
        { url: "https://cdn.example/final.webm?signature=test" },
      ],
    },
  };
  assert.equal(extractOutputUrl(unsupportedFallback), null);
});

test("downloads a bounded MP4 atomically and removes invalid partial output", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "blender-seedance-download-test-"));
  const { server, baseUrl } = await startServer((request, response) => {
    if (request.url === "/html") {
      response.setHeader("Content-Type", "text/html");
      response.end(minimalMp4(7));
      return;
    }
    if (request.url === "/interrupted") {
      response.setHeader("Content-Type", "video/mp4");
      response.write(minimalMp4(9).subarray(0, 8));
      response.destroy();
      return;
    }
    response.setHeader("Content-Type", "video/mp4");
    if (request.url === "/oversized") response.setHeader("Content-Length", "2048");
    response.end(request.url === "/invalid" ? Buffer.alloc(20) : minimalMp4(7));
  });

  try {
    const destination = path.join(directory, "valid.mp4");
    const downloaded = await downloadOutput(`${baseUrl}/valid`, destination, {
      allowLocal: true,
      timeoutMs: 1000,
      maxBytes: 1024,
    });
    assert.equal(downloaded.destination, destination);
    assert.equal(downloaded.bytes, minimalMp4(7).length);
    assert.equal(downloaded.sha256, createHash("sha256").update(minimalMp4(7)).digest("hex"));
    assert.deepEqual(fs.readFileSync(destination), minimalMp4(7));
    await assert.rejects(
      downloadOutput(`${baseUrl}/valid`, destination, { allowLocal: true, timeoutMs: 1000, maxBytes: 1024 }),
      /Refusing to replace an existing downloaded output/,
    );

    const concurrentDestination = path.join(directory, "concurrent.mp4");
    const concurrent = await Promise.allSettled([
      downloadOutput(`${baseUrl}/valid`, concurrentDestination, { allowLocal: true, timeoutMs: 1000, maxBytes: 1024 }),
      downloadOutput(`${baseUrl}/valid`, concurrentDestination, { allowLocal: true, timeoutMs: 1000, maxBytes: 1024 }),
    ]);
    assert.equal(concurrent.filter((item) => item.status === "fulfilled").length, 1);
    assert.equal(concurrent.filter((item) => item.status === "rejected").length, 1);
    assert.match(concurrent.find((item) => item.status === "rejected").reason.message, /Refusing to replace/);
    assert.deepEqual(fs.readFileSync(concurrentDestination), minimalMp4(7));

    const fallbackDestination = path.join(directory, "fallback.mp4");
    const fallback = await downloadOutput(`http://localhost:${server.address().port}/valid`, fallbackDestination, {
      allowLocal: true,
      timeoutMs: 1000,
      maxBytes: 1024,
      lookup: async () => [
        { address: "127.0.0.2", family: 4 },
        { address: "127.0.0.1", family: 4 },
      ],
    });
    assert.equal(fallback.bytes, minimalMp4(7).length);

    const invalid = path.join(directory, "invalid.mp4");
    await assert.rejects(
      downloadOutput(`${baseUrl}/invalid`, invalid, { allowLocal: true, timeoutMs: 1000, maxBytes: 1024 }),
      /recognizable MP4/,
    );
    assert.equal(fs.existsSync(invalid), false);
    assert.deepEqual(fs.readdirSync(directory).filter((name) => name.includes(".part-")), []);

    await assert.rejects(
      downloadOutput(`${baseUrl}/html`, path.join(directory, "html.mp4"), { allowLocal: true, timeoutMs: 1000, maxBytes: 1024 }),
      /unexpected Content-Type/,
    );
    await assert.rejects(
      downloadOutput(`${baseUrl}/oversized`, path.join(directory, "oversized.mp4"), { allowLocal: true, timeoutMs: 1000, maxBytes: 1024 }),
      /exceeds 1024 bytes/,
    );
    await assert.rejects(
      downloadOutput(`${baseUrl}/interrupted`, path.join(directory, "interrupted.mp4"), { allowLocal: true, timeoutMs: 1000, maxBytes: 1024 }),
    );
    assert.deepEqual(fs.readdirSync(directory).filter((name) => name.includes(".part-")), []);

    await assert.rejects(
      downloadOutput(`${baseUrl}/valid`, path.join(directory, "blocked.mp4"), { timeoutMs: 1000 }),
      /HTTPS|localhost/,
    );
    await assert.rejects(
      downloadOutput("https://localhost./video.mp4", path.join(directory, "localhost-dot.mp4"), { timeoutMs: 1000 }),
      /localhost/,
    );
    await assert.rejects(
      downloadOutput("https://[::ffff:127.0.0.1]/video.mp4", path.join(directory, "mapped-loopback.mp4"), { timeoutMs: 1000 }),
      /private network/,
    );
    for (const address of ["fe90::1", "febf::1"]) {
      await assert.rejects(
        downloadOutput(`https://[${address}]/video.mp4`, path.join(directory, `${address.slice(0, 4)}.mp4`), { timeoutMs: 1000 }),
        /private network/,
      );
    }
  } finally {
    await stopServer(server);
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("download timeout covers stalled DNS and rejected streaming bodies are destroyed", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "blender-seedance-timeout-test-"));
  const started = Date.now();
  await assert.rejects(
    downloadOutput("https://stalled.example/video.mp4", path.join(directory, "dns.mp4"), {
      timeoutMs: 1000,
      maxBytes: 1024,
      lookup: () => new Promise(() => {}),
    }),
    /timed out after 1000 milliseconds/,
  );
  assert.ok(Date.now() - started < 1800);

  let closeStream;
  const streamClosed = new Promise((resolve) => { closeStream = resolve; });
  const { server, baseUrl } = await startServer((request, response) => {
    response.setHeader("Content-Type", "text/html");
    response.write("not video");
    const interval = setInterval(() => response.write("."), 10);
    request.on("close", () => {
      clearInterval(interval);
      closeStream();
    });
  });
  try {
    await assert.rejects(
      downloadOutput(`${baseUrl}/stream`, path.join(directory, "stream.mp4"), {
        allowLocal: true,
        timeoutMs: 1000,
        maxBytes: 1024,
      }),
      /unexpected Content-Type/,
    );
    await Promise.race([
      streamClosed,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Rejected response socket remained open.")), 500)),
    ]);
  } finally {
    await stopServer(server);
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("localhost CLI can submit, poll, and download through the explicit test exception", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "blender-seedance-local-cli-test-"));
  let baseUrl;
  const { server, baseUrl: startedBaseUrl } = await startServer((request, response) => {
    if (request.method === "POST" && request.url === "/v1/tasks") {
      request.resume();
      request.on("end", () => {
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify({ data: { taskId: "task-local" } }));
      });
      return;
    }
    if (request.url === "/v1/tasks/task-local") {
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify({ data: { status: "success", outputs: [{ type: "video", url: `${baseUrl}/video.mp4` }] } }));
      return;
    }
    if (request.url === "/video.mp4") {
      response.setHeader("Content-Type", "video/mp4");
      response.end(minimalMp4(11));
      return;
    }
    response.statusCode = 404;
    response.end();
  });
  baseUrl = startedBaseUrl;
  try {
    const video = path.join(directory, "previs.mp4");
    const requestFile = path.join(directory, "seedance.request.json");
    const output = path.join(directory, "hiapi");
    fs.writeFileSync(video, minimalMp4(10));
    fs.writeFileSync(requestFile, JSON.stringify(template));
    const prepared = prepareRequest(template, video, { baseUrl });
    fs.writeFileSync(path.join(directory, "review-report.json"), JSON.stringify({
      video: { sha256: prepared.summary.media.sha256 },
      requestHash: prepared.requestHash,
      automaticChecks: { status: "pass" },
      humanReviewComplete: true,
    }));
    const result = await runCli([
      path.join(root, "scripts", "submit.mjs"),
      "--request", requestFile,
      "--video", video,
      "--base-url", baseUrl,
      "--out-dir", output,
      "--confirm-preflight", prepared.preflightToken,
      "--poll-interval-ms", "250",
      "--poll-timeout-ms", "2000",
    ], { ...process.env, HIAPI_API_KEY: "local-test-key" });
    assert.equal(result.code, 0, result.stderr);
    assert.deepEqual(fs.readFileSync(path.join(output, "task-local.mp4")), minimalMp4(11));
    assert.equal(fs.existsSync(path.join(output, `preflight-${prepared.preflightToken}.pending.json`)), false);
  } finally {
    await stopServer(server);
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("CLI clears pending state after a definitive rejected POST", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "blender-seedance-rejected-cli-test-"));
  const { server, baseUrl } = await startServer((request, response) => {
    request.resume();
    request.on("end", () => {
      response.statusCode = 401;
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify({ message: "invalid test credential" }));
    });
  });
  try {
    const video = path.join(directory, "previs.mp4");
    const requestFile = path.join(directory, "seedance.request.json");
    const output = path.join(directory, "hiapi");
    fs.writeFileSync(video, minimalMp4(12));
    fs.writeFileSync(requestFile, JSON.stringify(template));
    const prepared = prepareRequest(template, video, { baseUrl });
    fs.writeFileSync(path.join(directory, "review-report.json"), JSON.stringify({
      video: { sha256: prepared.summary.media.sha256 },
      requestHash: prepared.requestHash,
      automaticChecks: { status: "pass" },
      humanReviewComplete: true,
    }));
    const result = await runCli([
      path.join(root, "scripts", "submit.mjs"),
      "--request", requestFile,
      "--video", video,
      "--base-url", baseUrl,
      "--out-dir", output,
      "--confirm-preflight", prepared.preflightToken,
    ], { ...process.env, HIAPI_API_KEY: "rejected-test-key" });
    assert.equal(result.code, 1);
    assert.match(result.stderr, /definitive HTTP 401/);
    assert.match(result.stderr, /invalid test credential/);
    assert.equal(fs.existsSync(path.join(output, `preflight-${prepared.preflightToken}.pending.json`)), false);
  } finally {
    await stopServer(server);
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("polling validates numeric bounds before network access", async () => {
  const config = { baseUrl: "http://127.0.0.1:9", apiKey: "test-key", pollTimeoutMs: 1000 };
  for (const pollIntervalMs of [Number.NaN, 0, 249, 60001, Number.POSITIVE_INFINITY]) {
    await assert.rejects(waitForTask("task-safe", { ...config, pollIntervalMs }), /poll interval/);
  }
  await assert.rejects(
    waitForTask("task-safe", { ...config, pollIntervalMs: 250, pollTimeoutMs: 999 }),
    /poll timeout/,
  );
});

test("polling accepts HiAPI handling and archiving states before success", async () => {
  const statuses = ["queued", "handling", "handling", "archiving", "success"];
  let requests = 0;
  const { server, baseUrl } = await startServer((_request, response) => {
    const status = statuses[Math.min(requests, statuses.length - 1)];
    requests += 1;
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ data: { status } }));
  });

  try {
    const result = await waitForTask("task-statuses", {
      baseUrl,
      apiKey: "test-key",
      pollIntervalMs: 250,
      pollTimeoutMs: 2000,
      retries: 0,
    });
    assert.equal(result.data.status, "success");
    assert.equal(requests, statuses.length);
  } finally {
    await stopServer(server);
  }
});

test("terminal task failures preserve public code, message, and response", async () => {
  const failure = {
    data: {
      status: "fail",
      error: { code: "BAD_MEDIA", message: "reference video invalid" },
    },
  };
  const { server, baseUrl } = await startServer((_request, response) => {
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify(failure));
  });

  try {
    await assert.rejects(
      waitForTask("task-failure", {
        baseUrl,
        apiKey: "test-key",
        pollIntervalMs: 250,
        pollTimeoutMs: 1000,
        retries: 0,
      }),
      (error) => {
        assert.match(error.message, /BAD_MEDIA - reference video invalid/);
        assert.deepEqual(error.taskResponse, failure);
        return true;
      },
    );
  } finally {
    await stopServer(server);
  }
});

test("three malformed task statuses fail as protocol drift instead of waiting forever", async () => {
  let requests = 0;
  const { server, baseUrl } = await startServer((_request, response) => {
    requests += 1;
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ data: {} }));
  });

  try {
    await assert.rejects(
      waitForTask("task-malformed", {
        baseUrl,
        apiKey: "test-key",
        pollIntervalMs: 250,
        pollTimeoutMs: 1500,
        retries: 0,
      }),
      /unknown status "unknown" three times/,
    );
    assert.equal(requests, 3);
  } finally {
    await stopServer(server);
  }
});

test("request placeholder, audio flag, seed, and video container are validated", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "blender-seedance-request-test-"));
  try {
    const video = path.join(directory, "previs.mp4");
    fs.writeFileSync(video, minimalMp4());

    const hosted = structuredClone(template);
    hosted.input.reference_video_urls = ["https://example.test/already-hosted.mp4"];
    assert.throws(() => prepareRequest(hosted, video), /exactly one/);

    const audio = structuredClone(template);
    audio.input.generate_audio = "false";
    assert.throws(() => prepareRequest(audio, video), /generate_audio.*boolean/i);

    const seed = structuredClone(template);
    seed.input.seed = -1;
    assert.throws(() => prepareRequest(seed, video), /seed.*integer/i);

    const fakeVideo = path.join(directory, "fake.mp4");
    fs.writeFileSync(fakeVideo, Buffer.alloc(20));
    assert.throws(() => prepareRequest(template, fakeVideo), /recognizable MP4/);

    const tooLarge = path.join(directory, "too-large.mp4");
    fs.closeSync(fs.openSync(tooLarge, "w"));
    fs.truncateSync(tooLarge, 90 * 1024 * 1024 + 1);
    assert.throws(() => prepareRequest(template, tooLarge), /exceeds 90 MiB/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

function minimalMp4(minorVersion = 0) {
  const box = Buffer.alloc(20);
  box.writeUInt32BE(box.length, 0);
  box.write("ftyp", 4, "ascii");
  box.write("isom", 8, "ascii");
  box.writeUInt32BE(minorVersion, 12);
  box.write("isom", 16, "ascii");
  return box;
}

async function startServer(handler) {
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return { server, baseUrl: `http://127.0.0.1:${server.address().port}` };
}

async function stopServer(server) {
  server.closeAllConnections?.();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

async function runCli(args, env) {
  return await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd: root, env, windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}
