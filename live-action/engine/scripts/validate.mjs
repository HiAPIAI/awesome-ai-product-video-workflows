#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = path.join(root, "data", "workflows.json");
const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const renderTestsPath = path.join(root, "data", "render-tests.json");
const renderTests = JSON.parse(fs.readFileSync(renderTestsPath, "utf8"));
const errors = [];
const requiredRepositoryFiles = [
  "assets/cover.webp",
  "data/render-tests.json",
  "docs/research-notes.md",
  "scripts/run.mjs",
  "tests/run.test.mjs",
];
const allowedModes = new Set(["text-to-video", "image-to-video", "reference-to-video"]);
const allowedRatios = new Set(["16:9", "9:16", "1:1", "4:3", "3:4", "21:9", "adaptive"]);
const allowedResolutions = new Set(["480p", "720p", "1080p", "4k"]);
const allowedDifficulty = new Set(["starter", "intermediate", "advanced"]);
const allowedReviewResults = new Set(["pass", "partial", "fail"]);
const allowedSourceRoles = new Set(["first_frame_url", "last_frame_url", "reference_image_urls", "reference_video_urls", "reference_audio_urls"]);
const allowedSourceRights = new Set(["generated-original", "owned", "licensed"]);
const requiredFields = [
  "id", "category", "title_en", "title_zh", "summary_en", "summary_zh",
  "intent_en", "intent_zh", "mode", "duration", "aspect_ratio", "resolution",
  "difficulty", "asset_roles", "beats", "sound_en", "sound_zh", "prompt_en",
  "prompt_zh", "continuity_en", "continuity_zh", "failures", "media",
];

const categoryIds = new Set();
for (const [index, category] of data.categories.entries()) {
  if (!category.id || !category.en || !category.zh) errors.push(`categories[${index}]: missing id/en/zh`);
  if (categoryIds.has(category.id)) errors.push(`categories[${index}]: duplicate id ${category.id}`);
  categoryIds.add(category.id);
}

