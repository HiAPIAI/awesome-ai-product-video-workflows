# Blender Previs

This domain is the Codex-to-Blender gray-box previs and Seedance handoff workflow.
Its source implementation is preserved under [`engine/`](engine/) from the
`feat/blender-production-details` branch of
[`awesome-codex-blender-seedance-workflows`](https://github.com/HiAPIAI/awesome-codex-blender-seedance-workflows).

## Integration status

The upstream repository main branch was still an initialization commit when this
snapshot was prepared. The useful implementation exists on a chain of unmerged
branches. This draft uses the production-details branch as the content baseline;
camera telemetry and the granite-cliff example remain listed as follow-up merges in
the migration record.

Do not run this engine from the root package. Its Blender, FFmpeg, shot schema, and
render contract are intentionally isolated until the branch chain is resolved.

## Run the isolated engine

```bash
npm --prefix blender-previs/engine ci
npm --prefix blender-previs/engine test
```

Blender 4.5+ and FFmpeg with `ffprobe`/`libx264` are required for a real render.
