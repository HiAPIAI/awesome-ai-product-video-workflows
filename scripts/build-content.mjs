#!/usr/bin/env node

import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const siteRoot = join(root, "site");
const baseUrl = "https://hiapiai.github.io/awesome-ai-product-video-workflows";
const repositoryUrl = "https://github.com/HiAPIAI/awesome-ai-product-video-workflows";
const imagePath = "assets/ai-product-video-workflows-social-preview.jpg";

const workflowData = JSON.parse(
  await readFile(join(root, "data", "workflows.json"), "utf8"),
);
const projectData = JSON.parse(
  await readFile(join(root, "data", "projects.json"), "utf8"),
);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

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
  const siteUrl = zh
    ? `${baseUrl}/zh/workflows/${workflow.slug}/`
    : `${baseUrl}/workflows/${workflow.slug}/`;

  return `<!-- Generated from data/workflows.json. Run npm run build after editing the source data. -->

# ${title}

${description}

${zh ? "**目标搜索词**" : "**Primary search phrase**"}: \`${keyword}\`

${zh ? `[English](${alternate}) · [搜索友好网页](${siteUrl})` : `[简体中文](${alternate}) · [Search-friendly web page](${siteUrl})`}

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

function localizedUrl(workflow, language) {
  return language === "zh"
    ? `${baseUrl}/zh/workflows/${workflow.slug}/`
    : `${baseUrl}/workflows/${workflow.slug}/`;
}

function alternateUrl(workflow, language) {
  return localizedUrl(workflow, language === "zh" ? "en" : "zh");
}

function jsonLd(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function renderHead({
  language,
  title,
  description,
  canonical,
  alternate,
  assetPrefix,
  structuredData,
}) {
  return `<!doctype html>
<html lang="${language === "zh" ? "zh-CN" : "en"}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" hreflang="en" href="${language === "zh" ? alternate : canonical}">
  <link rel="alternate" hreflang="zh-CN" href="${language === "zh" ? canonical : alternate}">
  <link rel="alternate" hreflang="x-default" href="${language === "zh" ? alternate : canonical}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${baseUrl}/${imagePath}">
  <meta property="og:image:width" content="1280">
  <meta property="og:image:height" content="640">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${baseUrl}/${imagePath}">
  <link rel="icon" href="${assetPrefix}assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="${assetPrefix}assets/style.css">
  <script type="application/ld+json">${jsonLd(structuredData)}</script>
</head>`;
}

function renderWorkflowPage(workflow, language) {
  const zh = language === "zh";
  const title = workflow[zh ? "title_zh" : "title_en"];
  const description = workflow[zh ? "description_zh" : "description_en"];
  const inputs = workflow[zh ? "inputs_zh" : "inputs_en"];
  const outputs = workflow[zh ? "outputs_zh" : "outputs_en"];
  const gates = workflow[zh ? "gates_zh" : "gates_en"];
  const canonical = localizedUrl(workflow, language);
  const alternate = alternateUrl(workflow, language);
  const assetPrefix = zh ? "../../../" : "../../";
  const homeHref = zh ? "../../../zh/" : "../../";
  const languageHref = zh
    ? `../../../workflows/${workflow.slug}/`
    : `../../zh/workflows/${workflow.slug}/`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: title,
    description,
    url: canonical,
    image: `${baseUrl}/${imagePath}`,
    inLanguage: zh ? "zh-CN" : "en",
    isPartOf: {
      "@type": "CollectionPage",
      name: "Awesome AI Product Video Workflows",
      url: zh ? `${baseUrl}/zh/` : `${baseUrl}/`,
    },
    step: workflow.steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step[zh ? "title_zh" : "title_en"],
      text: step[zh ? "body_zh" : "body_en"],
    })),
  };

  return `${renderHead({
    language,
    title: `${title} | HiAPIAI`,
    description,
    canonical,
    alternate,
    assetPrefix,
    structuredData,
  })}
