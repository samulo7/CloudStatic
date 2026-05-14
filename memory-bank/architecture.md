# CloudStatic Architecture

## Core architecture

CloudStatic follows Build Time Heavy, Runtime Zero.

- Build time handles content rendering, image processing, manifest generation, and static asset preparation.
- Runtime serves static HTML, CSS, JS, JSON, and images from Cloudflare Workers Static Assets.
- MVP must not introduce SSR, R2, KV, D1, or runtime image optimization.

## Current implementation state

Phase 2 added the blog content system foundation. The codebase now has a centralized Astro content collection schema, sample MDX posts, a shared static layout, a blog list page, and static article detail routes.

No production image processing exists yet. Current image scripts are placeholders so package commands exist and Step 1 workflows can run without failing.

## File and directory responsibilities

### `package.json`

Defines project metadata, dependencies, and canonical scripts.

Current scripts:

- `dev`: starts Astro dev server.
- `build`: builds static site into `dist/`.
- `preview`: previews built static output.
- `process:images`: reserved for build-time image processing.
- `generate:manifest`: generates image manifest JSON.

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
- Provides the main content slot for static pages.
- Does not add client state, theme logic, or runtime API calls.

### `src/pages/index.astro`

Static homepage route for `/`.

Current responsibilities:

- Renders CloudStatic product name and baseline description through `BaseLayout`.
- Documents visible architecture principle: Build Time Heavy, Runtime Zero.
- Links to the blog list route for manual navigation.

### `src/pages/blog/index.astro`

Static blog list route for `/blog/`.

Current responsibilities:

- Reads the `blog` content collection at build time.
- Sorts articles by publish date descending.
- Renders title, description, date, tags, and article links.
- Shows an empty state if no articles exist.

### `src/pages/blog/[slug].astro`

Static blog article route.

Current responsibilities:

- Uses `getStaticPaths()` to generate one static route per blog entry.
- Renders MDX article content and metadata at build time.
- Uses `BaseLayout` and does not require browser JavaScript for readable article output.

### `src/styles/global.css`

Global stylesheet entry.

Current responsibilities:

- Imports Tailwind CSS.

Keep global CSS small. Put component-specific styles near components when needed.

### `src/env.d.ts`

Astro TypeScript environment declarations. Generated/managed as standard Astro project support file.

### `scripts/process-images.mjs`

Placeholder for future build-time image processing.

Current responsibilities:

- Checks whether `content-assets/incoming-images/` exists.
- Prints a clear no-op message.
- Does not process files yet.

Future Phase 3 responsibilities:

- Read source images from `content-assets/incoming-images/`.
- Compute SHA-256 hash and use first 16 characters for output file names.
- Generate WebP main images and 400w thumbnails via sharp.
- Write processed outputs under `content-assets/processed-images/images/`.
- Avoid using `public/images/` as long-term image storage.

### `scripts/generate-manifest.mjs`

Placeholder manifest generator.

Current responsibilities:

- Ensures `public/` exists.
- Writes empty `public/manifest.json` with schema `{ version: 1, images: [] }`.

Future Phase 3 responsibilities:

- Generate metadata for processed images.
- Keep manifest JSON valid and deduplicated by image hash.
- Record hash, main URL, thumbnail URL, width, height, format, size, and created time.

### `public/manifest.json`

Generated static image manifest consumed by future gallery and image components.

Current responsibilities:

- Stores empty image list for baseline build.

This file may be committed because it contains metadata only, not image binaries.

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
