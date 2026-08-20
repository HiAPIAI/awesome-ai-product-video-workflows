import fs from "node:fs";
import path from "node:path";
import dns from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import { createHash, randomUUID } from "node:crypto";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { canonicalJson, sha256 } from "./io.mjs";

const successStatuses = new Set(["success", "completed"]);
const failureStatuses = new Set(["fail", "failed", "error", "canceled", "cancelled"]);
const retryable = new Set([408, 425, 429, 500, 502, 503, 504]);
const activeStatuses = new Set(["pending", "queued", "submitted", "handling", "processing", "running", "archiving", "in_progress"]);
const maxMediaBytes = 90 * 1024 * 1024;
const maxRequestBytes = 127 * 1024 * 1024;
const maxDownloadBytes = 1024 * 1024 * 1024;
const maxJsonResponseBytes = 2 * 1024 * 1024;
const officialApiHosts = new Set(["api.hiapi.ai", "apidev.hiapi.ai"]);
const pendingRetryWindowMs = 23 * 60 * 60 * 1000;
const ambiguousSubmissionStatuses = new Set([408, 409, 422, 425, 429]);

export function prepareRequest(template, videoFile, options = {}) {
  const absolute = path.resolve(videoFile);
  const { buffer } = readStableFile(absolute);
  if (buffer.length === 0) throw new Error("Reference video is empty.");
  if (buffer.length > maxMediaBytes) throw new Error("Reference video exceeds 90 MiB. Compress it so the base64 request stays below the API body limit.");
  const extension = path.extname(absolute).toLowerCase();
  const mime = new Map([[".mp4", "video/mp4"], [".mov", "video/quicktime"], [".webm", "video/webm"]]).get(extension);
  if (!mime) throw new Error("Reference video must use an .mp4, .mov, or .webm extension.");
  assertVideoSignature(buffer, extension);
  const payload = structuredClone(template);
  validateGenerationRequest(payload);
  if (!payload?.input || !Array.isArray(payload.input.reference_video_urls)) {
    throw new Error("Request must contain input.reference_video_urls.");
  }
  const placeholders = payload.input.reference_video_urls.filter((value) => value === "{{PREVIS_VIDEO}}").length;
  if (placeholders !== 1 || payload.input.reference_video_urls.length !== 1) {
    throw new Error("Request must contain exactly one {{PREVIS_VIDEO}} reference placeholder.");
  }
  const media = { name: path.basename(absolute), bytes: buffer.length, sha256: sha256(buffer), mime };
  const projectedRequestBytes = Buffer.byteLength(canonicalJson(template)) + (4 * Math.ceil(buffer.length / 3)) + 1024;
  if (projectedRequestBytes > maxRequestBytes) {
    throw new Error("Confirmed request would exceed the 127 MiB API body safety limit. Compress the video or shorten the prompt.");
  }
  payload.input.reference_video_urls = options.embedMedia
    ? [`data:${mime};base64,${buffer.toString("base64")}`]
    : ["{{PREVIS_VIDEO}}"];
  const summaryPayload = structuredClone(payload);
  summaryPayload.input.reference_video_urls = [`local://${media.name}#sha256=${media.sha256}&bytes=${media.bytes}`];
  const baseUrl = assertSafeBaseUrl(options.baseUrl || "https://api.hiapi.ai");
  const summary = { endpoint: `${baseUrl}/v1/tasks`, method: "POST", media, payload: summaryPayload };
  const preflightToken = sha256(canonicalJson(summary));
  const requestHash = sha256(canonicalJson(template));
  return { payload, summary, preflightToken, requestHash };
}

