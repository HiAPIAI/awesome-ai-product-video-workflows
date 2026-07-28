# Contributing

Thanks for improving this AI product-video workflow library.

## Add or correct an open-source project

Update `data/projects.json` with:

- canonical GitHub repository URL
- current star snapshot and verification date
- license confirmed from the root license file
- one factual English description
- one factual Chinese description
- an explicit adoption boundary

Do not add affiliate links, referral parameters, paid placement, copied marketing claims, or projects with no public workflow value.

## Improve a workflow

Edit `data/workflows.json`, then run:

```bash
npm run build
npm run check
```

Generated Markdown and site pages must remain in sync. English and Chinese content must be updated together.

## Add a case

A case must clearly identify one of these states:

- real generated artifact with task, file, and QC evidence
- reproducible planning recipe that has not been generated
- external open-source case linked to its canonical source

Never present a mockup, dry run, accepted API request, or third-party video as a completed HiAPIAI output.

## Pull request checklist

- [ ] All claims can be verified from cited sources.
- [ ] Upstream license and adoption boundary are accurate.
- [ ] No API keys, cookies, private briefs, or third-party media are committed.
- [ ] English and Chinese pages are aligned.
- [ ] Local and external links resolve.
- [ ] `npm run check` passes.
