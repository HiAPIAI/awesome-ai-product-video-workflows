#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const USAGE = `Usage:
  node migrate-prompts.mjs --source 2.0|2.5 --input FILE [--out FILE]

The command emits one model partition. It refuses to merge 2.0 and 2.5 records.
Without --out it prints a summary and the first normalized record only.`;

function arg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1] ?? null;
}

function fail(message) {
  console.error(`Migration draft error: ${message}\n\n${USAGE}`);
  process.exitCode = 2;
}

function asText(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function list(value) {
  return Array.isArray(value) ? [...new Set(value.filter((item) => typeof item === "string" && item))] : [];
}

function normalize20(item, categories) {
  return {
    schema_version: "1.0",
    id: item.id,
    model: { family: "seedance", version: "2.0" },
    source: {
      type: "community-post",
      url: asText(item.source_url),
      author: asText(item.author),
      license_status: "review-required",
      attribution: asText(item.author),
    },
    title: { en: asText(item.title_en) ?? item.id, zh: asText(item.title_zh) },
    prompt: {
      en: asText(item.prompt_en) ?? "",
      zh: asText(item.prompt_zh),
      availability: "mirrored",
    },
    capability: asText(item.capability) ?? "unknown",
    duration_seconds: Number.isInteger(item.duration_seconds) ? item.duration_seconds : null,
    aspect_ratio: asText(item.aspect_ratio),
    resolution: asText(item.resolution),
    categories: [categories.get(item.category) ?? item.category].filter(Boolean),
    tags: list(item.tags),
    media: {
      preview_image: asText(item.preview_image),
      preview_video: asText(item.preview_video),
      rights_status: "review-required",
    },
    fallback: null,
  };
}

function normalize25Case(item) {
  return {
    schema_version: "1.0",
    id: item.id,
    model: { family: "seedance", version: "2.5" },
    source: {
      type: "official-showcase",
      url: asText(item.video_url),
      author: null,
      license_status: "review-required",
      attribution: "ByteDance/Volcengine showcase; verify redistribution rights",
    },
    title: { en: asText(item.title_en) ?? item.id, zh: asText(item.title_zh) },
    prompt: {
      en: asText(item.prompt_en) ?? asText(item.prompt_theme_en) ?? "",
      zh: asText(item.prompt_zh) ?? asText(item.prompt_theme_zh),
      availability: item.prompt_mirrored ? "mirrored" : "theme-only",
    },
    capability: asText(item.capability) ?? "unknown",
    duration_seconds: Number.isInteger(item.duration_seconds) ? item.duration_seconds : null,
    aspect_ratio: asText(item.aspect_ratio),
    resolution: asText(item.resolution),
    categories: [asText(item.category_en)].filter(Boolean),
    tags: list(item.tags),
    media: {
      preview_image: asText(item.preview_image_url),
      preview_video: asText(item.video_url),
      rights_status: "review-required",
    },
    fallback: null,
  };
}

function normalize25Template(item) {
  return {
    schema_version: "1.0",
    id: item.id,
    model: { family: "seedance", version: "2.5" },
    source: {
      type: "original-template",
      url: null,
      author: "HiAPI",
      license_status: "review-required",
      attribution: "Confirm the repository license before publishing",
    },
    title: { en: asText(item.title_en) ?? item.id, zh: asText(item.title_zh) },
    prompt: { en: asText(item.prompt) ?? "", zh: null, availability: "mirrored" },
    capability: asText(item.capability) ?? "unknown",
    duration_seconds: Number.parseInt(item.seconds, 10) || null,
    aspect_ratio: asText(item.aspect_ratio),
    resolution: asText(item.resolution),
    categories: [],
    tags: [],
    media: { preview_image: null, preview_video: null, rights_status: "first-party" },
    fallback: {
      model: "seedance-2.0",
      notes: asText(item.fallback_2_0_en),
    },
  };
}

function normalize(source, input) {
  if (source === "2.0") {
    const categories = new Map((input.categories ?? []).map((item) => [item.id, item.en]));
    return { partition: "seedance-2.0", items: (input.items ?? []).map((item) => normalize20(item, categories)) };
  }
  if (source !== "2.5") fail(`unknown source ${source}`);
  if (Array.isArray(input.cases)) {
    return { partition: "seedance-2.5/official-cases", items: input.cases.map(normalize25Case) };
  }
  if (Array.isArray(input.templates)) {
    return { partition: "seedance-2.5/templates", items: input.templates.map(normalize25Template) };
  }
  fail("2.5 input must be official-cases.json or templates.json");
  return { partition: "seedance-2.5/unknown", items: [] };
}

const source = arg("--source");
const inputPath = arg("--input");
const outputPath = arg("--out");
if (!source || !inputPath) {
  fail("--source and --input are required");
} else {
  const input = JSON.parse(fs.readFileSync(path.resolve(inputPath), "utf8"));
  const result = normalize(source, input);
  const document = {
    schema_version: "1.0",
    partition: result.partition,
    source_file: path.basename(inputPath),
    items: result.items,
  };
  if (outputPath) {
    fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
    fs.writeFileSync(path.resolve(outputPath), `${JSON.stringify(document, null, 2)}\n`);
    console.log(`Wrote ${result.items.length} records to ${outputPath} (${result.partition})`);
  } else {
    console.log(JSON.stringify({ partition: result.partition, count: result.items.length, first: result.items[0] ?? null }, null, 2));
  }
}
