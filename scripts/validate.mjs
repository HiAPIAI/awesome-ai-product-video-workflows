#!/usr/bin/env node

import { lstat, readFile, readdir, stat } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { argv } from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = "https://hiapiai.github.io/awesome-ai-product-video-workflows";

async function exists(path) {
  try {
    await lstat(path);
    return true;
  } catch {
    return false;
  }
}

async function walk(directory, ignored = new Set([".git", "node_modules"])) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(path, ignored)));
    } else {
      files.push(path);
    }
  }
  return files;
}

function jpegDimensions(buffer) {
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  const startOfFrame = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
  ]);
  while (offset + 8 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    if (startOfFrame.has(marker)) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }
    const length = buffer.readUInt16BE(offset + 2);
    if (!Number.isFinite(length) || length < 2) break;
    offset += 2 + length;
  }
  return null;
}

function extractMeta(html, name, property = false) {
  const attribute = property ? "property" : "name";
  const pattern = new RegExp(
    `<meta\\s+${attribute}="${name}"\\s+content="([^"]*)"`,
    "i",
  );
  return html.match(pattern)?.[1] ?? "";
}

async function validateMarkdownLinks(file, text, errors) {
  const linkPattern = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  for (const match of text.matchAll(linkPattern)) {
    const target = match[1];
    if (
      target.startsWith("http://") ||
      target.startsWith("https://") ||
      target.startsWith("#") ||
      target.startsWith("mailto:")
    ) {
      continue;
    }
    const withoutFragment = target.split("#")[0];
    if (!withoutFragment) continue;
    const resolved = resolve(dirname(file), decodeURIComponent(withoutFragment));
    if (!(await exists(resolved))) {
      errors.push(`${file.slice(root.length + 1)} has a broken local link: ${target}`);
    }
  }

  for (const match of text.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)) {
    if (!match[1].trim()) {
      errors.push(`${file.slice(root.length + 1)} has an image without descriptive alt text.`);
    }
  }
}

