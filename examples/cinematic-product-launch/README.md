# Worked Recipe: One Product Image to a Cinematic Launch Video

This is a reproducible planning case, not a claim that a final video has already been generated.

## Brief

- Input: one authorized front three-quarter product image plus a current product fact sheet
- Goal: a 15-second product-launch video
- Format: 16:9 master with a 9:16 derivative
- Creative promise: reveal one material or construction advantage
- Structure: three independent five-second shots

## Production path

### 1. Audit and lock the product

Record silhouette, proportions, material, color, logo, controls, packaging, and accessories. Reject the input if important sides are hidden or the pixels cannot support product-preserving generation.

### 2. Build a commercial hero visual

Generate two controlled candidates:

- candidate A changes the studio environment while preserving camera distance
- candidate B changes camera distance while preserving the environment

Approve one at native resolution. The frame must have clear depth, stable contact shadows, and motion space.

### 3. Create three shot cards

1. **Form reveal:** slow 20-degree arc around the product; no product motion.
2. **Material proof:** controlled light sweep across one verified surface; locked camera.
3. **Use context:** product enters an approved environment with one plausible interaction.

Each shot defines a start state, one primary action, one camera move, and an end state.

### 4. Generate short clips

Generate four-to-six-second clips independently. Keep the approved hero visual and identity anchors attached to every shot. Save the task ID and output for every attempt.

### 5. Assemble and review

Select one output per shot, assemble the 15-second rough cut, and add only approved text, voice, music, and CTA. Run full decode, audio, product-continuity, caption, and publication checks.

## Open-source methods used

- [Video ShotCraft](https://github.com/Vincentwei1021/video-shotcraft): product-shot recipe and motion-preview method
- [TVC Director](https://github.com/Ethanxwang/tvc-director): product multi-view, storyboard, and keyframe handoff
- [Flowboard](https://github.com/crisng95/flowboard): reusable product-reference and composed-shot graph
- [HyperFrames Launches](https://github.com/heygen-com/hyperframes-launches): per-project product-launch composition structure

Only the workflow methods are referenced. No upstream code or media is copied into this case.
