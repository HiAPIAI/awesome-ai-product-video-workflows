# AI Product Video Workflows: Product Images to Video Ads

![AI product video workflow from a product image and commercial hero visual to a vertical ecommerce video ad](assets/ai-product-video-workflows-social-preview.jpg)

Open workflows and worked cases for turning **product images into AI product videos, ecommerce video ads, UGC ads, product launch videos, TikTok ads, and Instagram Reels**. Built for ecommerce sellers, advertising teams, and AI creators who need product hero visuals, image-to-video production, social media variants, and verifiable quality control.

[Search-friendly website](https://hiapiai.github.io/awesome-ai-product-video-workflows/) · [简体中文](README.zh-CN.md) · [Install as an agent skill](#install-as-an-agent-skill)

[![Tests](https://github.com/HiAPIAI/awesome-ai-product-video-workflows/actions/workflows/test.yml/badge.svg)](https://github.com/HiAPIAI/awesome-ai-product-video-workflows/actions/workflows/test.yml)
[![Pages](https://github.com/HiAPIAI/awesome-ai-product-video-workflows/actions/workflows/pages.yml/badge.svg)](https://hiapiai.github.io/awesome-ai-product-video-workflows/)
[![License: MIT](https://img.shields.io/badge/License-MIT-121417.svg)](LICENSE)

## What this repository provides

This is a workflow library and installable agent skill, not another one-click video engine. It connects the strongest reusable ideas from current open-source projects with a source-grounded production path:

`product source → image audit → commercial hero visual → storyboard → video clips → UGC or product ad → platform variants → media QC`

You get:

- six bilingual, search-focused product-video workflows
- a machine-readable product brief, shot plan, and QC checklist
- a dated audit of high-signal GitHub repositories and license boundaries
- a real authenticated UGC video-ad case with artifact and QC evidence
- an installable `SKILL.md` for Codex and Claude Code
- a static bilingual website with canonical URLs, hreflang, structured data, sitemap, robots.txt, Open Graph metadata, and descriptive image alt text

## Product image to video workflows

| Stage | Workflow | Best for |
| ---: | --- | --- |
| 1 | [Product Image Audit for AI Video](workflows/01-product-image-audit.md) | source rights, product truth, native image quality, and identity anchors |
| 2 | [Product Image to Commercial Hero Visual](workflows/02-product-image-to-hero-visual.md) | ecommerce hero images, ad keyframes, and product photography |
| 3 | [Hero Image to AI Product Video Ad](workflows/03-hero-visual-to-product-video.md) | image-to-video product shots and cinematic product ads |
| 4 | [Product Page to Social Video Ad](workflows/04-product-page-to-video-ad.md) | ecommerce listings, product claims, hooks, storyboards, and CTAs |
| 5 | [UGC Product Video Ad Workflow](workflows/05-ugc-product-video-ad.md) | creator demos, talking-head ads, TikTok ads, and Reels |
| 6 | [Product Video Variants and Quality Control](workflows/06-social-variants-and-qc.md) | platform crops, hook tests, captions, exports, and media QC |

Chinese editions are under [`workflows/zh/`](workflows/zh/).

## Worked product-video cases

### Real UGC clip-light ad

[![Synthetic UGC creator demonstrating a fictional white clip light](https://raw.githubusercontent.com/HiAPIAI/hiapi-seedance-2-0-ugc-ad-video-skill/main/assets/examples/ugc-clip-light-e2e-preview.gif)](https://github.com/HiAPIAI/hiapi-seedance-2-0-ugc-ad-video-skill/blob/main/assets/examples/ugc-clip-light-e2e.mp4)

A synthetic adult creator demonstrates a fictional unbranded clip light in a 10-second vertical Seedance 2.0 video with native English dialogue. The case includes the source-grounded brief, first-frame route, runtime fixes, downloaded artifact, transcript, and an explicit limitation: visible brightness change is not enough to prove three discrete brightness levels.

[Read the case and evidence](examples/clip-light-ugc-ad/README.md)

### Cinematic product launch

A reusable recipe for converting one approved product image into multi-view references, a commercial hero frame, three shot cards, short image-to-video clips, and a product-launch rough cut.

[Open the cinematic product-launch recipe](examples/cinematic-product-launch/README.md)

### Catalog to social variants

A structured example for turning a current ecommerce listing into one master truth sheet and controlled TikTok, Reels, Shorts, and marketplace video variants.

[Open the catalog-to-social recipe](examples/catalog-to-social-variants/README.md)

## High-signal open-source foundations

This repository does not start from a blank slate. The current research combines:

- [MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo) for the script, voice, subtitle, music, aspect-ratio, and assembly pipeline
- [Short Video Factory](https://github.com/YILS-LIN/short-video-factory) for product-marketing and batch short-video workflows
- [Video ShotCraft](https://github.com/Vincentwei1021/video-shotcraft) for product shot recipes, motion previews, and production templates
- [Generative Media Skills](https://github.com/SamurAIGPT/Generative-Media-Skills) for agent-ready image, video, and audio recipe patterns
- [OpenShorts](https://github.com/mutonby/openshorts) for product research, hooks, AI actors, captions, rendering, and QC
- [TVC Director](https://github.com/Ethanxwang/tvc-director) for product references, storyboards, keyframes, and video scripts
- [Flowboard](https://github.com/crisng95/flowboard) for reusable product-reference nodes and image-to-video composition
- [Open AI UGC](https://github.com/Anil-matcha/Open-AI-UGC) for self-hosted creator-style video ads

Exact star snapshots, license files, and code-reuse boundaries are documented in [Open-source foundations](docs/open-source-foundations.md). AGPL, Elastic, custom-license, and no-license repositories are method references only unless a downstream project deliberately accepts their terms.

## Install as an agent skill

```bash
npx -y github:HiAPIAI/awesome-ai-product-video-workflows -y
```

Choose a specific agent or skills directory:

```bash
npx -y github:HiAPIAI/awesome-ai-product-video-workflows --codex
npx -y github:HiAPIAI/awesome-ai-product-video-workflows --claude
npx -y github:HiAPIAI/awesome-ai-product-video-workflows --target=/path/to/skills
```

Then ask your agent:

```text
Use $awesome-ai-product-video-workflows to turn this product image and current product page into a 10-second vertical video-ad plan. Build the product truth sheet first and stop before paid generation.
```

The workflow library can hand execution to these existing HiAPI skills when installed:

- [HiAPI GPT Image 2 Skill](https://github.com/HiAPIAI/hiapi-gpt-image-2-skill)
- [HiAPI Video Prompt Generator Skill](https://github.com/HiAPIAI/hiapi-video-prompt-generator-skill)
- [HiAPI Seedance 2.0 Video Skill](https://github.com/HiAPIAI/hiapi-seedance-2-0-video-skill)
- [HiAPI Seedance 2.0 UGC Ad Video Skill](https://github.com/HiAPIAI/hiapi-seedance-2-0-ugc-ad-video-skill)

## Copy the production templates

```bash
cp templates/product-brief.example.json /absolute/path/to/product-brief.json
cp templates/shot-plan.example.json /absolute/path/to/shot-01.json
cp templates/qc-checklist.md /absolute/path/to/product-video-qc.md
```

Replace all demo values before production. The example deliberately contains `example.com` and unconfirmed rights flags.

## SEO architecture

The GitHub repository and companion website target one clear topic cluster:

- AI product video workflows
- product image to video ad
- ecommerce video ad creation
- UGC product video ads
- product photography to commercial video
- TikTok, Reels, Shorts, and marketplace video variants

Each workflow has one English URL, one fully localized Chinese URL, a descriptive title and H1, unique meta description, semantic HTML, canonical and hreflang links, structured data, and internal links from the collection page. See [SEO strategy and validation](docs/seo-strategy.md).

## Truth and safety boundaries

- Do not invent product features, prices, discounts, reviews, results, certifications, or scarcity.
- Use real-person likenesses only with permission.
- Clearly record synthetic actors and follow current platform disclosure rules.
- Verify regulated-category policy before creating or publishing an ad.
- Paid generation, high-cost settings, and publication require separate approval.
- A successful API task is not a finished video. Download, decode, watch, listen, and inspect the artifact.

## Validate the repository

```bash
npm run check
```

The checks rebuild bilingual Markdown and static pages, validate data and SEO metadata, scan local links, verify the social-preview image contract, and run Node tests.

## Repository structure

```text
.
├── SKILL.md
├── README.md
├── README.zh-CN.md
├── agents/openai.yaml
├── data/
│   ├── projects.json
│   └── workflows.json
├── docs/
│   ├── open-source-foundations.md
│   └── seo-strategy.md
├── examples/
├── schemas/workflow.schema.json
├── scripts/
│   ├── build-content.mjs
│   ├── install.mjs
│   └── validate.mjs
├── site/
├── templates/
└── workflows/
```

## Contributing

Corrections, stronger open workflows, and source-backed cases are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md). Do not submit affiliate links, scraped commercial copy, unverified claims, or third-party media without rights.

## License

Original repository content and code are available under the [MIT License](LICENSE). Linked projects retain their own licenses and trademarks.
