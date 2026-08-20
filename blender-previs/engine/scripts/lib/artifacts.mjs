import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { relativePortable, writeJson, writeText } from "./io.mjs";

const ownershipMarkerName = ".codex-previs-output.json";
const lockName = ".codex-previs-output.lock";
const ownershipKind = "codex-blender-seedance-output";
const transactionKind = "codex-blender-seedance-promotion";
const transactionFileName = ".transaction.json";
const stagingPattern = /^\.codex-previs-staging-\d+-[0-9a-f-]{36}$/;
const backupPattern = /^\.codex-previs-backup-\d+-[0-9a-f-]{36}$/;
const lockStaleAfterMs = 24 * 60 * 60 * 1000;

const compiledArtifactNames = [
  "compiled.json",
  "prompt.txt",
  "seedance.request.json",
];

const renderArtifactNames = [
  ...compiledArtifactNames,
  "manifest.json",
  "previs.blend",
  "previs.blend1",
  "motion-trace.json",
  "previs.mp4",
  "render-report.json",
  "review-report.json",
  "review-checklist.md",
  "handoff-manifest.json",
  "seedance-handoff.md",
  "blocking-top.svg",
];
const publishedArtifactNames = [...renderArtifactNames, "frames", "review"];

export function writeCompiledArtifacts({ output, sourceFile, result, cwd = process.cwd() }) {
  assertArtifactLock(output, result.compiled.id);
  const manifest = {
    version: 1,
    id: result.compiled.id,
    source: relativePortable(cwd, sourceFile),
    files: [...compiledArtifactNames],
    hashes: result.hashes,
    warnings: result.warnings,
  };
  writeJson(path.join(output, "compiled.json"), result.compiled);
  writeJson(path.join(output, "seedance.request.json"), result.request);
  writeText(path.join(output, "prompt.txt"), `${result.prompt}\n`);
  writeJson(path.join(output, "manifest.json"), manifest);
  return manifest;
}

export function acquireArtifactLock(output, shotId) {
  const absolute = claimArtifactDirectory(output, shotId);
  const lockFile = path.join(absolute, lockName);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const token = randomUUID();
    try {
      const descriptor = fs.openSync(lockFile, "wx");
      try {
        fs.writeFileSync(descriptor, `${JSON.stringify({
          version: 1,
          pid: process.pid,
          shotId,
          token,
          createdAt: new Date().toISOString(),
        })}\n`, "utf8");
      } finally {
        fs.closeSync(descriptor);
      }
      let released = false;
      return () => {
        if (released) return;
        released = true;
        let current;
        try {
          current = JSON.parse(fs.readFileSync(lockFile, "utf8"));
        } catch (error) {
          if (error.code === "ENOENT") return;
          throw error;
        }
        if (current.token === token) fs.rmSync(lockFile, { force: true });
      };
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      const current = readJsonFile(lockFile);
      if (current && processIsAlive(current.pid) && !lockIsExpired(current)) {
        throw new Error(`Output directory is locked by process ${current.pid}: ${absolute}`);
      }
      fs.rmSync(lockFile, { force: true });
    }
  }
  throw new Error(`Unable to acquire output-directory lock: ${absolute}`);
}

export function createArtifactStaging(output, shotId) {
  const absolute = path.resolve(output);
  assertArtifactLock(absolute, shotId);
  recoverArtifactTransactions(absolute, shotId);
  cleanStaleStagingDirectories(absolute, shotId);
  cleanTemporaryVideos(absolute);
  const directory = path.join(absolute, `.codex-previs-staging-${process.pid}-${randomUUID()}`);
  let releaseLock;
  try {
    releaseLock = acquireArtifactLock(directory, shotId);
  } catch (error) {
    fs.rmSync(directory, { recursive: true, force: true });
    throw error;
  }
  let disposed = false;
  return {
    directory,
    dispose() {
      if (disposed) return;
      disposed = true;
      try {
        releaseLock();
      } finally {
        fs.rmSync(directory, { recursive: true, force: true });
      }
    },
  };
}

