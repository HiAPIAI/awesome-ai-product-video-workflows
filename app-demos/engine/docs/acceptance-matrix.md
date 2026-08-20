# Render acceptance matrix

This is the execution ledger for the first integrated render pass. A catalog entry is `verified` only after all declared outputs for that workflow pass both machine and full-video human review.

## Integration gate

- Rejected first-pass baseline: integration `d3a8c34c333d035a8d32848441203cb1e78ddd4d`, content merge `b3decf1c584651ed10eeaf5ef0f991f8c4f97089`, and frozen sample source commit `f36e38f58082de76eb9604509c7bb05b38232bd3`.
- Final candidate: integration `2e06275660043b36c5442db298c808f8fd661e71` with workflow source commit `46fd48487fd85e614045886372a0c4dee6fd8db6`.
- All five examples pass `validate -> compile -> render`; all seven outputs pass structural probe and complete decode. Node.js 20 and 22 CI pass at the final candidate commit.
- Machine acceptance and local frame extraction are complete, but the current renders failed product-quality review. They are deterministic SVG proof renders, not publication-ready product demos.
- The catalog remains `spec-only` until the visual composition is improved and every workflow declares and passes its intended audio policy.

## Declared outputs

The suite contains five workflows, seven outputs, 2,010 frames, and 67 seconds of encoded media at 30 fps.

| Workflow | Output ID | File | Required media | Audio | Current state |
| --- | --- | --- | --- | --- | --- |
| SaaS Feature Launch | `landscape` | `saas-feature-launch-landscape.mp4` | 1920x1080, 30 fps, 330 frames / 11s | Four-track local mix, no narration | Spec-only: structural render pass; visual/audio sign-off pending |
| SaaS Feature Launch | `vertical` | `saas-feature-launch-vertical.mp4` | 1080x1920, 30 fps, 330 frames / 11s | Same locked mix and cue frames | Spec-only: structural render pass; visual/audio sign-off pending |
| Mobile Onboarding | `vertical` | `mobile-onboarding-vertical.mp4` | 1080x1920, 30 fps, 300 frames / 10s | No source audio tracks | Spec-only: missing audio policy and visual sign-off |
| AI Workflow Demo | `landscape` | `ai-workflow-demo-landscape.mp4` | 1920x1080, 30 fps, 360 frames / 12s | No source audio tracks | Spec-only: missing audio policy and visual sign-off |
| Before / After Comparison | `landscape` | `before-after-comparison-landscape.mp4` | 1920x1080, 30 fps, 240 frames / 8s | No source audio tracks | Spec-only: missing audio policy and visual sign-off |
| Before / After Comparison | `vertical` | `before-after-comparison-vertical.mp4` | 1080x1920, 30 fps, 240 frames / 8s | No source audio tracks | Spec-only: missing audio policy and visual sign-off |
| Vertical Social Feature | `vertical` | `vertical-social-feature.mp4` | 1080x1920, 30 fps, 210 frames / 7s | No source audio tracks | Spec-only: missing audio policy and visual sign-off |

## Machine acceptance

Record one evidence row per output. A pass requires all applicable checks, not only a zero render exit code.

| Gate | Required result |
| --- | --- |
| Source validation | `validate` passes the frozen `demo-v1` Schema and repository semantic gates. |
| Compilation | `compiled-demo-v1.json` passes its Schema; asset hashes match repository bytes; paths are project-relative; no wall-clock or local absolute path appears. |
| SVG handoff | SVGs are rasterized only into ignored temporary render inputs; compiled assets and Git retain the original SVG paths and bytes. |
| Video probe | MP4 contains H.264 video in `yuv420p`, exact declared dimensions and 30 fps, exact frame count, and duration within one frame. |
| Complete decode | FFmpeg decodes the complete output with no errors. |
| Silent outputs | Workflows without source audio contain no unexpected audio stream. |
| SaaS audio | Both SaaS outputs contain the intended encoded audio stream, no narration, clicks at frames 62/174, chime at frame 210, and 12/24-frame BGM fades. |
| SaaS loudness | Final integrated loudness is from -24 to -20 LUFS and true peak is at or below -1 dBFS. Reject clipping, high-presence BGM, or masked cues; confirm at normal listening volume. |
| Determinism | Render both SaaS outputs twice from clean output directories; MP4 and first/middle/last decoded-frame SHA-256 values must match. |
| Review artifacts | Preserve compiled JSON, render report, FFprobe facts, first/middle/last frames, contact sheet, completed review checklist, and hashes under ignored output storage. |

