import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

export function findBlender(explicit = process.env.BLENDER_BIN) {
  if (explicit) return existingFile(path.resolve(explicit));
  const discovered = lookupExecutable(process.platform === "win32" ? "blender.exe" : "blender");
  if (discovered) return discovered;
  const candidates = [];
  if (process.platform === "win32") {
    const roots = [
      path.join(process.env.ProgramFiles || "C:\\Program Files", "Blender Foundation"),
      path.join(process.env.LOCALAPPDATA || "", "Programs", "Blender Foundation"),
    ];
    for (const root of roots) {
      if (!root || !fs.existsSync(root)) continue;
      for (const entry of safeReadDirectories(root).sort((left, right) => (
        right.name.localeCompare(left.name, undefined, { numeric: true, sensitivity: "base" })
      ))) {
        candidates.push(path.join(root, entry.name, "blender.exe"));
      }
      candidates.push(path.join(root, "blender.exe"));
    }
  }
  return candidates.map(existingFile).find(Boolean) || null;
}

export function blenderVersion(executable) {
  if (!executable) return null;
  const result = spawnSync(executable, ["--version"], { encoding: "utf8", timeout: 15000 });
  if (result.status !== 0) return null;
  return result.stdout.split(/\r?\n/)[0]?.trim() || null;
}

export function findFfmpeg(explicit = process.env.FFMPEG_BIN) {
  if (explicit) return existingFile(path.resolve(explicit));
  const discovered = lookupExecutable(process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg");
  if (discovered) return discovered;
  const candidates = [];
  if (process.platform === "win32") {
    const packageRoot = path.join(process.env.LOCALAPPDATA || "", "Microsoft", "WinGet", "Packages");
    if (fs.existsSync(packageRoot)) {
      for (const entry of safeReadDirectories(packageRoot).filter((item) => /ffmpeg/i.test(item.name))) {
        collectNamed(path.join(packageRoot, entry.name), "ffmpeg.exe", candidates, 4);
      }
    }
  }
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

export function findFfprobe(ffmpeg = findFfmpeg(), explicit = process.env.FFPROBE_BIN) {
  if (explicit) return existingFile(path.resolve(explicit));
  if (ffmpeg) {
    const sibling = path.join(path.dirname(ffmpeg), process.platform === "win32" ? "ffprobe.exe" : "ffprobe");
    if (existingFile(sibling)) return sibling;
  }
  return lookupExecutable(process.platform === "win32" ? "ffprobe.exe" : "ffprobe");
}

export function ffmpegHasLibx264(executable) {
  if (!executable) return false;
  const result = spawnSync(executable, ["-hide_banner", "-encoders"], { encoding: "utf8", timeout: 15000, windowsHide: true });
  return result.status === 0 && /\blibx264\b/.test(`${result.stdout}\n${result.stderr}`);
}

export function supportedBlenderVersion(value) {
  const match = String(value || "").match(/Blender\s+(\d+)\.(\d+)(?:\.(\d+))?/i);
  if (!match) return false;
  const major = Number(match[1]);
  const minor = Number(match[2]);
  return major > 4 || (major === 4 && minor >= 5);
}

function collectNamed(directory, name, output, depth) {
  if (depth < 0) return;
  let entries;
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch (error) {
    if (["EACCES", "EPERM", "ENOENT"].includes(error.code)) return;
    throw error;
  }
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isFile() && entry.name.toLowerCase() === name) output.push(target);
    else if (entry.isDirectory()) collectNamed(target, name, output, depth - 1);
  }
}

function lookupExecutable(name) {
  const command = process.platform === "win32" ? "where.exe" : "which";
  const lookup = spawnSync(command, [name], { encoding: "utf8", timeout: 10000, windowsHide: true });
  if (lookup.status !== 0) return null;
  return lookup.stdout.split(/\r?\n/).map((item) => item.trim()).filter(Boolean).map(existingFile).find(Boolean) || null;
}

function existingFile(candidate) {
  try {
    return candidate && fs.statSync(candidate).isFile() ? candidate : null;
  } catch {
    return null;
  }
}

function safeReadDirectories(directory) {
  try {
    return fs.readdirSync(directory, { withFileTypes: true }).filter((item) => item.isDirectory());
  } catch (error) {
    if (["EACCES", "EPERM", "ENOENT"].includes(error.code)) return [];
    throw error;
  }
}
