# Authoring workflows

## 1. Start from a product claim

Choose one audience, one feature, and one result. A short demo should not become a feature-list montage. Write a literal title and decide what the viewer must be able to verify in the UI.

## 2. Capture deterministic UI states

Export screenshots or prototype states at a stable viewport. Remove personal data, customer names, tokens, private URLs, notifications, and browser extensions. Use original assets or record the license and required attribution.

Critical evidence must remain deterministic:

- product UI and text;
- cursor positions and clicks;
- callouts and metrics;
- before/after states;
- logos and legal copy.

Generative media may only sit behind or between those layers. It must not redraw them.

## 3. Create the example directory

```text
examples/<workflow-id>/
├── assets/
├── demo.yaml
├── README.md
└── review-checklist.md
```

Use lowercase kebab-case identifiers. Asset paths are relative to the directory containing `demo.yaml`; absolute paths, `..` traversal, remote URLs, signed URLs, and generated outputs are forbidden.

## 4. Author the timeline

The source contract is `schemaVersion: demo-v1`. Treat scene `startFrame` as canvas-relative. Treat cursor `clickFrames` and callout `startFrame` as relative to their containing scene. Keep every nested event inside the scene duration.

Build a readable sequence:

1. State the feature category.
2. Establish product context.
3. Show the decisive interaction.
4. Hold the result long enough to read.
5. End with one product lockup.

See [Schema reference](schema-reference.md) for field semantics and the examples for working source files.

## 5. Describe rhythm and review intent

The example `README.md` must map time ranges to beats and explain what a reviewer should perceive. The `review-checklist.md` must cover full playback, text legibility, click alignment, crop safety, deterministic UI, and any workflow-specific truth claim.

## 6. Validate and compile

```bash
npm run validate -- examples/<workflow-id>/demo.yaml
npm run compile -- examples/<workflow-id>/demo.yaml --out-dir outputs/<workflow-id>
```

Fix validation errors in the source workflow. Do not patch compiled JSON by hand.

## 7. Render and review every output

```bash
npm run render -- --compiled outputs/<workflow-id>/compiled-demo-v1.json --out-dir outputs/<workflow-id>
```

Watch each aspect ratio from beginning to end. Review it at normal speed and at the intended device size. Keep catalog status `spec-only` until all outputs pass and deviations are recorded. API completion, a zero exit code, and individual frame screenshots are not substitutes for full-video review.

## Optional non-UI generation

Read [HiAPI safety](hiapi-safety.md). Define an enhancement only for `background`, `intro`, `transition`, or `outro`, run the preflight dry run, and obtain explicit approval before any paid submission.
