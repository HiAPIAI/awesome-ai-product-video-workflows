# Content Integration Draft

This document records a local, content-only integration plan. It is not a release
plan and no GitHub repository has been renamed, archived, deleted, or pushed.

## Domain boundaries

| Domain | Local path | Upstream source | Root package ownership |
| --- | --- | --- | --- |
| Product ads | `workflows/`, `product-ads/` | `awesome-ai-product-video-workflows` | Yes |
| App demos | `app-demos/engine/` | `awesome-ai-app-demo-video-workflows` | No |
| Live action | `live-action/engine/` | `awesome-seedance-2-0-live-action-workflows` | No |
| Blender previs | `blender-previs/engine/` | `awesome-codex-blender-seedance-workflows` | No |

The root package keeps its existing `workflows/`, `schemas/`, `scripts/`, and
`tests/` contract. Each sibling engine keeps its own `package.json`, schemas, CLI,
fixtures, and tests. This avoids collisions between the root workflow schema, the
app-demo `demo-v1` schema, the live-action request catalog, and the Blender shot
schema.

## App demo gate

The app-demo README currently labels every example `spec-only`. Before presenting
the domain as production-ready, complete all of the following in the app-demo
engine:

1. Render one landscape and one portrait example with a supported FFmpeg build.
2. Commit the generated review metadata, not generated media, and link a reviewable
   artifact from the example README.
3. Keep `drawtext` as an explicit doctor check. A missing filter is an environment
   failure and must produce an actionable message before the render test starts.
4. Resolve or document the six dependency audit findings reported by the current
   `npm ci` run (3 moderate and 3 high).

The local macOS run passed typecheck and 28 of 29 unit tests. The remaining render
test failed with `No such filter: 'drawtext'`, so this integration does not claim a
successful app-demo render.

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

The local copy intentionally leaves source READMEs under each `engine/` directory so
that these rewrites can be reviewed separately from the content merge.
