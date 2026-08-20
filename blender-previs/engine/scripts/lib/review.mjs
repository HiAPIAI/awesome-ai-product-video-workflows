import fs from "node:fs";
import path from "node:path";
import { writeJson, writeText } from "./io.mjs";
import { runProcess } from "./process.mjs";

const blankLumaRangeThreshold = 4;
const suddenLumaDifferenceThreshold = 45;

export async function createReviewArtifacts({
  ffmpeg,
  output,
  compiled,
  sequence,
  video,
  hashes,
  motionTrace,
  includeBlockingSvg = false,
}) {
  const reviewDirectory = path.join(output, "review");
  fs.mkdirSync(reviewDirectory, { recursive: true });
  const stills = {
    first: copyReviewFrame(sequence.first, reviewDirectory, "first-frame.png"),
    middle: copyReviewFrame(sequence.middle, reviewDirectory, "middle-frame.png"),
    last: copyReviewFrame(sequence.last, reviewDirectory, "last-frame.png"),
  };
  const contactSheet = path.join(reviewDirectory, "contact-sheet.png");
  await runProcess(ffmpeg, [
    "-hide_banner", "-loglevel", "error", "-y",
    "-i", stills.first.file,
    "-i", stills.middle.file,
    "-i", stills.last.file,
    "-filter_complex", "[0:v]scale=640:-2[first];[1:v]scale=640:-2[middle];[2:v]scale=640:-2[last];[first][middle][last]hstack=inputs=3",
    "-frames:v", "1",
    contactSheet,
  ], "FFmpeg contact sheet");
  assertNonEmpty(contactSheet, "contact sheet");

  const pattern = path.join(output, "frames", "frame_%04d.png");
  const statsOutput = await runProcess(ffmpeg, [
    "-hide_banner", "-nostats", "-loglevel", "error",
    "-framerate", String(compiled.timeline.fps),
    "-start_number", String(compiled.timeline.frameStart),
    "-i", pattern,
    "-frames:v", String(sequence.count),
    "-vf", "scale=320:-2,signalstats,metadata=mode=print:file=-",
    "-f", "null", "-",
  ], "FFmpeg frame analysis", { capture: true });
  const signalStats = validateSignalStats(parseSignalStats(`${statsOutput.stdout}\n${statsOutput.stderr}`), sequence.count);
  const automaticChecks = analyzeSignalStats(signalStats, compiled.timeline.frameStart);
  const artifacts = [
    "review/first-frame.png",
    "review/middle-frame.png",
    "review/last-frame.png",
    "review/contact-sheet.png",
  ];
  if (includeBlockingSvg) {
    writeText(path.join(reviewDirectory, "blocking-top.svg"), createBlockingSvg(compiled));
    artifacts.push("review/blocking-top.svg");
  }
  const report = {
    version: 1,
    shotId: compiled.id,
    sourceHash: hashes.source,
    compiledHash: hashes.compiled,
    requestHash: hashes.request,
    frames: {
      expected: sequence.count,
      verified: signalStats.length,
      first: sequence.first.frame,
      middle: sequence.middle.frame,
      last: sequence.last.frame,
    },
    video,
    motionTrace,
    automaticChecks,
    artifacts,
    humanReviewComplete: false,
  };
  writeJson(path.join(output, "review-report.json"), report);
  writeText(path.join(output, "review-checklist.md"), buildReviewChecklist(compiled, report));
  return report;
}

export function parseSignalStats(output) {
  const records = [];
  let current = null;
  for (const line of String(output).split(/\r?\n/)) {
    const frame = line.match(/\bframe:(\d+)\b/);
    if (frame) {
      current = { index: Number(frame[1]) };
      records.push(current);
      continue;
    }
    const value = line.match(/lavfi\.signalstats\.([A-Z]+)=(-?(?:\d+\.?\d*|\.\d+))/);
    if (current && value) current[value[1]] = Number(value[2]);
  }
  return records;
}

export function analyzeSignalStats(records, frameStart = 1) {
  const blankFrames = [];
  const suddenChanges = [];
  for (const record of records) {
    const frame = frameStart + record.index;
    const lumaRange = record.YMAX - record.YMIN;
    if (Number.isFinite(lumaRange) && lumaRange <= blankLumaRangeThreshold) {
      blankFrames.push({ frame, lumaRange: round(lumaRange), averageLuma: round(record.YAVG) });
    }
    if (record.index > 0 && Number.isFinite(record.YDIF) && record.YDIF >= suddenLumaDifferenceThreshold) {
      suddenChanges.push({ frame, lumaDifference: round(record.YDIF) });
    }
  }
  return {
    status: blankFrames.length || suddenChanges.length ? "attention" : "pass",
    thresholds: {
      blankLumaRange: blankLumaRangeThreshold,
      suddenLumaDifference: suddenLumaDifferenceThreshold,
    },
    blankFrames,
    suddenChanges,
  };
}

export function validateSignalStats(records, expectedCount) {
  if (!Array.isArray(records) || records.length !== expectedCount) {
    throw new Error(`Frame analysis returned ${Array.isArray(records) ? records.length : 0} records for ${expectedCount} frames.`);
  }
  const required = ["YMIN", "YMAX", "YAVG", "YDIF"];
  records.forEach((record, index) => {
    if (record.index !== index) throw new Error(`Frame analysis record ${index} has unexpected index ${record.index}.`);
    for (const field of required) {
      if (!Number.isFinite(record[field])) throw new Error(`Frame analysis record ${index} is missing finite ${field}.`);
    }
  });
  return records;
}

