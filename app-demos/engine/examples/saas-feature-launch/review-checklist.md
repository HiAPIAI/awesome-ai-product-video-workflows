# Review checklist

- [ ] Watch both landscape and vertical exports from beginning to end.
- [ ] Confirm the dashboard, builder, and result appear in that order.
- [ ] Confirm the cursor click lands on a visible control and never leaves the UI frame.
- [ ] Confirm the callout does not cover node labels or the publish control.
- [ ] Confirm all screenshot text remains sharp and uncropped.
- [ ] Confirm the vertical adaptation keeps the active workflow node in view.
- [ ] Confirm there is no narration in either output.
- [ ] Confirm the compiled mix preserves `music-bed: 1.3` and all three cue volumes at `1.25`.
- [ ] Confirm the music fades in over frames 0-11 and fades out over the final 24 frames without an abrupt edge.
- [ ] Confirm click cues land at global frames 107 and 219, and the result chime starts at frame 255.
- [ ] Confirm `node assets/audio/generate.mjs --check` passes and all three source audio assets are recorded as MIT.
- [ ] Confirm final EBU R128 integrated loudness is from -24 to -20 LUFS and true peak is at or below -1 dBFS; reject clipping or cues masked by the normalized four-track mix.
- [ ] Listen at normal volume and confirm the BGM stays low-presence while both clicks and the result chime remain clear.
- [ ] Confirm neither the compiled manifest nor the repository references `bgm_001` or `bgm_002`.
- [ ] Confirm no generated background or transition redraws the product UI.
- [ ] Record any timing, framing, or readability deviation before marking the workflow verified.
