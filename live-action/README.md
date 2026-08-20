# Live-Action Workflows

This domain preserves the 15 bilingual Seedance 2.0 live-action workflows from
[`awesome-seedance-2-0-live-action-workflows`](https://github.com/HiAPIAI/awesome-seedance-2-0-live-action-workflows).
The source catalog, runner, validation script, and render-test evidence live in
[`engine/`](engine/).

## What is included

- Five categories: cinematic, everyday life, dialogue, performance, and documentary/UGC.
- A dry-run-first CLI with task recovery and media validation.
- Three current verified render records; the remaining entries are reusable templates.

## Run the isolated engine

```bash
npm --prefix live-action/engine ci
npm --prefix live-action/engine test
npm --prefix live-action/engine run generate -- night-corridor-suspense --dry-run
```

HiAPI is an optional executor for this domain. The workflow content and request
shape should remain usable as reference material without an account.
