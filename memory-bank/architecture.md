# CloudStatic Architecture

## Core architecture

CloudStatic follows Build Time Heavy, Runtime Zero.

- Build time handles content rendering, image processing, manifest generation, and static asset preparation.
- Runtime serves static HTML, CSS, JS, JSON, and images from Cloudflare Workers Static Assets.
- MVP must not introduce SSR, R2, KV, D1, or runtime image optimization.

## Current implementation state

Phase 2 added the blog content system foundation and a cozy Japanese-style static UI shell. The homepage has since been upgraded into CloudStatic Journal: a poetic static personal-blog landing page with an artistic editorial hero, mood timeline, reading status widget, elegant static article cards, emotional signature quote, ambient footer, floating glass navigation, and CSS-only subtle visual effects. The codebase now has a centralized Astro content collection schema, sample MDX posts, shared navigation/layout, a warm diary-like homepage, timeline-style blog list cards, mood-category tag chips, and calm static article detail routes.

No production image processing exists yet. Current image scripts are placeholders so package commands exist and Step 1 workflows can run without failing.

Phase 3 now provides the image-processing foundation: local/CI source images live in `content-assets/incoming-images/`, sharp converts supported images into WebP outputs under `content-assets/processed-images/images/`, thumbnails are generated under `content-assets/processed-images/images/thumb/`, processed metadata is staged in `content-assets/processed-images/manifest-images.json`, and `public/manifest.json` is generated from that metadata. Image binaries remain ignored by git. A separate `copy:images` command copies processed images into `dist/images/` after Astro build.

## File and directory responsibilities

### `package.json`

Defines project metadata, dependencies, and canonical scripts.

Current scripts:

- `dev`: starts Astro dev server.
- `build`: builds static site into `dist/`.
- `preview`: previews built static output.
- `process:images`: processes source images from `content-assets/incoming-images/` into WebP main images, 400w thumbnails, and staged metadata.
- `generate:manifest`: generates `public/manifest.json` from processed image metadata.
- `copy:images`: copies processed image assets into `dist/images/` after Astro build.

Current dependency roles:

- `astro`: static site generation.
- `@astrojs/mdx`: MDX article support for blog content.
- `@astrojs/react`: React islands for future interactive UI only.
- `tailwindcss` and `@tailwindcss/vite`: global styling pipeline.
- `sharp`: future build-time image conversion, resizing, metadata extraction.
- `wrangler`: future Cloudflare Workers Static Assets deployment.

### `pnpm-lock.yaml`

Locks dependency versions for reproducible installs. Keep in sync with `package.json` via pnpm.

### `astro.config.mjs`

Astro configuration entry.

Current responsibilities:

- Enables MDX integration.
- Enables React integration for future islands.
- Registers Tailwind CSS Vite plugin.

Do not add SSR output or server adapter unless requirements explicitly change.

### `src/content.config.ts`

Central Astro content collection configuration.

Current responsibilities:

- Defines the `blog` content collection.
- Requires article `title`, `description`, `date`, and `tags` frontmatter.
- Allows optional `cover` metadata for future image integration.
- Keeps article metadata schema centralized rather than scattered through pages.

### `src/content/blog/*.mdx`

MDX blog source content.

Current responsibilities:

- Stores static article body and frontmatter.
- Provides Phase 2 sample posts for verifying collection reads, sort order, and article route generation.

### `src/layouts/BaseLayout.astro`

Shared static HTML shell.

Current responsibilities:

- Imports `src/styles/global.css` once for pages using this layout.
- Emits document metadata from `title` and `description` props.
- Provides shared static header navigation and page shell.
- Provides the main content slot for static pages.
- Does not add client state, theme logic, or runtime API calls.

### `src/pages/index.astro`

Static homepage route for `/`.

Current responsibilities:

- Renders the CloudStatic Journal poetic personal-blog homepage through `BaseLayout`.
- Reads the `blog` content collection at build time for the homepage post count and latest-post mood timeline.
- Provides an artistic editorial hero, reading status widget, dynamic mood timeline, visually distinct static principle cards, emotional signature quote, and ambient footer.
- Documents the static Cloudflare value quietly without exposing internal roadmap status.
- Links to the blog list route without adding unfinished gallery or upload navigation.
- Uses CSS-only ambience and subtle motion; no runtime APIs, client state, or React islands are required.

