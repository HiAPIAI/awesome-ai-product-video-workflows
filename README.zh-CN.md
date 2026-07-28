# AI 商品视频工作流：从商品图到广告视频

![从商品图、商业主视觉到竖屏电商广告视频的 AI 商品视频工作流](assets/ai-product-video-workflows-social-preview.jpg)

面向电商卖家、广告团队和 AI 创作者的开放案例库：把**商品图转成 AI 商品视频、电商广告、UGC 口播、产品发布视频、TikTok 广告和 Reels 短视频**。覆盖商品主视觉、图生视频、社媒变体和可验证的成片质检。

[搜索友好网页](https://hiapiai.github.io/awesome-ai-product-video-workflows/zh/) · [English](README.md) · [安装为 Agent Skill](#安装为-agent-skill)

[![Tests](https://github.com/HiAPIAI/awesome-ai-product-video-workflows/actions/workflows/test.yml/badge.svg)](https://github.com/HiAPIAI/awesome-ai-product-video-workflows/actions/workflows/test.yml)
[![Pages](https://github.com/HiAPIAI/awesome-ai-product-video-workflows/actions/workflows/pages.yml/badge.svg)](https://hiapiai.github.io/awesome-ai-product-video-workflows/zh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-121417.svg)](LICENSE)

## 这个仓库提供什么

它是可安装的 Agent 技能与完整工作流案例库，不是另一个“一键出片”引擎。仓库把当前高质量开源项目中可复用的方法连接成一条有事实依据的生产链路：

`商品来源 → 源图审计 → 商业主视觉 → 分镜 → 视频片段 → UGC 或产品广告 → 平台变体 → 成片质检`

你会获得：

- 六条双语、针对搜索意图设计的商品视频工作流
- 机器可读的商品 Brief、镜头卡与质检清单
- 带时间戳的 GitHub 高信号项目和许可证边界调研
- 一个有真实 task、成片、转写和 QC 证据的 UGC 广告案例
- 可供 Codex 与 Claude Code 安装的 `SKILL.md`
- 带 canonical、hreflang、结构化数据、sitemap、robots.txt、Open Graph 和图片 alt 的双语静态网站

## 从商品图到广告视频的完整流程

| 阶段 | 工作流 | 适合场景 |
| ---: | --- | --- |
| 1 | [AI 商品视频前的商品图审计](workflows/zh/01-product-image-audit.md) | 来源授权、商品事实、原生画质和身份锚点 |
| 2 | [商品图到商业主视觉](workflows/zh/02-product-image-to-hero-visual.md) | 电商主图、广告关键帧和商品摄影 |
| 3 | [商品主视觉到 AI 产品广告视频](workflows/zh/03-hero-visual-to-product-video.md) | 图生视频商品镜头和电影感产品广告 |
| 4 | [商品页到社媒视频广告](workflows/zh/04-product-page-to-video-ad.md) | 电商详情页、卖点、Hook、分镜和 CTA |
| 5 | [UGC 商品视频广告工作流](workflows/zh/05-ugc-product-video-ad.md) | 真人试用、口播、TikTok 广告和 Reels |
| 6 | [商品视频多平台变体与质检](workflows/zh/06-social-variants-and-qc.md) | 平台裁切、Hook 测试、字幕、导出和成片 QC |

英文版本见 [`workflows/`](workflows/)。

## 已整理的商品视频案例

### 真实夹灯 UGC 广告

[![合成 UGC 创作者演示虚构白色夹灯](https://raw.githubusercontent.com/HiAPIAI/hiapi-seedance-2-0-ugc-ad-video-skill/main/assets/examples/ugc-clip-light-e2e-preview.gif)](https://github.com/HiAPIAI/hiapi-seedance-2-0-ugc-ad-video-skill/blob/main/assets/examples/ugc-clip-light-e2e.mp4)

合成成人创作者演示虚构无品牌夹灯，生成 10 秒 Seedance 2.0 竖屏视频并带原生英语口播。案例保留商品事实 Brief、首帧路线、运行时修复、真实下载成片、转写和限制说明：画面能看到亮度变化，但不足以证明三个离散亮度档位。

[查看案例与证据](examples/clip-light-ugc-ad/README.md)

### 电影感商品发布视频

从一张批准的商品图出发，生成多视图参考、商业主视觉、三张镜头卡、短图生视频片段和产品发布粗剪的可复用配方。

[打开电影感商品发布配方](examples/cinematic-product-launch/README.md)

### 商品目录到社媒多版本

把当前电商商品页转成一份母版事实卡，再制作 TikTok、Reels、Shorts 和商城视频变体的结构化案例。

[打开商品目录到社媒变体案例](examples/catalog-to-social-variants/README.md)

## 高信号开源基础

本仓库没有从零开始，当前调研组合了：

- [MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo)：脚本、配音、字幕、音乐、横竖版和视频合成
- [Short Video Factory](https://github.com/YILS-LIN/short-video-factory)：商品营销与批量短视频工作流
- [Video ShotCraft](https://github.com/Vincentwei1021/video-shotcraft)：产品镜头卡、动效预览和制作模板
- [Generative Media Skills](https://github.com/SamurAIGPT/Generative-Media-Skills)：Agent 化图像、视频和音频配方
- [OpenShorts](https://github.com/mutonby/openshorts)：商品调研、Hook、AI 演员、字幕、渲染和质检
- [TVC Director](https://github.com/Ethanxwang/tvc-director)：商品多视图、分镜、关键帧和视频脚本
- [Flowboard](https://github.com/crisng95/flowboard)：可复用商品参考节点与图生视频画布
- [Open AI UGC](https://github.com/Anil-matcha/Open-AI-UGC)：自托管创作者式视频广告

精确 Star 快照、许可证文件和代码采用边界见 [开源基础调研](docs/open-source-foundations.md)。AGPL、Elastic、自定义许可证或无许可证项目默认只用于方法研究，除非下游项目明确接受对应条款。

## 安装为 Agent Skill

```bash
npx -y github:HiAPIAI/awesome-ai-product-video-workflows -y
```

指定 Agent 或技能目录：

```bash
npx -y github:HiAPIAI/awesome-ai-product-video-workflows --codex
npx -y github:HiAPIAI/awesome-ai-product-video-workflows --claude
npx -y github:HiAPIAI/awesome-ai-product-video-workflows --target=/path/to/skills
```

安装后可以这样提问：

```text
使用 $awesome-ai-product-video-workflows，把这张商品图和当前商品页做成 10 秒竖屏广告视频方案。先建立商品事实卡，停在付费生成之前。
```

如果已经安装，工作流会把执行交给：

- [HiAPI GPT Image 2 Skill](https://github.com/HiAPIAI/hiapi-gpt-image-2-skill)
- [HiAPI Video Prompt Generator Skill](https://github.com/HiAPIAI/hiapi-video-prompt-generator-skill)
- [HiAPI Seedance 2.0 Video Skill](https://github.com/HiAPIAI/hiapi-seedance-2-0-video-skill)
- [HiAPI Seedance 2.0 UGC Ad Video Skill](https://github.com/HiAPIAI/hiapi-seedance-2-0-ugc-ad-video-skill)

## 复制生产模板

```bash
cp templates/product-brief.example.json /absolute/path/to/product-brief.json
cp templates/shot-plan.example.json /absolute/path/to/shot-01.json
cp templates/qc-checklist.md /absolute/path/to/product-video-qc.md
```

生产前必须替换全部演示字段。示例故意保留 `example.com` 和未确认授权标记。

## SEO 架构

GitHub 仓库和配套网页围绕一个清晰主题集群：

- AI 商品视频工作流
- 商品图生成广告视频
- 电商视频广告制作
- UGC 商品视频广告
- 商品摄影到商业视频
- TikTok、Reels、Shorts 和商城视频变体

每条工作流都有独立英文 URL、完整本地化中文 URL、描述性标题与 H1、唯一 meta description、语义 HTML、canonical、hreflang、结构化数据和首页内部链接。详细实现见 [SEO 策略与验收](docs/seo-strategy.md)。

## 真实性与安全边界

- 不编造商品功能、价格、折扣、评价、结果、认证或稀缺性。
- 只有取得授权时才使用真人肖像。
- 明确记录合成人物，并在发布前核对当前平台披露要求。
- 受监管品类必须先核对当前政策。
- 付费生成、高成本参数和公开发布分别需要确认。
- API task 成功不等于视频完成；必须下载、解码、观看、听音频并检查成片。

## 验证仓库

```bash
npm run check
```

检查会重新生成双语 Markdown 和静态网页，验证数据与 SEO 元数据、扫描本地链接、检查社交预览图规格并运行 Node 测试。

## 贡献

欢迎提交更准确的项目说明、更强的开放工作流和有来源证据的真实案例。请先读 [CONTRIBUTING.md](CONTRIBUTING.md)。不要提交联盟链接、抓取的商业文案、未经核实的卖点或无授权第三方媒体。

## 许可证

本仓库原创内容与代码使用 [MIT License](LICENSE)。所链接项目保留各自许可证与商标。