### Rejected first-pass evidence

The ignored evidence directory is `outputs/acceptance-f36e38f/saas-feature-launch/`. It is bound to source commit `f36e38f58082de76eb9604509c7bb05b38232bd3`, source YAML SHA-256 `8768637ae4d9253fd2d688fbf9559a8be03bd54019c8032b16101ba095ae0fce`, and compiled JSON SHA-256 `0129a40d6a314e7047ce847991f4112f6cc37b09ba089d9fffb9ee672da003a5`.

- Both MP4s passed structural probe and complete decode: 330 frames, 11 seconds, 30 fps, H.264/yuv420p video, and AAC 48 kHz audio. The compiled manifest referenced zero PNG files, and no temporary `render-work` directory remained.
- Both MP4s measured `-28.2 LUFS` integrated, `2.0 LU` LRA, and `-10.9 dBFS` true peak. This fails the loudness gate. Together with the prior all-tracks-at-2 result of `-18.6 LUFS` and `-4.8 dBFS` true peak, the final source plan is calibrated to `music-bed: 1.3` and all three cues at `1.25`; expected output is approximately `-22.2 LUFS` and `-9 dBFS` true peak.
- Human review rejected both outputs. Title and body overlap; portrait content overflows and exposes black frames; the scene-local callout at frame 42 appears at global frame 42; and visual clicks occur at global frames 62/84 instead of the intended 107/219. The current source plan removes the title-only opening and uses source-backed example-state copy; a new render is still required before any promotion decision.
- This pass is failure evidence only. It is not a determinism run, no second render is allowed before the Render P0 fix merges, and it does not change any catalog status.

### Evidence ledger

| Output file | Integration SHA | MP4 SHA-256 | Probe/decode | Audio facts | Determinism | Human review | Final decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `saas-feature-launch-landscape.mp4` | `2e06275` / content `46fd484` | `7fe3ef03504e51df2260b84e9ad31075ce07ca43b4ccdd72b8d5f28946dc3d4b` | Pass: 1920x1080, 330f/11s, H.264/yuv420p + AAC 48 kHz; full decode | Pass: -22.3 LUFS, 2.5 LU LRA, -11.9 dBFS TP; normal-volume review approved | Pass: repeated MP4 and first/middle/last frames match | Pass: frame audit and full playback/audio review | `spec-only` |
| `saas-feature-launch-vertical.mp4` | `2e06275` / content `46fd484` | `5a0a17fc910b988ea1eb2f52933df89848e25eaca861cfb589e4b04a974cd312` | Pass: 1080x1920, 330f/11s, H.264/yuv420p + AAC 48 kHz; full decode | Pass: -22.3 LUFS, 2.5 LU LRA, -11.9 dBFS TP; normal-volume review approved | Pass: repeated MP4 and first/middle/last frames match | Pass: frame audit and full playback/audio review | `spec-only` |
| `mobile-onboarding-vertical.mp4` | `2e06275` / content `46fd484` | `edf2987e7198b951800e35a02503ca7828d47bc0d0a762d64d8284e8c98badb3` | Pass: 1080x1920, 300f/10s, H.264/yuv420p, no audio; full decode | N/A | Not required | Pass: frame audit and full playback review | `spec-only` |
| `ai-workflow-demo-landscape.mp4` | `2e06275` / content `46fd484` | `707585b2835a3c9cbd64ca00dafaefa66f06a1d868b6b07ad6d7ff0c91b691c5` | Pass: 1920x1080, 360f/12s, H.264/yuv420p, no audio; full decode | N/A | Not required | Pass: frame audit and full playback review | `spec-only` |
| `before-after-comparison-landscape.mp4` | `2e06275` / content `46fd484` | `0520567c86fc994269705da75f4eb95e0e05cee5c7989f7f1ab16f7eb5490695` | Pass: 1920x1080, 240f/8s, H.264/yuv420p, no audio; full decode | N/A | Not required | Pass: frame audit and full playback review | `spec-only` |
| `before-after-comparison-vertical.mp4` | `2e06275` / content `46fd484` | `69f3f037bf876aa9ea861224876e16c6e4e9873473dea31543ab39a2f2977e80` | Pass: 1080x1920, 240f/8s, H.264/yuv420p, no audio; full decode | N/A | Not required | Pass: frame audit and full playback review | `spec-only` |
| `vertical-social-feature.mp4` | `2e06275` / content `46fd484` | `07749c030bef3eae409c36d0bc71bc14e8eb080bb8051a6ea8b4663b06c60047` | Pass: 1080x1920, 210f/7s, H.264/yuv420p, no audio; full decode | N/A | Not required | Pass: frame audit and full playback review | `spec-only` |

