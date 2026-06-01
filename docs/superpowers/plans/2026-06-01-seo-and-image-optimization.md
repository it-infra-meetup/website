# SEO Essentials + Image Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add static SEO/social metadata and AVIF-optimized, correctly-sized images to the `apps/website` SPA, improving discoverability and Core Web Vitals without any routing/build/infra change.

**Architecture:** All metadata lives statically in `apps/website/index.html` + new files in `apps/website/public/`. High-res image **masters** move to a non-deployed `apps/website/branding/` directory; a committed `scripts/optimize-images.sh` regenerates **deliverables** (AVIF + resized fallback) into `public/`. Components wrap `<img>` in `<picture>` (AVIF source + original-format fallback). Generated deliverables are committed so the build (`vite build`) and CI pipeline are untouched.

**Tech Stack:** Vue 3 (`<script setup>`), Vite 8, TypeScript, ImageMagick 7 (AVIF via libheif), pnpm workspace. Spec: `docs/superpowers/specs/2026-06-01-seo-static-essentials-design.md`.

> **Note on testing:** `apps/website` has **no unit-test runner** (per CLAUDE.md, "the site has no tests"). Verification here is via the build (`pnpm build:website` / `vue-tsc -b`), `pnpm lint`, asset inspection (`identify`, `ls`, `grep` over `dist/`), and a couple of manual checks (Rich Results validator, DevTools Network). Do not add a test framework — that is out of scope.

> **Commit conventions:** Conventional Commits are enforced (commitlint via lefthook `commit-msg`). All work happens on a branch — direct pushes to `main` are blocked by a `pre-push` hook. A lefthook `pre-commit` hook runs lint/actionlint; if it blocks a commit, fix the reported issue and retry.

---

### Task 1: Create branch and commit the approved spec

**Files:**
- Modify: none (git only)

- [ ] **Step 1: Create and switch to a feature branch**

Run:
```bash
cd /home/a1678991/IdeaProjects/website
git switch -c feat/seo-and-image-optimization
```
Expected: `Switched to a new branch 'feat/seo-and-image-optimization'`

- [ ] **Step 2: Commit the design spec**

Run:
```bash
git add docs/superpowers/specs/2026-06-01-seo-static-essentials-design.md docs/superpowers/plans/2026-06-01-seo-and-image-optimization.md
git commit -m "docs(website): add SEO + image optimization design spec and plan"
```
Expected: a commit is created on `feat/seo-and-image-optimization`.

---

### Task 2: Move image masters to `branding/`, drop orphaned assets, add the optimize script

After this task the in-page images are no longer in `public/` (regenerated in Task 4). That is expected on this branch.

**Files:**
- Create: `apps/website/branding/` (+ `branding/lts/`) — high-res masters (moved)
- Create: `apps/website/scripts/optimize-images.sh`
- Delete: `apps/website/public/ITlogodayo.png`, `apps/website/public/it-infra-community.png`

- [ ] **Step 1: Create the branding directories and move masters**

Run:
```bash
cd /home/a1678991/IdeaProjects/website/apps/website
mkdir -p branding/lts
git mv public/ITlnfra.png branding/ITlnfra.png
git mv public/it-infra-lt.png branding/it-infra-lt.png
git mv public/it-infra-writing.png branding/it-infra-writing.png
git mv public/it-infra-lt-photo.png branding/it-infra-lt-photo.png
git mv public/favicon.png branding/favicon.png
git mv public/VRChat_Group.png branding/VRChat_Group.png
git mv public/lts/*.jpg branding/lts/
```
Expected: no errors; `ls branding` shows the 6 root masters; `ls branding/lts | wc -l` prints `40`.

- [ ] **Step 2: Delete the orphaned (unreferenced) assets**

Run:
```bash
git rm public/ITlogodayo.png public/it-infra-community.png
```
Expected: both files staged for deletion.

- [ ] **Step 3: Write the optimization script**

