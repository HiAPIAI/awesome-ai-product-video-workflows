#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "./lib/args.mjs";
import { assertReviewedPrevis, assertSafeBaseUrl, assertTrustedApiTarget, bindApiIdentity, createTask, downloadOutput, ensurePendingJournal, extractOutputUrl, isDefinitiveSubmissionFailure, normalizeTaskId, prepareRequest, waitForTask } from "./lib/hiapi.mjs";
import { readJson, writeJson } from "./lib/io.mjs";

try {
  const booleanNames = new Set(["no-wait", "allow-custom-base-url"]);
  const allowedNames = new Set([...booleanNames, "request", "video", "confirm-preflight", "resume", "out-dir", "base-url", "poll-interval-ms", "poll-timeout-ms"]);
  const { options, positionals } = parseArgs(process.argv.slice(2), booleanNames, allowedNames);
  if (positionals.length) usage("Positional arguments are not supported.");
  const baseUrl = assertSafeBaseUrl(String(options["base-url"] || process.env.HIAPI_BASE_URL || "https://api.hiapi.ai"));
  const outputDir = path.resolve(options["out-dir"] || "outputs/hiapi");
  if (options.resume) {
    if (options.request || options.video || options["confirm-preflight"] || options["no-wait"]) usage("--resume cannot be combined with submit options.");
    assertTrustedApiTarget(baseUrl, Boolean(options["allow-custom-base-url"]));
    await finish(normalizeTaskId(options.resume), requireApiKey(), { options, baseUrl, outputDir });
  } else {
    if (!options.request || !options.video) usage("--request and --video are required.");
    const videoFile = path.resolve(options.video);
    const prepared = prepareRequest(readJson(path.resolve(options.request)), videoFile, {
      embedMedia: Boolean(options["confirm-preflight"]),
      baseUrl,
    });
    console.log(JSON.stringify({ ...prepared.summary, pricing: "https://www.hiapi.ai/en/pricing", preflightToken: prepared.preflightToken }, null, 2));
    if (!options["confirm-preflight"]) {
      console.log(`Dry run only. To create exactly this paid task, repeat the command with --confirm-preflight ${prepared.preflightToken}`);
    } else {
      if (options["confirm-preflight"] !== prepared.preflightToken) throw new Error("Preflight token mismatch. Run a fresh dry run after every request or video change.");
      assertTrustedApiTarget(baseUrl, Boolean(options["allow-custom-base-url"]));
      assertReviewedPrevis(path.join(path.dirname(videoFile), "review-report.json"), {
        videoSha256: prepared.summary.media.sha256,
        requestHash: prepared.requestHash,
      });
      const apiKey = requireApiKey();
      fs.mkdirSync(outputDir, { recursive: true });
      const pendingFile = path.join(outputDir, `preflight-${prepared.preflightToken}.pending.json`);
      const pending = ensurePendingJournal(pendingFile, {
        version: 1,
        state: "pending_submit",
        endpoint: prepared.summary.endpoint,
        preflightToken: prepared.preflightToken,
        apiIdentityBinding: bindApiIdentity(apiKey, prepared.preflightToken),
        media: prepared.summary.media,
        payload: prepared.summary.payload,
      });
      console.log(pending.reused ? "Reusing the existing pending journal inside its 23-hour idempotency window." : "Created a pending submission journal before POST.");
      let created;
      try {
        created = await createTask(prepared.payload, { baseUrl, apiKey, idempotencyKey: prepared.preflightToken });
      } catch (error) {
        if (isDefinitiveSubmissionFailure(error)) {
          fs.rmSync(pendingFile, { force: true });
          console.error(`Removed the pending journal after definitive HTTP ${error.statusCode}; no ambiguous paid submission remains.`);
        }
        throw error;
      }
      const { taskId, response } = created;
      writeJson(path.join(outputDir, `${taskId}.submitted.json`), { taskId, preflightToken: prepared.preflightToken, response });
      fs.rmSync(pendingFile, { force: true });
      console.log(`Created HiAPI task ${taskId}.`);
      if (!options["no-wait"]) await finish(taskId, apiKey, { options, baseUrl, outputDir });
    }
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

async function finish(taskId, apiKey, context) {
  const { options, baseUrl, outputDir } = context;
  const pollIntervalMs = numericOption(options["poll-interval-ms"], 5000, 250, 60000, "--poll-interval-ms");
  const pollTimeoutMs = numericOption(options["poll-timeout-ms"], 1200000, 1000, 86400000, "--poll-timeout-ms");
  let response;
  try {
    response = await waitForTask(taskId, {
    baseUrl,
    apiKey,
      pollIntervalMs,
      pollTimeoutMs,
    }, ({ status }) => console.log(`${taskId}: ${status}`));
  } catch (error) {
    if (error.taskResponse) {
      fs.mkdirSync(outputDir, { recursive: true });
      writeJson(path.join(outputDir, `${taskId}.result.json`), error.taskResponse);
    }
    throw error;
  }
  fs.mkdirSync(outputDir, { recursive: true });
  writeJson(path.join(outputDir, `${taskId}.result.json`), response);
  const url = extractOutputUrl(response);
  if (!url) throw new Error(`Task ${taskId} succeeded but no supported MP4 output URL was returned.`);
  const destination = path.join(outputDir, `${taskId}.mp4`);
  const downloaded = await downloadOutput(url, destination, { allowLocal: new URL(baseUrl).protocol === "http:" });
  writeJson(path.join(outputDir, `${taskId}.download.json`), downloaded);
  console.log(`Saved generated_unreviewed output to ${destination} (${downloaded.bytes} bytes, sha256 ${downloaded.sha256}). Human review is still required.`);
}

function requireApiKey() {
  if (!process.env.HIAPI_API_KEY) throw new Error("HIAPI_API_KEY is not configured in this process. Never paste the key into chat or command arguments.");
  return process.env.HIAPI_API_KEY;
}

function usage(message) {
  throw new Error(`${message}\nUsage:\n  node scripts/submit.mjs --request <seedance.request.json> --video <previs.mp4> [--confirm-preflight <token>]\n  node scripts/submit.mjs --resume <task-id> [--out-dir outputs/hiapi]`);
}

function numericOption(value, fallback, minimum, maximum, name) {
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) throw new Error(`${name} must be an integer from ${minimum} to ${maximum}.`);
  return parsed;
}