export function assertReviewedPrevis(reviewFile, expected) {
  let report;
  try {
    report = JSON.parse(fs.readFileSync(reviewFile, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`Paid submission requires ${reviewFile}. Render and review the canonical previs first.`);
    }
    throw new Error(`Unable to read review report ${reviewFile}: ${error.message}`);
  }
  if (!plainObject(report) || !plainObject(report.video) || !plainObject(report.automaticChecks)) {
    throw new Error("Review report is malformed. Render the previs again before paid submission.");
  }
  if (!/^[a-f0-9]{64}$/.test(expected.videoSha256 || "") || !/^[a-f0-9]{64}$/.test(expected.requestHash || "")) {
    throw new Error("Internal review bindings are invalid.");
  }
  if (report.video.sha256 !== expected.videoSha256) {
    throw new Error("Review report does not match the selected previs video. Render and review these exact video bytes.");
  }
  if (report.requestHash !== expected.requestHash) {
    throw new Error("Review report does not match the selected Seedance request. Recompile, render, and review the exact request.");
  }
  if (!["pass", "attention"].includes(report.automaticChecks.status)) {
    throw new Error("Review report has no valid automatic-check result. Render the previs again.");
  }
  if (report.humanReviewComplete !== true) {
    throw new Error("Human review is incomplete. Watch the entire previs, complete review-checklist.md, then set humanReviewComplete to true in review-report.json.");
  }
  return report;
}

export async function createTask(payload, config) {
  const baseUrl = assertSafeBaseUrl(config.baseUrl);
  const idempotencyKey = validateIdempotencyKey(config.idempotencyKey);
  const response = await requestJson(`${baseUrl}/v1/tasks`, {
    method: "POST",
    headers: authHeaders(config.apiKey, idempotencyKey),
    body: canonicalJson(payload),
    timeoutMs: config.timeoutMs || 60000,
    redirect: "error",
  });
  const taskId = normalizeTaskId(extractTaskId(response));
  return { taskId, response };
}

export function ensurePendingJournal(file, journal, now = Date.now()) {
  if (!Number.isFinite(now)) throw new Error("Pending-journal clock is invalid.");
  if (!/^[a-f0-9]{64}$/.test(journal.apiIdentityBinding || "")) {
    throw new Error("Pending journal requires a valid API identity binding.");
  }
  if (fs.existsSync(file)) {
    const existing = readJsonFile(file, "pending journal");
    if (existing.preflightToken !== journal.preflightToken || existing.endpoint !== journal.endpoint) {
      throw new Error("Existing pending journal does not match this endpoint and preflight token.");
    }
    if (existing.apiIdentityBinding !== journal.apiIdentityBinding) {
      throw new Error("Existing pending journal belongs to a different API credential. Reconcile task history and billing instead of resubmitting with another key.");
    }
    const firstAttemptAt = Date.parse(existing.firstAttemptAt);
    const age = now - firstAttemptAt;
    if (!Number.isFinite(firstAttemptAt) || age < 0 || age >= pendingRetryWindowMs) {
      throw new Error("Pending submission is outside the 23-hour idempotency retry window. Do not resubmit until task history and billing have been reconciled.");
    }
    return { journal: existing, reused: true };
  }
  const value = {
    ...journal,
    firstAttemptAt: new Date(now).toISOString(),
    retrySafeUntil: new Date(now + pendingRetryWindowMs).toISOString(),
  };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  try {
    fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
    return { journal: value, reused: false };
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    return ensurePendingJournal(file, journal, now);
  }
}

export function bindApiIdentity(apiKey, preflightToken) {
  const token = normalizeApiKey(apiKey);
  const idempotencyKey = validateIdempotencyKey(preflightToken);
  return sha256(`hiapi-api-identity-v1\0${idempotencyKey}\0${token}`);
}

export function isDefinitiveSubmissionFailure(error) {
  const status = error?.statusCode;
  return Number.isInteger(status)
    && status >= 400
    && status < 500
    && !ambiguousSubmissionStatuses.has(status);
}

export async function getTask(taskId, config) {
  const safeTaskId = normalizeTaskId(taskId);
  const baseUrl = assertSafeBaseUrl(config.baseUrl);
  return requestJson(`${baseUrl}/v1/tasks/${encodeURIComponent(safeTaskId)}`, {
    method: "GET",
    headers: authHeaders(config.apiKey),
    timeoutMs: config.timeoutMs || 60000,
    retries: config.retries ?? 3,
    redirect: "error",
  });
}

