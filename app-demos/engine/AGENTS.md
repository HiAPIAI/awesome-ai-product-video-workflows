# Repository Guide For Codex

This repository turns app screenshots and exported UI prototype states into deterministic product demo videos, with optional HiAPI-generated non-UI enhancements.

## Bootstrap contract

- Source specifications use `schemaVersion: demo-v1` and validate against `schemas/demo-v1.schema.json`.
- The compiler emits `schemaVersion: compiled-demo-v1` and validates against `schemas/compiled-demo-v1.schema.json`.
- Stable CLI names are `doctor`, `validate`, `compile`, `render`, `generate`, and `test`.
- Rendering consumes compiled JSON. It must not reinterpret source YAML independently.
- Critical UI pixels, text, cursors, and callouts are deterministic local layers. Generative models must not redraw them.

## Three-lane ownership

| Lane | Owned paths | Must not edit |
| --- | --- | --- |
| Core | `schemas/`, `src/contracts/`, `src/compiler/`, `src/hiapi/`, core CLI files and matching tests | render code, examples, public docs |
| Render | `src/render/`, `src/compositions/`, `src/media/`, `src/cli/render.ts` and matching tests | schemas, compiler, HiAPI, examples, public docs |
| Workflows | `data/`, `examples/`, `assets/`, `docs/`, public README and repository gates | `src/`, schemas, package manifests |

`package.json`, `package-lock.json`, `tsconfig.json`, shared exports, and CI are integration-owned after bootstrap. If a lane needs a contract or dependency change, add one focused note under `docs/contract-change-requests/` and notify the integration owner instead of editing across lanes.

## Required behavior

- Working language is Chinese; code, identifiers, schema fields, and CLI output are English.
- Node.js 20+ is required. FFmpeg and FFprobe are external runtime requirements.
- Keep source assets project-relative. Reject absolute paths, path traversal, credentials, signed URLs, and generated output committed to Git.
- Local commands are offline by default. `generate` must dry-run unless the user supplies the exact current preflight confirmation token.
- Never log or persist `HIAPI_API_KEY`. Paid submission requires explicit user approval, an idempotency key, and a pre-request pending journal.
- API completion is not creative approval. Human review of the full rendered or generated video remains mandatory.

## Verification

Run `npm test` for every change. Lane-specific implementations must add focused tests without weakening repository gates or schema validation.
