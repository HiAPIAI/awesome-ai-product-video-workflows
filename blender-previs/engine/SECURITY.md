# Security Policy

## Report privately

Use the repository's GitHub private vulnerability reporting feature. Do not open a public issue for API-key exposure, command execution, path traversal, unsafe Blender scripting, or paid-task duplication.

## Supported version

Security fixes target the latest `main` branch until tagged releases begin.

## Credential handling

The CLI reads `HIAPI_API_KEY` only from the process environment and never intentionally prints it. It does not automatically load `.env`, and a dry run does not read the key. Generated requests, videos, Blender files, submission journals, task responses, output metadata, review images, and signed URLs are ignored by Git both under `outputs/` and in custom output directories. Treat every generated output directory as potentially sensitive even when it contains no bearer token.

If a key enters Git history or a public log, revoke it immediately in the HiAPI dashboard before attempting history cleanup.

## Execution boundary

The Blender renderer consumes a validated schema with a white-list of primitive types and numeric transforms. Pull requests that add arbitrary `exec`, `eval`, shell interpolation, generated Python, or remote script loading will not be accepted.

## Paid-task and network boundary

- The dry-run token binds the normalized API endpoint, request payload, and stable local-video hash. Confirmed submission sends that same 64-character token as `Idempotency-Key`.
- A pending journal with an immutable first-attempt time and a salted one-way binding to the exact API key is written before the paid POST. It does not contain the key. If the response is lost, do not delete it, change credentials, or change inputs; repeat only the identical confirmed command within 23 hours. After that safe window, automatic resubmission is blocked until task history and billing are reconciled.
- `HIAPI_BASE_URL` must be a clean HTTPS origin. Confirmed requests trust official HiAPI hosts by default; any other host requires the explicit `--allow-custom-base-url` flag after endpoint review. Plain HTTP localhost is allowed only for local tests and does not relax production download rules.
- Task IDs are restricted before they become filenames. Output downloads require MP4 over HTTPS, reject credential-bearing URLs, validate and pin all DNS answers on every redirect, reject private and non-public addresses, enforce one end-to-end deadline plus response/size limits, validate the response type and container signature, and publish without overwriting an existing file. A localhost API test may return HTTP localhost media only when the already-validated API base is itself localhost.

Automatic checks reduce accidental misuse; they do not make an arbitrary custom API host or generated video trustworthy. Review both before opting in or publishing media.
