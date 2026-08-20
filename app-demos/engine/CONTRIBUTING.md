# Contributing

Thank you for improving the workflows. Read `AGENTS.md` before making changes, keep each pull request inside one ownership lane, and run `npm test` before opening it.

## Workflow contribution checklist

A workflow pull request must include:

- one `examples/<workflow-id>/demo.yaml` using `schemaVersion: demo-v1`;
- original or clearly licensed project-relative assets under that example;
- a README with expected timing, beats, and review intent;
- a `review-checklist.md` covering every declared output;
- a matching entry in `data/workflows.json`;
- a full-video human review before any status is changed from `spec-only`.

Use lowercase kebab-case IDs. Keep asset references relative to `demo.yaml`. Do not use absolute paths, path traversal, remote media, or generated-output paths. If the frozen contract cannot express a necessary behavior, add a focused note under `docs/contract-change-requests/`; do not modify another lane's Schema, source, dependency, or CI files.

## Asset rights and privacy

Only contribute assets you created or can redistribute under clearly documented terms. Record the license on each declared asset and include attribution when required. Do not contribute scraped UI, customer screenshots, private prototypes, personal data, third-party logos, unlicensed fonts, music, footage, or stock media.

Fictional product screens must not imitate a real customer's private data. Remove account names, email addresses, tokens, internal URLs, notifications, and browser extensions before capture.

## Security and generated media

Never commit:

- API keys, credentials, cookies, signed URLs, or private endpoints;
- paid-task journals, provider responses, or raw generation metadata;
- compiled plans, frame sequences, videos, or other files under `outputs/`;
- generated media that redraws critical UI, text, cursors, callouts, metrics, or comparison evidence.

HiAPI generation is optional and limited to non-critical backgrounds, intros, transitions, and outros. Paid submission requires explicit user approval, the exact current preflight confirmation, an idempotency key, and a pending journal written before the request. See `docs/hiapi-safety.md`.

## Review and verification

```bash
npm test
npm run validate -- examples/<workflow-id>/demo.yaml
```

After rendering, watch every aspect ratio from beginning to end at normal speed. Check text legibility, safe crops, click alignment, callout placement, timing, truthfulness, audio, and deterministic UI. A successful render or API task does not satisfy this review by itself.

Keep commits scoped. Explain what changed, why the workflow is useful, which outputs were reviewed, asset provenance, and any known limitation in the pull request.
