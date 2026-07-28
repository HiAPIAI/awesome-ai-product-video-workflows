# Real Case: Product Image to UGC Clip-Light Video Ad

This case is a real authenticated production E2E, not a hypothetical storyboard. It uses a synthetic adult actor and a fictional unbranded clip light, so it demonstrates the workflow without presenting a generated person as a real customer.

## Goal

Create a 10-second, 9:16 creator-style product demonstration with native English dialogue:

> “This little clip light lives on my desk. One tap cycles through three brightness levels, so I can match the room in seconds. Clip it on and light your next call.”

The approved script was treated as a production instruction, not proof of a real product's performance.

## Workflow

1. Define a fictional product with no real brand, price, certification, or customer claim.
2. Create a source frame with one synthetic adult creator, one white clip light, and a plausible home-office interaction.
3. Validate a machine-readable UGC brief for duration, aspect ratio, talent status, script, claims, media, and cost.
4. Run a dry request and confirm the real image-to-video payload.
5. Create the paid task, record the task ID immediately, and resume the same task after a transient polling failure.
6. Download the MP4, fully decode it, inspect representative frames, measure audio, and transcribe the spoken dialogue.

## Verified artifact

- Model: Seedance 2.0
- Dimensions: 720 × 1280
- Duration: 10.054 seconds
- Frame rate: 24 fps
- Video: H.264 High
- Audio: AAC-LC stereo, 44.1 kHz
- SHA-256 of the private original: `26e6cb50eb911a6380aab85ffdb289ee4aa6f3691719da1365f043e7747469e8`

[Watch the public MP4](https://github.com/HiAPIAI/hiapi-seedance-2-0-ugc-ad-video-skill/blob/main/assets/examples/ugc-clip-light-e2e.mp4) · [Read the full E2E evidence](https://github.com/HiAPIAI/hiapi-seedance-2-0-ugc-ad-video-skill/blob/main/docs/e2e-validation.md)

## What passed

- one actor, one product, and one continuous creator-style shot
- complete approved dialogue and CTA
- stable person and clip-light structure
- visible button interaction and brightness change
- no subtitles, watermark, brand, or duplicate product
- complete FFmpeg decode, no black frames, and non-silent audio

## What did not become an ad claim

Static frame review did not prove that three separate button presses and three discrete brightness plateaus were clearly shown. The clip therefore passes integration and artifact QC, but it is not evidence that a real product has three brightness levels.

This distinction is the central rule of the repository: a generated visual can demonstrate a production workflow without proving a commercial claim.
