#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "./lib/args.mjs";
import { blenderVersion, findBlender, findFfmpeg, findFfprobe, supportedBlenderVersion } from "./lib/blender.mjs";
import {
  acquireArtifactLock,
  createArtifactStaging,
  promoteStagedArtifacts,
  publishFileAtomically,
  validateFrameSequence,
  verifyVideoProbe,
  writeCompiledArtifacts,
} from "./lib/artifacts.mjs";
import { runProcess } from "./lib/process.mjs";
import { createReviewArtifacts } from "./lib/review.mjs";
import { createSeedanceHandoff } from "./lib/handoff.mjs";
import { sha256File, writeJson } from "./lib/io.mjs";
import { readAndValidateMotionTrace } from "./lib/motion-trace.mjs";
import { compileShotSpec, loadShotSpec } from "./lib/spec.mjs";

const booleanOptions = new Set(["dry-run", "scene-only", "blocking-svg"]);
const allowedOptions = new Set(["dry-run", "scene-only", "blocking-svg", "out-dir", "blender", "ffmpeg", "ffprobe"]);

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

async function main() {
  const { options, positionals } = parseArgs(process.argv.slice(2), booleanOptions, allowedOptions);
  if (positionals.length !== 1) {
    throw new Error("Usage: node scripts/render.mjs <shot.json> [--out-dir outputs/<id>] [--blender <path>] [--ffmpeg <path>] [--ffprobe <path>] [--blocking-svg] [--scene-only] [--dry-run]");
  }
  const { file, spec } = loadShotSpec(positionals[0]);
  const result = compileShotSpec(spec);
  const output = path.resolve(options["out-dir"] || path.join("outputs", spec.id));
  const sceneOnly = Boolean(options["scene-only"]);
  const blender = findBlender(options.blender);
  const ffmpeg = sceneOnly ? null : findFfmpeg(options.ffmpeg);
  const ffprobe = sceneOnly ? null : findFfprobe(ffmpeg, options.ffprobe);
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const renderer = path.join(root, "scripts", "blender", "render_previs.py");
  const blenderArgsFor = (runOutput) => [
    "--background",
    "--factory-startup",
    "--python-exit-code", "1",
    "--python", renderer,
    "--",
    "--spec", path.join(runOutput, "compiled.json"),
    "--out-dir", runOutput,
    ...(sceneOnly ? [] : ["--render"]),
  ];

  if (options["dry-run"]) {
    console.log(JSON.stringify({
      blender: blender || "<BLENDER_BIN>",
      args: blenderArgsFor(output),
      ffmpeg: sceneOnly ? null : ffmpeg || "<FFMPEG_BIN>",
      ffprobe: sceneOnly ? null : ffprobe || "<FFPROBE_BIN>",
      output,
      writesFiles: false,
    }, null, 2));
    return;
  }
  if (!blender) {
    throw new Error("Blender was not found. Install Blender 4.5 LTS, put blender on PATH, or pass --blender <absolute-path>.");
  }
  const detectedBlenderVersion = blenderVersion(blender);
  if (!supportedBlenderVersion(detectedBlenderVersion)) {
    throw new Error(`Unsupported Blender version: ${detectedBlenderVersion || "unknown"}. Install Blender 4.5 or newer.`);
  }
  if (!sceneOnly && !ffmpeg) {
    throw new Error("FFmpeg was not found. Install FFmpeg, set FFMPEG_BIN, or use --scene-only.");
  }
  if (!sceneOnly && !ffprobe) {
    throw new Error("FFprobe was not found beside FFmpeg or on PATH. Install the complete FFmpeg toolset or set FFPROBE_BIN.");
  }

  const releaseLock = acquireArtifactLock(output, spec.id);
  let staging;
  try {
    staging = createArtifactStaging(output, spec.id);
    const runOutput = staging.directory;
    const blenderArgs = blenderArgsFor(runOutput);
    writeCompiledArtifacts({ output: runOutput, sourceFile: file, result });
    await runProcess(blender, blenderArgs, "Blender");
    const blenderReport = readBlenderReport(runOutput, result.compiled, sceneOnly);
    const motionTrace = readAndValidateMotionTrace(runOutput, result.compiled);
    if (sceneOnly) {
      writeJson(path.join(runOutput, "render-report.json"), {
        ...blenderReport,
        motionTrace,
        files: ["previs.blend", "motion-trace.json"],
      });
      promoteStagedArtifacts(runOutput, output, spec.id, { sceneOnly: true });
      console.log(`Built Blender scene ${spec.id} in ${output}`);
      return;
    }

    const timeline = result.compiled.timeline;
    const sequence = validateFrameSequence(path.join(runOutput, "frames"), timeline.frameStart, timeline.frameEnd);
    const encoded = await encodeAndProbe({ ffmpeg, ffprobe, output: runOutput, compiled: result.compiled, sequence });
    try {
      const review = await createReviewArtifacts({
        ffmpeg,
        output: runOutput,
        compiled: result.compiled,
        sequence,
        video: encoded.video,
        hashes: result.hashes,
        motionTrace,
        includeBlockingSvg: Boolean(options["blocking-svg"]),
      });
      publishFileAtomically(encoded.temporary, encoded.destination);
      createSeedanceHandoff({
        output: runOutput,
        compiled: result.compiled,
        request: result.request,
        video: encoded.video,
        motionTrace,
      });
      writeJson(path.join(runOutput, "render-report.json"), {
        ...blenderReport,
        status: "complete",
        sourceHash: result.hashes.source,
        compiledHash: result.hashes.compiled,
        requestHash: result.hashes.request,
        encoded: true,
        video: encoded.video,
        motionTrace,
        automaticReview: review.automaticChecks.status,
        humanReviewComplete: false,
        files: [
          "previs.blend",
          "motion-trace.json",
          "previs.mp4",
          "frames/",
          "review/",
          "review-report.json",
          "review-checklist.md",
          "handoff-manifest.json",
          "seedance-handoff.md",
        ],
      });
    } finally {
      if (fs.existsSync(encoded.temporary)) fs.rmSync(encoded.temporary, { force: true });
    }
    promoteStagedArtifacts(runOutput, output, spec.id);
    console.log(`Rendered and verified ${spec.id} in ${output}`);
  } finally {
    staging?.dispose();
    releaseLock();
  }
}

