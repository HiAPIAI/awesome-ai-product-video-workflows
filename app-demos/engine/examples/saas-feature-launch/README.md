# SaaS Feature Launch

This workflow introduces one feature in context, demonstrates its decisive interaction, and closes on a concrete result. It avoids a feature-list montage.

The included Northstar screens are original synthetic reference UI licensed
under MIT. They are useful for testing the compiler and composition contract,
but they are not a real product, customer result, or publication asset. Replace
them with a real public product flow and source-backed copy before promotion.

## Expected rhythm

| Time | Beat | Review intent |
| --- | --- | --- |
| 0.0-3.0s | Dashboard context and entry point | A useful product state is visible from the first frame. |
| 3.0-7.0s | Builder interaction | Cursor movement leads the eye; the callout never covers the workflow nodes. |
| 7.0-10.0s | Example run result | The run state and review status are readable without an unsupported performance claim. |
| 10.0-11.0s | Product lockup | The product name lands once, without a second CTA. |

## Locked audio plan

There is no narration. The local mix uses four tracks. Two rejected passes bound the current renderer's mix: all tracks at `volume: 2` measured `-18.6 LUFS` and `-4.8 dBFS` true peak, while music at `0.65` and cues at `1` measured `-28.2 LUFS` and `-10.9 dBFS` true peak. The values below are frozen for the final Render-fix acceptance pass. The replacement cues preserve the timestamps and track volumes but use original deterministic PCM sources, so final acceptance depends on measured output and normal-volume listening rather than the prior estimate.

| Frame | Audio | Source and intent |
| ---: | --- | --- |
| 0 | Light product bed | `bgm_003.wav`, original deterministic synthesis, 48 kHz stereo, 11.06s; `volume: 1.3`, 12-frame fade-in and 24-frame fade-out. |
| 62 | UI click | `sfx_001.wav`, original deterministic 180 ms click, `volume: 1.25`; synchronized to the dashboard action. |
| 174 | UI click | Reuse the same original click at `volume: 1.25`; synchronized to the builder action. |
| 210 | Result confirmation | `sfx_002.wav`, original deterministic 2.5s chime, `volume: 1.25`; lands as the example run appears. |

The acceptance gate is `-24` to `-20 LUFS` integrated with true peak at or below `-1 dBFS`, followed by normal-volume human listening. If the final Render-fix pass misses this range, record a renderer change request instead of tuning the example again. `bgm_001` and `bgm_002` are explicitly excluded.

The screenshots and all three audio sources are original assets created for this repository and licensed under MIT. Run `node assets/audio/generate.mjs --check` from this example directory to verify that the checked-in click and chime match their deterministic source formula.
