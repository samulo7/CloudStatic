# Progress

## 2026-05-18 — Phase 7.2 hosted deploy verified; custom domain troubleshooting ongoing

Phase 7.2 remote verification succeeded. Phase 8 quality checks were not started.

What changed after local Phase 7.2 implementation:

- Created commit `cfdb487` (`Add gated Cloudflare deploy workflow`) and pushed it to `origin/master`.
- GitHub Actions `CI` workflow ran on `master` and succeeded, including `Deploy to Cloudflare Workers Static Assets`.
- Cloudflare dashboard showed Worker project `cloudstatic` with workers.dev domain `cloudstatic.catherine.workers.dev` and no bindings, matching the static-only MVP target.
- `https://cloudstatic.catherine.workers.dev/` returned the CloudStatic Astro homepage, confirming the deployed Static Assets output is correct.

Custom domain investigation:

- User added custom domain `cloudstatic.775774.xyz` to the `cloudstatic` Worker.
- Cloudflare DNS shows an auto-managed, read-only Worker record: `cloudstatic.775774.xyz` -> `cloudstatic`.
- Public DNS resolves `cloudstatic.775774.xyz` to Cloudflare edge IPs.
- Requests to `https://cloudstatic.775774.xyz/` still return Docker registry proxy JSON, not the CloudStatic homepage.
- Cache-busted requests and paths such as `/blog/` and `/manifest.json` also return the same Docker registry proxy JSON, so this is not a browser cache issue.
- `/cdn-cgi/trace` confirms requests enter Cloudflare for host `cloudstatic.775774.xyz`.
- Removing the previous wildcard DNS entry did not fix the custom domain behavior.
- Current suspected issue is Cloudflare custom-domain/Worker binding state or a residual service mapping for this hostname, not the Astro build or Workers Static Assets deployment itself.

Next planned work:

- Do not start Phase 8 until the user explicitly approves it after custom-domain verification.
- Test a fresh hostname such as `cs.775774.xyz` or `blog.775774.xyz` as a new custom domain for the `cloudstatic` Worker.
- If the fresh hostname works, treat `cloudstatic.775774.xyz` as stale/residual and either abandon it or re-add it later.
- If the fresh hostname also returns Docker proxy JSON, re-run the GitHub Actions deployment or inspect Cloudflare Workers & Pages for residual Docker proxy service mappings.

## 2026-05-18 — Phase 7.2 gated deploy workflow implemented

Implemented implementation-plan Phase 7.2 only. Phase 8 quality checks were not started.

What changed:

- Added a Wrangler deploy step to `.github/workflows/ci.yml` after build artifact upload.
- Deploy runs only for `push` events on `refs/heads/master`.
- Pull requests and non-master branches still build, verify artifacts, and upload `cloudstatic-dist`, but skip deployment.
- Deploy uses GitHub Secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` through environment variables.
- Updated `memory-bank/architecture.md` with Phase 7.2 CI deploy behavior, secret requirements, and branch gating.
- No formatter, type checker, test tooling, R2, KV, D1, SSR, Worker runtime handler, or runtime image optimization was added.

Verification:

- `pnpm install --frozen-lockfile` passed locally with pnpm 10.32.1.
- `pnpm process:images` passed; processed 2 images and skipped unsupported `not-image.txt` with warning.
- `pnpm generate:manifest` passed; generated `public/manifest.json` with 2 images.
- `pnpm build` passed and generated 6 static pages.
- `pnpm copy:images` passed; copied processed images to `dist/images/`.
- Local artifact checks passed for `dist/index.html`, `dist/manifest.json`, and `dist/images/`.
- `pnpm exec wrangler deploy --dry-run` passed; read 27 files from `dist`, reported no bindings, and did not publish.

Next planned work:

- User should configure GitHub Secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` before expecting master deploy to succeed.
- User should verify GitHub Actions behavior: PR/non-master builds skip deploy; master push deploys after build.
- Do not start Phase 8 checks until user explicitly verifies Phase 7.2 and approves Phase 8.

