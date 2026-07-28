<!-- Generated from data/workflows.json. Run npm run build after editing the source data. -->

# UGC Product Video Ad Workflow

Create a creator-style product demo with verified claims, approved dialogue, talent or synthetic-actor disclosure, image-to-video generation, native audio, and paid-social QC.

**Primary search phrase**: `UGC product video ad workflow`

[简体中文](zh/05-ugc-product-video-ad.md) · [Back to repository](../README.md)

## Inputs

- Product truth sheet
- Creator or synthetic-actor reference
- Approved spoken script
- Platform disclosure requirements

## Outputs

- UGC brief
- First frame or reference pack
- Vertical video clip
- Consent and QC record

## Step-by-step workflow

### 1. Choose the creator relationship

Identify whether the person is the seller, a hired creator, a consenting customer, or a synthetic actor. Never describe a generated person as a real purchaser or present invented personal experience.

### 2. Write demonstration-first dialogue

Use natural spoken language that can be delivered in the allotted seconds. Pair each sentence with a visible action and remove unverified outcomes, exaggerated praise, or unsupported comparisons.

### 3. Prepare a believable first frame

Keep the product large enough to verify and give the creator a plausible grip. Use a real environment, phone-camera framing, and clean interaction geometry instead of a polished studio pose that cannot animate.

### 4. Generate a single continuous demo

For a first proof, use one creator, one product, one location, and one action chain. Print or record the task ID immediately and resume the same task after transient polling failures.

### 5. Review truth, audio, and disclosure

Watch the entire clip with sound. Confirm the spoken script, product behavior, hand contact, CTA, synthetic-media disclosure, and platform-specific ad requirements before treating it as publishable.

## Gates before the next stage

- Talent status explicit
- Consent or synthetic disclosure recorded
- Dialogue visible in the action
- Full audio review completed

## Continue

Use the root `SKILL.md` to select the next workflow, and preserve evidence with the product brief, shot plan, and QC checklist under `templates/`.
