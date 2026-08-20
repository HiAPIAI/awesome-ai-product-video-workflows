# Architecture

## Contracts

`shot.json` is the source of truth. Codex translates the user's natural-language brief into that contract; the user does not need to author JSON. It describes intent, duration, render dimensions, proxy geometry, object keyframes, camera keyframes, and Seedance creative locks. The JSON Schema documents structural constraints and common field bounds; `scripts/lib/spec.mjs` repeats those gates without a runtime dependency, then adds cross-field rules that JSON Schema cannot express. Runtime validation rejects colliding compiled frame numbers, excessive render budgets, camera/target coincidence, and mismatched previs/output aspect ratios before Blender runs.

The compiler creates four reviewable artifacts:

- `compiled.json`: frame-resolved Blender input.
- `prompt.txt`: natural-language visual, blocking, camera, continuity, and proxy-replacement contract.
- `seedance.request.json`: `/v1/tasks` payload with a single `{{PREVIS_VIDEO}}` placeholder.
- `manifest.json`: source, compiled, and request hashes plus warnings.

## Render path

Blender runs with `--background --factory-startup --python-exit-code 1`. The Python script creates only white-listed primitives and transform keyframes, saves `previs.blend`, and renders frame-stepped PNGs through Workbench by default. A validated cinematic spec can instead select bounded Cycles samples, fixed material presets, bevels, smooth shading, camera depth of field, world volume density, and up to 16 bounded lights; no arbitrary node graph or Python reaches Blender through the shot spec. The Node wrapper first claims an empty directory with a shot-specific marker and holds an exclusive process lock; it refuses non-empty unowned directories, concurrent writers, and a marker belonging to another shot. Each run writes to a separately owned staging directory, requires the exact contiguous frame set, encodes an exact frame count to a temporary H.264/yuv420p MP4 with faststart, and uses FFprobe to verify codec, pixel format, dimensions, frame rate, and frame count. Only then does a recoverable backup transaction replace the published artifact set; failures preserve the previous set, and the next run repairs an interrupted promotion. Captured child output is consumed through the `close` event so FFprobe and frame-analysis pipes are fully drained. Compiler output is byte-deterministic; render pixels can still vary across Blender builds, drivers, and hardware.

Separating frame rendering from video encoding avoids Blender-version differences in video output settings and ensures Python exceptions fail the parent command.

Before media review, Blender records `motion-trace.json` from the evaluated dependency graph for every timeline frame. The trace captures camera location, target, normalized forward/up directions, lens, horizontal field of view, target distance, and every proxy's evaluated transform. The Node wrapper validates the exact frame range, frame times, object order, numeric bounds, and normalized orientation vectors, then records the file hash and a camera-path summary in the render report. This makes camera recording inspectable without treating authored keyframes as proof of the evaluated scene.

The review stage copies the first, middle, and last verified frames, builds a contact sheet, and uses FFmpeg `signalstats` to flag low-luma-range frames and abrupt luma changes. Every record must have the exact contiguous index and finite luma metrics. The stage records facts and flags in `review-report.json` and writes a human `review-checklist.md`; it never marks human review complete. `--blocking-svg` optionally adds a top-down diagram of object paths, camera positions, and targets. `--scene-only` avoids FFmpeg/FFprobe discovery and stops after the `.blend` scene while still writing and validating the motion trace; `--dry-run` reports planned commands without writing files.

## Handoff path

Every verified full render writes `seedance-handoff.md` and `handoff-manifest.json` in the same atomic publication transaction as the video and review artifacts. The handoff names `previs.mp4` as the primary motion reference, `prompt.txt` as the generation contract, and the first frame as an optional composition reference. It records file roles, byte counts, SHA-256 hashes, output settings, and the evaluated camera summary. Manual upload is the default completion path because provider schema declarations alone do not prove an upstream adapter forwards reference video inputs.

## Optional generation path

The submitter reads and hashes the local video once, validates its extension and container signature, and caps it at 90 MiB so base64 stays below the API request-body limit. It replaces `{{PREVIS_VIDEO}}` with a data URI only for a confirmed request. Its dry-run summary replaces the base64 with filename, byte count, and SHA-256, so logs stay small and non-sensitive. The confirmation token hashes the normalized API endpoint and that summary, so it becomes invalid whenever the endpoint, request, or video changes. Confirmed submission additionally requires a sibling review report whose request hash and video SHA-256 match and whose human-review flag is true.

Before `POST /v1/tasks`, the CLI writes `preflight-<token>.pending.json` with an immutable first-attempt time and a salted one-way binding to the exact API key, then sends canonical JSON with the same token as `Idempotency-Key`. A valid response is persisted as `<task-id>.submitted.json` before the pending journal is removed. The POST is never automatically retried, but an operator can repeat the unchanged confirmed command with the same credential inside a 23-hour safe window after an ambiguous connection failure. A deterministic client rejection removes pending state; transport failures plus 408/409/422/425/429 remain fail-closed for reconciliation. After the window, the CLI refuses to risk a new charge and requires task/billing reconciliation. Only task polling automatically retries transient failures; an existing task can also be resumed by its validated ID. JSON API responses are bounded before buffering.

Task results and terminal failure details are persisted. Output selection accepts typed or extension-confirmed MP4 artifacts and rejects unsupported MOV/WebM results. Every download redirect resolves and validates the complete address set, then pins it without a second DNS lookup and falls back across addresses inside one end-to-end deadline. HTTPS, credentials, DNS/private ranges, response size/type, stream length, and MP4 signature are checked; rejected responses are destroyed rather than drained indefinitely. A validated localhost API test can opt into loopback HTTP media without changing production behavior. Bytes land in a unique partial file and are published through an atomic no-clobber hard link only after validation; `<task-id>.download.json` records the final size and SHA-256.

## Trust boundaries

| Input | Trust | Enforcement |
|---|---|---|
| Committed shot spec | Untrusted until validated | Schema rules, bounds, allowed primitives |
| Blender Python renderer | Trusted repository code | No dynamic `exec`, no model-authored script input |
| Local previs | User-reviewed artifact | Stable read, container check, SHA-256-bound preflight token |
| API target | Untrusted configuration | HTTPS origin validation; official hosts by default; explicit custom-host opt-in |
| HiAPI response | Untrusted external data | Redirect rejection, safe task IDs, HTTP/status checks, terminal-state persistence |
| Generated video | Unreviewed output | Restricted download target, atomic validation, hash metadata, explicit `generated_unreviewed` handoff language |
