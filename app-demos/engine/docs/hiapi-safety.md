# HiAPI safety

HiAPI is optional. The default workflow is local, deterministic, and offline. Generation is appropriate only when a non-critical background, intro, transition, or outro materially improves the demo.

## Hard boundaries

- Never ask a model to redraw product UI, text, metrics, cursors, callouts, legal copy, or before/after evidence.
- Never upload customer screenshots, private prototypes, personal data, access tokens, API keys, signed URLs, internal hostnames, or unreleased confidential material.
- Never put `HIAPI_API_KEY` in `demo.yaml`, request JSON, logs, screenshots, issue reports, or committed files.
- Never treat API completion as creative or legal approval. Review the complete generated clip and final composite.
- Never commit request journals, provider responses, downloaded generations, or rendered binaries.

## Paid-request gate

`generate` must first perform a dry run and display the normalized request, estimated scope, output location, idempotency key, and a current preflight token. A paid submission is allowed only when all of the following are true:

1. The user explicitly approves that exact request and cost-bearing action.
2. The operator supplies the exact current `--confirm-preflight` token.
3. The command writes a pending journal before submitting the network request.
4. The request carries a stable idempotency key so retries do not duplicate charges.
5. Logs redact credentials and time-limited URLs.

Expired, changed, or reused confirmations must fail closed. Do not bypass preflight in scripts or CI.

## Account links

- [Register](https://www.hiapi.ai/en/register?utm_source=github&utm_medium=safety-doc&utm_campaign=awesome-ai-app-demo-video-workflows&utm_content=register)
- [Create an API key](https://www.hiapi.ai/en/dashboard/api-keys?utm_source=github&utm_medium=safety-doc&utm_campaign=awesome-ai-app-demo-video-workflows&utm_content=api-key)
- [Review Seedance 2.0](https://www.hiapi.ai/en/models/seedance-2-0?utm_source=github&utm_medium=safety-doc&utm_campaign=awesome-ai-app-demo-video-workflows&utm_content=seedance-model)
- [Read the API documentation](https://docs.hiapi.ai/?utm_source=github&utm_medium=safety-doc&utm_campaign=awesome-ai-app-demo-video-workflows&utm_content=api-docs)

These URLs use repository-specific UTM parameters so registrations, key creation, model discovery, and documentation visits can be attributed separately without embedding user identifiers.

## Incident handling

Stop the process if a credential, signed URL, private asset, or unexpected paid task appears. Preserve only redacted diagnostic metadata, rotate exposed credentials, and report the incident through the private channel described in [SECURITY.md](../SECURITY.md).