export async function waitForTask(taskId, config, onUpdate = () => {}) {
  const safeTaskId = normalizeTaskId(taskId);
  const intervalMs = finiteInteger(config.pollIntervalMs ?? 5000, 250, 60000, "poll interval");
  const timeoutMs = finiteInteger(config.pollTimeoutMs ?? 20 * 60 * 1000, 1000, 24 * 60 * 60 * 1000, "poll timeout");
  const deadline = Date.now() + timeoutMs;
  let unknownStatuses = 0;
  while (Date.now() < deadline) {
    const remainingMs = deadline - Date.now();
    const response = await getTask(safeTaskId, { ...config, timeoutMs: Math.max(1, Math.min(config.timeoutMs || 60000, remainingMs)) });
    const status = extractStatus(response);
    onUpdate({ taskId: safeTaskId, status, response });
    if (successStatuses.has(status)) return response;
    if (failureStatuses.has(status)) {
      const detail = extractFailureDetail(response);
      const error = new Error(`HiAPI task ${safeTaskId} ended with status ${status}${detail ? `: ${detail}` : "."}`);
      error.taskResponse = response;
      throw error;
    }
    if (!activeStatuses.has(status)) {
      unknownStatuses += 1;
      if (unknownStatuses >= 3) throw new Error(`HiAPI task ${safeTaskId} returned unknown status "${status}" three times.`);
    } else {
      unknownStatuses = 0;
    }
    await new Promise((resolve) => setTimeout(resolve, Math.min(intervalMs, Math.max(0, deadline - Date.now()))));
  }
  throw new Error(`Timed out waiting for HiAPI task ${safeTaskId}. Resume later with --resume ${safeTaskId}.`);
}