export function buildReviewChecklist(compiled, report) {
  const cleanTitle = String(compiled.title).replace(/[\r\n]+/g, " ").trim();
  const checks = report.automaticChecks;
  return [
    `# Review checklist: ${cleanTitle}`,
    "",
    `Automated frame scan: **${checks.status}** (${checks.blankFrames.length} blank, ${checks.suddenChanges.length} sudden-change flags).`,
    "",
    "- [ ] Watch `previs.mp4` from first frame to last without scrubbing.",
    "- [ ] Inspect `review/contact-sheet.png` and the first, middle, and last stills.",
    "- [ ] Confirm subject spacing, contacts, screen direction, and action order.",
    "- [ ] Confirm camera path, lens changes, horizon, and reveal timing.",
    "- [ ] Inspect `motion-trace.json` when exact per-frame camera, target, lens, or proxy transforms matter.",
    "- [ ] Review every automated flag in `review-report.json` and accept or fix it.",
    "- [ ] Confirm duration, frame rate, resolution, and aspect ratio match the generation request.",
    "- [ ] Mark `humanReviewComplete` only after the complete previs passes review.",
    "",
  ].join("\n");
}

export function createBlockingSvg(compiled) {
  const width = 960;
  const height = 640;
  const margin = 56;
  const groundX = compiled.world.groundSize[0] / 2;
  const groundY = compiled.world.groundSize[1] / 2;
  const points = [
    [-groundX, -groundY],
    [groundX, groundY],
    ...compiled.objects.flatMap((object) => object.keyframes.map((keyframe) => keyframe.location)),
    ...compiled.camera.keyframes.flatMap((keyframe) => [keyframe.location, keyframe.target]),
  ];
  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = Math.max(maxX - minX, 1);
  const spanY = Math.max(maxY - minY, 1);
  const scale = Math.min((width - margin * 2) / spanX, (height - margin * 2) / spanY);
  const project = (point) => [
    margin + (point[0] - minX) * scale,
    height - margin - (point[1] - minY) * scale,
  ];
  const lines = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Top-down blocking for ${escapeXml(compiled.title)}">`,
    "<rect width=" + `"${width}" height="${height}" fill="#11161d"/>`,
    `<rect x="${round(project([-groundX, groundY])[0])}" y="${round(project([-groundX, groundY])[1])}" width="${round(groundX * 2 * scale)}" height="${round(groundY * 2 * scale)}" fill="#202832" stroke="#6b7785" stroke-width="2"/>`,
    `<text x="${margin}" y="32" fill="#f2f5f7" font-family="sans-serif" font-size="20">${escapeXml(compiled.title)} - top view</text>`,
  ];
  for (const object of compiled.objects) {
    const projected = object.keyframes.map((keyframe) => project(keyframe.location));
    const color = rgbHex(object.color);
    lines.push(`<polyline points="${projected.map(pointPair).join(" ")}" fill="none" stroke="${color}" stroke-width="4"/>`);
    projected.forEach((point, index) => {
      lines.push(`<circle cx="${round(point[0])}" cy="${round(point[1])}" r="${index === 0 ? 7 : 5}" fill="${color}"/>`);
    });
    const label = projected[0];
    lines.push(`<text x="${round(label[0] + 10)}" y="${round(label[1] - 10)}" fill="#f2f5f7" font-family="sans-serif" font-size="14">${escapeXml(object.id)}</text>`);
  }
  const cameraPoints = compiled.camera.keyframes.map((keyframe) => project(keyframe.location));
  lines.push(`<polyline points="${cameraPoints.map(pointPair).join(" ")}" fill="none" stroke="#63d6a2" stroke-width="4" stroke-dasharray="10 7"/>`);
  compiled.camera.keyframes.forEach((keyframe, index) => {
    const camera = cameraPoints[index];
    const target = project(keyframe.target);
    lines.push(`<line x1="${round(camera[0])}" y1="${round(camera[1])}" x2="${round(target[0])}" y2="${round(target[1])}" stroke="#63d6a2" stroke-width="1.5" opacity="0.65"/>`);
    lines.push(`<circle cx="${round(camera[0])}" cy="${round(camera[1])}" r="7" fill="#63d6a2"/>`);
  });
  lines.push("</svg>\n");
  return lines.join("\n");
}

function copyReviewFrame(source, directory, name) {
  const destination = path.join(directory, name);
  fs.copyFileSync(source.file, destination);
  assertNonEmpty(destination, name);
  return { frame: source.frame, file: destination };
}

function assertNonEmpty(file, label) {
  if (!fs.existsSync(file) || fs.statSync(file).size === 0) throw new Error(`Missing or empty ${label}: ${file}`);
}

function pointPair(point) {
  return `${round(point[0])},${round(point[1])}`;
}

function rgbHex(color) {
  return `#${color.map((value) => Math.round(value * 255).toString(16).padStart(2, "0")).join("")}`;
}

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&apos;",
  })[character]);
}

function round(value) {
  return Number.isFinite(value) ? Number(value.toFixed(3)) : null;
}