## 2026-05-18 — Phase 7.1 local verification re-run

Re-ran Phase 7.1 local verification only. Phase 7.2 deploy and Phase 8 quality checks were not started.

Verification:

- `pnpm install --frozen-lockfile` passed locally with pnpm 10.32.1.
- `pnpm process:images` passed; processed 2 images and skipped unsupported `not-image.txt` with warning.
- `pnpm generate:manifest` passed; generated `public/manifest.json` with 2 images.
- `pnpm build` passed and generated 6 static pages.
- `pnpm copy:images` passed; copied processed images to `dist/images/`.
- Local artifact checks passed for `dist/index.html`, `dist/manifest.json`, and `dist/images/`.
- Git status/diff were clean before updating this progress entry.

Next planned work:

- User should verify Phase 7.1 CI behavior by pushing or opening a pull request when ready.
- Do not start Phase 7.2 deploy or Phase 8 checks until user explicitly approves.

## 2026-05-15 — Phase 7.1 CI build workflow implemented

Implemented implementation-plan Phase 7.1 only. Phase 7.2 deploy and Phase 8 quality checks were not started.

What changed:

- Added `.github/workflows/ci.yml` for GitHub Actions build verification.
- Workflow runs on `push` and `pull_request`.
- CI installs dependencies with `pnpm install --frozen-lockfile`.
- CI runs `pnpm process:images`, `pnpm generate:manifest`, `pnpm build`, and `pnpm copy:images`.
- CI verifies `dist/index.html`, `dist/manifest.json`, and `dist/images/` exist.
- CI uploads `dist/` as the `cloudstatic-dist` artifact for inspection.
- Added `packageManager` to `package.json` so `pnpm/action-setup` can install pnpm in CI.
- Updated manifest generation to preserve committed manifest records when CI has no ignored source images.
- No deploy step, Cloudflare secrets, auto-commit behavior, or Phase 8 checks were added.

Verification:

- `pnpm install --frozen-lockfile` passed locally with pnpm 10.32.1.
- `pnpm generate:manifest` passed with processed metadata temporarily absent; committed manifest retained 2 images.
- `pnpm build` passed after manifest-retention test.
- `pnpm process:images` passed; processed 2 images and skipped unsupported `not-image.txt` with warning.
- `pnpm generate:manifest` passed; generated `public/manifest.json` with 2 images.
- `pnpm build` passed and generated 6 static pages.
- `pnpm copy:images` passed; copied processed images to `dist/images/`.
- Local artifact checks passed for `dist/index.html`, `dist/manifest.json`, and `dist/images/`.
- GitHub Actions verification requires push or pull request after user review.

Next planned work:

- Run local Phase 7.1 verification commands.
- User should verify Phase 7.1 test results and CI behavior.
- Do not start Phase 7.2 deploy or Phase 8 checks until user explicitly approves.

## 2026-05-15 — Phase 6 Cloudflare deployment foundation complete

Implemented implementation-plan Phase 6 only. Phase 7 CI workflow was not started.

What changed:

- Added `wrangler.toml` with project name `cloudstatic`.
- Configured `[assets] directory = "./dist"` for Cloudflare Workers Static Assets.
- Did not add Worker runtime handlers, SSR, R2, KV, D1, or runtime image optimization.
- Confirmed existing `pnpm copy:images` stages `content-assets/processed-images/images/` into `dist/images/` after Astro build.
- Updated `memory-bank/architecture.md` with Wrangler deployment responsibilities and preflight flow.

Verification:

- `pnpm build` passed and generated 6 static pages.
- `pnpm copy:images` copied processed images to `dist/images/`.
- `pnpm exec wrangler deploy --dry-run` passed, read 27 files from `dist`, and reported no bindings.
- Verified `dist/manifest.json`, main image, thumbnail, gallery page, upload page, and article page exist.
- Production preview served `/`, `/blog/`, `/blog/hello-cloudstatic/`, `/gallery/`, `/upload/`, image URLs, thumbnail URL, and `/manifest.json` with HTTP 200 on port 4323.

