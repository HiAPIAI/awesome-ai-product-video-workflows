#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const workflowData = JSON.parse(
  await readFile(join(root, "data", "workflows.json"), "utf8"),
);

function markdownList(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

function renderWorkflowMarkdown(workflow, language) {
  const zh = language === "zh";
  const title = workflow[zh ? "title_zh" : "title_en"];
  const description = workflow[zh ? "description_zh" : "description_en"];
  const keyword = workflow[zh ? "keyword_zh" : "keyword_en"];
  const inputs = workflow[zh ? "inputs_zh" : "inputs_en"];
  const outputs = workflow[zh ? "outputs_zh" : "outputs_en"];
  const gates = workflow[zh ? "gates_zh" : "gates_en"];
  const alternate = zh
    ? `../${String(workflow.order).padStart(2, "0")}-${workflow.id}.md`
    : `zh/${String(workflow.order).padStart(2, "0")}-${workflow.id}.md`;

  return `<!-- Generated from data/workflows.json. Run npm run build after editing the source data. -->

# ${title}

${description}

${zh ? "**目标搜索词**" : "**Primary search phrase**"}: \`${keyword}\`

${zh ? `[English](${alternate}) · [返回中文首页](../../README.zh-CN.md)` : `[简体中文](${alternate}) · [Back to repository](../README.md)`}

## ${zh ? "输入" : "Inputs"}

${markdownList(inputs)}

## ${zh ? "输出" : "Outputs"}

${markdownList(outputs)}

## ${zh ? "完整工作流" : "Step-by-step workflow"}

${workflow.steps
  .map(
    (step, index) =>
      `### ${index + 1}. ${step[zh ? "title_zh" : "title_en"]}\n\n${step[zh ? "body_zh" : "body_en"]}`,
  )
  .join("\n\n")}

## ${zh ? "进入下一阶段前的门禁" : "Gates before the next stage"}

${markdownList(gates)}

## ${zh ? "继续执行" : "Continue"}

${zh
  ? "使用仓库根目录的 `SKILL.md` 路由到下一条工作流，并用 `templates/` 中的商品 Brief、镜头卡和质检清单保存证据。"
  : "Use the root `SKILL.md` to select the next workflow, and preserve evidence with the product brief, shot plan, and QC checklist under `templates/`."}
`;
}

for (const workflow of workflowData.workflows) {
  const filename = `${String(workflow.order).padStart(2, "0")}-${workflow.id}.md`;
  const englishPath = join(root, "workflows", filename);
  const chinesePath = join(root, "workflows", "zh", filename);
  await mkdir(dirname(englishPath), { recursive: true });
  await mkdir(dirname(chinesePath), { recursive: true });
  await writeFile(englishPath, renderWorkflowMarkdown(workflow, "en"));
  await writeFile(chinesePath, renderWorkflowMarkdown(workflow, "zh"));
}

console.log(`Built ${workflowData.workflows.length * 2} bilingual workflow documents.`);
