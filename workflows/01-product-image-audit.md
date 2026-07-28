<!-- Generated from data/workflows.json. Run npm run build after editing the source data. -->

# Product Image Audit for AI Video

Evaluate a source product photo for identity, geometry, rights, resolution, background, reflections, packaging, and claim evidence before any AI product video generation.

**Primary search phrase**: `product image preparation for AI video`

[简体中文](zh/01-product-image-audit.md) · [Back to repository](../README.md)

## Inputs

- Original product image files
- Product page or verified fact sheet
- Brand assets and usage rights
- Target platform and aspect ratio

## Outputs

- Approved source image set
- Product truth sheet
- Locked visual anchors
- Retouch and reshoot list

## Step-by-step workflow

### 1. Inventory every source

Record the original filename, pixel dimensions, crop, color profile, source URL, and rights status. Keep the untouched original beside any edited derivative so later reviewers can identify what changed.

### 2. Extract product identity anchors

Describe silhouette, proportions, material, finish, seams, controls, logo position, package structure, and included accessories. These anchors become the rejection checklist for generated images and video frames.

### 3. Separate facts from visual guesses

A photo can show a button, but it cannot prove battery life, performance, certification, price, or customer satisfaction. Map every ad claim to a current source or mark it as prohibited.

### 4. Assess generation readiness

Reject tiny, blurred, over-compressed, occluded, or heavily stylized source images when they cannot preserve product geometry. Prefer multiple clean views for reflective, articulated, or asymmetric products.

### 5. Approve the source pack

Choose one canonical hero reference and optional angle, packaging, and scale references. State what may vary, such as background or camera angle, and what must remain fixed.

## Gates before the next stage

- No unclear rights
- No unsupported claims
- Native pixels recorded
- Canonical reference selected

## Continue

Use the root `SKILL.md` to select the next workflow, and preserve evidence with the product brief, shot plan, and QC checklist under `templates/`.