Next planned work:

- User should verify Phase 6 browser behavior and deployment config.
- Do not start Phase 7 CI foundation until user explicitly approves.

## 2026-05-15 — Phase 5 article image integration complete

Implemented implementation-plan Phase 5 only. Phase 6 was not started.

What changed:

- Added `src/components/CloudImage.astro` for manifest-backed static article images.
- `CloudImage` reads `public/manifest.json` at build time and looks up images by hash.
- `CloudImage` renders main image URL, thumbnail `srcset`, width, height, `loading="lazy"`, `decoding="async"`, and caller-provided alt text.
- `CloudImage` fails the build if an MDX article references a hash missing from the manifest.
- Updated `src/content/blog/hello-cloudstatic.mdx` to import `CloudImage` and reference existing hash `85565496ee0bf3ce`.
- Added minimal article image styling via `.cloud-image`.
- Updated `memory-bank/architecture.md` with Phase 5 component and content responsibilities.

Verification:

- `pnpm build` passed and generated `/blog/hello-cloudstatic/`.
- `pnpm copy:images` copied processed images to `dist/images/`.
- Generated `dist/blog/hello-cloudstatic/index.html` contains `/images/2026/05/85565496ee0bf3ce.webp`.
- Generated article HTML contains thumbnail `srcset`, `width="800"`, `height="600"`, `loading="lazy"`, and `decoding="async"`.

Next planned work:

- User should verify Phase 5 browser behavior.
- Do not start Phase 6 Cloudflare deployment foundation until user explicitly approves.

## 2026-05-15 — Phase 4 image management MVP implemented

Implemented implementation-plan Phase 4 only. Phase 5 was not started.

What changed:

- Added static gallery route at `src/pages/gallery.astro`.
- Gallery reads `public/manifest.json` at build time and renders image cards or an empty state.
- Added `src/components/ImageLinkActions.tsx` React island for Markdown, HTML, and URL copy actions.
- Added upload preview route at `src/pages/upload.astro`.
- Added `src/components/UploadPreviewIsland.tsx` React island for drag/drop, file picker, multiple previews, removal, and non-image errors.
- Added Gallery and Upload links to shared navigation.
- Added focused gallery, copy-control, upload, and preview styles.
- Updated `memory-bank/architecture.md` with Phase 4 route/component responsibilities.

Verification:

- `pnpm build` passed and generated `/gallery/` plus `/upload/` static routes.
- `pnpm copy:images` copied processed images to `dist/images/`.
- Generated `dist/gallery/index.html` shows empty state with current empty manifest.
- Generated `dist/upload/index.html` includes upload shell, CI/deploy notice, and hydrated preview island markup.
- Browser interaction checks are pending user verification.

Next planned work:

- Run Phase 4 verification.
- User should verify Phase 4 test results.
- Do not start Phase 5 article image integration until user explicitly approves.

## 2026-05-15 — Phase 3 image-processing foundation complete

Completed implementation-plan Phase 3 only. Phase 4 was not started.

What changed:

- Replaced placeholder `scripts/process-images.mjs` with sharp-based build-time image processing.
- Source images are read from `content-assets/incoming-images/`.
- Processed WebP main images are written to `content-assets/processed-images/images/[year]/[month]/[hash].webp`.
- 400w thumbnails are written to `content-assets/processed-images/images/thumb/[hash]_400w.webp` without enlarging small images.
- SHA-256 first 16 characters are used for stable URL filenames and dedupe.
- Unsupported files are skipped with a clear warning.
- Replaced placeholder `scripts/generate-manifest.mjs` with manifest generation from processed metadata.
- Added `scripts/copy-processed-images.mjs` and `pnpm copy:images` for post-build copying into `dist/images/`.
- Kept image binaries under ignored `content-assets/incoming-images/` and `content-assets/processed-images/` paths.
- Updated `memory-bank/architecture.md` with current Phase 3 architecture.

