#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ignoredDirectories = new Set([".git", "build", "node_modules", "outputs"]);
const markdownFiles = [];
collectMarkdown(process.cwd());

const missing = [];
for (const file of markdownFiles) {
  const source = fs.readFileSync(file, "utf8");
  for (const match of source.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    let target = match[1].trim().replace(/^<|>$/g, "");
    if (!target || target.startsWith("#") || /^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
    target = target.split("#", 1)[0].split("?", 1)[0];
    try {
      target = decodeURIComponent(target);
    } catch {
      missing.push(`${portable(file)} -> ${target} (invalid encoding)`);
      continue;
    }
    const resolved = target.startsWith("/")
      ? path.resolve(process.cwd(), `.${target}`)
      : path.resolve(path.dirname(file), target);
    if (!fs.existsSync(resolved)) missing.push(`${portable(file)} -> ${target}`);
  }
}
if (missing.length) throw new Error(`Missing local Markdown links:\n${missing.join("\n")}`);
console.log(`Checked local links in ${markdownFiles.length} Markdown files.`);

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (packageJson.private !== true) throw new Error("package.json must remain private");
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run this repository gate through npm run test:repo.");
const npmCache = path.join(process.cwd(), "node_modules", ".cache", "repository-gates");
const packed = JSON.parse(execFileSync(process.execPath, [npmCli, "pack", "--dry-run", "--json"], {
  encoding: "utf8",
  env: { ...process.env, npm_config_cache: npmCache },
}));
const files = packed[0].files.map(({ path: file }) => file.replaceAll("\\", "/"));
const forbidden = files.filter((file) => (
  /(^|\/)(?:build|node_modules|outputs|__pycache__)(\/|$)/.test(file)
  || /\.(?:blend1?|log|mov|mp4|pyc|webm)$/.test(file)
  || (/(^|\/)\.env(?:\..+)?$/.test(file) && file !== ".env.example")
  || /preflight-.+\.pending\.json$/.test(file)
  || /(?:^|\/)(?:\.codex-previs-(?:staging|backup)-[^/]+)(?:\/|$)/.test(file)
  || /(?:^|\/)(?:\.codex-previs-output(?:\.json|\.lock)|compiled\.json|manifest\.json|prompt\.txt|seedance\.request\.json|render-report\.json|review-report\.json|review-checklist\.md|handoff-manifest\.json|seedance-handoff\.md|blocking-top\.svg)$/.test(file)
  || /\.(?:submitted|result|download)\.json$/.test(file)
  || /(?:^|\/)(?:frames\/frame_\d+|review\/(?:first-frame|middle-frame|last-frame|contact-sheet))\.png$/.test(file)
));
if (forbidden.length) throw new Error(`Forbidden package files:\n${forbidden.join("\n")}`);
console.log(`Checked ${files.length} files in the npm dry-run package.`);

function collectMarkdown(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) collectMarkdown(target);
    else if (entry.isFile() && entry.name.endsWith(".md")) markdownFiles.push(target);
  }
}

function portable(file) {
  return path.relative(process.cwd(), file).split(path.sep).join("/");
}