export async function downloadOutput(url, destination, options = {}) {
  const timeoutMs = finiteInteger(options.timeoutMs ?? 5 * 60 * 1000, 1000, 30 * 60 * 1000, "download timeout");
  const byteLimit = finiteInteger(options.maxBytes ?? maxDownloadBytes, 1, maxDownloadBytes, "download byte limit");
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  if (fs.existsSync(destination)) throw new Error(`Refusing to replace an existing downloaded output: ${destination}`);
  const controller = new AbortController();
  const deadline = Date.now() + timeoutMs;
  const timer = setTimeout(() => controller.abort(new Error(`Output download timed out after ${timeoutMs} milliseconds.`)), timeoutMs);
  const temporary = `${destination}.part-${process.pid}-${randomUUID()}`;
  let bytes = 0;
  const digest = createHash("sha256");
  try {
    const response = await requestSafeRedirects(url, {
      signal: controller.signal,
      deadline,
      allowLocal: Boolean(options.allowLocal),
      lookup: options.lookup,
    });
    const status = response.statusCode || 0;
    if (status < 200 || status >= 300) {
      discardResponse(response);
      throw new Error(`Unable to download output: HTTP ${status}.`);
    }
    const type = String(headerValue(response.headers["content-type"]) || "").toLowerCase();
    if (type && !type.startsWith("video/mp4") && !type.startsWith("application/octet-stream")) {
      discardResponse(response);
      throw new Error(`Output download returned unexpected Content-Type ${type}.`);
    }
    const declared = Number(headerValue(response.headers["content-length"]));
    if (Number.isFinite(declared) && declared > byteLimit) {
      discardResponse(response);
      throw new Error(`Output download exceeds ${byteLimit} bytes.`);
    }
    const limiter = new Transform({
      transform(chunk, encoding, callback) {
        bytes += chunk.length;
        if (bytes <= byteLimit) digest.update(chunk);
        callback(bytes > byteLimit ? new Error(`Output download exceeds ${byteLimit} bytes.`) : null, chunk);
      },
    });
    await pipeline(response, limiter, fs.createWriteStream(temporary, { flags: "wx" }));
    if (bytes === 0) throw new Error("Output download was empty.");
    const handle = fs.openSync(temporary, "r");
    const header = Buffer.alloc(12);
    try {
      fs.readSync(handle, header, 0, header.length, 0);
    } finally {
      fs.closeSync(handle);
    }
    assertVideoSignature(header, ".mp4");
    controller.signal.throwIfAborted();
    publishNoClobber(temporary, destination);
    return { destination, bytes, sha256: digest.digest("hex") };
  } catch (error) {
    if (controller.signal.aborted) {
      throw controller.signal.reason instanceof Error
        ? controller.signal.reason
        : new Error(`Output download timed out after ${timeoutMs} milliseconds.`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
    if (!controller.signal.aborted) controller.abort();
    fs.rmSync(temporary, { force: true });
  }
}

export function extractTaskId(response) {
  return response?.data?.taskId || response?.data?.task_id || response?.taskId || response?.task_id || response?.data?.id || null;
}

export function extractStatus(response) {
  const value = response?.data?.status ?? response?.status;
  return typeof value === "string" && value.trim() ? value.trim().toLowerCase() : "unknown";
}

export function extractOutputUrl(response) {
  const data = response?.data || response;
  const entries = [data?.outputs, Array.isArray(data?.output) ? data.output : null].filter(Array.isArray).flat();
  const typedVideo = entries.find((item) => plainObject(item) && /video/i.test(String(item.type || item.media_type || item.kind || "")) && mp4Url(item.url || item.video_url));
  if (typedVideo) return typedVideo.url || typedVideo.video_url;
  const extensionVideo = entries.find((item) => plainObject(item) && mp4Url(item.url || item.video_url) && /\.mp4(?:[?#]|$)/i.test(item.url || item.video_url));
  if (extensionVideo) return extensionVideo.url || extensionVideo.video_url;
  const candidates = [
    data?.output?.video_url,
    data?.output?.videoUrl,
    data?.output_url,
    data?.video_url,
    data?.url,
    data?.outputs?.[0]?.url,
    data?.output?.[0]?.url,
  ];
  return candidates.find(mp4Url) || null;
}

async function requestJson(url, options) {
  const retries = options.retries || 0;
  const deadline = Date.now() + (options.timeoutMs || 60000);
  for (let attempt = 0; ; attempt += 1) {
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) throw new Error("HiAPI request timed out.");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), remainingMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal, timeoutMs: undefined, retries: undefined });
      const text = await readBoundedResponseText(response, maxJsonResponseBytes);
      let body;
      try {
        body = text ? JSON.parse(text) : {};
      } catch {
        body = { message: text.slice(0, 500) };
      }
      if (response.ok) return body;
      if (attempt < retries && retryable.has(response.status)) {
        await retryDelay(500 * (2 ** attempt), deadline, `HiAPI request failed (${response.status}).`);
        continue;
      }
      const message = String(body?.message || body?.error?.message || `HTTP ${response.status}`).slice(0, 500);
      const error = new Error(`HiAPI request failed (${response.status}): ${message}`);
      error.statusCode = response.status;
      error.response = body;
      throw error;
    } catch (error) {
      if (attempt < retries && (error.name === "AbortError" || error instanceof TypeError)) {
        await retryDelay(500 * (2 ** attempt), deadline, error.message || "HiAPI request failed.");
        continue;
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}

function authHeaders(apiKey, idempotencyKey) {
  const token = normalizeApiKey(apiKey);
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
  };
}

function normalizeApiKey(apiKey) {
  if (typeof apiKey !== "string" || !apiKey.trim()) throw new Error("HIAPI_API_KEY is empty.");
  const token = apiKey.trim();
  if (/[\x00-\x1f\x7f]/.test(token)) throw new Error("HIAPI_API_KEY contains invalid control characters.");
  return token;
}

export function assertSafeBaseUrl(value) {
  const url = new URL(value);
  const local = isLocalHost(url.hostname);
  if (url.protocol !== "https:" && !(local && url.protocol === "http:")) {
    throw new Error("HIAPI_BASE_URL must use HTTPS. Plain HTTP is allowed only for localhost tests.");
  }
  if (url.username || url.password || url.search || url.hash) throw new Error("HIAPI_BASE_URL must not include credentials, query parameters, or a fragment.");
  if (url.pathname !== "/") throw new Error("HIAPI_BASE_URL must be an origin without a path.");
  return url.origin;
}

export function assertTrustedApiTarget(value, allowCustom = false) {
  const baseUrl = assertSafeBaseUrl(value);
  const hostname = normalizedHostname(new URL(baseUrl).hostname);
  if (!officialApiHosts.has(hostname) && !isLocalHost(hostname) && !allowCustom) {
    throw new Error("Paid requests to a custom HIAPI_BASE_URL require --allow-custom-base-url after reviewing the full endpoint in the dry run.");
  }
  return baseUrl;
}

export function normalizeTaskId(value) {
  const taskId = typeof value === "string" ? value.trim() : "";
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(taskId)) {
    throw new Error("HiAPI task id is missing or contains unsafe characters.");
  }
  if (/^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i.test(taskId)) {
    throw new Error("HiAPI task id is a reserved Windows filename.");
  }
  return taskId;
}

function validateGenerationRequest(payload) {
  const input = payload?.input;
  if (payload?.model !== "seedance-2.0") throw new Error("Request model must be seedance-2.0.");
  if (!input || typeof input.prompt !== "string" || input.prompt.trim().length < 20) throw new Error("Request input.prompt is missing or too short.");
  if (!Number.isInteger(input.duration) || input.duration < 4 || input.duration > 15) throw new Error("Request input.duration must be an integer from 4 to 15.");
  if (!["480p", "720p", "1080p", "4k"].includes(input.resolution)) throw new Error("Request input.resolution is invalid.");
  if (!["16:9", "9:16", "1:1", "4:3", "3:4", "21:9", "adaptive"].includes(input.aspect_ratio)) throw new Error("Request input.aspect_ratio is invalid.");
  if (typeof input.generate_audio !== "boolean") throw new Error("Request input.generate_audio must be a boolean.");
  if (input.seed !== undefined && (!Number.isInteger(input.seed) || input.seed < 0 || input.seed > 2147483647)) {
    throw new Error("Request input.seed must be an integer from 0 to 2147483647.");
  }
  if (input.first_frame_url || input.last_frame_url) throw new Error("Previs reference mode cannot be mixed with first_frame_url or last_frame_url.");
}

function validateIdempotencyKey(value) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value)) throw new Error("A 64-character preflight token is required as the Idempotency-Key.");
  return value;
}

