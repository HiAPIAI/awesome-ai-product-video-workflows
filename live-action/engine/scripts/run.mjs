#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "data", "workflows.json"), "utf8"));
const defaultApiOrigin = "https://api.hiapi.ai";
const successStatuses = new Set(["success", "completed"]);
const failureStatuses = new Set(["fail", "failed", "canceled", "cancelled"]);
const retryableStatuses = new Set([408, 425, 429, 500, 502, 503, 504]);
const mediaFields = new Set([
  "first_frame_url",
  "last_frame_url",
  "reference_image_urls",
  "reference_video_urls",
  "reference_audio_urls",
]);
const arrayMediaFields = new Set([
  "reference_image_urls",
  "reference_video_urls",
  "reference_audio_urls",
]);
const mediaFieldsByMode = new Map([
  ["text-to-video", new Set()],
  ["image-to-video", new Set(["first_frame_url", "last_frame_url"])],
  ["reference-to-video", new Set(["reference_image_urls", "reference_video_urls", "reference_audio_urls"])],
]);

function usage() {
  console.log(`Usage:
  npm run generate -- <workflow-id> [--dry-run] [--no-wait] [--zh]
  npm run generate -- <workflow-id> --media first_frame_url=YOUR_ASSET_URL
  npm run generate -- <workflow-id> --media reference_image_urls=YOUR_IMAGE_URL --media reference_video_urls=YOUR_VIDEO_URL
  npm run generate -- <workflow-id> --output-dir outputs
  npm run generate -- --task-id TASK_ID [--output-dir outputs]
  npm run generate -- --list

Options:
  --dry-run           Print the request without creating a paid task.
  --no-wait           Submit once, print the task id, and exit.
  --task-id ID        Resume polling an existing task without submitting a new one.
  --output-dir DIR    Save task metadata and download successful outputs.
  --media key=url     Replace a workflow media placeholder. Repeat for arrays.
  --zh                Use the Chinese prompt.
  --quiet             Suppress normal progress output.

Environment:
  HIAPI_API_KEY             Required for live submission or task recovery.
  HIAPI_TIMEOUT_MS          Total poll timeout. Default: 900000.
  HIAPI_REQUEST_TIMEOUT_MS  Timeout for one HTTP request. Default: 30000.
  HIAPI_MAX_RETRIES         Retries for transient HTTP/network errors. Default: 4.
  HIAPI_RETRY_BASE_MS       Initial retry delay. Default: 1000.
  HIAPI_POLL_INTERVAL_MS    Delay between task polls. Default: 3000.`);
}

function optionValue(argv, index, name) {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}

function parseCliArgs(argv) {
  const options = {
    dryRun: false,
    noWait: false,
    quiet: false,
    language: "en",
    list: false,
    help: false,
    mediaPairs: [],
    taskId: null,
    outputDir: null,
    workflowId: null,
  };
  const positionals = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--no-wait") options.noWait = true;
    else if (arg === "--quiet") options.quiet = true;
    else if (arg === "--zh") options.language = "zh";
    else if (arg === "--list") options.list = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--media") {
      options.mediaPairs.push(optionValue(argv, index, "--media"));
      index += 1;
    } else if (arg.startsWith("--media=")) {
      const value = arg.slice("--media=".length);
      if (!value) throw new Error("--media requires a value");
      options.mediaPairs.push(value);
    } else if (arg === "--task-id") {
      options.taskId = optionValue(argv, index, "--task-id");
      index += 1;
    } else if (arg.startsWith("--task-id=")) {
      options.taskId = arg.slice("--task-id=".length);
      if (!options.taskId) throw new Error("--task-id requires a value");
    } else if (arg === "--output-dir") {
      options.outputDir = optionValue(argv, index, "--output-dir");
      index += 1;
    } else if (arg.startsWith("--output-dir=")) {
      options.outputDir = arg.slice("--output-dir=".length);
      if (!options.outputDir) throw new Error("--output-dir requires a value");
    } else if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      positionals.push(arg);
    }
  }

  if (positionals.length > 1) throw new Error(`Unexpected positional argument: ${positionals[1]}`);
  options.workflowId = positionals[0] ?? null;

  if (options.help) return options;
  if (options.list) {
    if (options.workflowId || options.taskId || options.mediaPairs.length || options.outputDir || options.dryRun || options.noWait || options.language === "zh") {
      throw new Error("--list cannot be combined with workflow, task, media, language, or execution options");
    }
    return options;
  }
  if (options.taskId) {
    if (options.workflowId) throw new Error("--task-id cannot be combined with a workflow id");
    if (options.mediaPairs.length) throw new Error("--task-id cannot be combined with --media");
    if (options.dryRun || options.noWait || options.language === "zh") {
      throw new Error("--task-id cannot be combined with --dry-run, --no-wait, or --zh");
    }
    return options;
  }
  if (!options.workflowId) throw new Error("A workflow id is required. Run with --list to see valid ids.");
  if (options.dryRun && options.noWait) throw new Error("--dry-run cannot be combined with --no-wait");
  if (options.dryRun && options.outputDir) throw new Error("--dry-run cannot be combined with --output-dir");
  if (options.noWait && options.outputDir) throw new Error("--output-dir requires polling; remove --no-wait");
  return options;
}

