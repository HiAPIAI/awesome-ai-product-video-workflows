<!-- Generated from data/workflows.json. Run npm run build after editing the source data. -->

# Product Video Variants and Quality Control

Turn approved product-ad clips into controlled TikTok, Reels, Shorts, marketplace, and paid-social variants while preserving product truth and measurable QC.

**Primary search phrase**: `product video variants and quality control`

[简体中文](zh/06-social-variants-and-qc.md) · [Search-friendly web page](https://hiapiai.github.io/awesome-ai-product-video-workflows/workflows/product-video-variants-and-quality-control/)

## Inputs

- Approved master clips
- Platform placements
- Caption and CTA copy
- Brand and disclosure rules

## Outputs

- Platform variant matrix
- Rendered exports
- Technical QC report
- Creative test ledger

## Step-by-step workflow

### 1. Define the master truth

Freeze the approved product shots, claim ledger, offer, and disclosure. Variants may change presentation, but they must not introduce new product behavior or stronger claims.

### 2. Build a platform matrix

Record aspect ratio, duration, safe zones, caption treatment, CTA location, audio expectations, and file requirements for each placement. Verify current platform rules before publication.

### 3. Change one variable per test

Create controlled variants for hook, first frame, proof order, CTA, or duration. Avoid changing the actor, product, script, music, crop, and offer simultaneously because the result cannot explain performance.

### 4. Run technical media QC

Verify codec, dimensions, duration, frame rate, audio stream, loudness, black frames, frozen frames, captions, fast start, and complete decode. Record file hashes for approved masters.

### 5. Run creative and compliance QC

Inspect the first two seconds, product continuity, readability, spoken claims, disclosure, CTA, and offer freshness. Publication remains a separate authorized action after the files pass review.

## Gates before the next stage

- Master truth frozen
- Platform requirements current
- One variable per test
- Technical and creative QC passed

## Continue

Use the root `SKILL.md` to select the next workflow, and preserve evidence with the product brief, shot plan, and QC checklist under `templates/`.
