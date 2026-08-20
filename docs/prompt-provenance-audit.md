# Prompt Provenance Audit

Verified 2026-08-20 against the public `main` branches of:

- [`awesome-seedance-2-0-prompts`](https://github.com/HiAPIAI/awesome-seedance-2-0-prompts)
- [`awesome-seedance-2-5-prompts`](https://github.com/HiAPIAI/awesome-seedance-2-5-prompts)

## Findings

| Source | Public material | Repository license | Redistribution boundary |
| --- | --- | --- | --- |
| Seedance 2.0 | Community X/Twitter cases, creator handles, original-post links, user-attachment videos, preview images | CC BY 4.0 for HiAPI-owned curation and structure | `NOTICE.md` excludes prompt text, example media, creator attribution, brands, and platform names unless separately licensed |
| Seedance 2.5 | Volcengine promotion-page case links, preview images, reference-material URLs, prompt-theme summaries | CC BY 4.0 for HiAPI-owned curation and structure | `NOTICE.md` excludes source prompts, videos, images, reference materials, brands, model names, and platform names unless separately licensed |

The repository-level CC BY declaration must not be interpreted as a license for
every file or linked asset. A GitHub `user-attachments` URL is a hosting location,
not proof that HiAPI owns or may redistribute the media. A public X post is a source
for attribution and verification, not automatic permission to mirror the video or
prompt text.

## Migration policy

Until a creator or rightsholder grants permission, the unified library may include:

- a stable source URL and creator / publisher attribution;
- a short factual theme summary written by HiAPI;
- model, duration, aspect-ratio, and capability metadata that can be independently verified;
- a link to the original page where the prompt or media can be reviewed;
- `source.license_status` and `media.rights_status` values of `attributed`, `first-party`,
  `unknown`, or `review-required`.

It must not include mirrored third-party videos, copied preview images, full prompt
text, reference files, or brand/IP assets unless the record has a separate permission
or a clearly applicable license. The migration script therefore remains dry-run and
keeps Seedance 2.0 community records separate from Seedance 2.5 official cases.

## Release gate

A prompt or media record is publishable only when its rights status is either
`first-party` or backed by a recorded permission. `attributed-third-party`,
`unknown`, and `review-required` records remain source-index entries and cannot be
packaged as downloadable assets.