const workflowIds = new Set();
for (const [index, workflow] of data.workflows.entries()) {
  const where = `workflows[${index}] (${workflow.id ?? "no-id"})`;
  for (const field of requiredFields) {
    if (workflow[field] === undefined || workflow[field] === null || workflow[field] === "") {
      errors.push(`${where}: missing ${field}`);
    }
  }
  if (workflowIds.has(workflow.id)) errors.push(`${where}: duplicate id`);
  workflowIds.add(workflow.id);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(workflow.id ?? "")) errors.push(`${where}: id must be kebab-case`);
  if (!categoryIds.has(workflow.category)) errors.push(`${where}: unknown category ${workflow.category}`);
  if (!allowedModes.has(workflow.mode)) errors.push(`${where}: invalid mode ${workflow.mode}`);
  if (!Number.isInteger(workflow.duration) || workflow.duration < 4 || workflow.duration > 15) errors.push(`${where}: duration must be an integer from 4 to 15`);
  if (!allowedRatios.has(workflow.aspect_ratio)) errors.push(`${where}: invalid aspect_ratio ${workflow.aspect_ratio}`);
  if (!allowedResolutions.has(workflow.resolution)) errors.push(`${where}: invalid resolution ${workflow.resolution}`);
  if (!allowedDifficulty.has(workflow.difficulty)) errors.push(`${where}: invalid difficulty ${workflow.difficulty}`);
  if (!Array.isArray(workflow.asset_roles) || workflow.asset_roles.length === 0) errors.push(`${where}: asset_roles must not be empty`);
  if (!Array.isArray(workflow.beats) || workflow.beats.length < 2) errors.push(`${where}: at least two beats are required`);
  if (!Array.isArray(workflow.failures) || workflow.failures.length < 2) errors.push(`${where}: at least two failure fixes are required`);
  if (workflow.prompt_en.length < 220 || workflow.prompt_zh.length < 120) errors.push(`${where}: prompts are too short for a production workflow`);

  let expectedBeatStart = 0;
  for (const [beatIndex, beat] of (workflow.beats ?? []).entries()) {
    const match = /^(\d+)-(\d+)s$/.exec(beat.time ?? "");
    if (!match) {
      errors.push(`${where}: beats[${beatIndex}].time must use start-ends`);
      continue;
    }
    const start = Number(match[1]);
    const end = Number(match[2]);
    if (start !== expectedBeatStart || end <= start || end > workflow.duration) {
      errors.push(`${where}: beats[${beatIndex}] must continue from ${expectedBeatStart}s and end within ${workflow.duration}s`);
    }
    expectedBeatStart = end;
  }
  if (expectedBeatStart !== workflow.duration) errors.push(`${where}: beats must cover the full ${workflow.duration}s duration`);

  const mediaKeys = Object.keys(workflow.media ?? {});
  if (workflow.mode === "text-to-video" && mediaKeys.length !== 0) errors.push(`${where}: text-to-video must not define media fields`);
  if (workflow.mode === "image-to-video" && !workflow.media.first_frame_url) errors.push(`${where}: image-to-video requires first_frame_url`);
  if (workflow.mode === "reference-to-video" && !mediaKeys.some((key) => key.startsWith("reference_"))) errors.push(`${where}: reference-to-video requires reference media`);
  if ((workflow.media.first_frame_url || workflow.media.last_frame_url) && mediaKeys.some((key) => key.startsWith("reference_"))) errors.push(`${where}: first/last-frame and reference modes cannot be mixed`);
  if ((workflow.media.reference_image_urls?.length ?? 0) > 9) errors.push(`${where}: reference_image_urls exceeds 9 items`);
  if ((workflow.media.reference_video_urls?.length ?? 0) > 3) errors.push(`${where}: reference_video_urls exceeds 3 items`);
  if ((workflow.media.reference_audio_urls?.length ?? 0) > 3) errors.push(`${where}: reference_audio_urls exceeds 3 items`);
}

for (const categoryId of categoryIds) {
  if (!data.workflows.some((workflow) => workflow.category === categoryId)) errors.push(`category ${categoryId} has no workflows`);
}

