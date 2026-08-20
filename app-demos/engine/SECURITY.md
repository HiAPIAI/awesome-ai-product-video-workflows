# Security Policy

## Reporting

Report credential exposure, unsafe paid submission, path traversal, private-media disclosure, or idempotency failures privately to the repository maintainers through GitHub's private security reporting feature. Do not open a public issue containing secrets, signed URLs, task journals, private screenshots, or exploitable details.

Include the affected version or commit, reproduction steps using redacted fixtures, expected behavior, and impact. Do not attach a real API key or customer asset.

## Security boundaries

- Local validation, compilation, and rendering must not require network access.
- Asset paths must remain inside the example directory and must reject absolute paths and traversal.
- `HIAPI_API_KEY` is read from the process environment and must never be logged or persisted.
- `generate` is a dry run unless the user supplies the exact current preflight token.
- A paid submission requires explicit approval, a stable idempotency key, and a pending journal written before the request.
- Logs and errors must redact credentials and time-limited URLs.
- Product UI, text, metrics, cursors, and callouts must remain deterministic local layers.

If exposure occurs, stop the task, rotate the credential, invalidate accessible signed URLs, remove public artifacts where possible, and report only redacted metadata. API completion does not approve generated media; review the complete output for private data, unexpected content, and license risk before use.
