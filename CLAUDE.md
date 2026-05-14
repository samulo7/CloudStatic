# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Always rules

These rules apply before writing any code in this repository:

- Read `memory-bank/architecture.md` completely before writing code. It is expected to contain the full architecture and database/schema structure once implementation begins.
- Read `memory-bank/CloudStatic_设计文档.md` completely before writing code. It is expected to contain product requirements and behavior rules once implementation begins.
- If either required memory-bank file is missing, stop code changes and create or request the missing file before implementing features.
- After completing any major feature or milestone, update `memory-bank/architecture.md` so future agents have current architecture, data model, and integration context.
- Keep implementation modular across multiple focused files. Do not create monolithic giant files that mix routing, UI, state, data processing, deployment logic, and utilities.
- Prefer small modules with clear boundaries: pages, components, layouts, content collections, image-processing scripts, manifest/search-index scripts, and deployment configuration should stay separated.

## Repository status

This repository currently contains product/design documentation for CloudStatic, not an initialized application codebase. There is no package.json, lockfile, Astro config, Wrangler config, README, Cursor rules, or Copilot instructions yet.

Source documents:

- CloudStatic_设计文档.md — product/design requirements
- tech-stack.md — selected technical stack and architecture guidance

## Intended architecture

CloudStatic is a self-hosted image hosting + static blog platform built around Cloudflare Workers Static Assets. The core architecture rule is **Build Time Heavy, Runtime Zero**:

- Do image processing, Markdown/MDX rendering, manifest generation, RSS/sitemap/search-index generation, and SEO metadata generation at build time.
- Deploy static files to Cloudflare Workers Static Assets.
- Let Cloudflare Edge serve HTML, images, CSS, JS, and JSON directly.
- Avoid runtime Worker logic unless a future requirement explicitly needs server-side behavior.

Preferred stack from project docs:

- Astro SSG for static pages
- MDX + Astro Content Collections for blog content
- React Islands only for interactive UI such as upload, image filtering, search, and theme toggle
- Tailwind CSS for styling
- sharp for build-time image conversion, thumbnails, dimensions, and hashing
- pnpm for package management
- GitHub Actions for CI/CD
- Wrangler CLI for Cloudflare deployment
- Cloudflare Workers Static Assets as the deployment target

## Storage and asset handling constraints

Do not design the long-term image pipeline around `public/images/`. Astro copies `public/` into `dist/` during builds; tens of thousands of images would make CI builds slow due to repeated scanning/copying.

Preferred image flow:

1. Treat uploaded/source images as CI or local processing inputs.
2. Generate WebP originals, 400w thumbnails, dimensions, and SHA-256-derived filenames with sharp.
3. Generate/update `manifest.json` with image metadata.
4. During CI, copy processed image outputs into `dist/images/`, or configure Wrangler assets so the image directory bypasses Astro's build pipeline.
5. Deploy the final static assets to Cloudflare.

Avoid committing image binaries into the main git history by default. Commit metadata such as `manifest.json` and blog content, but keep large image outputs ignored unless the project explicitly chooses a different archival strategy.

## MVP scope

First implementation should optimize for this working loop:

1. Upload image
2. Process image and generate link
3. Write MDX article referencing the image
4. Build static site
5. Deploy to Cloudflare Workers Static Assets

Defer Fuse.js search, Giscus comments, analytics dashboard, CLI upload tooling, and anti-hotlink rules until the core loop works.

## Commands

No commands are currently available because the application has not been scaffolded yet.

When the Astro project is created, expected package scripts should align with these workflows:

```bash
pnpm install
pnpm dev
pnpm build
pnpm preview
pnpm process:images
pnpm generate:manifest
pnpm generate:search-index
wrangler deploy
```

Expected CI flow from project docs:

```bash
pnpm install --frozen-lockfile
pnpm process:images
pnpm generate:manifest
pnpm build
wrangler deploy
```

Do not assume these scripts exist until package.json is created.

Expected Wrangler asset configuration direction when `wrangler.toml` is created:

```toml
name = "cloudstatic"
compatibility_date = "2024-01-01"

[assets]
directory = "./dist"
```

If processed images bypass Astro, make sure CI places them under `dist/images/` before `wrangler deploy`, or adjust Wrangler assets configuration deliberately.

## Implementation notes for future agents

- Prefer Astro static pages for blog, gallery, tags, categories, feed, sitemap, and SEO surfaces.
- Keep React limited to islands that need browser interactivity; do not convert the whole site into a React SPA.
- Keep client state local to React islands unless cross-page persistence is required; avoid adding global state management in the MVP.
- Keep network calls out of static reading surfaces. Upload and deployment-trigger flows may call external services, but blog/gallery reading paths should remain static assets.
- Keep image-processing, manifest generation, search-index generation, and deploy logic in separate scripts rather than one all-purpose build script.
- Use SHA-256 first 16 characters for image filenames to avoid collisions and support deduplication.
- Generate `/images/[year]/[month]/[hash].webp`, `/images/thumb/[hash]_400w.webp`, `/manifest.json`, and `/search-index.json` as build outputs.
- Keep R2, KV, D1, SSR, and runtime image optimization out of the MVP unless requirements change.
- If adding comments later, prefer Giscus rather than building a custom backend.
- If adding analytics later, prefer Cloudflare Web Analytics first.
