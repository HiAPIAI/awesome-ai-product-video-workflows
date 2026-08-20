#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "data", "workflows.json"), "utf8"));
const renderTests = JSON.parse(fs.readFileSync(path.join(root, "data", "render-tests.json"), "utf8"));
const checkOnly = process.argv.includes("--check");
const campaign = "awesome-seedance-2-0-live-action-workflows";

const links = {
  en: {
    home: `https://www.hiapi.ai/en?utm_source=github&utm_medium=readme&utm_campaign=${campaign}`,
    register: `https://www.hiapi.ai/en/register?utm_source=github&utm_medium=readme&utm_campaign=${campaign}`,
    model: `https://www.hiapi.ai/en/models/seedance-2-0?utm_source=github&utm_medium=readme&utm_campaign=${campaign}`,
  },
  zh: {
    home: `https://www.hiapi.ai/zh?utm_source=github&utm_medium=readme&utm_campaign=${campaign}`,
    register: `https://www.hiapi.ai/zh/register?utm_source=github&utm_medium=readme&utm_campaign=${campaign}`,
    model: `https://www.hiapi.ai/zh/models/seedance-2-0?utm_source=github&utm_medium=readme&utm_campaign=${campaign}`,
  },
  docs: `https://docs.hiapi.ai/?utm_source=github&utm_medium=readme&utm_campaign=${campaign}`,
  skill: "https://github.com/HiAPIAI/hiapi-seedance-2-0-video-skill",
  gallery: "https://github.com/HiAPIAI/awesome-seedance-2-0-prompts",
};

const categoryById = new Map(data.categories.map((category) => [category.id, category]));

