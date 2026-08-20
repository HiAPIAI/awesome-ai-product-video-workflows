#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { findBlender, blenderVersion, ffmpegHasLibx264, findFfmpeg, findFfprobe, supportedBlenderVersion } from "./lib/blender.mjs";
import { parseArgs } from "./lib/args.mjs";

try {
  const booleans = new Set(["json", "strict", "paid"]);
  const { options, positionals } = parseArgs(process.argv.slice(2), booleans, booleans);
  if (positionals.length) throw new Error("doctor does not accept positional arguments.");
  const blender = findBlender();
  const version = blenderVersion(blender);
  const ffmpeg = findFfmpeg();
  const ffprobe = findFfprobe(ffmpeg);
  const libx264 = ffmpegHasLibx264(ffmpeg);
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  const git = spawnSync(process.platform === "win32" ? "where.exe" : "which", ["git"], { encoding: "utf8", timeout: 10000, windowsHide: true });
  const checks = {
    node: { ok: nodeMajor >= 20, value: `Node ${process.versions.node}` },
    git: { ok: git.status === 0, value: git.status === 0 ? "available" : "not found" },
    blender: { ok: Boolean(blender) && supportedBlenderVersion(version), value: blender ? `${version || "unknown version"} (${blender})` : "not found; install Blender 4.5+ or set BLENDER_BIN" },
    ffmpeg: { ok: Boolean(ffmpeg), value: ffmpeg || "not found; install FFmpeg or set FFMPEG_BIN" },
    libx264: { ok: libx264, value: ffmpeg ? (libx264 ? "available" : "missing from FFmpeg build") : "FFmpeg not found" },
    ffprobe: { ok: Boolean(ffprobe), value: ffprobe || "not found beside FFmpeg or on PATH" },
    hiapiKey: { ok: Boolean(process.env.HIAPI_API_KEY), value: process.env.HIAPI_API_KEY ? "configured" : "not configured (only required for paid generation)" },
  };
  const readiness = {
    compile: checks.node.ok,
    render: checks.node.ok && checks.blender.ok && checks.ffmpeg.ok && checks.libx264.ok && checks.ffprobe.ok,
    paidGeneration: checks.node.ok && checks.hiapiKey.ok,
  };
  if (options.json) {
    console.log(JSON.stringify({ checks, readiness }, null, 2));
  } else {
    for (const [name, check] of Object.entries(checks)) console.log(`${check.ok ? "PASS" : "MISS"} ${name}: ${check.value}`);
    console.log(`Ready: compile=${readiness.compile}, render=${readiness.render}, paidGeneration=${readiness.paidGeneration}`);
  }
  const requiredChecks = [checks.node, checks.git, checks.blender, checks.ffmpeg, checks.libx264, checks.ffprobe, ...(options.paid ? [checks.hiapiKey] : [])];
  if (options.strict && requiredChecks.some((check) => !check.ok)) process.exitCode = 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
