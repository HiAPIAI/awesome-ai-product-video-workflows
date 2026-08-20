import fs from "node:fs";
import path from "node:path";
import { sha256File, writeJson, writeText } from "./io.mjs";

const handoffFiles = [
  { role: "motion-reference", file: "previs.mp4" },
  { role: "generation-prompt", file: "prompt.txt" },
  { role: "composition-reference", file: "review/first-frame.png" },
  { role: "review-contact-sheet", file: "review/contact-sheet.png" },
  { role: "camera-and-blocking-trace", file: "motion-trace.json" },
];

export function createSeedanceHandoff({ output, compiled, request, video, motionTrace }) {
  const files = handoffFiles.map(({ role, file }) => describeFile(output, role, file));
  const input = request.input;
  const manifest = {
    version: 1,
    shotId: compiled.id,
    mode: "manual-seedance-upload",
    upload: {
      video: "previs.mp4",
      prompt: "prompt.txt",
      optionalCompositionReference: "review/first-frame.png",
    },
    generation: {
      model: request.model,
      duration: input.duration,
      resolution: input.resolution,
      aspectRatio: input.aspect_ratio,
      generateAudio: input.generate_audio,
    },
    camera: motionTrace.camera,
    video,
    files,
    apiSubmissionDefault: false,
  };
  writeJson(path.join(output, "handoff-manifest.json"), manifest);
  writeText(path.join(output, "seedance-handoff.md"), buildSeedanceHandoffGuide(compiled, manifest));
  return manifest;
}

export function buildSeedanceHandoffGuide(compiled, manifest) {
  const generation = manifest.generation;
  const camera = manifest.camera;
  return [
    `# Seedance handoff: ${singleLine(compiled.title)}`,
    "",
    "## Upload",
    "",
    "1. Upload `previs.mp4` as the primary Blender motion reference (Video 1).",
    "2. Paste `prompt.txt` without rewriting its blocking, timing, camera, continuity, or proxy-replacement contracts.",
    `3. Set ${generation.duration} seconds, ${generation.resolution}, ${generation.aspectRatio}, and audio ${generation.generateAudio ? "on" : "off"}.`,
    "4. Generate in Seedance 2.0 and download the result before temporary URLs expire.",
    "",
    "Use `review/first-frame.png` only when the selected Seedance surface accepts an additional composition reference without replacing Video 1. Do not mix mutually exclusive first-frame and multimodal-reference modes.",
    "",
    "## Reference contract",
    "",
    "- Blender controls composition, spacing, occlusion, action order, timing, and camera motion.",
    "- The prompt controls final subjects, environment, materials, lighting, and replacement of proxy appearance.",
    "- The previs is not a request to preserve gray-box geometry or viewport shading.",
    `- Verified camera path: ${formatVector(camera.startLocation)} to ${formatVector(camera.endLocation)}, ${camera.pathDistance} scene units, ${camera.minimumLensMm}-${camera.maximumLensMm}mm.`,
    "",
    "## Review",
    "",
    "Watch the complete generated clip and compare it with `previs.mp4` and `review/contact-sheet.png`. Check subject count and continuity, screen direction, contacts, camera speed, reveal timing, proxy leakage, and any unexpected cut or zoom.",
    "",
    "API submission is optional and disabled by default. Use it only after the active provider is verified to forward reference video inputs end to end.",
    "",
  ].join("\n");
}

function describeFile(output, role, file) {
  const absolute = path.join(output, ...file.split("/"));
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile() || fs.statSync(absolute).size === 0) {
    throw new Error(`Cannot build Seedance handoff; missing or empty ${file}.`);
  }
  return {
    role,
    file,
    bytes: fs.statSync(absolute).size,
    sha256: sha256File(absolute),
  };
}

function singleLine(value) {
  return String(value).replace(/[\r\n]+/g, " ").trim();
}

function formatVector(value) {
  return `[${value.join(", ")}]`;
}
