# Development Plan

## Product position

Provide the smallest trustworthy bridge from a natural-language shot brief to Blender previs and a manual Seedance handoff. The repository should be useful without a custom GUI and complementary to Blender MCP and Blockout rather than a clone of either.

## P0 - executable foundation (completed)

- [x] Versioned shot schema with camera, proxy, world, and Seedance constraints.
- [x] Three original workflows covering action, reveal, and product cinematography.
- [x] Deterministic compiler producing a prompt, API request, manifest, and hashes.
- [x] Blender 4.5+/5.x batch renderer with strict Python failure propagation.
- [x] PNG-frame to H.264 encoding through FFmpeg.
- [x] HiAPI `/v1/tasks` submit, poll, resume, and output download lifecycle.
- [x] Endpoint-bound dry-run gate, server idempotency key, recovery journal, and validated atomic download.
- [x] Node 20/22 CI, unit tests, bilingual docs, contribution and security guidance.

## P1 - stronger review artifacts (completed)

- [x] Generate first/middle/last stills and a contact sheet.
- [x] Flag likely blank frames and abrupt luma changes for human inspection.
- [x] Add optional top-down blocking diagrams through `--blocking-svg`.
- [x] Write a verified review report and human QC checklist beside each render.
- [x] Claim and lock shot-specific output directories before any destructive cleanup.
- [x] Preserve the previous render through isolated staging and recoverable promotion.
- [x] Bind paid submission to the reviewed request/video hashes and completed human-review flag.
- [x] Bind recovery to the exact API credential and bound the idempotency window, API responses, media uploads, and all-address DNS-pinned MP4 downloads.
- [x] Record and validate evaluated per-frame camera, lens, target, and proxy transforms from Blender.

## P2 - focused authoring and handoff

- [x] Add a root skill contract that tells Codex to translate natural-language briefs directly into `shot.json` instead of requiring hand-authored JSON or a brittle keyword parser.
- [x] Make plane-first blocking, minimal proxy geometry, one dominant camera move, and two-key defaults explicit.
- [x] Generate `seedance-handoff.md` and `handoff-manifest.json` automatically after every verified render.
- [x] Make manual Seedance upload the default completion path and demote API submission to an explicitly requested, provider-verified option.
- Add a cached Blender 4.5 LTS/current 5.x headless render matrix when CI download/runtime budget is available; local release verification remains required until then.
- Add a rights-cleared start-image handoff only after the production Seedance request contract and paid preflight binding are verified end to end.

Blockout, Blender MCP, and GLB/FBX import remain external authoring options, not planned core layers. Add an adapter only when a concrete shot cannot be expressed safely with the existing primitive schema.

## P3 - community scale

- Build a generated workflow index from canonical JSON.
- Add public, rights-cleared before/after showcases.
- Add multilingual workflow pages only after the English and Chinese source stay synchronized automatically.

## Success criteria

- A new contributor can render an example in under ten minutes after dependencies are installed.
- A user can give Codex a plain-language shot brief and receive a complete manual Seedance upload package without learning the JSON schema.
- A changed request or video cannot reuse an old paid confirmation token.
- Every merged workflow is reproducible from committed text files.
- No secret, signed media URL, local absolute path, generated video, or third-party unlicensed asset enters Git.