function parseMediaOverrides(pairs) {
  const overrides = {};
  for (const pair of pairs) {
    const separator = pair.indexOf("=");
    if (separator < 1 || separator === pair.length - 1) throw new Error("--media must use key=value");
    const key = pair.slice(0, separator);
    const value = pair.slice(separator + 1);
    if (!mediaFields.has(key)) throw new Error(`Unsupported media field: ${key}`);
    let url;
    try {
      url = new URL(value);
    } catch {
      throw new Error(`--media ${key} must be an http(s) URL`);
    }
    if (!new Set(["http:", "https:"]).has(url.protocol)) {
      throw new Error(`--media ${key} must be an http(s) URL`);
    }
    if (arrayMediaFields.has(key)) (overrides[key] ??= []).push(value);
    else if (overrides[key]) throw new Error(`--media ${key} may only be provided once`);
    else overrides[key] = value;
  }
  return overrides;
}

function normalizeMedia(workflow, overrides) {
  const allowed = mediaFieldsByMode.get(workflow.mode);
  for (const key of Object.keys(overrides)) {
    if (!allowed?.has(key)) throw new Error(`${workflow.mode} does not accept --media ${key}=url`);
  }

  const media = structuredClone(workflow.media);
  for (const [key, value] of Object.entries(overrides)) media[key] = value;
  for (const [key, value] of Object.entries(media)) {
    if (Array.isArray(value)) {
      const usable = value.filter((item) => typeof item === "string" && !item.startsWith("asset://"));
      if (usable.length) media[key] = usable;
      else delete media[key];
    } else if (typeof value === "string" && value.startsWith("asset://")) {
      delete media[key];
    }
  }

  const requiredKeys = new Set();
  for (const asset of workflow.asset_roles.filter((item) => item.required)) {
    if (asset.slot.startsWith("@Image")) requiredKeys.add(workflow.mode === "image-to-video" ? "first_frame_url" : "reference_image_urls");
    if (asset.slot.startsWith("@Video")) requiredKeys.add("reference_video_urls");
    if (asset.slot.startsWith("@Audio")) requiredKeys.add("reference_audio_urls");
  }
  for (const key of requiredKeys) {
    if (!media[key] || (Array.isArray(media[key]) && media[key].length === 0)) {
      throw new Error(`This workflow requires --media ${key}=url`);
    }
  }
  return media;
}

function buildPayload(workflow, language, mediaPairs) {
  return {
    model: data.model,
    input: {
      prompt: workflow[`prompt_${language}`],
      duration: workflow.duration,
      resolution: workflow.resolution,
      aspect_ratio: workflow.aspect_ratio,
      generate_audio: true,
      ...normalizeMedia(workflow, parseMediaOverrides(mediaPairs)),
    },
  };
}

function positiveIntegerEnv(name, fallback, { allowZero = false } = {}) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  const valid = Number.isInteger(value) && (allowZero ? value >= 0 : value > 0);
  if (!valid) throw new Error(`${name} must be ${allowZero ? "a non-negative" : "a positive"} integer`);
  return value;
}

function apiConfig() {
  const customOrigin = process.env.HIAPI_API_ORIGIN?.trim();
  const apiOrigin = (customOrigin || defaultApiOrigin).replace(/\/$/, "");
  let parsedOrigin;
  try {
    parsedOrigin = new URL(apiOrigin);
  } catch {
    throw new Error("HIAPI_API_ORIGIN must be a valid URL");
  }
  if (!["http:", "https:"].includes(parsedOrigin.protocol)) {
    throw new Error("HIAPI_API_ORIGIN must use http or https");
  }
  const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);
  if (customOrigin && !localHosts.has(parsedOrigin.hostname) && process.env.HIAPI_ALLOW_CUSTOM_ORIGIN !== "1") {
    throw new Error("Non-local HIAPI_API_ORIGIN requires HIAPI_ALLOW_CUSTOM_ORIGIN=1");
  }
  return {
    apiOrigin,
    requestTimeoutMs: positiveIntegerEnv("HIAPI_REQUEST_TIMEOUT_MS", 30000),
    maxRetries: positiveIntegerEnv("HIAPI_MAX_RETRIES", 4, { allowZero: true }),
    retryBaseMs: positiveIntegerEnv("HIAPI_RETRY_BASE_MS", 1000),
    pollIntervalMs: positiveIntegerEnv("HIAPI_POLL_INTERVAL_MS", 3000),
    totalTimeoutMs: positiveIntegerEnv("HIAPI_TIMEOUT_MS", 900000),
  };
}

