# App Demos

This domain contains the deterministic app-screen demo compiler and renderer from
[`awesome-ai-app-demo-video-workflows`](https://github.com/HiAPIAI/awesome-ai-app-demo-video-workflows).
The source package is preserved in [`engine/`](engine/) and is intentionally not
merged into the root `package.json` or root schema namespace.

## Current status

The compiler, validation, offline render path, and paid-generation preflight are
available. All five examples remain `spec-only`: local MP4 proof renders and review
metadata exist, but the visual-quality and audio review gate is not complete. The
generated MP4 files stay out of Git.

See [`reviews/saas-feature-launch-render.json`](reviews/saas-feature-launch-render.json)
for the reproducible tool versions, output dimensions, hashes, and review status.
The complete local batch result is summarized in
[`reviews/catalog-render-summary.json`](reviews/catalog-render-summary.json).

The render path requires an FFmpeg build with the `drawtext` filter (usually
provided by `libfreetype`). Run `npm --prefix app-demos/engine run doctor -- --strict`
first. If the filter is unavailable, the real-media tests are reported as skipped
and rendering exits with an actionable environment error; TypeScript, contract,
and offline tests can still run. See [`docs/content-integration.md`](../docs/content-integration.md#app-demo-gate)
for the acceptance gate.

## Run the isolated engine

```bash
npm --prefix app-demos/engine ci
npm --prefix app-demos/engine test
```

The command names and contracts remain those documented in
[`engine/README.source.md`](engine/README.source.md).
