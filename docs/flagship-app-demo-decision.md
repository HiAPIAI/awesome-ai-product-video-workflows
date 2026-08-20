# Flagship App Demo Decision

Decision date: 2026-08-20

## Decision

Keep `SaaS Feature Launch` as the one flagship reference workflow, but do not
promote or pay to distribute its current render. The workflow is worth a
limited optimization pass because its reusable contract is clear:

```text
product context -> one visible interaction -> inspectable result
```

The current media is not ready for promotion. It uses fictional static SVG
screens, and the previous result screen presented unsupported performance
numbers (`42% faster`, `3.8 days -> 2.2 days`). The remaining four examples stay
as engine/tutorial templates and are not launch assets.

## Evidence split

| Area | Evidence | Decision |
| --- | --- | --- |
| Workflow contract | YAML schema, compile path, click/callout mapping, safety preflight, deterministic tests | Keep and improve |
| Composition | Title-only opening, sparse screen holds, portrait crop risk, stale timing evidence | Fix before any release candidate |
| Source material | Fictional Northstar SVG screens with no public product URL or measured result | Replace or clearly label as synthetic |
| Audio | SaaS has an original local mix; other examples have no declared audio policy | Keep SaaS audio path; declare silent policy for tutorials |
| Evidence chain | Catalog says `do-not-publish`, while an older acceptance table says `verified` | Correct the ledger; a stale row cannot authorize release |

## Required promotion gates

The workflow may move from `spec-only` to `verified` only when all gates are
true in the same review record:

1. The product flow is public and linked, or every screen is explicitly marked
   synthetic and the page makes no product-performance claim.
2. The first frame shows a useful product state; there is no title-only opening.
3. Three observable beats are readable at full speed: entry point, interaction,
   and result.
4. Portrait output keeps the active control and result inside the safe crop.
5. Audio is either intentionally silent and documented or measured against the
   declared loudness/peak gate.
6. The exact source commit, output hashes, full decode, frame review, and normal
   volume listening are recorded together.
7. A human reviewer approves the final source-backed copy and confirms there are
   no fabricated metrics, customer outcomes, or platform UI claims.

Until these gates pass, use the workflow as a developer-facing deterministic
app-demo engine example, not as a HiAPI advertisement or paid social asset.
