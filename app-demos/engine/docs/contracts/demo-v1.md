# Demo v1 contract

`demo-v1` is the human-authored YAML contract. `compiled-demo-v1` is the deterministic renderer handoff. The JSON Schemas are authoritative; TypeScript declarations provide editor support but do not replace runtime validation.

## Invariants

- IDs are lowercase kebab-case and unique within their collection.
- Asset paths are project-relative and cannot escape the source directory.
- Scene and callout timing uses integer frames. The compiler rejects out-of-range timing and invalid asset references.
- The compiler resolves defaults, calculates each scene `endFrame`, hashes source/assets, and writes no wall-clock timestamps or local absolute paths.
- Rendering reads compiled JSON only.
- HiAPI requests use `/v1/tasks` and may generate only non-critical background, intro, transition, or outro media.

## Frozen CLI

```text
doctor [--strict]
validate <demo.yaml>
compile <demo.yaml> --out-dir <directory>
render --compiled <compiled-demo-v1.json> --out-dir <directory>
generate --request <hiapi-request.json> --out-dir <directory> [--confirm-preflight <token>]
```
