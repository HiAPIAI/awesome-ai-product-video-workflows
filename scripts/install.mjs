#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { argv, env, exit, stdin, stdout } from "node:process";
import readline from "node:readline/promises";

const displayName = "Awesome AI Product Video Workflows";
const skillFolder = "awesome-ai-product-video-workflows";
const skillRepo = "https://github.com/HiAPIAI/awesome-ai-product-video-workflows.git";
const args = argv.slice(2);
const yes = args.includes("-y") || args.includes("--yes") || !stdin.isTTY;

function flagValue(name) {
  const prefix = `--${name}=`;
  const hit = args.find((argument) => argument.startsWith(prefix));
  if (!hit) return null;
  return resolve(hit.slice(prefix.length).replace(/^~(?=$|\/)/, homedir()));
}

function detectedTargets() {
  const targets = [];
  const codexHome = env.CODEX_HOME || join(homedir(), ".codex");
  if (existsSync(codexHome)) {
    targets.push({ label: "Codex", directory: join(codexHome, "skills") });
  }
  const claudeHome = join(homedir(), ".claude");
  if (existsSync(claudeHome)) {
    targets.push({ label: "Claude Code", directory: join(claudeHome, "skills") });
  }
  return targets;
}

async function resolveTargets() {
  const explicit = flagValue("target") || flagValue("skills-dir");
  if (explicit) return [{ label: "explicit", directory: explicit }];
  if (env.AGENT_SKILLS_DIR) {
    return [{ label: "$AGENT_SKILLS_DIR", directory: resolve(env.AGENT_SKILLS_DIR) }];
  }
  if (args.includes("--codex")) {
    return [{
      label: "Codex",
      directory: join(env.CODEX_HOME || join(homedir(), ".codex"), "skills"),
    }];
  }
  if (args.includes("--claude")) {
    return [{ label: "Claude Code", directory: join(homedir(), ".claude", "skills") }];
  }

  const targets = detectedTargets();
  if (targets.length === 0) {
    throw new Error("No agent skills directory detected. Pass --codex, --claude, or --target=/path/to/skills.");
  }
  if (targets.length === 1 || yes) return targets;

  console.log("Detected agent skill directories:");
  targets.forEach((target, index) => {
    console.log(`  ${index + 1}) ${target.label} → ${target.directory}`);
  });
  console.log("  a) all");
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const answer = (await rl.question("Choose [1-N / a]: ")).trim().toLowerCase();
  rl.close();
  if (answer === "a" || answer === "all") return targets;
  const index = Number.parseInt(answer, 10);
  if (Number.isInteger(index) && index >= 1 && index <= targets.length) {
    return [targets[index - 1]];
  }
  throw new Error("Invalid target choice.");
}

function installTarget(target) {
  mkdirSync(target.directory, { recursive: true });
  const destination = join(target.directory, skillFolder);
  if (existsSync(destination)) {
    console.log(`[${displayName}] Replacing ${destination}`);
    rmSync(destination, { recursive: true, force: true });
  }
  console.log(`[${displayName}] Installing → ${destination}`);
  execFileSync("git", ["clone", "--depth", "1", skillRepo, destination], {
    stdio: "inherit",
  });
}

try {
  execFileSync("git", ["--version"], { stdio: "ignore" });
  const targets = await resolveTargets();
  for (const target of targets) installTarget(target);
  console.log(`[${displayName}] Done. Restart the agent if it caches skills.`);
} catch (error) {
  console.error(`[${displayName}] Failed: ${error.message}`);
  exit(1);
}
