# Content Integration Draft

This document records the content integration and repository lifecycle. The root
repository is now the canonical `awesome-ai-video-workflows` name; the old name
remains a GitHub redirect for existing installs.

## Domain boundaries

| Domain | Local path | Upstream source | Root package ownership |
| --- | --- | --- | --- |
| Product ads | `workflows/`, `product-ads/` | `awesome-ai-video-workflows` (renamed from `awesome-ai-product-video-workflows`) | Yes |
| App demos | `app-demos/engine/` | `awesome-ai-app-demo-video-workflows` | No |
| Live action | `live-action/engine/` | `awesome-seedance-2-0-live-action-workflows` | No |
| Blender previs | `blender-previs/engine/` | `awesome-codex-blender-seedance-workflows` | No |

The root package keeps its existing `workflows/`, `schemas/`, `scripts/`, and
`tests/` contract. Each sibling engine keeps its own `package.json`, schemas, CLI,
fixtures, and tests. This avoids collisions between the root workflow schema, the
app-demo `demo-v1` schema, the live-action request catalog, and the Blender shot
schema.

## App demo gate

The app-demo renderer and contracts are integrated, but every catalog entry remains
`spec-only`. The local MP4s are deterministic proof renders built from fictional SVG
screens; they are not publication-quality flagship media. The flagship app-demo
case is intentionally deferred until its product source, composition, interaction
rhythm, and audio mix are redesigned together.

Before presenting the domain as production-ready, complete all of the following in
the app-demo engine:

1. Render one landscape and one portrait example with a supported FFmpeg build for
   each remaining catalog entry.
2. Commit the generated review metadata, not generated media, and link a reviewable
   artifact from the example README.
3. Keep `drawtext` as an explicit doctor check. A missing filter is an environment
   failure and must produce an actionable message before the render test starts.
4. Resolve or document the four remaining dependency audit findings reported by
   the current `npm ci` run. `ajv`, `yaml`, `fast-uri`, and `nanoid` are upgraded;
   the remaining advisories come from the Motion Canvas Vite 5 toolchain and affect
   its development server. They must be revisited when Motion Canvas publishes a
   Vite 6+ compatible plugin.

The local macOS run uses Homebrew `ffmpeg-full` 9.0.1 with `libfreetype`. All five
catalog examples render locally, including the required landscape and portrait
outputs; automated decode and review-frame checks pass. This is engineering evidence
only. The visual-quality review found oversized title cards, low-information static
screen holds, and five silent outputs, so no catalog entry is promoted to `verified`.

## Deferred flagship work

The flagship app-demo case is a separate workstream and is intentionally not a
prerequisite for finishing the rest of this integration. Do not spend paid API
credits or publish generated MP4s while it is deferred. The next flagship review
must start from one approved, public product flow and pass the following gates:

1. Real or explicitly fictional product source is named, licensed, and linked.
2. The first second shows a useful product result rather than a title-only card.
3. Screen states change because of an interaction; screenshots are not merely
   cross-faded.
4. Audio policy is explicit: a deliberate silent export or a measured BGM/SFX mix.
5. Full-speed human review passes at the intended landscape or portrait display size.

The app-demo CLI and repository gates do not start a Vite development server during
normal validation or rendering. The residual advisories are tracked as a toolchain
upgrade item, rather than being hidden by suppressing audit output.

## Blender branch gate

The content snapshot uses `feat/blender-production-details`, which includes the
natural-language handoff and four shot examples. The camera telemetry branch and
granite-cliff branch are not linear descendants of that baseline. A local merge
produced a conflict in `scripts/blender/render_previs.py` plus changes to the shot
schema and spec compiler. Resolve those as a dedicated integration change before
publishing the additional camera-track contract.

## URL and package migration

Before any upstream rename or archive:

- update every `package.json` name, binary, homepage, schema `$id`, `llms.txt`, and
  CI badge that embeds the old repository slug;
- preserve the old install command in a compatibility README for at least one
  release cycle;
- update internal links, raw GitHub URLs, issue templates, and UTM campaign names;
- keep model/provider links optional in the first screen of domain READMEs;
- run each engine's own tests from its subdirectory and the root `npm run check`.

The root installer is part of the compatibility surface. Its upgrade path stages a
fresh checkout, preserves an existing `.env`, and restores the previous directory
if cloning or replacement fails. `tests/install.test.mjs` covers both the successful
upgrade and failed-download rollback paths.

The local copy intentionally leaves source READMEs under each `engine/` directory so
that these rewrites can be reviewed separately from the content merge.

Prompt provenance findings are recorded in
[`docs/prompt-provenance-audit.md`](prompt-provenance-audit.md). The current source
licenses support attribution-preserving indexing, not blanket redistribution of
third-party prompts or media.