async function encodeAndProbe({ ffmpeg, ffprobe, output, compiled, sequence }) {
  const pattern = path.join(output, "frames", "frame_%04d.png");
  const temporary = path.join(output, `previs.tmp-${process.pid}.mp4`);
  const destination = path.join(output, "previs.mp4");
  const args = [
    "-hide_banner", "-loglevel", "warning", "-y",
    "-framerate", String(compiled.timeline.fps),
    "-start_number", String(compiled.timeline.frameStart),
    "-i", pattern,
    "-frames:v", String(sequence.count),
    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    temporary,
  ];
  try {
    await runProcess(ffmpeg, args, "FFmpeg");
    if (!fs.existsSync(temporary) || fs.statSync(temporary).size === 0) {
      throw new Error("FFmpeg completed without a usable temporary MP4.");
    }
    const probe = await runProcess(ffprobe, [
      "-v", "error",
      "-select_streams", "v:0",
      "-count_frames",
      "-show_entries", "stream=codec_name,pix_fmt,width,height,r_frame_rate,avg_frame_rate,nb_read_frames,nb_frames",
      "-of", "json",
      temporary,
    ], "FFprobe", { capture: true });
    let payload;
    try {
      payload = JSON.parse(probe.stdout);
    } catch {
      throw new Error(`FFprobe returned invalid JSON${probe.stderr.trim() ? `: ${probe.stderr.trim()}` : "."}`);
    }
    const video = verifyVideoProbe(payload, {
      width: compiled.resolution.width,
      height: compiled.resolution.height,
      fps: compiled.timeline.fps,
      frameCount: sequence.count,
    });
    return {
      temporary,
      destination,
      video: {
        ...video,
        bytes: fs.statSync(temporary).size,
        sha256: sha256File(temporary),
      },
    };
  } catch (error) {
    if (fs.existsSync(temporary)) fs.rmSync(temporary, { force: true });
    throw error;
  }
}

function readBlenderReport(output, compiled, sceneOnly) {
  const reportFile = path.join(output, "render-report.json");
  if (!fs.existsSync(reportFile)) throw new Error("Blender completed without render-report.json.");
  const report = JSON.parse(fs.readFileSync(reportFile, "utf8"));
  const expected = compiled.timeline.frameEnd - compiled.timeline.frameStart + 1;
  if (report.shotId !== compiled.id) throw new Error(`Blender report belongs to ${report.shotId || "<unknown>"}, expected ${compiled.id}.`);
  if (report.expectedFrameCount !== expected) {
    throw new Error(`Blender report expected ${report.expectedFrameCount} frames, compiler expected ${expected}.`);
  }
  const sceneFile = path.join(output, "previs.blend");
  if (!report.sceneSaved || !fs.existsSync(sceneFile) || fs.statSync(sceneFile).size === 0) {
    throw new Error("Blender completed without a usable previs.blend scene.");
  }
  if (sceneOnly) {
    if (report.renderRequested || report.renderedFrameCount !== 0 || report.status !== "scene-only-complete") {
      throw new Error("Blender scene-only report contains an invalid render completion state.");
    }
  } else if (!report.renderCompleted || report.renderedFrameCount !== expected || report.status !== "frames-complete") {
    throw new Error(`Blender rendered ${report.renderedFrameCount} of ${expected} frames.`);
  }
  return {
    ...report,
    scene: {
      file: "previs.blend",
      bytes: fs.statSync(sceneFile).size,
      sha256: sha256File(sceneFile),
    },
  };
}