function readStableFile(file) {
  const descriptor = fs.openSync(file, "r");
  try {
    const stat = fs.fstatSync(descriptor);
    if (!stat.isFile()) throw new Error(`Reference video is not a file: ${file}`);
    if (stat.size > maxMediaBytes) throw new Error("Reference video exceeds 90 MiB. Compress it so the base64 request stays below the API body limit.");
    const buffer = fs.readFileSync(descriptor);
    if (buffer.length !== stat.size) throw new Error("Reference video changed while it was being read. Run the preflight again.");
    return { buffer, stat };
  } finally {
    fs.closeSync(descriptor);
  }
}

function assertVideoSignature(buffer, extension) {
  const isoMedia = buffer.length >= 12 && buffer.subarray(4, 8).toString("ascii") === "ftyp";
  const webm = buffer.length >= 4 && buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  if ((extension === ".mp4" || extension === ".mov") && !isoMedia) throw new Error("Reference or output video is not a recognizable MP4/MOV container.");
  if (extension === ".webm" && !webm) throw new Error("Reference video is not a recognizable WebM container.");
}

async function requestSafeRedirects(value, options) {
  let current = value;
  for (let redirects = 0; redirects <= 5; redirects += 1) {
    const target = await resolveSafeDownloadTarget(current, options);
    const response = await requestPinned(target, options.signal, options.deadline);
    if (![301, 302, 303, 307, 308].includes(response.statusCode)) return response;
    const location = headerValue(response.headers.location);
    discardResponse(response);
    if (!location) throw new Error("Output download redirect omitted Location.");
    current = new URL(location, target.url).toString();
  }
  throw new Error("Output download exceeded five redirects.");
}