<body>
  <header class="site-header">
    <a class="brand" href="${homeHref}">HiAPIAI · Product Video</a>
    <nav aria-label="${zh ? "主导航" : "Primary navigation"}">
      <a href="${homeHref}">${zh ? "全部工作流" : "All workflows"}</a>
      <a href="${languageHref}">${zh ? "English" : "简体中文"}</a>
      <a href="${repositoryUrl}">GitHub</a>
    </nav>
  </header>
  <main>
    <article class="workflow-article">
      <p class="eyebrow">${escapeHtml(workflow[zh ? "keyword_zh" : "keyword_en"])}</p>
      <h1>${escapeHtml(title)}</h1>
      <p class="lede">${escapeHtml(description)}</p>
      <div class="io-grid">
        <section>
          <h2>${zh ? "输入" : "Inputs"}</h2>
          <ul>${inputs.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        </section>
        <section>
          <h2>${zh ? "输出" : "Outputs"}</h2>
          <ul>${outputs.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        </section>
      </div>
      <section>
        <h2>${zh ? "完整工作流" : "Step-by-step workflow"}</h2>
        <ol class="steps">
          ${workflow.steps
            .map(
              (step) => `<li>
                <h3>${escapeHtml(step[zh ? "title_zh" : "title_en"])}</h3>
                <p>${escapeHtml(step[zh ? "body_zh" : "body_en"])}</p>
              </li>`,
            )
            .join("")}
        </ol>
      </section>
      <section class="gate-panel">
        <h2>${zh ? "进入下一阶段前的门禁" : "Gates before the next stage"}</h2>
        <ul>${gates.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </section>
      <section>
        <h2>${zh ? "继续执行" : "Continue the production path"}</h2>
        <p>${zh
          ? "返回工作流案例库选择下一阶段；实际付费生成、真人肖像和公开发布均需要单独确认。"
          : "Return to the workflow library for the next stage. Paid generation, real-person likeness use, and public publishing each require separate confirmation."}</p>
        <p><a class="button" href="${homeHref}">${zh ? "返回全部工作流" : "Browse all workflows"}</a></p>
      </section>
    </article>
  </main>
  <footer>
    <p>Open workflows by <a href="https://www.hiapi.ai/">HiAPI</a> · <a href="${repositoryUrl}">Source on GitHub</a></p>
  </footer>
</body>
</html>
`;
}

function renderHomePage(language) {
  const zh = language === "zh";
  const canonical = zh ? `${baseUrl}/zh/` : `${baseUrl}/`;
  const alternate = zh ? `${baseUrl}/` : `${baseUrl}/zh/`;
  const title = zh
    ? "AI 商品视频工作流：从商品图到广告视频"
    : "AI Product Video Workflows: Images to Video Ads";
  const description = zh
    ? "从商品图到电商广告视频的开放工作流案例库，覆盖商品主视觉、图生视频、UGC 口播、TikTok、Reels、平台变体与质量检查。"
    : "Open workflows and case studies for turning product images into ecommerce video ads, UGC ads, product launch videos, TikTok ads, and Reels.";
  const assetPrefix = zh ? "../" : "";
  const languageHref = zh ? "../" : "zh/";
  const workflowPrefix = zh ? "workflows/" : "workflows/";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: canonical,
    image: `${baseUrl}/${imagePath}`,
    inLanguage: zh ? "zh-CN" : "en",
    author: {
      "@type": "Organization",
      name: "HiAPIAI",
      url: "https://github.com/HiAPIAI",
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: workflowData.workflows.map((workflow) => ({
        "@type": "ListItem",
        position: workflow.order,
        name: workflow[zh ? "title_zh" : "title_en"],
        url: localizedUrl(workflow, language),
      })),
    },
  };

  return `${renderHead({
    language,
    title,
    description,
    canonical,
    alternate,
    assetPrefix,
    structuredData,
  })}
<body>
  <header class="site-header">
    <a class="brand" href="${zh ? "./" : "./"}">HiAPIAI · Product Video</a>
    <nav aria-label="${zh ? "主导航" : "Primary navigation"}">
      <a href="#workflows">${zh ? "工作流" : "Workflows"}</a>
      <a href="#projects">${zh ? "开源项目" : "Open source"}</a>
      <a href="${languageHref}">${zh ? "English" : "简体中文"}</a>
      <a href="${repositoryUrl}">GitHub</a>
    </nav>
  </header>
  <main>
    <section class="hero">
      <div>
        <p class="eyebrow">${zh ? "商品图 · 主视觉 · 广告视频 · UGC · 社媒变体" : "Product image · hero visual · video ad · UGC · social variants"}</p>
        <h1>${escapeHtml(title)}</h1>
        <p class="lede">${escapeHtml(description)}</p>
        <div class="hero-actions">
          <a class="button" href="#workflows">${zh ? "查看完整工作流" : "Explore the workflows"}</a>
          <a class="button secondary" href="${repositoryUrl}">${zh ? "在 GitHub 查看" : "View on GitHub"}</a>
        </div>
      </div>
      <img src="${assetPrefix}${imagePath}" width="1280" height="640" alt="${zh
        ? "从商品图、商业主视觉到竖屏广告视频的 AI 商品视频工作流"
        : "AI product video workflow from a product image and commercial hero visual to a vertical video ad"}">
    </section>
    <section id="workflows">
      <p class="eyebrow">${zh ? "六步生产路径" : "Six-stage production path"}</p>
      <h2>${zh ? "从商品源图到可验收广告成片" : "From source product image to reviewable video ad"}</h2>
      <div class="card-grid">
        ${workflowData.workflows
          .map(
            (workflow) => `<article class="card">
              <span>${String(workflow.order).padStart(2, "0")}</span>
              <h3><a href="${workflowPrefix}${workflow.slug}/">${escapeHtml(workflow[zh ? "title_zh" : "title_en"])}</a></h3>
              <p>${escapeHtml(workflow[zh ? "description_zh" : "description_en"])}</p>
              <a class="text-link" href="${workflowPrefix}${workflow.slug}/">${zh ? "打开工作流" : "Open workflow"} →</a>
            </article>`,
          )
          .join("")}
      </div>
    </section>
    <section class="principles">
      <div>
        <p class="eyebrow">${zh ? "为什么这不是提示词合集" : "More than a prompt list"}</p>
        <h2>${zh ? "商品事实、视觉一致性与真实质检贯穿全流程" : "Product truth, visual fidelity, and real QC across the full workflow"}</h2>
      </div>
      <ul>
        <li>${zh ? "每条商品卖点必须对应当前来源。" : "Every product claim maps to a current source."}</li>
        <li>${zh ? "商品身份锚点从源图延续到每个视频镜头。" : "Product identity anchors persist from source image to every video shot."}</li>
        <li>${zh ? "任务状态不代替成片解码、观看和音频检查。" : "Task status never replaces artifact decoding, viewing, and audio review."}</li>
        <li>${zh ? "生成、真人肖像和发布都有独立授权门。" : "Generation, likeness use, and publication have separate approval gates."}</li>
      </ul>
    </section>
    <section id="projects">
      <p class="eyebrow">${zh ? "基于当前 GitHub 调研" : "Built on current GitHub research"}</p>
      <h2>${zh ? "高星开源基础与许可证边界" : "High-signal open-source foundations and license boundaries"}</h2>
      <p>${zh
        ? `以下项目于 ${projectData.verified_at} 通过 GitHub API、README 和许可证文件核验。Star 是时间点快照，不能替代代码质量或许可证审查。`
        : `These projects were checked on ${projectData.verified_at} with GitHub API metadata, READMEs, and license files. Stars are a dated signal, not a quality or licensing guarantee.`}</p>
      <div class="project-list">
        ${projectData.projects
          .slice(0, 8)
          .map(
            (project) => `<article>
              <h3><a href="${project.url}">${escapeHtml(project.name)}</a></h3>
              <p>${escapeHtml(project[zh ? "summary_zh" : "summary_en"])}</p>
              <small>${project.stars.toLocaleString("en-US")} stars at audit · ${escapeHtml(project.license)} · ${escapeHtml(project.adoption)}</small>
            </article>`,
          )
          .join("")}
      </div>
      <p><a class="text-link" href="${repositoryUrl}/blob/main/docs/open-source-foundations.md">${zh ? "查看完整调研与采用边界" : "Read the full research and adoption boundaries"} →</a></p>
    </section>
    <section class="cta">
      <p class="eyebrow">${zh ? "给 Agent 和团队使用" : "For agents and production teams"}</p>
      <h2>${zh ? "安装为技能，或直接复制结构化模板" : "Install it as an agent skill or copy the structured templates"}</h2>
      <pre><code>npx -y github:HiAPIAI/awesome-ai-product-video-workflows -y</code></pre>
      <p>${zh ? "仓库同时提供商品 Brief、镜头卡、质检清单、真实 UGC 案例和可追溯开源调研。" : "The repository also includes a product brief, shot plan, QC checklist, a real UGC example, and traceable open-source research."}</p>
    </section>
  </main>
  <footer>
    <p>Open workflows by <a href="https://www.hiapi.ai/">HiAPI</a> · <a href="${repositoryUrl}">Source on GitHub</a></p>
  </footer>
</body>
</html>
`;
}

await mkdir(join(root, "workflows", "zh"), { recursive: true });
await mkdir(join(siteRoot, "zh"), { recursive: true });
await mkdir(join(siteRoot, "assets"), { recursive: true });

for (const workflow of workflowData.workflows) {
  const filename = `${String(workflow.order).padStart(2, "0")}-${workflow.id}.md`;
  await writeFile(
    join(root, "workflows", filename),
    renderWorkflowMarkdown(workflow, "en"),
  );
  await writeFile(
    join(root, "workflows", "zh", filename),
    renderWorkflowMarkdown(workflow, "zh"),
  );

  const englishDirectory = join(siteRoot, "workflows", workflow.slug);
  const chineseDirectory = join(siteRoot, "zh", "workflows", workflow.slug);
  await mkdir(englishDirectory, { recursive: true });
  await mkdir(chineseDirectory, { recursive: true });
  await writeFile(
    join(englishDirectory, "index.html"),
    renderWorkflowPage(workflow, "en"),
  );
  await writeFile(
    join(chineseDirectory, "index.html"),
    renderWorkflowPage(workflow, "zh"),
  );
}

await writeFile(join(siteRoot, "index.html"), renderHomePage("en"));
await writeFile(join(siteRoot, "zh", "index.html"), renderHomePage("zh"));
await writeFile(join(siteRoot, ".nojekyll"), "");

const urls = [
  `${baseUrl}/`,
  `${baseUrl}/zh/`,
  ...workflowData.workflows.flatMap((workflow) => [
    localizedUrl(workflow, "en"),
    localizedUrl(workflow, "zh"),
  ]),
];

await writeFile(
  join(siteRoot, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url}</loc>
    <lastmod>${workflowData.verified_at}</lastmod>
  </url>`,
  )
  .join("\n")}
</urlset>
`,
);

await writeFile(
  join(siteRoot, "robots.txt"),
  `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`,
);

await cp(
  join(root, "schemas", "workflow.schema.json"),
  join(siteRoot, "workflow.schema.json"),
);

console.log(
  `Built ${workflowData.workflows.length * 2} workflow docs and ${urls.length} indexable pages.`,
);
