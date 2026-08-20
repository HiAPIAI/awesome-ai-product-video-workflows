# SaaS Feature Launch

This workflow introduces one feature in context, demonstrates its decisive interaction, and closes on a concrete result. It avoids a feature-list montage.

## Expected rhythm

| Time | Beat | Review intent |
| --- | --- | --- |
| 0.0-1.5s | Literal feature promise | The viewer understands the category before seeing UI. |
| 1.5-4.5s | Dashboard context | The automation entry point remains readable. |
| 4.5-8.5s | Builder interaction | Cursor movement leads the eye; the callout never covers the workflow nodes. |
| 8.5-10.0s | Performance result | The 42% improvement is readable without pausing. |
| 10.0-11.0s | Product lockup | The product name lands once, without a second CTA. |

## Locked audio plan

There is no narration. The local mix uses four tracks. Two rejected passes bound the current renderer's mix: all tracks at `volume: 2` measured `-18.6 LUFS` and `-4.8 dBFS` true peak, while music at `0.65` and cues at `1` measured `-28.2 LUFS` and `-10.9 dBFS` true peak. The values below are frozen for the final Render-fix acceptance pass. The replacement cues preserve the timestamps and track volumes but use original deterministic PCM sources, so final acceptance depends on measured output and normal-volume listening rather than the prior estimate.

| Frame | Audio | Source and intent |
| ---: | --- | --- |
| 0 | Light product bed | `bgm_003.wav`, original deterministic synthesis, 48 kHz stereo, 11.06s; `volume: 1.3`, 12-frame fade-in and 24-frame fade-out. |
| 107 | UI click | `sfx_001.wav`, original deterministic 180 ms click, `volume: 1.25`; synchronized to the dashboard action. |
| 219 | UI click | Reuse the same original click at `volume: 1.25`; synchronized to the builder action. |
| 255 | Result confirmation | `sfx_002.wav`, original deterministic 2.5s chime, `volume: 1.25`; lands as the performance result appears. |

The acceptance gate is `-24` to `-20 LUFS` integrated with true peak at or below `-1 dBFS`, followed by normal-volume human listening. If the final Render-fix pass misses this range, record a renderer change request instead of tuning the example again. `bgm_001` and `bgm_002` are explicitly excluded.

The screenshots and all three audio sources are original assets created for this repository and licensed under MIT. Run `node assets/audio/generate.mjs --check` from this example directory to verify that the checked-in click and chime match their deterministic source formula.