Create `apps/website/scripts/optimize-images.sh` with exactly:
```bash
#!/usr/bin/env bash
# Regenerate optimized image deliverables in public/ from masters in branding/.
# Requires ImageMagick 7 with AVIF (libheif). Run from anywhere; output is committed.
set -euo pipefail
cd "$(dirname "$0")/.."   # -> apps/website

mkdir -p public/lts

# --- Hero logo: 4045x1245 -> 960w, keep alpha ---
magick branding/ITlnfra.png -resize 960x -strip -define png:compression-level=9 public/ITlnfra.png
magick branding/ITlnfra.png -resize 960x -quality 55 public/ITlnfra.avif

# --- Atmosphere photos: native 560x320, keep alpha ---
for n in it-infra-lt it-infra-writing it-infra-lt-photo; do
  magick "branding/$n.png" -strip -define png:compression-level=9 "public/$n.png"
  magick "branding/$n.png" -quality 55 "public/$n.avif"
done

# --- LT gallery: 1920x1080 -> 800x450 ---
for f in branding/lts/*.jpg; do
  b="$(basename "$f" .jpg)"
  magick "$f" -resize 800x450 -strip -quality 82 "public/lts/$b.jpg"
  magick "$f" -resize 800x450 -quality 50 "public/lts/$b.avif"
done

# --- Favicon set (from 2000x2000 master) ---
magick branding/favicon.png -define icon:auto-resize=16,32,48 public/favicon.ico
magick branding/favicon.png -resize 180x180 public/apple-touch-icon.png
magick branding/favicon.png -resize 32x32   public/favicon-32x32.png
magick branding/favicon.png -resize 16x16   public/favicon-16x16.png
magick branding/favicon.png -resize 192x192 public/icon-192.png
magick branding/favicon.png -resize 512x512 public/icon-512.png

# --- OG image: 2048x1152 -> 1200x675, stays PNG (no AVIF for OG crawlers) ---
magick branding/VRChat_Group.png -resize 1200x675 -strip public/VRChat_Group.png

echo "Image deliverables regenerated in public/."
```

- [ ] **Step 2b: Make it executable**

Run:
```bash
chmod +x apps/website/scripts/optimize-images.sh
```

- [ ] **Step 3: Commit**

Run:
```bash
cd /home/a1678991/IdeaProjects/website
git add apps/website/branding apps/website/scripts/optimize-images.sh apps/website/public
git commit -m "chore(website): move image masters to branding/, add optimize-images script, drop orphaned assets"
```
Expected: commit records the renames, deletions, and new script.

---

### Task 3: Generate all image deliverables; commit favicon set + web manifest

Runs `optimize-images.sh` **once** to produce every deliverable (favicons, in-page AVIF/fallbacks, OG image). This task commits the favicon/icon files and the manifest; Task 4 verifies and commits the remaining in-page/OG deliverables produced by the same run.

**Files:**
- Create (generated): `apps/website/public/favicon.ico`, `apple-touch-icon.png`, `favicon-32x32.png`, `favicon-16x16.png`, `icon-192.png`, `icon-512.png` (plus in-page/OG deliverables, committed in Task 4)
- Create: `apps/website/public/site.webmanifest`

- [ ] **Step 1: Run the optimization script (generates all deliverables)**

Run:
```bash
/home/a1678991/IdeaProjects/website/apps/website/scripts/optimize-images.sh
```
Expected: ends with `Image deliverables regenerated in public/.` and no errors.

- [ ] **Step 2: Verify the icons exist with correct dimensions**

Run:
```bash
cd /home/a1678991/IdeaProjects/website/apps/website
identify -format "%f %wx%h\n" public/apple-touch-icon.png public/favicon-32x32.png public/favicon-16x16.png public/icon-192.png public/icon-512.png
```
Expected:
```
apple-touch-icon.png 180x180
favicon-32x32.png 32x32
favicon-16x16.png 16x16
icon-192.png 192x192
icon-512.png 512x512
```

- [ ] **Step 3: Write the web manifest**