### Final candidate evidence

The ignored evidence roots are `outputs/acceptance-46fd484/` and `outputs/acceptance-46fd484-repeat/`. The SaaS compiled JSON SHA-256 is `20aff80493af160c081d2e3ad7130839f699cdc2a627cda1f1ef6dfb9101eaae`.

- All compiled manifests retain `compiled-demo-v1`, reference all 13 original SVG assets, contain zero PNG paths and zero absolute paths, and leave no `.render-work-*` directories behind.
- The historical SaaS candidate used clicks at frames 107/219. The current source plan uses clicks at frames 62/174, a result chime at frame 210, and keeps the callout scene-local at frames 42-98; a fresh render must verify the mapping.
- The complete high-density frame audit samples every 15th frame for all seven outputs and includes boundary evidence under `outputs/acceptance-46fd484/evidence/full-review/`. Expected fade-through-dark inside the device viewport is not a full-frame black leak.
- `generate` was not invoked. Render subprocesses ran without `HIAPI_API_KEY`; no paid HiAPI request was made.

## Workflow-specific human review

| Workflow | Required full-video decisions |
| --- | --- |
| SaaS Feature Launch | Example workflow is visible from the first frame; dashboard, builder, and synthetic run status stay readable; both clicks land on controls; callout avoids nodes; vertical crop follows the active UI; BGM and cues support rather than mask the result. |
| Mobile Onboarding | Welcome, preferences, and first plan read in order; selections and CTA fit the phone; longest text stays inside the device; value arrives without a rushed hold. |
| AI Workflow Demo | Structured input, execution status, output, and explicit human approval are all visible; no generated layer is mistaken for exact product UI. |
| Before / After Comparison | Both states use matched content and framing; the comparison is honest; labels remain visible; vertical adaptation does not hide evidence. |
| Vertical Social Feature | Hook, one interaction, and result remain readable at phone size; captions stay inside marked social safe margins; no real platform chrome is misrepresented. |

Reviewers must watch each complete video at normal speed and intended display size, then complete the example's `review-checklist.md`. Contact sheets and individual frames support review but cannot replace it. The historical review record is superseded; no current release owner approval exists.

## Status promotion

No workflow is currently promoted to `verified`. The recorded outputs prove that the render pipeline can produce deterministic MP4 files, but they do not pass the publication-quality bar. `verified` will require full-video human review, intentional audio policy, readable product content at target size, and no misleading claims.
