<!-- Generated from data/workflows.json. Run npm run build after editing the source data. -->

# Hero Image to AI Product Video Ad

Animate an approved product hero image into short, controllable product-ad shots with clear motion, camera, timing, audio, and continuity instructions.

**Primary search phrase**: `hero image to AI product video ad`

[简体中文](zh/03-hero-visual-to-product-video.md) · [Back to repository](../README.md)

## Inputs

- Approved hero visual
- Product identity anchors
- Shot purpose
- Duration and aspect ratio

## Outputs

- Shot card
- Image-to-video prompt
- Generation settings
- Artifact and QC record

## Step-by-step workflow

### 1. Give one shot one job

Use a shot to reveal the form, demonstrate one interaction, show a material response, or place the product in context. A short generative clip should not attempt a full commercial narrative.

### 2. Write start, action, and end states

Describe what is visible at frame one, the single primary motion, and the exact final state. This provides a continuity contract for later assembly and limits uncontrolled transformations.

### 3. Use restrained camera language

Choose one camera move and one subject move. Slow push-ins, short arcs, controlled rack focus, and subtle turntable motion usually preserve product geometry better than multiple rapid moves.

### 4. Separate clips before assembly

Generate and approve independent four-to-ten-second shots. Build longer ads from selected clips instead of asking one generation to handle multiple locations, interactions, claims, and transitions.

### 5. Verify the actual artifact

Save the task ID and downloaded file, fully decode the media, watch with audio, inspect representative frames, and compare the product against the source. Accepted requests are not finished ads.

## Gates before the next stage

- One shot purpose
- Start and end states defined
- Cost approved
- Artifact watched and decoded

## Continue

Use the root `SKILL.md` to select the next workflow, and preserve evidence with the product brief, shot plan, and QC checklist under `templates/`.