Verification:

- `pnpm process:images` creates required input/output directories and staged metadata.
- PNG and JPG fixtures generated WebP outputs.
- Duplicate PNG fixture deduped to one hash record.
- Chinese/space/special-character source filename produced safe hash URL.
- Unsupported `.txt` fixture was skipped with warning.
- `pnpm generate:manifest` generated valid `public/manifest.json` with 2 image records.
- Re-running processing kept manifest at 2 image records.
- Large-image thumbnail width verified as 400px.
- Small-image thumbnail width verified as 320px, not enlarged.
- `pnpm build` passed.
- `pnpm copy:images` copied processed images to `dist/images/`.

Next planned work:

- User should verify Step 3 test results.
- Do not start Phase 4 gallery/link/upload work until user explicitly approves.

## 2026-05-14 — Phase 2 blog foundation and homepage UI iteration complete

Completed implementation-plan Phase 2 and subsequent homepage visual iterations.

What changed:

- Added Astro blog content collection with MDX posts and centralized schema.
- Added shared `BaseLayout` with static navigation and metadata props.
- Added static blog list route at `src/pages/blog/index.astro`.
- Added static article detail route at `src/pages/blog/[slug].astro`.
- Redesigned homepage into CloudStatic Journal, a poetic static personal-blog landing page.
- Added dynamic homepage post count and latest-post mood timeline from the `blog` content collection.
- Added reading status widget, editorial principle cards, signature quote, ambient footer, floating glass navigation, paper textures, and CSS-only subtle motion.
- Refined hero spacing to avoid title/card overlap on desktop and stack safely on medium screens.
- Reduced overuse of handwritten type by keeping body and timeline article text in sans-serif.
- Kept unfinished gallery/upload navigation hidden.

Verification:

- `pnpm build` passes.
- Static output generates `/`, `/blog/`, `/blog/hello-cloudstatic/`, and `/blog/build-time-heavy/`.
- No Phase 3 image-processing logic, runtime API, SSR, R2, KV, D1, client state, or React island was added.

Next planned work:

- User visual verification of current CloudStatic Journal UI.
- Prioritize blog list and article page styling before deeper homepage polish.
- Review mobile behavior, especially large heading wraps.
- Add gallery/upload navigation only after those features exist.
- Do not start Phase 3 image processing until user explicitly approves moving on.

## 2026-05-14 — Phase 1 complete

Completed implementation-plan Phase 1: initialized Astro static project baseline.

What changed:

- Created Astro project with TypeScript-oriented structure.
- Added package scripts:
  - `pnpm dev`
  - `pnpm build`
  - `pnpm preview`
  - `pnpm process:images`
  - `pnpm generate:manifest`
- Added dependencies for MVP stack:
  - Astro
  - MDX integration
  - React integration
  - Tailwind CSS via Vite plugin
  - sharp
  - Wrangler
- Configured `astro.config.mjs` with MDX, React, and Tailwind Vite plugin.
- Created minimal homepage at `src/pages/index.astro` showing CloudStatic baseline copy and Build Time Heavy, Runtime Zero principle.
- Created global stylesheet at `src/styles/global.css` importing Tailwind.
- Created placeholder scripts:
  - `scripts/process-images.mjs` currently reports no-op image processing for Step 1.
  - `scripts/generate-manifest.mjs` generates empty `public/manifest.json`.

Verified by user before this update:

- Dependencies install successfully.
- Local development server starts.
- Default page opens in browser.
- Production build succeeds and generates `dist/`.
- Step 1 verification passed.

Next planned work:

- Continue with implementation-plan Phase 2 only after this documentation backfill.
- Phase 2 scope: MDX content collection, shared layout, blog list page, article detail page.
- Do not start Phase 3 image processing until user verifies Phase 2 tests.