function apiKey() {
  const value = process.env.HIAPI_API_KEY?.trim();
  if (!value) throw new Error("HIAPI_API_KEY is required for live requests");
  return value;
}

function errorMessage(body, status) {
  return body?.error?.message ?? body?.message ?? (typeof body === "string" ? body : `HTTP ${status}`);
}

function retryDelayMs(response, attempt, baseMs) {
  const retryAfter = response?.headers?.get("retry-after");
  const seconds = retryAfter ? Number(retryAfter) : NaN;
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1000, 30000);
  return Math.min(baseMs * (2 ** attempt), 10000);
}

async function requestWithRetry(url, options, config, { parseJson = true, onRetry = () => {} } = {}) {
  let lastError;
  let attempts = 0;
  for (let attempt = 0; attempt <= config.maxRetries; attempt += 1) {
    attempts = attempt + 1;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.requestTimeoutMs);
    let response;
    try {
      response = await fetch(url, { ...options, signal: controller.signal });
      if (response.ok) {
        if (!parseJson) return response;
        const text = await response.text();
        let body;
        try {
          body = text ? JSON.parse(text) : null;
        } catch {
          body = text;
        }
        return body?.data ?? body;
      }

      const text = await response.text();
      let body;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = text;
      }
      const error = new Error(`HiAPI request failed (${response.status}): ${errorMessage(body, response.status)}`);
      error.retryable = retryableStatuses.has(response.status);
      error.response = response;
      throw error;
    } catch (error) {
      lastError = error;
      const retryable = error?.retryable !== false;
      if (!retryable || attempt >= config.maxRetries) break;
      const waitMs = retryDelayMs(error?.response, attempt, config.retryBaseMs);
      onRetry({ attempt: attempt + 1, waitMs, error });
      await delay(waitMs);
    } finally {
      clearTimeout(timer);
    }
  }
  const message = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`Request failed after ${attempts} attempt(s): ${message}`);
}

function taskStatus(task) {
  return String(task?.status ?? "unknown").toLowerCase();
}

function taskOutputs(task) {
  const outputs = task?.output ?? task?.outputs ?? [];
  return Array.isArray(outputs) ? outputs : [];
}

async function waitForTask(taskId, key, config, log) {
  const deadline = Date.now() + config.totalTimeoutMs;
  let lastStatus;
  while (Date.now() < deadline) {
    const current = await requestWithRetry(`${config.apiOrigin}/v1/tasks/${encodeURIComponent(taskId)}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${key}` },
    }, config, {
      onRetry: ({ attempt, waitMs, error }) => log(`poll retry ${attempt} in ${waitMs}ms: ${error.message}`),
    });
    const status = taskStatus(current);
    if (status !== lastStatus) {
      log(`status: ${status}`);
      lastStatus = status;
    }
    if (successStatuses.has(status)) return current;
    if (failureStatuses.has(status)) throw new Error(current.error?.message ?? `Generation ended with status ${status}`);
    await delay(config.pollIntervalMs);
  }
  throw new Error(`Timed out waiting for task ${taskId}`);
}

async function submitTask(payload, key, config, log) {
  const idempotencyKey = randomUUID();
  const task = await requestWithRetry(`${config.apiOrigin}/v1/tasks`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  }, config, {
    onRetry: ({ attempt, waitMs, error }) => log(`submit retry ${attempt} in ${waitMs}ms: ${error.message}`),
  });
  if (!task?.taskId) throw new Error("HiAPI response is missing data.taskId");
  log(`taskId: ${task.taskId}`);
  return task;
}

function outputExtension(output, url) {
  const pathname = new URL(url).pathname;
  const extension = path.extname(pathname).toLowerCase();
  if (/^\.[a-z0-9]{2,5}$/.test(extension)) return extension;
  if (output?.type === "video") return ".mp4";
  if (output?.type === "image") return ".png";
  if (output?.type === "audio") return ".mp3";
  return ".bin";
}

function redactUrlForArchive(value) {
  try {
    const url = new URL(value);
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "[invalid-url-redacted]";
  }
}

function payloadForArchive(payload) {
  const archived = structuredClone(payload);
  for (const key of mediaFields) {
    const value = archived.input?.[key];
    if (Array.isArray(value)) archived.input[key] = value.map(redactUrlForArchive);
    else if (typeof value === "string") archived.input[key] = redactUrlForArchive(value);
  }
  return archived;
}