if (renderTests.schema_version !== 1) errors.push("render-tests.json: schema_version must be 1");
if (!Array.isArray(renderTests.tests) || renderTests.tests.length === 0) {
  errors.push("render-tests.json: at least one verified render test is required");
} else {
  const taskIds = new Set();
  const currentRevisionWorkflowIds = new Set();
  const currentRevisionModes = new Set();
  for (const [index, renderTest] of renderTests.tests.entries()) {
    const where = `render-tests[${index}] (${renderTest.workflow_id ?? "no-workflow"})`;
    const workflow = data.workflows.find((item) => item.id === renderTest.workflow_id);
    if (!workflow) errors.push(`${where}: unknown workflow_id`);
    if (!/^tk-hiapi-[A-Za-z0-9_-]+$/.test(renderTest.task_id ?? "")) errors.push(`${where}: invalid task_id`);
    if (taskIds.has(renderTest.task_id)) errors.push(`${where}: duplicate task_id`);
    taskIds.add(renderTest.task_id);
    if (Number.isNaN(Date.parse(renderTest.tested_at))) errors.push(`${where}: invalid tested_at`);
    if (renderTest.model !== data.model) errors.push(`${where}: model must be ${data.model}`);
    if (renderTest.api_status !== "success") errors.push(`${where}: only successful API tasks may be recorded`);
    if (typeof renderTest.current_revision !== "boolean") errors.push(`${where}: current_revision must be boolean`);
    if (!/^[a-f0-9]{64}$/.test(renderTest.prompt_sha256 ?? "")) errors.push(`${where}: prompt_sha256 must be lowercase SHA-256`);

    if (workflow) {
      if (renderTest.request?.mode !== workflow.mode) errors.push(`${where}: request.mode does not match workflow`);
      if (!new Set(["en", "zh"]).has(renderTest.request?.language)) errors.push(`${where}: request.language must be en or zh`);
      if (renderTest.request?.duration !== workflow.duration) errors.push(`${where}: request.duration does not match workflow`);
      if (renderTest.request?.resolution !== workflow.resolution) errors.push(`${where}: request.resolution does not match workflow`);
      if (renderTest.request?.aspect_ratio !== workflow.aspect_ratio) errors.push(`${where}: request.aspect_ratio does not match workflow`);
      if (renderTest.current_revision) {
        const currentPrompt = workflow[`prompt_${renderTest.request.language}`] ?? "";
        const currentPromptHash = createHash("sha256").update(currentPrompt).digest("hex");
        if (renderTest.prompt_sha256 !== currentPromptHash) errors.push(`${where}: current revision prompt hash does not match workflow.prompt_en`);
        if (currentRevisionWorkflowIds.has(workflow.id)) errors.push(`${where}: workflow has more than one current render test`);
        currentRevisionWorkflowIds.add(workflow.id);
        currentRevisionModes.add(workflow.mode);
      }
    }
    if (renderTest.request?.generate_audio !== true) errors.push(`${where}: generate_audio must be true`);

    const sourceAssets = renderTest.source_assets ?? [];
    if (renderTest.request?.mode === "text-to-video" && sourceAssets.length) errors.push(`${where}: text-to-video must not define source_assets`);
    if (renderTest.request?.mode !== "text-to-video" && sourceAssets.length === 0) errors.push(`${where}: media workflows require source_assets`);
    for (const [sourceIndex, source] of sourceAssets.entries()) {
      const sourceWhere = `${where}: source_assets[${sourceIndex}]`;
      if (!allowedSourceRoles.has(source.role)) errors.push(`${sourceWhere}: invalid role`);
      if (renderTest.request?.mode === "image-to-video" && !new Set(["first_frame_url", "last_frame_url"]).has(source.role)) {
        errors.push(`${sourceWhere}: source role does not match image-to-video`);
      }
      if (renderTest.request?.mode === "reference-to-video" && !source.role.startsWith("reference_")) {
        errors.push(`${sourceWhere}: source role does not match reference-to-video`);
      }
      if (!/^tk-hiapi-[A-Za-z0-9_-]+$/.test(source.task_id ?? "")) errors.push(`${sourceWhere}: invalid task_id`);
      if (!source.model || !source.type) errors.push(`${sourceWhere}: model and type are required`);
      if (!Number.isInteger(source.bytes) || source.bytes <= 0) errors.push(`${sourceWhere}: bytes must be positive`);
      if (!/^[a-f0-9]{64}$/.test(source.sha256 ?? "")) errors.push(`${sourceWhere}: sha256 must be lowercase SHA-256`);
      if (!Number.isInteger(source.width) || !Number.isInteger(source.height)) errors.push(`${sourceWhere}: dimensions must be integers`);
      if (!allowedSourceRights.has(source.rights)) errors.push(`${sourceWhere}: invalid rights`);
      if (typeof source.published !== "boolean") errors.push(`${sourceWhere}: published must be boolean`);
    }

    const artifact = renderTest.artifact ?? {};
    if (typeof artifact.published !== "boolean") errors.push(`${where}: artifact.published must be boolean`);
    if (!Number.isInteger(artifact.bytes) || artifact.bytes <= 0) errors.push(`${where}: artifact.bytes must be positive`);
    if (!/^[a-f0-9]{64}$/.test(artifact.sha256 ?? "")) errors.push(`${where}: artifact.sha256 must be lowercase SHA-256`);
    if (!(artifact.duration_seconds > 0)) errors.push(`${where}: artifact.duration_seconds must be positive`);
    if (!Number.isInteger(artifact.width) || !Number.isInteger(artifact.height)) errors.push(`${where}: artifact dimensions must be integers`);
    if (!(artifact.fps > 0)) errors.push(`${where}: artifact.fps must be positive`);
    if (!artifact.video_codec || !artifact.audio_codec) errors.push(`${where}: video and audio codecs are required`);
    if (artifact.published && !renderTest.preview_url) errors.push(`${where}: published artifacts require preview_url`);

    const checks = Object.values(renderTest.review?.checks ?? {});
    if (!new Set(["pass", "partial-pass", "fail"]).has(renderTest.review?.overall)) errors.push(`${where}: invalid review.overall`);
    if (checks.length === 0 || checks.some((result) => !allowedReviewResults.has(result))) errors.push(`${where}: invalid review checks`);
    if ((renderTest.review?.notes_en?.length ?? 0) < 80 || (renderTest.review?.notes_zh?.length ?? 0) < 40) {
      errors.push(`${where}: bilingual review notes are required`);
    }
    if (checks.includes("partial") && renderTest.review?.overall === "pass") errors.push(`${where}: partial checks cannot have overall pass`);
    if (checks.includes("fail") && renderTest.review?.overall !== "fail") errors.push(`${where}: failed checks require overall fail`);
  }
  for (const mode of allowedModes) {
    if (!currentRevisionModes.has(mode)) errors.push(`render-tests.json: missing current verified baseline for ${mode}`);
  }
}

