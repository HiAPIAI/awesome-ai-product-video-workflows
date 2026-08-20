<!-- Generated from data/workflows.json. Do not edit directly. -->

<div align="center">

<a href="https://www.hiapi.ai/en?utm_source=github&utm_medium=readme&utm_campaign=awesome-seedance-2-0-live-action-workflows"><img src="./assets/cover.webp" alt="Awesome Seedance 2.0 Live-Action Workflows" width="100%"></a>

# Awesome Seedance 2.0 Live-Action Workflows

A bilingual workflow library for AI filmmakers and short-form teams: cinematic shots, everyday life, performance, dialogue, and documentary/UGC.

[HiAPI](https://www.hiapi.ai/en?utm_source=github&utm_medium=readme&utm_campaign=awesome-seedance-2-0-live-action-workflows) | [Get API Key](https://www.hiapi.ai/en/register?utm_source=github&utm_medium=readme&utm_campaign=awesome-seedance-2-0-live-action-workflows) | [Seedance 2.0](https://www.hiapi.ai/en/models/seedance-2-0?utm_source=github&utm_medium=readme&utm_campaign=awesome-seedance-2-0-live-action-workflows) | [Docs](https://docs.hiapi.ai/?utm_source=github&utm_medium=readme&utm_campaign=awesome-seedance-2-0-live-action-workflows) | [Agent Skill](https://github.com/HiAPIAI/hiapi-seedance-2-0-video-skill)

**English** | [简体中文](README.zh-CN.md)

**15 workflows | 5 categories | T2V / I2V / R2V | HiAPI `/v1/tasks`**

</div>

> **Status:** The repository distinguishes workflow templates from verified renders. Only entries with a completed API task, file validation, and human frame review appear in the verification table below; preview media still requires publication rights.

This repository adapts the strongest navigation, asset-role, timeline, quality-gate, and contribution patterns from popular Seedance, AI short-film, and Awesome List projects while keeping every workflow original and live-action focused. See [reference repository research](docs/research-notes.md).

## Verified Render Tests

Only entries that completed a real API task, file validation, and human frame review appear here. Evidence is stored in `data/render-tests.json`; after a prompt changes, its old task becomes historical and the current revision must be tested again.

| Workflow | Mode | Tested | Revision | Review | Artifact evidence | Known deviation |
| --- | --- | --- | --- | --- | --- | --- |
| [Night Corridor Suspense](workflows/night-corridor-suspense.md) | text-to-video | 2026-07-27 | Historical | Partial pass | 8.04s · 1280×720 · 24 fps · H.264/AAC | The corridor, rear tracking, progressive darkness, stable subject, audio track, and final stop are present. The requested two separate light switch-offs occur as one near-simultaneous lighting change around 3.5-3.75 seconds. |
| [Night Corridor Suspense](workflows/night-corridor-suspense.md) | text-to-video | 2026-07-27 | Current | Partial pass | 8.04s · 1280×720 · 24 fps · H.264/AAC | The revised prompt prevents a global exposure drop: one central ceiling light switches off independently around 3.25-3.5 seconds while the side lights remain stable. A second distinct light switch-off is still not visible, so the two-step sequence remains only partially satisfied. |
| [Rain-Window Reunion](workflows/rain-window-reunion.md) | image-to-video | 2026-07-27 | Current | Partial pass | 10.04s · 1280×720 · 24 fps · H.264/AAC | The generated video preserves the rainy window, cafe layout, standing adult, and first-frame composition, then moves into the requested listener close-up without an embrace. The seated person's face was blurred in the source image, so the detailed final close-up invents facial information that cannot be verified against the reference. |
| [Night Market Walk](workflows/night-market-walk.md) | reference-to-video | 2026-07-27 | Current | Pass | 12.04s · 720×1280 · 24 fps · H.264/AAC | Using one original image reference and no motion video, the output preserves the adult's face, hair, dark raincoat, and grounded night-market lighting. It follows the requested rear follow, side-profile stall glance, and return-behind sequence while keeping the subject readable in a realistic crowd. |

---

## Start In 60 Seconds

1. Pick a workflow from a category below.
2. Preview a text-to-video request without spending credits:

```bash
npm run generate -- night-corridor-suspense --dry-run
```

3. Set `HIAPI_API_KEY`, remove `--dry-run`, and the runner creates the task and waits for the result.
4. For image or reference workflows, repeat `--media key=url` to replace media placeholders.
5. Add `--output-dir outputs` to download the result and task evidence. If polling is interrupted, resume with `--task-id TASK_ID` without submitting again.

For agent-run generation, install the [HiAPI Seedance 2.0 Video Skill](https://github.com/HiAPIAI/hiapi-seedance-2-0-video-skill).

---

## Browse By Category

| Category | Count | Best for |
| --- | ---: | --- |
| [Cinematic Shots](#cinematic-shots) | 3 | Grounded narrative shots built around motivated camera, practical light, and one visible dramatic turn. |
| [Everyday Life](#everyday-life) | 3 | Believable routines and public-space moments with natural movement, texture, and ambient sound. |
| [Dialogue Scenes](#dialogue-scenes) | 3 | Short two-person scenes that protect eyelines, performance restraint, dialogue timing, and reaction shots. |
| [Performance](#performance) | 3 | Actor, musician, and movement workflows where body rhythm and micro-expression carry the clip. |
| [Documentary / UGC](#documentary-ugc) | 3 | Creator-style and observational footage that feels captured rather than staged. |

---

## What Every Workflow Includes

- **Directorial intent:** what the scene must accomplish dramatically.
- **Reference roles:** which asset controls identity, location, motion, or sound.
- **Timed beats:** only the actions that can fit coherently in the clip.
- **Continuity locks:** identity, wardrobe, props, light direction, and geography.
- **Failure fixes:** change one variable per retake instead of rewriting everything.
- **HiAPI request:** the canonical `seedance-2.0` async `/v1/tasks` payload.

---

<a id="cinematic-shots"></a>

## Cinematic Shots

Grounded narrative shots built around motivated camera, practical light, and one visible dramatic turn.

| Workflow | Mode | Length | Ratio | Level | Outcome |
| --- | --- | ---: | --- | --- | --- |
| [Rain-Window Reunion](workflows/rain-window-reunion.md) | image-to-video | 10s | 16:9 | intermediate | A restrained reunion told through one glance, one step, and a reflection crossing the rain-streaked glass. |
| [Night Corridor Suspense](workflows/night-corridor-suspense.md) | text-to-video | 8s | 16:9 | starter | A one-person suspense beat driven by practical lights turning off behind the subject. |
| [One-Take Apartment Arrival](workflows/one-take-apartment-arrival.md) | image-to-video | 15s | 16:9 | advanced | A 15-second continuous arrival that moves from hallway isolation to a warm occupied room. |

---

<a id="everyday-life"></a>

## Everyday Life

Believable routines and public-space moments with natural movement, texture, and ambient sound.

| Workflow | Mode | Length | Ratio | Level | Outcome |
| --- | --- | ---: | --- | --- | --- |
| [Morning Kitchen Routine](workflows/morning-kitchen-routine.md) | image-to-video | 10s | 9:16 | starter | A vertical lifestyle clip built from three small continuous actions instead of a montage of unrelated gestures. |
| [After-Work Elevator](workflows/after-work-elevator.md) | text-to-video | 8s | 9:16 | starter | A quiet vertical micro-story where public composure drops only after the elevator doors close. |
| [Night Market Walk](workflows/night-market-walk.md) | reference-to-video | 12s | 9:16 | intermediate | A reference-driven vertical walk that prioritizes crowd realism, sensory detail, and a stable subject. |

---

<a id="dialogue-scenes"></a>

## Dialogue Scenes

Short two-person scenes that protect eyelines, performance restraint, dialogue timing, and reaction shots.

| Workflow | Mode | Length | Ratio | Level | Outcome |
| --- | --- | ---: | --- | --- | --- |
| [Cafe Unspoken Apology](workflows/cafe-unspoken-apology.md) | image-to-video | 12s | 16:9 | intermediate | A two-person dialogue scene where the apology lands through a failed sentence and the listener's reaction. |
| [Office Resignation Turn](workflows/office-resignation.md) | image-to-video | 12s | 9:16 | advanced | A vertical two-person micro-drama with a first-two-second hook and an unanswered final reveal. |
| [Doorstep Reconciliation](workflows/doorstep-reconciliation.md) | image-to-video | 15s | 16:9 | intermediate | A two-person doorstep scene that ends with permission to enter, not a complete emotional resolution. |

---

<a id="performance"></a>

## Performance

Actor, musician, and movement workflows where body rhythm and micro-expression carry the clip.

| Workflow | Mode | Length | Ratio | Level | Outcome |
| --- | --- | ---: | --- | --- | --- |
| [Restrained Camera Monologue](workflows/restrained-camera-monologue.md) | image-to-video | 12s | 16:9 | intermediate | A single-performer close shot where voice rhythm, breathing, and eye focus matter more than gestures. |
| [Street Dance Rehearsal](workflows/street-dance-rehearsal.md) | reference-to-video | 10s | 9:16 | advanced | A motion-reference workflow that transfers rhythm and blocking without transferring the source dancer's identity. |
| [Acoustic Room Performance](workflows/acoustic-room-performance.md) | reference-to-video | 15s | 16:9 | advanced | A single-take musician workflow that keeps hands, instrument, voice, and room acoustics coherent. |

---

<a id="documentary-ugc"></a>

## Documentary / UGC

Creator-style and observational footage that feels captured rather than staged.

| Workflow | Mode | Length | Ratio | Level | Outcome |
| --- | --- | ---: | --- | --- | --- |
| [Street Interview Answer](workflows/street-interview-answer.md) | text-to-video | 10s | 9:16 | starter | A vertical creator-style answer with a believable pause, one concise sentence, and ambient interruptions. |
| [Kitchen Product Testimonial](workflows/kitchen-product-testimonial.md) | image-to-video | 10s | 9:16 | starter | A low-polish UGC testimonial where the product is handled naturally and the claim stays specific. |
| [Workshop Day-In-The-Life](workflows/workshop-day-in-life.md) | text-to-video | 15s | 16:9 | intermediate | An observational mini-sequence that moves from hands to face to finished object without glossy commercial coverage. |

---

## Contributing

Original, IP-clean, reusable live-action workflows are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) and run `npm test`.

## License

[CC BY 4.0](LICENSE). See [NOTICE.md](NOTICE.md) for original-asset and external-reference boundaries.
