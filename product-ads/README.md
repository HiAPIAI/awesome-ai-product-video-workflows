# Product Ads

This domain is the product-to-ad path that ships with the integration repository.
It owns the six source-grounded workflows under [`../workflows/`](../workflows/), the
product truth templates, and the media QC checklist.

## Start here

- [Product image audit](../workflows/01-product-image-audit.md)
- [Product page to social video ad](../workflows/04-product-page-to-video-ad.md)
- [UGC product video ad](../workflows/05-ugc-product-video-ad.md)
- [Social variants and QC](../workflows/06-social-variants-and-qc.md)

The product-ad domain is the only domain that is part of the root package and root
validation contract. Other domains keep their own schemas and runners under their
`engine/` directory until a later integration makes their contracts compatible.

## Scope boundary

Product truth, claims, rights, shot planning, and publication QC belong here. A
domain-specific renderer or provider adapter belongs in the relevant sibling domain,
not in the root package.
