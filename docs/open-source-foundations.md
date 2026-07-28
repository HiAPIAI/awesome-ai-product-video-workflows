# Open-Source Foundations for AI Product Video Workflows

Verified: 2026-07-27 (America/Los_Angeles)

## Research method

The project list was built from current GitHub repository search, repository metadata, root file inventories, README sections, and license-file review. Star counts are a dated discovery signal, not proof of output quality, security, maintenance, or license suitability.

No upstream code or third-party media is copied into this repository.

## Audited repositories

| Repository | Stars at audit | License finding | Workflow value | Adoption boundary |
| --- | ---: | --- | --- | --- |
| [harry0703/MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo) | 99,596 | MIT | script, voice, captions, music, aspect ratios, assembly | workflow reference |
| [YILS-LIN/short-video-factory](https://github.com/YILS-LIN/short-video-factory) | 5,007 | AGPL-3.0 | product marketing, batch editing, cross-platform desktop workflow | method only unless AGPL is accepted |
| [SamurAIGPT/Generative-Media-Skills](https://github.com/SamurAIGPT/Generative-Media-Skills) | 3,920 | MIT | agent media primitives, product references, async recipes | workflow reference |
| [mutonby/openshorts](https://github.com/mutonby/openshorts) | 2,770 | MIT except `cloud/` under a commercial license | product research, hooks, AI actors, captions, rendering, QC | exclude `cloud/`; review files before reuse |
| [Vincentwei1021/video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft) | 2,344 | Apache-2.0 | product shot cards, motion previews, Remotion template | workflow reference; Remotion has separate licensing |
| [dramaclaw/dramaclaw](https://github.com/dramaclaw/dramaclaw) | 2,155 | Elastic License 2.0 | scripts, assets, shots, voices, async production | method only; hosted-service restriction |
| [Pluviobyte/video-production-skills](https://github.com/Pluviobyte/video-production-skills) | 574 | no root license found | motion direction, product and website videos, QA | method only |
| [xixihhhh/clipforge](https://github.com/xixihhhh/clipforge) | 413 | AGPL-3.0 | one product image to selling points, media, voice, captions, export | method only unless AGPL is accepted |
| [crisng95/flowboard](https://github.com/crisng95/flowboard) | 397 | no root license found | product-reference nodes, studio composites, variants, image-to-video | method only |
| [heygen-com/hyperframes-launches](https://github.com/heygen-com/hyperframes-launches) | 331 | no root license found | public product-launch compositions and project layouts | study only; do not copy assets or code |
| [Ethanxwang/tvc-director](https://github.com/Ethanxwang/tvc-director) | 264 | MIT | brief to product views, storyboards, keyframes, video scripts | workflow reference |
| [Anil-matcha/Open-AI-UGC](https://github.com/Anil-matcha/Open-AI-UGC) | 207 | MIT | AI actors, multi-image references, video tasks, deployment | workflow reference |

The machine-readable snapshot is in [`data/projects.json`](../data/projects.json).

## Why these projects were combined

No single upstream repository covers source rights, product truth, product-preserving hero imagery, image-to-video planning, UGC consent, platform variants, technical media QC, and search-friendly bilingual documentation.

This repository combines methods without making a code fork:

1. use current product sources and lock identity anchors
2. approve a reference-preserving hero visual
3. create short, single-purpose shot cards
4. generate and review independent clips
5. assemble a product-led or UGC ad
6. create controlled platform variants
7. verify the actual media artifact and publication requirements

## License decisions

### Suitable for direct review as code references

- MIT: MoneyPrinterTurbo, Generative Media Skills, TVC Director, Open AI UGC, and most of OpenShorts outside `cloud/`
- Apache-2.0: Video ShotCraft

Any actual code reuse still requires preservation of copyright notices, license text, and required attribution.

### Method research only by default

- AGPL-3.0: Short Video Factory and ClipForge
- Elastic License 2.0: DramaClaw
- no root license found: Flowboard, Video Production Skills, and HyperFrames Launches
- custom downstream dependency terms: Remotion

Public source visibility is not permission to copy, modify, or redistribute.

## Refresh procedure

Before changing an adoption decision:

1. query the current GitHub repository metadata
2. read the current root license file and special subdirectory licenses
3. inspect the README and the exact files to be reused
4. record the verification date
5. rerun repository validation