function safeDownloadUrl(value, allowLocal) {
  const url = new URL(value);
  const local = isLocalHost(url.hostname);
  if (url.protocol !== "https:" && !(allowLocal && local && url.protocol === "http:")) throw new Error("Output URL must use HTTPS.");
  if (local && !allowLocal) throw new Error("Output URL must not target localhost.");
  if (isDisallowedIp(url.hostname) && !(allowLocal && local && isLoopbackIp(url.hostname))) throw new Error("Output URL must not target a private network address.");
  if (url.username || url.password) throw new Error("Output URL must not contain credentials.");
  return url;
}

async function resolveSafeDownloadTarget(value, options) {
  const url = safeDownloadUrl(value, options.allowLocal);
  const hostname = normalizedHostname(url.hostname);
  let addresses;
  if (net.isIP(hostname)) {
    addresses = [{ address: hostname, family: net.isIP(hostname) }];
  } else {
    try {
      const lookup = options.lookup || ((target) => dns.lookup(target, { all: true, verbatim: true }));
      addresses = await waitForAbortable(lookup(hostname), options.signal, `DNS resolution for ${hostname}`);
    } catch (error) {
      if (options.signal.aborted) throw options.signal.reason;
      throw new Error(`Unable to resolve output host ${hostname}: ${error.message}`);
    }
  }
  if (!Array.isArray(addresses)) addresses = addresses ? [addresses] : [];
  addresses = addresses.map((entry) => {
    const address = normalizedHostname(typeof entry === "string" ? entry : entry?.address);
    return { address, family: net.isIP(address) };
  }).filter((entry, index, list) => (
    entry.family > 0 && list.findIndex((candidate) => candidate.address === entry.address) === index
  ));
  if (!addresses.length) throw new Error(`Output host ${hostname} resolved to no addresses.`);
  const localTarget = isLocalHost(hostname);
  for (const entry of addresses) {
    if (isDisallowedIp(entry.address) && !(options.allowLocal && localTarget && isLoopbackIp(entry.address))) {
      throw new Error(`Output host ${hostname} resolved to a private or non-public network address.`);
    }
  }
  return { url, addresses };
}

async function requestPinned(target, signal, deadline) {
  let lastError;
  for (let index = 0; index < target.addresses.length; index += 1) {
    if (signal.aborted) throw signal.reason;
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error("Output download timed out before connecting.");
    const addressesLeft = target.addresses.length - index;
    const attemptTimeoutMs = addressesLeft > 1 ? Math.max(100, Math.floor(remaining / addressesLeft)) : remaining;
    try {
      return await requestPinnedAddress(target.url, target.addresses[index], signal, attemptTimeoutMs);
    } catch (error) {
      if (signal.aborted) throw signal.reason;
      lastError = error;
    }
  }
  throw new Error(`Unable to connect to any validated address for ${target.url.hostname}: ${lastError?.message || "connection failed"}`);
}

function requestPinnedAddress(url, target, signal, attemptTimeoutMs) {
  const transport = url.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    const lookup = (_hostname, options, callback) => {
      if (options?.all) callback(null, [{ address: target.address, family: target.family }]);
      else callback(null, target.address, target.family);
    };
    let settled = false;
    let timer;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      callback(value);
    };
    const request = transport.get(url, { agent: false, lookup, signal }, (response) => finish(resolve, response));
    timer = setTimeout(() => {
      request.destroy(new Error(`Connection to ${target.address} timed out after ${attemptTimeoutMs} milliseconds.`));
    }, attemptTimeoutMs);
    request.on("error", (error) => finish(reject, error));
  });
}

