# Prompt Library Migration Draft

This directory defines a possible common record format for the Seedance 2.0 and
Seedance 2.5 prompt libraries. It deliberately contains no prompt data. The two
source libraries have different provenance, media rights, and fields, so they must
remain separate partitions until those differences are reviewed.

## Proposed partitions

```text
prompt-library/
├── seedance-2.0/                 # community X posts and attributed clips
├── seedance-2.5/official-cases/  # Volcengine/ByteDance showcase material
└── seedance-2.5/templates/       # first-party reusable templates
```

All records use [`unified-prompt.schema.json`](unified-prompt.schema.json). The
`source.license_status` and `media.rights_status` fields are intentionally
conservative: migration does not imply permission to redistribute a prompt or clip.

## Dry-run examples

```bash
node prompt-library-migration/migrate-prompts.mjs \
  --source 2.0 \
  --input /path/to/awesome-seedance-2-0-prompts/data/prompts.json

node prompt-library-migration/migrate-prompts.mjs \
  --source 2.5 \
  --input /path/to/awesome-seedance-2-5-prompts/data/official-cases.json \
  --out /tmp/seedance-2.5-official-cases.json
```

Without `--out`, the script only prints a count and first normalized record. It
never combines 2.0 and 2.5 inputs. The normalized record deliberately keeps only a
short theme summary: it does not copy third-party prompt text, even when the source
JSON contains a `prompt_en` field. A later implementation still needs schema
validation, duplicate detection, media-link checks, and a human rights review before
any record can become a downloadable prompt asset.