for (const relativePath of requiredRepositoryFiles) {
  if (!fs.existsSync(path.join(root, relativePath))) errors.push(`missing repository file ${relativePath}`);
}

const textExtensions = new Set([".md", ".txt", ".json", ".mjs", ".yml", ".yaml"]);
const secretPatterns = [
  /(?<![A-Za-z])sk-[A-Za-z0-9_-]{20,}/,
  /ghp_[A-Za-z0-9_]{20,}/,
  /Bearer\s+[A-Za-z0-9._-]{24,}/i,
];
const markdownFiles = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if ([".git", "node_modules"].includes(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (textExtensions.has(path.extname(entry.name))) {
      if (path.extname(entry.name) === ".md") markdownFiles.push(fullPath);
      const content = fs.readFileSync(fullPath, "utf8");
      for (const pattern of secretPatterns) {
        if (pattern.test(content)) errors.push(`${path.relative(root, fullPath)}: secret-like content matches ${pattern}`);
      }
    }
  }
}

walk(root);

for (const markdownPath of markdownFiles) {
  const content = fs.readFileSync(markdownPath, "utf8");
  const references = [
    ...content.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g),
    ...content.matchAll(/(?:href|src)=["']([^"']+)["']/g),
  ];
  for (const match of references) {
    const rawTarget = match[1].trim().replace(/^<|>$/g, "");
    if (!rawTarget || rawTarget.startsWith("#") || /^[a-z][a-z0-9+.-]*:/i.test(rawTarget)) continue;
    const relativeTarget = rawTarget.split(/[?#]/, 1)[0];
    let decodedTarget;
    try {
      decodedTarget = decodeURIComponent(relativeTarget);
    } catch {
      errors.push(`${path.relative(root, markdownPath)}: malformed local link ${rawTarget}`);
      continue;
    }
    const resolved = path.resolve(path.dirname(markdownPath), decodedTarget);
    if (!fs.existsSync(resolved)) errors.push(`${path.relative(root, markdownPath)}: broken local link ${rawTarget}`);
  }
}

const generatedFiles = new Set(data.workflows.map((workflow) => `${workflow.id}.md`));
for (const file of fs.readdirSync(path.join(root, "workflows"))) {
  if (file.endsWith(".md") && !generatedFiles.has(file)) errors.push(`workflows/${file}: not present in data/workflows.json`);
}

if (errors.length) {
  console.error("Validation failed:\n" + errors.map((error) => `  - ${error}`).join("\n"));
  process.exit(1);
}

console.log(`OK: ${data.workflows.length} workflows across ${data.categories.length} categories validated.`);