### `src/pages/blog/index.astro`

Static blog list route for `/blog/`.

Current responsibilities:

- Reads the `blog` content collection at build time.
- Sorts articles by publish date descending.
- Renders date, title, description, mood-category tags, and article links in timeline-style static cards.
- Shows a styled empty state if no articles exist.

### `src/pages/blog/[slug].astro`

Static blog article route.

Current responsibilities:

- Uses `getStaticPaths()` to generate one static route per blog entry.
- Renders MDX article content and metadata at build time.
- Provides a static article header, back link, mood-category tag list, and warm readable body container.
- Uses `BaseLayout` and does not require browser JavaScript for readable article output.

### `src/styles/global.css`

Global stylesheet entry.

Current responsibilities:

- Imports Tailwind CSS.
- Defines the warm cream/beige visual system, ambient texture backgrounds, floating glass navigation, poetic homepage hero, reading status widget, mood timeline, diary/editorial cards, mood chips, calm article typography, and reduced-motion-safe CSS-only effects.

Keep global CSS small. Put component-specific styles near components when needed.

### `src/env.d.ts`

Astro TypeScript environment declarations. Generated/managed as standard Astro project support file.

### `scripts/process-images.mjs`

Build-time image processor.

Current responsibilities:

- Ensures `content-assets/incoming-images/`, `content-assets/processed-images/images/`, and `content-assets/processed-images/images/thumb/` exist.
- Recursively reads PNG, JPG, and JPEG source files from `content-assets/incoming-images/`.
- Computes SHA-256 from source image bytes and uses the first 16 characters as the stable public file name.
- Writes WebP main images to `content-assets/processed-images/images/[year]/[month]/[hash].webp`.
- Writes thumbnails to `content-assets/processed-images/images/thumb/[hash]_400w.webp`.
- Uses sharp at build time only; no runtime image conversion exists.
- Generates staged metadata at `content-assets/processed-images/manifest-images.json`.
- Deduplicates records by hash and skips unsupported file types with a clear warning.

### `scripts/generate-manifest.mjs`

Static manifest generator.

Current responsibilities:

- Reads staged metadata from `content-assets/processed-images/manifest-images.json` when present.
- Writes `public/manifest.json` with schema `{ version: 1, images: [...] }`.
- Deduplicates manifest records by image hash.
- Emits metadata only: hash, main URL, thumbnail URL, width, height, format, size, and created time.
- Writes an empty manifest if no processed metadata exists.

### `scripts/copy-processed-images.mjs`

Deployment asset staging script.

Current responsibilities:

- Copies `content-assets/processed-images/images/` into `dist/images/` after Astro build.
- Keeps processed image deployment separate from Astro `public/images/` long-term storage.

### `public/manifest.json`

Generated static image manifest consumed by future gallery and image components.

Current responsibilities:

- Stores image metadata for static pages and future gallery/image components.
- Uses schema `{ version: 1, images: [{ hash, url, thumbnailUrl, width, height, format, size, createdAt }] }`.
- May be committed because it contains metadata only, not image binaries.

### `memory-bank/`

Project planning and continuity documents for future agents.

Current responsibilities:

- `CloudStatic_设计文档.md`: product requirements and behavior rules.
- `tech-stack.md`: selected stack and architecture guidance.
- `implementation-plan.md`: staged execution checklist and verification criteria.
- `progress.md`: chronological implementation progress and handoff notes.
- `architecture.md`: current architecture, file responsibilities, and integration context.

## Asset flow target

Future intended flow:

1. Raw or uploaded images enter `content-assets/incoming-images/`.
2. Build-time script processes images with sharp.
3. Processed assets are written under `content-assets/processed-images/images/`.
4. Manifest metadata is generated without embedding image content.
5. Astro builds pages into `dist/`.
6. Separate copy step places processed images under `dist/images/` before deployment.
7. Wrangler deploys `dist/` as Cloudflare Workers Static Assets.

## Current boundaries

- Static reading surfaces should not call runtime APIs.
- React is reserved for interactive islands only.
- Image binaries should not enter main git history by default.
- Search, comments, analytics, CLI upload tooling, and anti-hotlink rules remain deferred.