function taskForArchive(task) {
  const archived = structuredClone(task);
  for (const output of taskOutputs(archived)) {
    if (typeof output?.url === "string") output.url = redactUrlForArchive(output.url);
  }
  return archived;
}

async function sha256File(filePath) {
  const hash = createHash("sha256");
  for await (const chunk of fs.createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
}

async function downloadOutput(output, index, directory, config, log) {
  if (!output?.url) return null;
  let parsed;
  try {
    parsed = new URL(output.url);
  } catch {
    throw new Error(`Output ${index + 1} has an invalid URL`);
  }
  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error(`Output ${index + 1} URL must use http(s)`);

  const fileName = `output-${index + 1}${outputExtension(output, output.url)}`;
  const target = path.join(directory, fileName);
  const partial = `${target}.part`;
  await fs.promises.rm(partial, { force: true });
  const response = await requestWithRetry(output.url, { headers: { Accept: "*/*" } }, config, {
    parseJson: false,
    onRetry: ({ attempt, waitMs, error }) => log(`download retry ${attempt} in ${waitMs}ms: ${error.message}`),
  });
  if (!response.body) throw new Error(`Output ${index + 1} response has no body`);
  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(partial));
  await fs.promises.rm(target, { force: true });
  await fs.promises.rename(partial, target);
  const stat = await fs.promises.stat(target);
  return {
    file: fileName,
    bytes: stat.size,
    sha256: await sha256File(target),
    source_url: redactUrlForArchive(output.url),
    type: output.type ?? null,
    expire_at: output.expireAt ?? null,
  };
}

async function archiveTask(task, { outputDir, payload, workflowId, config, log }) {
  const taskId = task?.taskId;
  if (!taskId) throw new Error("Cannot archive a task without taskId");
  const base = path.resolve(process.cwd(), outputDir);
  const directory = path.join(base, taskId.replace(/[^A-Za-z0-9._-]/g, "_"));
  await fs.promises.mkdir(directory, { recursive: true });
  await fs.promises.writeFile(path.join(directory, "task.json"), `${JSON.stringify(taskForArchive(task), null, 2)}\n`);
  if (payload) await fs.promises.writeFile(path.join(directory, "request.json"), `${JSON.stringify(payloadForArchive(payload), null, 2)}\n`);

  const files = [];
  for (const [index, output] of taskOutputs(task).entries()) {
    const saved = await downloadOutput(output, index, directory, config, log);
    if (saved) files.push(saved);
  }
  const manifest = {
    task_id: taskId,
    workflow_id: workflowId ?? null,
    archived_at: new Date().toISOString(),
    status: taskStatus(task),
    files,
  };
  await fs.promises.writeFile(path.join(directory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  log(`saved: ${directory}`);
  return directory;
}

async function main(argv = process.argv.slice(2)) {
  const options = parseCliArgs(argv);
  if (options.help) {
    usage();
    return;
  }
  if (options.list) {
    for (const workflow of data.workflows) console.log(`${workflow.id}\t${workflow.mode}\t${workflow.duration}s\t${workflow.title_en}`);
    return;
  }

  const log = options.quiet ? () => {} : console.log;
  if (options.taskId) {
    const config = apiConfig();
    const key = apiKey();
    const task = await waitForTask(options.taskId, key, config, log);
    for (const [index, output] of taskOutputs(task).entries()) {
      if (output?.url) log(`output ${index + 1}: ${output.url}`);
    }
    if (options.outputDir) await archiveTask(task, { outputDir: options.outputDir, config, log });
    return;
  }

  const workflow = data.workflows.find((item) => item.id === options.workflowId);
  if (!workflow) throw new Error(`Unknown workflow: ${options.workflowId}. Run with --list to see valid ids.`);
  const payload = buildPayload(workflow, options.language, options.mediaPairs);
  if (options.dryRun) {
    if (!options.quiet) console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const config = apiConfig();
  const key = apiKey();
  const submitted = await submitTask(payload, key, config, log);
  if (options.noWait) return;
  let task;
  try {
    task = await waitForTask(submitted.taskId, key, config, log);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${message}\nResume without resubmitting: npm run generate -- --task-id ${submitted.taskId}`);
  }
  for (const [index, output] of taskOutputs(task).entries()) {
    if (output?.url) log(`output ${index + 1}: ${output.url}`);
  }
  if (options.outputDir) {
    await archiveTask(task, {
      outputDir: options.outputDir,
      payload,
      workflowId: workflow.id,
      config,
      log,
    });
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}

export { archiveTask, buildPayload, main, normalizeMedia, parseCliArgs, parseMediaOverrides, redactUrlForArchive, requestWithRetry, waitForTask };
