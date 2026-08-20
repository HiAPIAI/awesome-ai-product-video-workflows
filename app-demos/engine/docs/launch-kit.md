# Launch kit

Do not publish until at least one workflow has a complete, reviewed render. Replace all bracketed placeholders with verified facts, final media, and measured links. Never claim a `spec-only` workflow is rendered or production-ready.

## Shared source links

| Intent | Public URL |
| --- | --- |
| HiAPI home | `https://www.hiapi.ai/en?utm_source={surface}&utm_medium=launch-kit&utm_campaign=awesome-ai-app-demo-video-workflows&utm_content=home` |
| Registration | `https://www.hiapi.ai/en/register?utm_source={surface}&utm_medium=launch-kit&utm_campaign=awesome-ai-app-demo-video-workflows&utm_content=register` |
| API key | `https://www.hiapi.ai/en/dashboard/api-keys?utm_source={surface}&utm_medium=launch-kit&utm_campaign=awesome-ai-app-demo-video-workflows&utm_content=api-key` |
| Seedance 2.0 | `https://www.hiapi.ai/en/models/seedance-2-0?utm_source={surface}&utm_medium=launch-kit&utm_campaign=awesome-ai-app-demo-video-workflows&utm_content=seedance-model` |
| API docs | `https://docs.hiapi.ai/?utm_source={surface}&utm_medium=launch-kit&utm_campaign=awesome-ai-app-demo-video-workflows&utm_content=api-docs` |

Replace `{surface}` with `github`, `seo`, `x`, `reddit`, `youtube`, or `product-hunt`. Keep the campaign and content values unchanged so each funnel step remains distinguishable.

## Release asset inventory

- [ ] One reviewed 16:9 MP4, H.264, readable at 1280x720.
- [ ] One reviewed 9:16 MP4, H.264, readable on a phone-sized viewport.
- [ ] Repository social preview using `assets/cover.svg` or an approved raster export.
- [ ] One truthful product screenshot with alt text.
- [ ] Captions or transcript for every published video.
- [ ] Version tag, changelog, license, security policy, and contributor guide.
- [ ] Final links tested in a private/incognito session with UTM parameters intact.

## GitHub

- [ ] Pin the five-workflow catalog near the top of the README.
- [ ] Attach reviewed MP4s or stable previews to the release, not to Git history.
- [ ] State which workflows are `spec-only` and which exact exports passed review.
- [ ] Add repository topics: `product-demo`, `app-demo`, `video-workflows`, `motion-canvas`, `hiapi`.
- [ ] Verify setup from a clean clone with Node 20.18+, FFmpeg, and FFprobe.

Suggested release title: `v[version]: five reproducible app-demo workflows`

## SEO

Primary phrase: `app demo video workflows`. Supporting phrases: `product demo video from screenshots`, `SaaS feature launch video`, and `9:16 app feature video`.

- [ ] Use one literal H1 and a 150-160 character description.
- [ ] Give every image useful alt text; do not keyword-stuff.
- [ ] Link to the canonical repository and the relevant example directory.
- [ ] Publish a transcript or structured workflow summary alongside video.
- [ ] Check title, description, canonical URL, Open Graph image, and link status.

Suggested description: `Open demo-v1 workflows for turning app screenshots and UI prototype states into reviewed SaaS, mobile, AI, comparison, and vertical product videos.`

## X

- [ ] Use a reviewed 9:16 or 16:9 clip with burned-in captions.
- [ ] Put the literal outcome in the first line; keep the thread to proof, workflow, link.
- [ ] Use the `x` source URL and verify the link preview.
- [ ] Avoid unverified performance claims or fabricated customer results.

Draft: `We open-sourced five app-demo video workflows: SaaS launch, mobile onboarding, AI workflow, before/after, and a 9:16 feature short. Deterministic UI, review checklists, optional non-UI HiAPI enhancements. [repository URL]`

## Reddit

- [ ] Read each community's self-promotion and link rules before posting.
- [ ] Share implementation details, limitations, and a direct answer to a real community question.
- [ ] Disclose maintainership and any HiAPI relationship.
- [ ] Use the `reddit` source URL only where links are permitted.
- [ ] Do not cross-post identical copy, solicit votes, or automate replies.

Discussion outline: problem observed, deterministic approach, one reviewed example, current limitations, source link, specific question for practitioners.

## YouTube

- [ ] Upload the reviewed 16:9 demo; publish Shorts separately for 9:16.
- [ ] Add accurate captions, chapters, and a concise transcript.
- [ ] Show the real result in the thumbnail and opening seconds.
- [ ] Put the repository first in the description and use `youtube` for HiAPI links.
- [ ] State asset provenance and distinguish deterministic UI from generated layers.

Suggested title: `Build Product Demo Videos from App Screenshots | 5 Open Workflows`

## Product Hunt

Launch only after a clean-clone setup succeeds and usable reviewed renders exist.

- [ ] Prepare a literal name, tagline, gallery, maker comment, and first comment.
- [ ] Use real workflow screenshots and reviewed video; do not use concept-only mockups as proof.
- [ ] Explain who it is for, what is open source, and where HiAPI is optional.
- [ ] Use `product-hunt` source URLs and test every CTA.
- [ ] Do not coordinate votes or overstate adoption.

Suggested tagline: `Open workflows that turn app screenshots into reviewable product demo videos.`

## Final approval

- [ ] Maintainer reviewed every published video from start to finish.
- [ ] All claims match the current tagged commit and workflow status.
- [ ] No private data, credentials, signed URLs, unlicensed media, or generated UI is present.
- [ ] UTM attribution distinguishes surface and funnel intent.
- [ ] A rollback owner and correction path are recorded before publication.