export function promoteStagedArtifacts(staging, output, shotId, options = {}) {
  const absolute = path.resolve(output);
  const staged = path.resolve(staging);
  assertArtifactLock(absolute, shotId);
  assertArtifactLock(staged, shotId);
  if (path.dirname(staged) !== absolute || !stagingPattern.test(path.basename(staged))) {
    throw new Error(`Invalid artifact staging directory: ${staged}`);
  }
  recoverArtifactTransactions(absolute, shotId);
  const required = options.sceneOnly
    ? ["compiled.json", "prompt.txt", "seedance.request.json", "manifest.json", "previs.blend", "motion-trace.json", "render-report.json"]
    : ["compiled.json", "prompt.txt", "seedance.request.json", "manifest.json", "previs.blend", "motion-trace.json", "previs.mp4", "render-report.json", "review-report.json", "review-checklist.md", "handoff-manifest.json", "seedance-handoff.md", "frames", "review"];
  const missing = required.filter((name) => !fs.existsSync(path.join(staged, name)));
  if (missing.length) throw new Error(`Staged render is incomplete: missing ${missing.join(", ")}.`);

  const oldNames = publishedArtifactNames.filter((name) => fs.existsSync(path.join(absolute, name)));
  const newNames = publishedArtifactNames.filter((name) => fs.existsSync(path.join(staged, name)));
  const backup = path.join(absolute, `.codex-previs-backup-${process.pid}-${randomUUID()}`);
  fs.mkdirSync(backup);
  const state = {
    version: 1,
    kind: transactionKind,
    shotId,
    phase: "moving-old",
    oldNames,
    newNames,
  };
  writeJson(path.join(backup, transactionFileName), state);
  try {
    for (const name of oldNames) fs.renameSync(path.join(absolute, name), path.join(backup, name));
    state.phase = "publishing-new";
    writeJson(path.join(backup, transactionFileName), state);
    for (const name of newNames) fs.renameSync(path.join(staged, name), path.join(absolute, name));
    state.phase = "published";
    writeJson(path.join(backup, transactionFileName), state);
    fs.rmSync(backup, { recursive: true, force: true });
  } catch (error) {
    try {
      recoverArtifactTransaction(backup, absolute, shotId);
    } catch (rollbackError) {
      throw new Error(`Artifact promotion failed: ${error.message}. Rollback also failed: ${rollbackError.message}`);
    }
    throw new Error(`Artifact promotion failed and the previous render was restored: ${error.message}`);
  }
}

