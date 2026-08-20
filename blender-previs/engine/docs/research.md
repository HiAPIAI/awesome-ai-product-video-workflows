# Research Notes

Research performed on 2026-07-29 using public GitHub metadata, repository documentation, and Exa semantic search. Stars are a point-in-time signal, not a quality guarantee.

| Project | Observed strength | Decision used here |
|---|---|---|
| [Evolink-AI/Awesome-Blender-Seedance-Workflow-Usecases](https://github.com/Evolink-AI/Awesome-Blender-Seedance-Workflow-Usecases) | A large attributed case library organized around camera, blocking, agents, and limitations; CC BY 4.0 content. | Differentiate with original executable workflows, automated checks, and a HiAPI handoff rather than reproducing its case library. |
| [ahujasid/blender-mcp](https://github.com/ahujasid/blender-mcp) | Popular MIT-licensed interactive Blender control over MCP, including scene inspection and arbitrary Python execution. | Keep Blender MCP optional for exploration; the committed handoff uses a constrained JSON schema and never accepts arbitrary generated Python. |
| [wassermanproductions/blockout](https://github.com/wassermanproductions/blockout) | Apache-2.0 desktop gray-box editor with real lens math, choreography marks, deterministic export, generator profiles, and MCP control. | Avoid rebuilding a large editor. Focus on a small Git-native Blender compiler and direct HiAPI lifecycle; document Blockout as a strong upstream authoring option. |
| [wassermanproductions/motion-previs-studio](https://github.com/wassermanproductions/motion-previs-studio) | Apache-2.0 reference analysis with pose, depth, camera, and production-pack exports. | Defer pose/depth extraction to future adapters rather than embedding a second analysis application in P0. |
| [ZeroLu/awesome-seedance](https://github.com/ZeroLu/awesome-seedance) | A multilingual prompt and example gallery; its visible license signals should be reviewed before reuse. | Keep this repository task-oriented and executable rather than optimizing for prompt volume, and do not reuse its content. |
| [Emily2040/seedance-2.0](https://github.com/Emily2040/seedance-2.0) | Broad agent operating guidance for reference roles, shot planning, continuity, and multilingual prompting. | Preserve explicit reference-role, continuity, and human-review language in the compiler, while keeping the P0 schema compact. |
| [Reid Hannaford's Blender-to-Seedance process note](https://x.com/reidhannaford/status/2071595581508563168) | Demonstrates using a start image for visual direction and a Blender previs for blocking, timing, and camera reference before Seedance generation. | Treat evaluated motion and camera state as inspectable handoff evidence; do not pursue production-detail proxy modeling as the default. |
| [AceDataCloud/SeedanceMCP](https://github.com/acedatacloud/seedancemcp) | MCP task creation, polling, model discovery, and batch operations for another provider. | Provide submit/poll/resume behavior locally, but keep provider routing on HiAPI `/v1/tasks` and default to dry-run. |

No source code, prompt text, screenshots, or videos from these projects are copied into this repository. The implementation and example shots are original. External tools retain their own licenses and trademarks.

## Platform contract verification

- [HiAPI Seedance 2.0 documentation](https://www.hiapi.ai/docs/models/video/seedance-2-0/) confirms the `seedance-2.0` model, asynchronous `POST /v1/tasks` lifecycle, `reference_video_urls`, supported resolutions, and the 2-15 second reference-video boundary. This repository further narrows committed shots to 4-15 seconds for reviewability.
- [Blender 5.0 Python API release notes](https://developer.blender.org/docs/release_notes/5.0/python_api/) document removal of the legacy `Action.fcurves` path. The renderer therefore supports the current action-slot/channel-bag API while retaining Blender 4.5 compatibility.

These official contracts are treated separately from creative inspiration: they determine compatibility and validation behavior, not example-shot content.

## Competitive gap

The related case libraries emphasize discovery, while the desktop tools emphasize interactive authoring and broader production surfaces. This repository occupies a narrower space: a compact, inspectable contract that Codex can edit, Blender can render headlessly, Git can review, and HiAPI can submit safely.
