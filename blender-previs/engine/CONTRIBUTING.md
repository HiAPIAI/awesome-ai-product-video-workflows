# Contributing

Contributions are welcome when they improve reproducibility, safety, or the practical range of film shots.

## Add a workflow

1. Copy the closest directory under `examples/`.
2. Use a new lowercase kebab-case ID and write an original shot concept.
3. Keep one continuous 4-15 second shot. Use no more proxies than the blocking needs.
4. Describe proxy roles as final cinematic subjects, not as cubes or cylinders.
5. Add continuity locks and concrete failure exclusions.
6. Run `npm test`, then compile into `outputs/<shot-id>` and inspect the prompt and manifest.
7. Render the full previs into that same `outputs/<shot-id>` directory and inspect first, middle, and final frames, the complete video, and `seedance-handoff.md`.
8. Submit only text files. Do not commit generated media, `.blend` files, local paths, or secrets.

## Acceptance bar

A workflow must communicate something a text prompt alone commonly misses: screen direction, contact timing, multi-subject spacing, camera choreography, reveal cadence, or product motion. Cosmetic variants and large batches of near-duplicate prompts are out of scope.

The PR description must state:

- What control problem the workflow solves.
- Why the selected proxies and camera keys are sufficient.
- The exact validation and render commands used.
- The `render-report.json` and review-check result, without committing either generated file.
- Confirmation that the handoff manifest binds the prompt, video, first frame, contact sheet, and motion trace.
- Whether any external reference influenced the shot and whether its use is authorized.
- That no paid generation was performed, or the task ID and human QC result if one was explicitly approved.

## Code changes

Keep the runtime dependency-free unless a dependency removes substantial complexity and its license, maintenance, and security cost are justified. New schema features need validation tests, compiler tests, Blender 4.5+/5.x compatibility, and documentation.

Do not weaken endpoint-bound preflight, canonical POST bytes, credential-bound pending journals, the 23-hour recovery window, reviewed-artifact binding, all-address DNS pinning, no-clobber downloads, staged render promotion, output-directory ownership/locking, or task-ID checks. Do not add automatic POST retries, print environment secrets, or execute generated Python.