Create `apps/website/public/site.webmanifest` with exactly:
```json
{
  "name": "ITインフラ集会",
  "short_name": "ITインフラ集会",
  "description": "VRChatで開催されるITインフラ技術コミュニティ",
  "lang": "ja",
  "start_url": "/",
  "display": "browser",
  "theme_color": "#007bff",
  "background_color": "#ffffff",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 4: Commit**

Run:
```bash
cd /home/a1678991/IdeaProjects/website
git add apps/website/public/favicon.ico apps/website/public/apple-touch-icon.png apps/website/public/favicon-32x32.png apps/website/public/favicon-16x16.png apps/website/public/icon-192.png apps/website/public/icon-512.png apps/website/public/site.webmanifest
git commit -m "feat(website): generate favicon set and web manifest"
```

---

### Task 4: Verify and commit in-page + OG image deliverables

The deliverables were already produced by the single `optimize-images.sh` run in Task 3; this task only verifies and commits the in-page/OG files (favicons + manifest were committed in Task 3).

**Files:**
- Create/modify (generated): `apps/website/public/ITlnfra.{avif,png}`, `it-infra-{lt,writing,lt-photo}.{avif,png}`, `lts/<date>.{avif,jpg}` (×40), `VRChat_Group.png`

- [ ] **Step 1: Confirm the deliverables are present (generated in Task 3)**

Run:
```bash
cd /home/a1678991/IdeaProjects/website/apps/website
git status --porcelain public | head
```
Expected: untracked/modified in-page image files (`ITlnfra.*`, `it-infra-*.*`, `lts/*`, `VRChat_Group.png`) are listed. If nothing image-related appears, re-run `scripts/optimize-images.sh`.

- [ ] **Step 2: Verify deliverables exist and are correctly sized**

Run:
```bash
cd /home/a1678991/IdeaProjects/website/apps/website
identify -format "%f %wx%h\n" public/ITlnfra.avif public/ITlnfra.png public/it-infra-lt.avif public/VRChat_Group.png
echo "avif count (expect 44): $(ls public/*.avif public/lts/*.avif | wc -l)"
echo "lt jpg count (expect 40): $(ls public/lts/*.jpg | wc -l)"
```
Expected: `ITlnfra.*` ≈ `960x295`; `it-infra-lt.avif` `560x320`; `VRChat_Group.png` `1200x675`; avif count `44` (1 hero + 3 atmosphere + 40 LT); LT jpg count `40`.

- [ ] **Step 3: Sanity-check the weight win**

Run:
```bash
cd /home/a1678991/IdeaProjects/website/apps/website
du -sh public/lts
```
Expected: materially smaller than the original ~7 MB (roughly ~2 MB of jpg + avif combined; exact value will vary).

- [ ] **Step 4: Commit**

Run:
```bash
cd /home/a1678991/IdeaProjects/website
git add apps/website/public
git commit -m "feat(website): generate AVIF + resized fallbacks for in-page and OG images"
```

---

### Task 5: Add robots.txt and sitemap.xml

**Files:**
- Create: `apps/website/public/robots.txt`, `apps/website/public/sitemap.xml`

- [ ] **Step 1: Write robots.txt**

Create `apps/website/public/robots.txt` with exactly:
```
User-agent: *
Allow: /

Sitemap: https://it-infra-meetup.org/sitemap.xml
```

- [ ] **Step 2: Write sitemap.xml**

Create `apps/website/public/sitemap.xml` with exactly:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://it-infra-meetup.org/</loc>
  </url>
</urlset>
```

- [ ] **Step 3: Commit**

Run:
```bash
cd /home/a1678991/IdeaProjects/website
git add apps/website/public/robots.txt apps/website/public/sitemap.xml
git commit -m "feat(website): add robots.txt and sitemap.xml"
```

---

### Task 6: Add SEO metadata, social cards, favicon links, and JSON-LD to index.html

**Files:**
- Modify: `apps/website/index.html` (full rewrite of `<head>`)

- [ ] **Step 1: Replace `apps/website/index.html` with the full content below**

```html
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ITインフラ集会 | VRChatのITインフラ技術コミュニティ</title>
    <meta name="description" content="VRChatで開催されるITインフラ技術コミュニティ。データセンター・ネットワーク・クラウド・社内SEなど、設計・構築・運用を語り合うLT・技術交流・機材談義イベントを定期開催。" />
    <link rel="canonical" href="https://it-infra-meetup.org/" />
    <meta name="theme-color" content="#007bff" />

    <!-- Icons -->
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />

    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="ITインフラ集会" />
    <meta property="og:title" content="ITインフラ集会" />
    <meta property="og:description" content="VRChatで開催されるITインフラ技術コミュニティ。データセンター・ネットワーク・クラウド・社内SEなど、設計・構築・運用を語り合うLT・技術交流・機材談義イベントを定期開催。" />
    <meta property="og:url" content="https://it-infra-meetup.org/" />
    <meta property="og:locale" content="ja_JP" />
    <meta property="og:image" content="https://it-infra-meetup.org/VRChat_Group.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="675" />
    <meta property="og:image:alt" content="ITインフラ集会" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@it_infra_meetup" />
    <meta name="twitter:title" content="ITインフラ集会" />
    <meta name="twitter:description" content="VRChatで開催されるITインフラ技術コミュニティ。データセンター・ネットワーク・クラウド・社内SEなど、設計・構築・運用を語り合うLT・技術交流・機材談義イベントを定期開催。" />
    <meta name="twitter:image" content="https://it-infra-meetup.org/VRChat_Group.png" />

    <!-- Structured data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "ITインフラ集会",
      "url": "https://it-infra-meetup.org/",
      "logo": "https://it-infra-meetup.org/icon-512.png",
      "description": "VRChatで開催されるITインフラ技術コミュニティ。",
      "sameAs": [
        "https://x.com/it_infra_meetup",
        "https://discord.gg/7EtJz53ugA",
        "https://vrchat.com/home/group/grp_caa820c4-7aa6-48bc-a7bc-593376245419"
      ]
    }
    </script>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "ITインフラ集会",
      "url": "https://it-infra-meetup.org/",
      "inLanguage": "ja"
    }
    </script>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Noto+Sans+JP:wght@300;500;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 2: Build and confirm the metadata is present in the output**

Run:
```bash
cd /home/a1678991/IdeaProjects/website
pnpm build:website
grep -c "og:image" apps/website/dist/index.html
grep -c "application/ld+json" apps/website/dist/index.html
grep -c "vite.svg" apps/website/dist/index.html || true
```
Expected: build succeeds; `og:image` count `≥1`; `application/ld+json` count `2`; `vite.svg` count `0`.

- [ ] **Step 3: Validate the two JSON-LD blocks are well-formed JSON**

Run:
```bash
cd /home/a1678991/IdeaProjects/website
node -e "const h=require('fs').readFileSync('apps/website/dist/index.html','utf8');const m=[...h.matchAll(/<script type=\"application\/ld\+json\">([\s\S]*?)<\/script>/g)];if(m.length!==2)throw new Error('expected 2 blocks, got '+m.length);m.forEach(x=>JSON.parse(x[1]));console.log('JSON-LD OK:',m.length,'blocks')"
```
Expected: `JSON-LD OK: 2 blocks` (throws if any block is invalid JSON).

- [ ] **Step 4: Commit**

Run:
```bash
git add apps/website/index.html
git commit -m "feat(website): add SEO meta, Open Graph/Twitter cards, favicon links, and JSON-LD"
```

---

### Task 7: Convert HeroSection logo to `<picture>` (AVIF + fallback)

**Files:**
- Modify: `apps/website/src/components/sections/HeroSection.vue` (the `ITlnfra.png` `<img>`, around line 9)

- [ ] **Step 1: Replace the Hero `<img>` with a `<picture>`**

Find (in `apps/website/src/components/sections/HeroSection.vue`):
```html
          <img :src="`${baseUrl}ITlnfra.png`">
```
Replace with:
```html
          <picture>
            <source :srcset="`${baseUrl}ITlnfra.avif`" type="image/avif">
            <img :src="`${baseUrl}ITlnfra.png`" alt="ITインフラ集会" width="960" height="295" decoding="async">
          </picture>
```

- [ ] **Step 2: Type-check, lint, and build**

Run:
```bash
cd /home/a1678991/IdeaProjects/website
pnpm typecheck && pnpm --filter website lint && pnpm build:website
```
Expected: all succeed with no errors.

- [ ] **Step 3: Commit**

Run:
```bash
git add apps/website/src/components/sections/HeroSection.vue
git commit -m "perf(website): serve Hero logo as AVIF with fallback"
```

---

### Task 8: Convert AtmosphereSection images to `<picture>` (AVIF + fallback)

**Files:**
- Modify: `apps/website/src/components/sections/AtmosphereSection.vue` (the `<img>` at line 20; add an `.avif` path helper in `<script setup>`)

- [ ] **Step 1: Add an avif-path helper to `<script setup>`**

In `apps/website/src/components/sections/AtmosphereSection.vue`, find:
```ts
const baseUrl = import.meta.env.BASE_URL
```
Add immediately after it:
```ts
const toAvif = (src: string): string => src.replace(/\.(png|jpe?g)$/i, '.avif')
```

- [ ] **Step 2: Replace the `<img>` with a `<picture>`**

Find:
```html
            <img class="mb-4" alt="" :src="item.img">
```
Replace with:
```html
            <picture>
              <source :srcset="toAvif(item.img)" type="image/avif">
              <img class="mb-4" :src="item.img" :alt="item.title" width="560" height="320" loading="lazy" decoding="async">
            </picture>
```

- [ ] **Step 3: Type-check, lint, and build**

Run:
```bash
cd /home/a1678991/IdeaProjects/website
pnpm typecheck && pnpm --filter website lint && pnpm build:website
```
Expected: all succeed.

- [ ] **Step 4: Commit**

Run:
```bash
git add apps/website/src/components/sections/AtmosphereSection.vue
git commit -m "perf(website): serve Atmosphere images as AVIF with fallback"
```

---

### Task 9: Convert LtCard thumbnail to `<picture>` (AVIF + fallback)

**Files:**
- Modify: `apps/website/src/components/lt/LtCard.vue` (the `<img>` at lines 4-8; add a computed `avifSrc`)

- [ ] **Step 1: Add the `avifSrc` computed to `<script setup>`**

In `apps/website/src/components/lt/LtCard.vue`, replace:
```ts
import { Calendar } from '@lucide/vue'

defineProps<{
  date: string
  title: string
  author: string
  image?: string
}>()
```
with:
```ts
import { computed } from 'vue'
import { Calendar } from '@lucide/vue'

const props = defineProps<{
  date: string
  title: string
  author: string
  image?: string
}>()

const avifSrc = computed(() => props.image?.replace(/\.(jpe?g|png)$/i, '.avif'))
```

- [ ] **Step 2: Replace the thumbnail `<img>` with a `<picture>`**

Find:
```html
      <img
        v-if="image"
        :src="image"
        :alt="title"
      >
```
Replace with:
```html
      <picture v-if="image">
        <source :srcset="avifSrc" type="image/avif">
        <img :src="image" :alt="title" width="800" height="450" loading="lazy" decoding="async">
      </picture>
```

- [ ] **Step 3: Type-check, lint, and build**

Run:
```bash
cd /home/a1678991/IdeaProjects/website
pnpm typecheck && pnpm --filter website lint && pnpm build:website
```
Expected: all succeed. (Note: `avifSrc` is `string | undefined`; binding it to `<source srcset>` is valid — an undefined srcset simply makes that source inert, and the `v-if="image"` guard means it is only rendered when `image` is set.)

- [ ] **Step 4: Commit**

Run:
```bash
git add apps/website/src/components/lt/LtCard.vue
git commit -m "perf(website): serve LT gallery thumbnails as AVIF with fallback"
```

---

### Task 10: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Full type-check, lint, and build**

Run:
```bash
cd /home/a1678991/IdeaProjects/website
pnpm typecheck && pnpm lint && pnpm build:website
```
Expected: all pass with no errors.

- [ ] **Step 2: Confirm deployed output contains the right files and not the masters/orphans**

Run:
```bash
cd /home/a1678991/IdeaProjects/website/apps/website
ls dist/robots.txt dist/sitemap.xml dist/site.webmanifest dist/favicon.ico dist/VRChat_Group.png dist/icon-512.png
echo "dist avif (expect 44): $(ls dist/*.avif dist/lts/*.avif | wc -l)"
ls dist/ITlogodayo.png dist/it-infra-community.png 2>/dev/null && echo "ERROR: orphan in dist" || echo "OK: orphans absent"
test -d dist/branding && echo "ERROR: branding shipped" || echo "OK: branding not shipped"
```
Expected: the listed files exist; avif count `44`; "OK: orphans absent"; "OK: branding not shipped".

- [ ] **Step 3: Manual — preview and check images + favicon load**

Run:
```bash
cd /home/a1678991/IdeaProjects/website
pnpm --filter website preview
```
Then in a browser at the printed URL: confirm the favicon appears (no 404), the Hero logo, Atmosphere images, and (at `/#/lt-list`) the LT thumbnails render. In DevTools → Network, filter images and confirm `.avif` is served to this (AVIF-capable) browser. Stop the preview server when done (Ctrl-C).

- [ ] **Step 4: Manual — validate structured data**

Paste `https://it-infra-meetup.org/` (after deploy) or the contents of the two JSON-LD blocks into Google's Rich Results Test (https://search.google.com/test/rich-results) or the Schema Markup Validator (https://validator.schema.org/). Expected: `Organization` and `WebSite` detected, no errors. (Pre-deploy, the JSON validity was already confirmed in Task 6 Step 3.)

- [ ] **Step 5: Finish the branch**

Use the superpowers:finishing-a-development-branch skill to decide how to integrate (open a PR — merging to `main` is what triggers the automated deploy). Do not deploy manually.

---

## Notes for the implementer

- **Post-deploy follow-ups (not part of this plan):** submit the sitemap in Google Search Console; re-scrape the OG card with the X/Discord/Facebook debuggers so caches pick up the new card.
- **Regenerating images later:** edit/add a master in `branding/` (and its `ltImagePaths.ts` entry for new LTs), run `apps/website/scripts/optimize-images.sh`, and commit the regenerated `public/` deliverables.
- **Deferred (future tiers):** Event JSON-LD from live data, per-route `<title>`/meta, HTML5 history routing + prerendering, responsive multi-width `srcset`.