function waitForAbortable(value, signal, label) {
  if (signal.aborted) return Promise.reject(signal.reason);
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(signal.reason instanceof Error ? signal.reason : new Error(`${label} was aborted.`));
    signal.addEventListener("abort", onAbort, { once: true });
    Promise.resolve(value).then(
      (result) => {
        signal.removeEventListener("abort", onAbort);
        resolve(result);
      },
      (error) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
}

function discardResponse(response) {
  response.destroy();
}

function publishNoClobber(temporary, destination) {
  try {
    fs.linkSync(temporary, destination);
  } catch (error) {
    if (error.code === "EEXIST") throw new Error(`Refusing to replace an existing downloaded output: ${destination}`);
    throw new Error(`Unable to publish downloaded output without overwrite: ${error.message}`);
  }
  fs.rmSync(temporary, { force: true });
}

function normalizedHostname(value) {
  return String(value).replace(/^\[|\]$/g, "").replace(/\.$/, "").toLowerCase();
}

function isLocalHost(value) {
  return new Set(["localhost", "127.0.0.1", "::1"]).has(normalizedHostname(value));
}

function isLoopbackIp(value) {
  const host = normalizedHostname(value);
  if (host === "::1") return true;
  const parts = host.split(".").map(Number);
  return parts.length === 4 && parts.every(Number.isInteger) && parts[0] === 127;
}

function isDisallowedIp(value) {
  const host = normalizedHostname(value);
  const mapped = host.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isDisallowedIp(mapped[1]);
  const parts = host.split(".").map(Number);
  if (parts.length === 4 && parts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)) {
    return parts[0] === 10
      || parts[0] === 0
      || parts[0] === 127
      || (parts[0] === 169 && parts[1] === 254)
      || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
      || (parts[0] === 192 && parts[1] === 168)
      || (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127)
      || (parts[0] === 192 && parts[1] === 0 && [0, 2].includes(parts[2]))
      || (parts[0] === 192 && parts[1] === 88 && parts[2] === 99)
      || (parts[0] === 198 && [18, 19, 51].includes(parts[1]))
      || (parts[0] === 203 && parts[1] === 0 && parts[2] === 113)
      || parts[0] >= 224;
  }
  if (net.isIP(host) === 6) {
    return host === "::" || host === "::1" || !/^[23][0-9a-f]{3}:/i.test(host) || /^2001:db8:/i.test(host);
  }
  return false;
}

async function retryDelay(delayMs, deadline, timeoutMessage) {
  const remainingMs = deadline - Date.now();
  if (remainingMs <= delayMs) throw new Error(timeoutMessage);
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

async function readBoundedResponseText(response, byteLimit) {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > byteLimit) {
    await response.body?.cancel();
    throw new Error(`HiAPI response exceeds ${byteLimit} bytes.`);
  }
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > byteLimit) {
        await reader.cancel();
        throw new Error(`HiAPI response exceeds ${byteLimit} bytes.`);
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, bytes).toString("utf8");
}

function finiteInteger(value, minimum, maximum, label) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) throw new Error(`${label} must be an integer from ${minimum} to ${maximum} milliseconds.`);
  return value;
}

function extractFailureDetail(response) {
  const error = response?.data?.error || response?.error || {};
  const code = error.code || response?.data?.error_code || response?.error_code;
  const message = error.message || response?.data?.message || response?.message;
  return [code, message].filter((value) => typeof value === "string" && value.trim()).join(" - ").slice(0, 500);
}

function httpUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

function mp4Url(value) {
  if (!httpUrl(value)) return false;
  try {
    const extension = path.posix.extname(new URL(value).pathname).toLowerCase();
    return extension === "" || extension === ".mp4";
  } catch {
    return false;
  }
}

function headerValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function readJsonFile(file, label) {
  try {
    const value = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!plainObject(value)) throw new Error("expected a JSON object");
    return value;
  } catch (error) {
    throw new Error(`Unable to read ${label} ${file}: ${error.message}`);
  }
}

function plainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
