# `demo-v1` schema reference

The canonical machine-readable contract is [`schemas/demo-v1.schema.json`](../schemas/demo-v1.schema.json). This page explains authoring semantics without replacing the schema. Unknown properties are rejected.

## Top-level fields

| Field | Required | Meaning |
| --- | --- | --- |
| `schemaVersion` | yes | Must be exactly `demo-v1`. |
| `project` | yes | Stable project `id`, title, and optional description. |
| `canvas` | yes | Authoring width, height, fps, and total duration in frames. |
| `brand` | yes | Background, foreground, accent, and local/system font stack. |
| `assets` | yes | Project-relative images, videos, audio, and fonts. |
| `scenes` | yes | Ordered title, screen, comparison, and outro segments. |
| `audio` | no | Audio tracks that reference declared assets. |
| `outputs` | yes | Target dimensions, fps, and `.mp4` file names. |
| `hiapi` | no | Optional, constrained non-UI enhancement requests. |

## Identifiers, paths, and time

Identifiers use lowercase kebab-case and must be unique within their collection. Asset paths resolve from the directory containing `demo.yaml`. They must be relative local paths and must not contain traversal segments.

`canvas.durationFrames` is the complete timeline. Each scene uses canvas-relative `startFrame` and `durationFrames`. Nested timing is scene-relative:

- `cursor.clickFrames[]` is measured from the scene's first frame;
- `callouts[].startFrame` is measured from the scene's first frame;
- each click and complete callout must fit within the containing scene.

At 30 fps, frame 45 starts at 1.5 seconds. Avoid overlaps unless the renderer explicitly defines them; the v1 examples use contiguous scenes.

## Scenes

| Kind | Required content | Typical use |
| --- | --- | --- |
| `title` | `heading` | Literal product or feature promise. |
| `screen` | `assetId` | One deterministic UI state. |
| `comparison` | `assetId`, `secondaryAssetId` | Matched before/after states. |
| `outro` | `heading` | One product lockup or closing result. |

`fit` controls how the asset occupies the authoring canvas. `from`, `to`, `easing`, `transitionIn`, and `transitionOut` describe deterministic motion. Cursor coordinates and callout positions use canvas coordinates.

Every referenced asset ID must exist. `brand.logoAssetId`, scene asset references, audio asset references, and HiAPI `inputAssetIds` all use the IDs declared in `assets`.

## Outputs

Each output declares a unique ID, dimensions, supported fps, and a safe `.mp4` file name. An output may change aspect ratio, but reviewers must confirm the adaptation preserves the active UI and readable text. The source `demo.yaml` never points into generated output directories.

## HiAPI enhancements

`hiapi.enabled` does not authorize a paid task. Enhancement purpose is limited to `background`, `intro`, `transition`, or `outro`. Input assets must be declared, public-safe, and relevant. Product UI, text, metrics, cursors, and callouts remain deterministic local layers. See [HiAPI safety](hiapi-safety.md).

## Validation

```bash
npm run validate -- examples/ai-workflow-demo/demo.yaml
```

Validation checks the frozen JSON Schema. Repository gates additionally verify asset existence, safe paths, references, timeline bounds, catalog agreement, documentation, and public-link attribution.
