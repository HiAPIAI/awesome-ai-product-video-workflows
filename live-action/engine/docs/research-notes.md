# Reference Repository Research

Research snapshot: 2026-07-27, Beijing time. Star counts are point-in-time signals, not quality scores.

This repository was designed after reviewing popular Seedance, AI filmmaking, prompt-library, and Awesome List projects. The goal was to reuse strong public product patterns without copying prompts, media, source code, or branded artwork.

## Repositories Reviewed

| Repository | Stars | Strongest pattern | How this repository adapts it |
| --- | ---: | --- | --- |
| [Emily2040/seedance-2.0](https://github.com/Emily2040/seedance-2.0) | 5,373 | Routes users by intent, separates reference roles, and treats take review as a production artifact. | Every workflow starts with directorial intent, assigns each reference a job, locks continuity, and fixes one variable per retake. |
| [dexhunter/seedance2-skill](https://github.com/dexhunter/seedance2-skill) | 2,995 | Very short path from discovery to a usable result. | The root README has a 60-second start and a zero-dependency runner instead of requiring a site or framework. |
| [songguoxs/seedance-prompt-skill](https://github.com/songguoxs/seedance-prompt-skill) | 2,442 | Native Chinese usage and low-friction prompt creation. | English and Chinese are first-class, matched versions generated from one canonical dataset. |
| [ZeroLu/awesome-seedance](https://github.com/ZeroLu/awesome-seedance) | 2,208 | Clear visual curation and broad Seedance discovery. | The index is highly scannable, but launch entries stay narrow, original, and live-action only. |
| [liangdabiao/Seedance2-Storyboard-Generator](https://github.com/liangdabiao/Seedance2-Storyboard-Generator) | 1,938 | Numbered assets, time-axis prompts, final-frame continuity, and complete example projects. | Each workflow includes an asset-role table, timed beats, and explicit continuity locks. |
| [YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) | 1,656 | Gallery-first browsing, internationalization, and category-led discovery. | The project ships a full English and Chinese index with five task-oriented categories, without adding a frontend in P0. |
| [cclank/lanshu-awesome-ai-video-kit](https://github.com/cclank/lanshu-awesome-ai-video-kit) | 322 | Data-driven content, methodology layers, a prompt browser, and validation scripts. | Canonical JSON generates all workflow pages, and offline validation prevents drift. A browser is deferred until the library needs it. |
| [jnMetaCode/ai-shortfilm-prompts](https://github.com/jnMetaCode/ai-shortfilm-prompts) | 298 | A repeatable staged prompt method, genre templates, and self-checks. | Each entry follows one production contract: intent, references, beats, sound, prompt, request, continuity, and failure fixes. |
| [geekjourneyx/awesome-ai-video-prompts](https://github.com/geekjourneyx/awesome-ai-video-prompts) | 67 | Educational taxonomy for camera, composition, sound, workflows, and quality control. | Camera and sound guidance live inside the workflow that needs them instead of becoming a separate encyclopedic manual. |
| [sindresorhus/awesome](https://github.com/sindresorhus/awesome) | 489,383 | Strict curation, contribution rules, and a bias against duplicate low-quality lists. | Contributions must be original, IP-clean, complete, and reproducible; quantity alone is not accepted. |

## Product Decisions

The market already has broad prompt galleries and large Seedance skills. This repository therefore focuses on one underserved job: reusable live-action production workflows for short films, dialogue, performance, everyday life, and documentary/UGC.

Included in P0:

- 15 original bilingual workflow packs across five live-action categories.
- Current HiAPI `POST /v1/tasks` request bodies.
- A zero-dependency Node.js runner for dry runs, submission, polling, and output URLs.
- Data-first generation, offline validation, contribution templates, and clear IP boundaries.

Deliberately deferred:

- A custom web gallery. GitHub navigation is enough until the collection becomes difficult to scan.
- Hundreds of unverified prompts. New entries need a complete workflow contract, not a headline count.
- Rehosting third-party preview media. Real outputs belong in the existing attributed HiAPIAI prompt gallery unless permission covers this repository too.
- Model comparison tables. The scope is Seedance 2.0 live-action production, not general model selection.

## Existing HiAPIAI Matrix

This repository complements, rather than duplicates, existing public projects:

- [awesome-seedance-2-0-prompts](https://github.com/HiAPIAI/awesome-seedance-2-0-prompts): attributed real-output prompt gallery.
- [hiapi-realistic-video-workflow](https://github.com/HiAPIAI/hiapi-realistic-video-workflow): installable realism prompting and Seedance execution skills.
- [hiapi-seedance-2-0-video-skill](https://github.com/HiAPIAI/hiapi-seedance-2-0-video-skill): agent-run task creation, polling, and downloads.
- This repository: human-readable director workflows and copyable API payloads.
