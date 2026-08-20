# Setup

## Requirements

- Node.js 20.18 or newer
- npm with lockfile support
- FFmpeg and FFprobe available on `PATH`
- Git for cloning and contribution checks

No HiAPI account or network access is required for validation, compilation, or deterministic rendering.

## Install and diagnose

```bash
git clone https://github.com/HiAPIAI/awesome-ai-app-demo-video-workflows.git
cd awesome-ai-app-demo-video-workflows
npm ci
npm run doctor -- --strict
```

`doctor` checks the local runtime. Strict mode is recommended in CI and before rendering. During the multi-branch v1 integration, a command may still expose only its frozen help contract until its implementation branch is merged.

## Validate, compile, and render

```bash
npm run validate -- examples/mobile-onboarding/demo.yaml
npm run compile -- examples/mobile-onboarding/demo.yaml --out-dir outputs/mobile-onboarding
npm run render -- --compiled outputs/mobile-onboarding/compiled-demo-v1.json --out-dir outputs/mobile-onboarding
```

Use a separate output directory per workflow. `outputs/` is ignored because compiled plans, frames, videos, request previews, and journals are generated artifacts. Do not commit them.

## Optional HiAPI setup

Deterministic demos do not need HiAPI. For an optional non-UI enhancement:

1. [Register for HiAPI](https://www.hiapi.ai/en/register?utm_source=github&utm_medium=setup-doc&utm_campaign=awesome-ai-app-demo-video-workflows&utm_content=register).
2. [Create an API key](https://www.hiapi.ai/en/dashboard/api-keys?utm_source=github&utm_medium=setup-doc&utm_campaign=awesome-ai-app-demo-video-workflows&utm_content=api-key).
3. Select a suitable model, such as [Seedance 2.0](https://www.hiapi.ai/en/models/seedance-2-0?utm_source=github&utm_medium=setup-doc&utm_campaign=awesome-ai-app-demo-video-workflows&utm_content=seedance-model).
4. Set `HIAPI_API_KEY` in the process environment. Never place it in YAML, JSON, shell history, screenshots, or committed files.
5. Read [HiAPI safety](hiapi-safety.md) before running `generate`.

The first invocation must be a dry run:

```bash
npm run generate -- --request path/to/hiapi-request.json --out-dir outputs/hiapi-preview
```

A paid submission requires explicit approval and the exact current `--confirm-preflight` token printed by that dry run. Never reuse a token from another request.

## Verification

```bash
npm test
```

After rendering, watch every output from start to finish at normal speed and complete the example's `review-checklist.md`. A successful command or API task is not creative approval.