function anchor(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function requestFor(workflow, language = "en") {
  return {
    model: data.model,
    input: {
      prompt: workflow[`prompt_${language}`],
      duration: workflow.duration,
      resolution: workflow.resolution,
      aspect_ratio: workflow.aspect_ratio,
      generate_audio: true,
      ...workflow.media,
    },
  };
}

function tableCell(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

function renderTestSection(language) {
  const zh = language === "zh";
  const rows = renderTests.tests.map((renderTest) => {
    const workflow = data.workflows.find((item) => item.id === renderTest.workflow_id);
    const title = zh ? workflow.title_zh : workflow.title_en;
    const evidence = `${renderTest.artifact.duration_seconds.toFixed(2)}s · ${renderTest.artifact.width}×${renderTest.artifact.height} · ${renderTest.artifact.fps} fps · ${renderTest.artifact.video_codec}/${renderTest.artifact.audio_codec}`;
    const review = zh
      ? { pass: "通过", "partial-pass": "部分通过", fail: "失败" }[renderTest.review.overall]
      : { pass: "Pass", "partial-pass": "Partial pass", fail: "Fail" }[renderTest.review.overall];
    const revision = zh
      ? (renderTest.current_revision ? "当前版本" : "历史版本")
      : (renderTest.current_revision ? "Current" : "Historical");
    const notes = zh ? renderTest.review.notes_zh : renderTest.review.notes_en;
    return `| [${title}](workflows/${workflow.id}.md) | ${renderTest.request.mode} | ${renderTest.tested_at.slice(0, 10)} | ${revision} | ${review} | ${tableCell(evidence)} | ${tableCell(notes)} |`;
  }).join("\n");

  if (zh) {
    return `## 已验证的真实生成\n\n只有完成真实 API 生成、文件校验和人工画面复核的条目才会进入此表。任务证据保存在 \`data/render-tests.json\`；提示词修改后，旧任务自动降为历史版本，当前版本必须重新实测。\n\n| 工作流 | 模式 | 测试日期 | 版本 | 复核 | 成片证据 | 已知偏差 |\n| --- | --- | --- | --- | --- | --- | --- |\n${rows}`;
  }
  return `## Verified Render Tests\n\nOnly entries that completed a real API task, file validation, and human frame review appear here. Evidence is stored in \`data/render-tests.json\`; after a prompt changes, its old task becomes historical and the current revision must be tested again.\n\n| Workflow | Mode | Tested | Revision | Review | Artifact evidence | Known deviation |\n| --- | --- | --- | --- | --- | --- | --- |\n${rows}`;
}

function renderIndex(language) {
  const zh = language === "zh";
  const localeLinks = links[language];
  const title = zh ? "Awesome Seedance 2.0 真人实拍工作流" : "Awesome Seedance 2.0 Live-Action Workflows";
  const description = zh
    ? "面向 AI 影视创作者和短视频团队的双语工作流库：电影镜头、生活场景、人物表演、对话视频与 UGC / 纪实。"
    : "A bilingual workflow library for AI filmmakers and short-form teams: cinematic shots, everyday life, performance, dialogue, and documentary/UGC.";
  const languageLine = zh ? "[English](README.md) | **简体中文**" : "**English** | [简体中文](README.zh-CN.md)";
  const generatedNote = zh
    ? "<!-- 本文件由 data/workflows.json 生成。请勿直接编辑。 -->"
    : "<!-- Generated from data/workflows.json. Do not edit directly. -->";
  const workflowNoun = zh ? "条工作流" : "workflows";
  const categoryNoun = zh ? "个类别" : "categories";

  const categoryRows = data.categories.map((category) => {
    const count = data.workflows.filter((workflow) => workflow.category === category.id).length;
    const label = zh ? category.zh : category.en;
    const descriptionText = zh ? category.description_zh : category.description_en;
    return `| [${label}](#${anchor(category.en)}) | ${count} | ${tableCell(descriptionText)} |`;
  }).join("\n");

  const sections = data.categories.map((category) => {
    const label = zh ? category.zh : category.en;
    const descriptionText = zh ? category.description_zh : category.description_en;
    const tableHeader = zh
      ? "| 工作流 | 模式 | 时长 | 画幅 | 难度 | 结果 |\n| --- | --- | ---: | --- | --- | --- |"
      : "| Workflow | Mode | Length | Ratio | Level | Outcome |\n| --- | --- | ---: | --- | --- | --- |";
    const rows = data.workflows
      .filter((workflow) => workflow.category === category.id)
      .map((workflow) => {
        const workflowTitle = zh ? workflow.title_zh : workflow.title_en;
        const summary = zh ? workflow.summary_zh : workflow.summary_en;
        return `| [${workflowTitle}](workflows/${workflow.id}.md) | ${workflow.mode} | ${workflow.duration}s | ${workflow.aspect_ratio} | ${workflow.difficulty} | ${tableCell(summary)} |`;
      })
      .join("\n");
    return `<a id="${anchor(category.en)}"></a>\n\n## ${label}\n\n${descriptionText}\n\n${tableHeader}\n${rows}`;
  }).join("\n\n---\n\n");

  const quickStart = zh
    ? `## 60 秒开始\n\n1. 从下方类别中选择一条工作流。\n2. 先离线预览一个无需参考素材的请求：\n\n\`\`\`bash\nnpm run generate -- night-corridor-suspense --dry-run\n\`\`\`\n\n3. 设置 \`HIAPI_API_KEY\` 后去掉 \`--dry-run\`，即可创建任务并等待结果。\n4. 图生视频或参考视频工作流可用重复的 \`--media key=url\` 替换素材占位符。\n5. 使用 \`--output-dir outputs\` 下载成片和任务证据；轮询中断时使用 \`--task-id TASK_ID\` 恢复，不会重复提交。\n\n需要 Agent 直接执行时，安装 [HiAPI Seedance 2.0 Video Skill](${links.skill})。`
    : `## Start In 60 Seconds\n\n1. Pick a workflow from a category below.\n2. Preview a text-to-video request without spending credits:\n\n\`\`\`bash\nnpm run generate -- night-corridor-suspense --dry-run\n\`\`\`\n\n3. Set \`HIAPI_API_KEY\`, remove \`--dry-run\`, and the runner creates the task and waits for the result.\n4. For image or reference workflows, repeat \`--media key=url\` to replace media placeholders.\n5. Add \`--output-dir outputs\` to download the result and task evidence. If polling is interrupted, resume with \`--task-id TASK_ID\` without submitting again.\n\nFor agent-run generation, install the [HiAPI Seedance 2.0 Video Skill](${links.skill}).`;

  const principles = zh
    ? `## 每条工作流包含什么\n\n- **镜头意图**：先说明这一段戏在叙事上要完成什么。\n- **参考素材角色**：明确人物、场景、动作、声音分别由哪个素材负责。\n- **时间轴节拍**：短时长内只保留能被模型稳定完成的动作。\n- **连续性锁定**：固定人物身份、服装、道具、光向和空间关系。\n- **失败修复**：一次只改一个变量，避免整段提示词推倒重来。\n- **HiAPI 请求**：统一使用 \`seedance-2.0\` 与异步 \`/v1/tasks\`。`
    : `## What Every Workflow Includes\n\n- **Directorial intent:** what the scene must accomplish dramatically.\n- **Reference roles:** which asset controls identity, location, motion, or sound.\n- **Timed beats:** only the actions that can fit coherently in the clip.\n- **Continuity locks:** identity, wardrobe, props, light direction, and geography.\n- **Failure fixes:** change one variable per retake instead of rewriting everything.\n- **HiAPI request:** the canonical \`seedance-2.0\` async \`/v1/tasks\` payload.`;

  const honestStatus = zh
    ? `> **状态说明：** 仓库会明确区分“工作流模板”和“已实测条目”。只有完成真实 API 生成、文件校验与人工画面复核的条目才会出现在下方验证表；预览素材仍需具备公开授权。`
    : `> **Status:** The repository distinguishes workflow templates from verified renders. Only entries with a completed API task, file validation, and human frame review appear in the verification table below; preview media still requires publication rights.`;

  const research = zh
    ? `本仓库综合参考了热门 Seedance、AI 短片与 Awesome List 项目的入口设计、素材角色、时间轴、质量门槛和贡献机制，同时保持内容原创且聚焦真人场景。详见 [同类开源仓库调研](docs/research-notes.md)。`
    : `This repository adapts the strongest navigation, asset-role, timeline, quality-gate, and contribution patterns from popular Seedance, AI short-film, and Awesome List projects while keeping every workflow original and live-action focused. See [reference repository research](docs/research-notes.md).`;

  return `${generatedNote}\n\n<div align="center">\n\n<a href="${localeLinks.home}"><img src="./assets/cover.webp" alt="${title}" width="100%"></a>\n\n# ${title}\n\n${description}\n\n[HiAPI](${localeLinks.home}) | [Get API Key](${localeLinks.register}) | [Seedance 2.0](${localeLinks.model}) | [Docs](${links.docs}) | [Agent Skill](${links.skill})\n\n${languageLine}\n\n**${data.workflows.length} ${workflowNoun} | ${data.categories.length} ${categoryNoun} | T2V / I2V / R2V | HiAPI \`/v1/tasks\`**\n\n</div>\n\n${honestStatus}\n\n${research}\n\n${renderTestSection(language)}\n\n---\n\n${quickStart}\n\n---\n\n## ${zh ? "按类别浏览" : "Browse By Category"}\n\n| ${zh ? "类别" : "Category"} | ${zh ? "数量" : "Count"} | ${zh ? "适用场景" : "Best for"} |\n| --- | ---: | --- |\n${categoryRows}\n\n---\n\n${principles}\n\n---\n\n${sections}\n\n---\n\n## ${zh ? "参与贡献" : "Contributing"}\n\n${zh ? "欢迎提交原创、去 IP、可复用的真人写实工作流。请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)，并运行 `npm test`。" : "Original, IP-clean, reusable live-action workflows are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) and run `npm test`."}\n\n## ${zh ? "许可" : "License"}\n\n[CC BY 4.0](LICENSE). ${zh ? "原创资产与外部参考边界见 [NOTICE.md](NOTICE.md)。" : "See [NOTICE.md](NOTICE.md) for original-asset and external-reference boundaries."}\n`;
}

function renderWorkflow(workflow) {
  const category = categoryById.get(workflow.category);
  const verifiedTests = renderTests.tests.filter((renderTest) => renderTest.workflow_id === workflow.id);
  const currentTest = verifiedTests.find((renderTest) => renderTest.current_revision);
  const reviewLabel = currentTest
    ? { pass: "通过", "partial-pass": "部分通过", fail: "失败" }[currentTest.review.overall]
    : null;
  const renderStatus = currentTest
    ? `Verified render (${currentTest.review.overall}) / 已实测（${reviewLabel}）`
    : "Unverified template / 未实测模板";
  const renderEvidence = currentTest
    ? `## Verified Render Evidence / 真实生成证据\n\n- Task: \`${currentTest.task_id}\`\n- Tested: ${currentTest.tested_at}\n- Prompt (${currentTest.request.language}) SHA-256: \`${currentTest.prompt_sha256}\`\n- Artifact: ${currentTest.artifact.duration_seconds.toFixed(2)}s, ${currentTest.artifact.width}×${currentTest.artifact.height}, ${currentTest.artifact.fps} fps, ${currentTest.artifact.video_codec}/${currentTest.artifact.audio_codec}\n- Artifact SHA-256: \`${currentTest.artifact.sha256}\`\n- Review: ${currentTest.review.overall}\n\n**EN:** ${currentTest.review.notes_en}\n\n**中文：** ${currentTest.review.notes_zh}`
    : `> **Render status / 生成状态：** This entry is an unverified workflow template. It has not yet completed the repository's real-task, file-validation, and human-review gate. / 本条目是未实测工作流模板，尚未完成仓库要求的真实任务、文件校验和人工画面复核。`;
  workflow = {
    ...workflow,
    summary_zh: `${workflow.summary_zh}\n\n${renderEvidence}`,
    difficulty: `${workflow.difficulty} |\n| Render status | ${renderStatus}`,
  };
  const assets = workflow.asset_roles.map((asset) => `| \`${asset.slot}\` | ${asset.required ? "yes" : "optional"} | ${tableCell(asset.en)} | ${tableCell(asset.zh)} |`).join("\n");
  const beats = workflow.beats.map((beat) => `| ${beat.time} | ${tableCell(beat.en)} | ${tableCell(beat.zh)} |`).join("\n");
  const failures = workflow.failures.map((failure) => `| ${tableCell(failure.symptom_en)} | ${tableCell(failure.fix_en)} | ${tableCell(failure.symptom_zh)} | ${tableCell(failure.fix_zh)} |`).join("\n");
  const requestEn = JSON.stringify(requestFor(workflow, "en"), null, 2);
  const requestZh = JSON.stringify(requestFor(workflow, "zh"), null, 2);

  return `<!-- Generated from data/workflows.json. Do not edit directly. -->\n\n# ${workflow.title_en}\n\n## ${workflow.title_zh}\n\n${workflow.summary_en}\n\n${workflow.summary_zh}\n\n| Field | Value |\n| --- | --- |\n| Category | ${category.en} / ${category.zh} |\n| Mode | ${workflow.mode} |\n| Duration | ${workflow.duration}s |\n| Aspect ratio | ${workflow.aspect_ratio} |\n| Resolution | ${workflow.resolution} |\n| Difficulty | ${workflow.difficulty} |\n\n## Directorial Intent / 导演意图\n\n**EN:** ${workflow.intent_en}\n\n**中文：** ${workflow.intent_zh}\n\n## Reference Roles / 参考素材角色\n\n| Slot | Required | English | 中文 |\n| --- | --- | --- | --- |\n${assets}\n\n## Beat Sheet / 时间轴\n\n| Time | English | 中文 |\n| --- | --- | --- |\n${beats}\n\n## Sound / 声音\n\n**EN:** ${workflow.sound_en}\n\n**中文：** ${workflow.sound_zh}\n\n## Prompt (English)\n\n\`\`\`text\n${workflow.prompt_en}\n\`\`\`\n\n## 提示词（中文）\n\n\`\`\`text\n${workflow.prompt_zh}\n\`\`\`\n\n## HiAPI Request (English Prompt)\n\n\`\`\`json\n${requestEn}\n\`\`\`\n\n<details><summary><strong>HiAPI 请求（中文提示词）</strong></summary>\n\n\`\`\`json\n${requestZh}\n\`\`\`\n\n</details>\n\nCreate the task with \`POST https://api.hiapi.ai/v1/tasks\`, then query \`GET https://api.hiapi.ai/v1/tasks/{taskId}\`. Replace every \`asset://...\` placeholder with your uploaded asset id or supported URL, and remove unused optional media fields from \`input\`.\n\n使用 \`POST https://api.hiapi.ai/v1/tasks\` 创建任务，再查询 \`GET https://api.hiapi.ai/v1/tasks/{taskId}\`。请把所有 \`asset://...\` 占位符替换成已上传素材 id 或受支持的 URL，并从 \`input\` 中删除未使用的可选素材字段。\n\n## Continuity Lock / 连续性锁定\n\n**EN:** ${workflow.continuity_en}\n\n**中文：** ${workflow.continuity_zh}\n\n## Failure Fixes / 失败修复\n\n| Symptom | Fix one variable | 症状 | 一次只改一个变量 |\n| --- | --- | --- | --- |\n${failures}\n\n---\n\n[Browse all workflows](../README.md) | [浏览全部工作流](../README.zh-CN.md) | [Get a HiAPI API Key](${links.en.register}) | [Install the HiAPI Skill](${links.skill})\n`;
}

function renderLlms() {
  const lines = [
    "# Awesome Seedance 2.0 Live-Action Workflows",
    "",
    "Canonical data: data/workflows.json",
    "Model: seedance-2.0",
    "Create task: POST https://api.hiapi.ai/v1/tasks",
    "Read task: GET https://api.hiapi.ai/v1/tasks/{taskId}",
    "Runner: npm run generate -- <workflow-id> [--dry-run] [--media key=url]",
    "Resume task: npm run generate -- --task-id TASK_ID [--output-dir outputs]",
    "Research notes: docs/research-notes.md",
    "Verified render evidence: data/render-tests.json",
    `API key: ${links.en.register}`,
    `Agent skill: ${links.skill}`,
    "",
    "Workflow index:",
  ];
  for (const workflow of data.workflows) {
    lines.push(`- ${workflow.id}: workflows/${workflow.id}.md | ${workflow.mode} | ${workflow.duration}s | ${workflow.aspect_ratio}`);
  }
  lines.push("", "Rules:", "- Preserve the asset role map before rewriting prompts.", "- Keep identity, wardrobe, props, light direction, and screen geography stable.", "- On retake, change one variable and preserve accepted footage decisions.", "- Do not claim a template has been rendered unless a reviewed preview is present.", "");
  return lines.join("\n");
}

const outputs = new Map([
  ["README.md", renderIndex("en")],
  ["README.zh-CN.md", renderIndex("zh")],
  ["llms.txt", renderLlms()],
  ...data.workflows.map((workflow) => [`workflows/${workflow.id}.md`, renderWorkflow(workflow)]),
]);

let stale = false;
for (const [relativePath, content] of outputs) {
  const target = path.join(root, relativePath);
  const normalized = `${content.trimEnd()}\n`;
  if (checkOnly) {
    const current = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "";
    if (current !== normalized) {
      console.error(`Out of date: ${relativePath}`);
      stale = true;
    }
    continue;
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, normalized);
  console.log(`Wrote ${relativePath}`);
}

if (stale) process.exit(1);
if (checkOnly) console.log(`OK: ${outputs.size} generated files are current.`);
