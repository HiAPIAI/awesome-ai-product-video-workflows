---
name: awesome-ai-product-video-workflows
description: Use when planning, creating, reviewing, or researching AI product videos from product images, ecommerce listings, or product briefs. Routes ecommerce sellers, ad teams, and AI creators through product-image preparation, hero visuals, storyboards, image-to-video generation, UGC ads, social variants, and media QC without inventing product claims.
---

# Awesome AI Product Video Workflows

Create traceable product-video plans from real product inputs. Treat this repository as a workflow router and case library. Reuse installed image, video, voice, and editing skills for execution instead of rebuilding their transports.

## Start here

1. Read the user's product source, target audience, channel, aspect ratio, duration, language, and desired call to action.
2. Confirm whether the request is research, planning, prompt writing, generation, editing, or publication.
3. Read only the workflow files that match the selected route.
4. Build a product truth sheet before writing claims or scripts.
5. Stop before paid generation, use of a real person's likeness, or publication unless the user has authorized that action.

## Route the request

| User goal | Primary workflow |
| --- | --- |
| Clean or evaluate a product photo | `workflows/01-product-image-audit.md` |
| Turn one product image into a commercial hero visual | `workflows/02-product-image-to-hero-visual.md` |
| Animate an approved product visual into an ad | `workflows/03-hero-visual-to-product-video.md` |
| Turn a product page or brief into a social video ad | `workflows/04-product-page-to-video-ad.md` |
| Create a creator-style product demo or UGC ad | `workflows/05-ugc-product-video-ad.md` |
| Produce TikTok, Reels, Shorts, and marketplace variants | `workflows/06-social-variants-and-qc.md` |

For Chinese deliverables, use the matching files under `workflows/zh/`.

## Required product truth sheet

Record these facts before creative work:

- product name and category
- source URLs or files
- visible construction, color, material, controls, packaging, and accessories
- verified features and the evidence source for each feature
- prohibited or unverified claims
- current price, offer, availability, and region only when supplied by a current source
- brand assets and usage rights
- target audience and approved CTA

Do not convert a visual guess into a factual claim. If a detail cannot be proven from the source, label it as unknown or remove it.

## Select one production path

### Product-led cinematic ad

Use when the product itself is the hero. Lock the product reference, build one approved key visual, plan three to six shots, and animate each shot separately. Prefer product geometry, material response, lighting, and use context over abstract visual effects.

### UGC product demo

Use when trust and demonstration matter more than polish. Confirm talent rights, distinguish a synthetic actor from a real customer, keep dialogue within the requested duration, and never present generated talent as an actual purchaser or testimonial.

### Catalog-to-social variants

Use when the same product needs multiple placements. Keep the product truth sheet and visual anchors stable while changing only one controlled variable at a time: hook, crop, duration, CTA, or platform-safe text.

## Execution handoff

Use already installed skills when available:

- `hiapi-gpt-image-2-skill` for product cleanup, reference-preserving product hero images, and storyboard keyframes.
- `hiapi-video-prompt-generator-skill` for shot-specific motion, camera, timing, and audio prompts.
- `hiapi-seedance-2-0-video-skill` for image-to-video or reference-guided video tasks.
- `hiapi-seedance-2-0-ugc-ad-video-skill` for claim, consent, dialogue, cost, and UGC-specific gates.

If a required execution skill is missing, provide the plan and exact handoff package. Do not silently substitute a different paid provider or claim that media was generated.

## Human review gates

Require explicit review at these points:

1. product truth sheet approved
2. hero image or keyframes approved
3. storyboard and spoken script approved
4. cost-bearing generation approved
5. output media watched with audio
6. claims, likeness, platform disclosure, and CTA approved
7. publication separately authorized

## Product fidelity checks

Compare every generated frame against the approved product reference:

- silhouette and proportions
- logo placement and spelling
- color and material
- control count and location
- packaging and included accessories
- reflections, shadows, and contact with hands or surfaces
- continuity across shots

Reject a visually attractive result if it changes the product.

## Video QC

Do not call a video finished from a task status alone. Verify:

- the downloaded artifact opens and fully decodes
- aspect ratio, duration, frame rate, and audio match the brief
- first two seconds communicate the intended hook
- product identity remains stable
- dialogue is audible and complete
- captions match the spoken words
- CTA is readable and truthful
- no accidental watermark, platform UI, extra product, malformed hand, or unsupported claim appears

## Safety and publication boundaries

- Use a real person's likeness only with permission.
- Do not fabricate reviews, before-and-after results, discounts, scarcity, sales numbers, certifications, or product performance.
- Regulated products require current policy research and compliance review.
- Platform rules and disclosure requirements can change; verify them before publication.
- This skill may prepare a publish-ready package but never publishes by default.

## Output package

Deliver:

- source inventory
- product truth sheet and claim ledger
- selected route and rationale
- shot list or UGC script
- image and video prompts
- reference-asset map
- generation settings and cost gates
- selected outputs with task or file evidence
- QC report
- platform variants
- disclosure and publication checklist

Use the templates in `templates/` and the worked examples in `examples/`.