export function claimArtifactDirectory(output, shotId) {
  if (typeof shotId !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(shotId)) {
    throw new Error("A valid shot id is required to claim an output directory.");
  }
  const absolute = path.resolve(output);
  fs.mkdirSync(absolute, { recursive: true });
  const markerFile = path.join(absolute, ownershipMarkerName);
  if (!fs.existsSync(markerFile)) {
    const entries = fs.readdirSync(absolute);
    if (entries.length) {
      throw new Error(`Refusing to use a non-empty unowned output directory: ${absolute}. Choose an empty directory.`);
    }
    try {
      fs.writeFileSync(markerFile, `${JSON.stringify({ version: 1, kind: ownershipKind, shotId }, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
  }
  assertArtifactOwnership(absolute, shotId);
  return absolute;
}

export function cleanRenderArtifacts(output, shotId) {
  const absolute = path.resolve(output);
  assertArtifactLock(absolute, shotId);
  const removed = [];
  for (const name of renderArtifactNames) {
    const target = path.join(absolute, name);
    if (!fs.existsSync(target)) continue;
    fs.rmSync(target, { recursive: true, force: true });
    removed.push(name);
  }
  for (const name of ["frames", "review"]) {
    const target = path.join(absolute, name);
    if (!fs.existsSync(target)) continue;
    fs.rmSync(target, { recursive: true, force: true });
    removed.push(`${name}/`);
  }
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    if (!entry.isFile() || !/^previs\.tmp-\d+\.mp4$/.test(entry.name)) continue;
    fs.rmSync(path.join(absolute, entry.name), { force: true });
    removed.push(entry.name);
  }
  return removed;
}

function recoverArtifactTransactions(output, shotId) {
  for (const entry of fs.readdirSync(output, { withFileTypes: true })) {
    if (!entry.isDirectory() || !backupPattern.test(entry.name)) continue;
    recoverArtifactTransaction(path.join(output, entry.name), output, shotId);
  }
}

function recoverArtifactTransaction(backup, output, shotId) {
  const state = readJsonFile(path.join(backup, transactionFileName));
  if (state?.version !== 1 || state?.kind !== transactionKind || state?.shotId !== shotId
    || !["moving-old", "publishing-new", "published"].includes(state?.phase)
    || !safeArtifactNameList(state.oldNames) || !safeArtifactNameList(state.newNames)) {
    throw new Error(`Invalid artifact-promotion recovery state: ${backup}`);
  }
  if (state.phase === "published") {
    fs.rmSync(backup, { recursive: true, force: true });
    return;
  }
  if (state.phase === "publishing-new") {
    for (const name of state.newNames) fs.rmSync(path.join(output, name), { recursive: true, force: true });
  }
  for (const name of state.oldNames) {
    const source = path.join(backup, name);
    if (!fs.existsSync(source)) continue;
    const destination = path.join(output, name);
    if (fs.existsSync(destination)) {
      throw new Error(`Cannot restore ${name}; the destination already exists.`);
    }
    fs.renameSync(source, destination);
  }
  fs.rmSync(backup, { recursive: true, force: true });
}

function safeArtifactNameList(value) {
  return Array.isArray(value)
    && value.every((name) => typeof name === "string" && publishedArtifactNames.includes(name))
    && new Set(value).size === value.length;
}

function cleanStaleStagingDirectories(output, shotId) {
  for (const entry of fs.readdirSync(output, { withFileTypes: true })) {
    if (!entry.isDirectory() || !stagingPattern.test(entry.name)) continue;
    const target = path.join(output, entry.name);
    assertArtifactOwnership(target, shotId);
    fs.rmSync(target, { recursive: true, force: true });
  }
}

function cleanTemporaryVideos(output) {
  for (const entry of fs.readdirSync(output, { withFileTypes: true })) {
    if (entry.isFile() && /^previs\.tmp-\d+\.mp4$/.test(entry.name)) {
      fs.rmSync(path.join(output, entry.name), { force: true });
    }
  }
}

function assertArtifactOwnership(output, shotId) {
  const marker = readJsonFile(path.join(output, ownershipMarkerName));
  if (marker?.version !== 1 || marker?.kind !== ownershipKind || marker?.shotId !== shotId) {
    throw new Error(`Output directory is not owned by shot ${shotId}: ${output}`);
  }
}

function assertArtifactLock(output, shotId) {
  const absolute = path.resolve(output);
  assertArtifactOwnership(absolute, shotId);
  const lock = readJsonFile(path.join(absolute, lockName));
  if (lock?.version !== 1 || lock?.pid !== process.pid || lock?.shotId !== shotId || typeof lock?.token !== "string") {
    throw new Error(`Output directory must be locked by this process before writing: ${absolute}`);
  }
}

function readJsonFile(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EISDIR" || error instanceof SyntaxError) return null;
    throw error;
  }
}

function processIsAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === "EPERM";
  }
}

function lockIsExpired(lock, now = Date.now()) {
  const createdAt = Date.parse(lock?.createdAt);
  return Number.isFinite(createdAt) && now - createdAt >= lockStaleAfterMs;
}

export function validateFrameSequence(framesDirectory, frameStart, frameEnd) {
  if (!Number.isInteger(frameStart) || !Number.isInteger(frameEnd) || frameEnd < frameStart) {
    throw new Error(`Invalid expected frame range ${frameStart}-${frameEnd}.`);
  }
  const expectedCount = frameEnd - frameStart + 1;
  const entries = fs.existsSync(framesDirectory)
    ? fs.readdirSync(framesDirectory, { withFileTypes: true })
      .filter((entry) => entry.isFile() && /^frame_\d{4}\.png$/.test(entry.name))
      .map((entry) => entry.name)
      .sort()
    : [];
  const expected = Array.from({ length: expectedCount }, (_, index) => frameName(frameStart + index));
  const missing = expected.filter((name) => !entries.includes(name));
  const unexpected = entries.filter((name) => !expected.includes(name));
  if (missing.length || unexpected.length) {
    const details = [
      missing.length ? `missing ${summarizeNames(missing)}` : null,
      unexpected.length ? `unexpected ${summarizeNames(unexpected)}` : null,
    ].filter(Boolean).join("; ");
    throw new Error(`Frame sequence is not strictly continuous (${details}).`);
  }
  const files = expected.map((name) => path.join(framesDirectory, name));
  const empty = files.filter((file) => fs.statSync(file).size === 0).map((file) => path.basename(file));
  if (empty.length) throw new Error(`Frame sequence contains empty files: ${summarizeNames(empty)}.`);
  const middleIndex = Math.round((files.length - 1) / 2);
  return {
    frameStart,
    frameEnd,
    count: files.length,
    files,
    first: { frame: frameStart, file: files[0] },
    middle: { frame: frameStart + middleIndex, file: files[middleIndex] },
    last: { frame: frameEnd, file: files.at(-1) },
  };
}

export function verifyVideoProbe(payload, expected) {
  const streams = Array.isArray(payload?.streams) ? payload.streams : [];
  if (streams.length !== 1) throw new Error(`FFprobe expected one video stream, received ${streams.length}.`);
  const stream = streams[0];
  const frameCount = parseInteger(stream.nb_read_frames ?? stream.nb_frames);
  const fps = parseRate(stream.avg_frame_rate) || parseRate(stream.r_frame_rate);
  const actual = {
    codec: stream.codec_name,
    pixelFormat: stream.pix_fmt,
    width: Number(stream.width),
    height: Number(stream.height),
    fps,
    frameCount,
    durationSeconds: Number.isFinite(fps) && Number.isInteger(frameCount)
      ? Number((frameCount / fps).toFixed(6))
      : null,
  };
  const mismatches = [];
  if (actual.codec !== "h264") mismatches.push(`codec ${actual.codec || "<missing>"} (expected h264)`);
  if (actual.pixelFormat !== "yuv420p") mismatches.push(`pixel format ${actual.pixelFormat || "<missing>"} (expected yuv420p)`);
  if (actual.width !== expected.width || actual.height !== expected.height) {
    mismatches.push(`resolution ${actual.width}x${actual.height} (expected ${expected.width}x${expected.height})`);
  }
  if (!Number.isFinite(actual.fps) || Math.abs(actual.fps - expected.fps) > 0.001) {
    mismatches.push(`fps ${actual.fps ?? "<missing>"} (expected ${expected.fps})`);
  }
  if (actual.frameCount !== expected.frameCount) {
    mismatches.push(`frame count ${actual.frameCount ?? "<missing>"} (expected ${expected.frameCount})`);
  }
  if (mismatches.length) throw new Error(`FFprobe verification failed: ${mismatches.join("; ")}.`);
  return actual;
}

export function publishFileAtomically(temporary, destination) {
  if (!fs.existsSync(temporary) || fs.statSync(temporary).size === 0) {
    throw new Error(`Cannot publish missing or empty temporary file: ${temporary}`);
  }
  try {
    fs.linkSync(temporary, destination);
  } catch (error) {
    if (error.code === "EEXIST") throw new Error(`Refusing to replace an existing published artifact: ${destination}`);
    throw error;
  }
  fs.rmSync(temporary, { force: true });
}

function frameName(frame) {
  return `frame_${String(frame).padStart(4, "0")}.png`;
}

function summarizeNames(names) {
  if (names.length <= 4) return names.join(", ");
  return `${names.slice(0, 3).join(", ")} and ${names.length - 3} more`;
}

function parseRate(value) {
  if (typeof value !== "string") return null;
  const [numerator, denominator = "1"] = value.split("/").map(Number);
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;
  return numerator / denominator;
}

function parseInteger(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : null;
}
