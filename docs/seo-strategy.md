# SEO Strategy and Validation

## Search intent

The repository targets users who want an actionable production path, not a generic list of AI tools:

- AI product video workflow
- product image to video ad
- ecommerce video ad generator workflow
- UGC product video ad
- product photography to commercial video
- TikTok and Reels product video
- 商品图生成广告视频
- AI 商品视频工作流
- UGC 商品广告视频

Each workflow owns one primary query and a distinct URL to avoid multiple thin pages competing for the same phrase.

## Implemented repository SEO

- descriptive keyword-aligned repository name
- English default README with the primary topic in the H1 and first paragraph
- fully localized Chinese README
- natural keyword coverage instead of repeated keyword blocks
- descriptive image filename and alt text
- topic-cluster internal links
- real artifact case and dated source audit for experience and trust
- `llms.txt` for machine-readable discovery
- GitHub topics aligned with product-video search intent

GitHub documents that repository topics help people find and contribute to projects: [Classifying a repository with topics](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics).

## Implemented website SEO

The GitHub Pages site uses static semantic HTML so core content is present without JavaScript:

- unique `<title>`, meta description, and H1 per page
- self-referencing canonical URLs
- reciprocal English and `zh-CN` hreflang plus `x-default`
- `CollectionPage`, `ItemList`, and `HowTo` JSON-LD
- Open Graph and Twitter image metadata
- descriptive image filename, dimensions, and alt text
- semantic headings, ordered steps, and internal navigation
- responsive layout and reduced-motion support
- `robots.txt` and `sitemap.xml`
- one indexable page per useful workflow, not mass-generated doorway pages

Google recommends visible text, descriptive titles and descriptions, semantic HTML, and sitemaps in its [developer SEO guide](https://developers.google.com/search/docs/fundamentals/get-started-developers). Its [image SEO guidance](https://developers.google.com/search/docs/appearance/google-images) recommends standard image elements, descriptive filenames and alt text, relevant landing-page text, and representative preview metadata.

## Social preview

The repository image contract is:

- PNG or JPEG
- 1280 × 640 pixels
- under 1 MB
- solid background
- readable at small sizes
- no third-party platform logos or unsupported claims

This follows GitHub's [repository social-preview guidance](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview).

## Internal linking

The collection page links directly to all six workflows. Every workflow links back to the collection and to the alternate language. Google notes that informative titles, logical structure, and concise internal anchor text help it understand potential sitelinks: [Sitelinks best practices](https://developers.google.com/search/docs/appearance/sitelinks).

## Validation

`npm run check` verifies:

- workflow and project data integrity
- unique workflow IDs, slugs, titles, descriptions, and target phrases
- generated English and Chinese Markdown
- canonical, hreflang, robots, Open Graph, and JSON-LD metadata
- one H1 per HTML page
- sitemap coverage
- local Markdown links
- descriptive image alt text
- social-preview dimensions and file-size limit
- absence of common secret patterns

After deployment, use Google Search Console and Bing Webmaster Tools to submit the sitemap and monitor impressions, clicks, indexed pages, queries, and international-page selection. Indexing and ranking are not guaranteed by metadata alone.