export async function validateRepository() {
  const errors = [];
  const warnings = [];
  const workflows = JSON.parse(
    await readFile(join(root, "data", "workflows.json"), "utf8"),
  ).workflows;
  const projects = JSON.parse(
    await readFile(join(root, "data", "projects.json"), "utf8"),
  ).projects;

  if (workflows.length < 6) errors.push("At least six useful workflows are required.");
  if (projects.length < 10) errors.push("At least ten audited open-source projects are required.");

  const unique = (values) => new Set(values).size === values.length;
  for (const [label, values] of [
    ["workflow ids", workflows.map((workflow) => workflow.id)],
    ["workflow slugs", workflows.map((workflow) => workflow.slug)],
    ["English workflow titles", workflows.map((workflow) => workflow.title_en)],
    ["Chinese workflow titles", workflows.map((workflow) => workflow.title_zh)],
    ["English target phrases", workflows.map((workflow) => workflow.keyword_en)],
  ]) {
    if (!unique(values)) errors.push(`${label} must be unique.`);
  }

  for (const workflow of workflows) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(workflow.id)) {
      errors.push(`Invalid workflow id: ${workflow.id}`);
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(workflow.slug)) {
      errors.push(`Invalid workflow slug: ${workflow.slug}`);
    }
    if (workflow.description_en.length < 100) {
      errors.push(`${workflow.id} English description is too thin.`);
    }
    if (workflow.description_zh.length < 40) {
      errors.push(`${workflow.id} Chinese description is too thin.`);
    }
    if (!Array.isArray(workflow.steps) || workflow.steps.length < 5) {
      errors.push(`${workflow.id} must contain at least five production steps.`);
    }
    if (workflow.inputs_en.length !== workflow.inputs_zh.length) {
      errors.push(`${workflow.id} input localization is incomplete.`);
    }
    if (workflow.outputs_en.length !== workflow.outputs_zh.length) {
      errors.push(`${workflow.id} output localization is incomplete.`);
    }
    for (const step of workflow.steps) {
      for (const field of ["title_en", "body_en", "title_zh", "body_zh"]) {
        if (!step[field]?.trim()) errors.push(`${workflow.id} is missing ${field}.`);
      }
    }
  }

  for (const project of projects) {
    if (!/^https:\/\/github\.com\/[^/]+\/[^/]+$/.test(project.url)) {
      errors.push(`${project.name} must use a canonical GitHub repository URL.`);
    }
    if (!Number.isInteger(project.stars) || project.stars < 0) {
      errors.push(`${project.name} has an invalid star snapshot.`);
    }
    if (!project.license || !project.adoption) {
      errors.push(`${project.name} must state its license and adoption boundary.`);
    }
    if (!project.summary_en || !project.summary_zh) {
      errors.push(`${project.name} must have English and Chinese descriptions.`);
    }
  }

  const requiredFiles = [
    "README.md",
    "README.zh-CN.md",
    "SKILL.md",
    "llms.txt",
    "agents/openai.yaml",
    "schemas/workflow.schema.json",
    "site/index.html",
    "site/zh/index.html",
    "site/robots.txt",
    "site/sitemap.xml",
    "assets/ai-product-video-workflows-social-preview.jpg",
  ];
  for (const file of requiredFiles) {
    if (!(await exists(join(root, file)))) errors.push(`Missing required file: ${file}`);
  }

  for (const workflow of workflows) {
    const filename = `${String(workflow.order).padStart(2, "0")}-${workflow.id}.md`;
    for (const path of [
      join(root, "workflows", filename),
      join(root, "workflows", "zh", filename),
      join(root, "site", "workflows", workflow.slug, "index.html"),
      join(root, "site", "zh", "workflows", workflow.slug, "index.html"),
    ]) {
      if (!(await exists(path))) {
        errors.push(`Missing generated workflow page: ${path.slice(root.length + 1)}`);
      }
    }
  }

  const markdownFiles = (await walk(root)).filter((file) => extname(file) === ".md");
  for (const file of markdownFiles) {
    const text = await readFile(file, "utf8");
    await validateMarkdownLinks(file, text, errors);
  }

  const htmlFiles = (await walk(join(root, "site"))).filter(
    (file) => extname(file) === ".html",
  );
  const sitemap = await readFile(join(root, "site", "sitemap.xml"), "utf8");
  for (const file of htmlFiles) {
    const html = await readFile(file, "utf8");
    const relative = file.slice(root.length + 1);
    const title = html.match(/<title>([^<]+)<\/title>/i)?.[1] ?? "";
    const description = extractMeta(html, "description");
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1] ?? "";
    const chinesePage = /<html lang="zh-CN">/i.test(html);
    const h1Count = (html.match(/<h1(?:\s|>)/gi) ?? []).length;
    const jsonLdText = html.match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/i,
    )?.[1];

    if (!title || title.length > 70) errors.push(`${relative} has an invalid title.`);
    const minimumDescriptionLength = chinesePage ? 35 : 80;
    const maximumDescriptionLength = chinesePage ? 100 : 180;
    if (
      description.length < minimumDescriptionLength ||
      description.length > maximumDescriptionLength
    ) {
      errors.push(
        `${relative} meta description must be ${minimumDescriptionLength}-${maximumDescriptionLength} characters.`,
      );
    }
    if (h1Count !== 1) errors.push(`${relative} must contain exactly one H1.`);
    if (!canonical.startsWith(`${baseUrl}/`)) {
      errors.push(`${relative} has an invalid canonical URL.`);
    }
    if (canonical && !sitemap.includes(`<loc>${canonical}</loc>`)) {
      errors.push(`${relative} canonical URL is missing from sitemap.xml.`);
    }
    for (const language of ["en", "zh-CN", "x-default"]) {
      if (!html.includes(`hreflang="${language}"`)) {
        errors.push(`${relative} is missing hreflang=${language}.`);
      }
    }
    if (!extractMeta(html, "og:image", true).endsWith(
      "/assets/ai-product-video-workflows-social-preview.jpg",
    )) {
      errors.push(`${relative} is missing the preferred Open Graph image.`);
    }
    if (/noindex/i.test(extractMeta(html, "robots"))) {
      errors.push(`${relative} unexpectedly blocks indexing.`);
    }
    if (!jsonLdText) {
      errors.push(`${relative} is missing JSON-LD.`);
    } else {
      try {
        JSON.parse(jsonLdText);
      } catch {
        errors.push(`${relative} contains invalid JSON-LD.`);
      }
    }
  }

  const socialPath = join(root, "assets", "ai-product-video-workflows-social-preview.jpg");
  if (await exists(socialPath)) {
    const image = await readFile(socialPath);
    const dimensions = jpegDimensions(image);
    if (!dimensions || dimensions.width !== 1280 || dimensions.height !== 640) {
      errors.push("Social preview must be a 1280 × 640 JPEG.");
    }
    if (image.byteLength >= 1_000_000) {
      errors.push("Social preview must be under 1 MB.");
    }
  }

  const sourceFiles = (await walk(root)).filter((file) =>
    [".md", ".json", ".mjs", ".yaml", ".yml", ".txt", ".html", ".css"].includes(
      extname(file),
    ),
  );
  const secretPatterns = [
    /\bsk-[A-Za-z0-9_-]{20,}\b/,
    /\b(?:api[_-]?key|token|password)\s*[:=]\s*["'][^"'{}\s]{12,}["']/i,
  ];
  for (const file of sourceFiles) {
    const text = await readFile(file, "utf8");
    if (secretPatterns.some((pattern) => pattern.test(text))) {
      errors.push(`${file.slice(root.length + 1)} may contain a secret.`);
    }
  }

  const skill = await readFile(join(root, "SKILL.md"), "utf8");
  const frontmatter = skill.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  const frontmatterKeys = [...frontmatter.matchAll(/^([a-z_]+):/gm)].map(
    (match) => match[1],
  );
  if (frontmatterKeys.join(",") !== "name,description") {
    errors.push("SKILL.md frontmatter must contain only name and description.");
  }
  if (!frontmatter.includes("name: awesome-ai-product-video-workflows")) {
    errors.push("SKILL.md name must match the installation directory.");
  }

  const robots = await readFile(join(root, "site", "robots.txt"), "utf8");
  if (!robots.includes("Allow: /") || !robots.includes(`${baseUrl}/sitemap.xml`)) {
    errors.push("robots.txt must allow crawling and point to sitemap.xml.");
  }

  if (warnings.length) {
    for (const warning of warnings) console.warn(`WARN ${warning}`);
  }
  return { ok: errors.length === 0, errors, warnings };
}

const invokedDirectly =
  argv[1] && pathToFileURL(resolve(argv[1])).href === import.meta.url;

if (invokedDirectly) {
  const result = await validateRepository();
  if (!result.ok) {
    for (const error of result.errors) console.error(`ERROR ${error}`);
    process.exitCode = 1;
  } else {
    console.log("Repository, workflow data, local links, and SEO metadata are valid.");
  }
}
