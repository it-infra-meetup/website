# SEO Static Essentials + Image Optimization — Design

- **Date:** 2026-06-01
- **Status:** Approved (pending spec review)
- **Scope tier:** Static essentials (no routing/build-pipeline/infra change)

## Context

`apps/website` is a Vue 3 SPA served as static files from S3/CloudFront. Two problems:

1. **No SEO / social metadata.** `index.html`'s `<head>` has only `lang="ja"`, charset,
   viewport, a `<title>`, and Google Fonts links. No description, canonical, Open Graph/Twitter
   tags, structured data, robots.txt, or sitemap. The favicon link (`/vite.svg`) points at a
   file that does not exist → 404 favicon.
2. **Unoptimized images.** In-page images are oversized and in heavy formats: the Hero logo
   `ITlnfra.png` is 4045×1245, the 40 LT gallery photos are 1920×1080 JPEGs (~7 MB total) shown
   as small thumbnails, and the three Atmosphere PNGs are 200–290 KB each. Two assets
   (`ITlogodayo.png`, `it-infra-community.png`) are not referenced anywhere (≈420 KB dead weight).

Production domain: **`https://it-infra-meetup.org/`**. Brand primary `#007bff`; light background
gradient `#e0f7fa` → `#ffffff`.

User-supplied assets (currently in `apps/website/public/`):
- `VRChat_Group.png` — 2048×1152 (16:9), the Open Graph / Twitter share image.
- `favicon.png` — 2000×2000 square (cloud mascot), the favicon source.

Local tooling confirmed: ImageMagick 7.1.2 with AVIF read/write (libheif 1.22.2), plus
`avifenc`/`heif-enc` and WebP support.

## Goals

1. Make the site friendly to search engines and social-share crawlers using only static files
   baked into `index.html` and `public/`.
2. Cut image weight (AVIF + correct dimensions) to improve Core Web Vitals (LCP/CLS), without
   changing routing, build tooling, or the CloudFront/S3 pipeline.

## Out of scope (explicitly deferred)

- **Event JSON-LD / event rich results** — needs the live next-event date (runtime). Deferred.
  (`Organization` + `WebSite` JSON-LD, which are static, ARE in scope.)
- **Per-route meta tags** (distinct `<title>`/description for `/lt-list`) — needs a head-management
  approach; tier B.
- **Hash routing → HTML5 history routing** and **build-time prerendering (SSG)** — tier C.
- **Build-time/CI image generation.** Optimized image deliverables are generated locally by a
  documented script and **committed**, keeping the build and CI tooling unchanged (the existing
  `release.yml` just runs `vite build` + `s3 sync`). Repo size grows modestly as a tradeoff.
- **Responsive multi-width `srcset`.** Single properly-sized variant per image; multi-width is a
  future option.

Because the site stays on hash routing, `/#/lt-list` is not a distinct URL to crawlers, so the
sitemap lists only the homepage. Accepted limitation of the static tier.

---

## Part A — SEO metadata

All edits in `apps/website/index.html` plus new files in `apps/website/public/`.

### A1. Core `<head>` meta
- **Title** (replace): `ITインフラ集会 | VRChatのITインフラ技術コミュニティ`
- **Description** (~85 full-width chars):
  `VRChatで開催されるITインフラ技術コミュニティ。データセンター・ネットワーク・クラウド・社内SEなど、設計・構築・運用を語り合うLT・技術交流・機材談義イベントを定期開催。`
- `<link rel="canonical" href="https://it-infra-meetup.org/">`
- `<meta name="theme-color" content="#007bff">`
- Keep existing `lang="ja"`, charset, viewport.

### A2. Open Graph + Twitter Card
```html
<meta property="og:type" content="website">
<meta property="og:site_name" content="ITインフラ集会">
<meta property="og:title" content="ITインフラ集会">
<meta property="og:description" content="<same as A1 description>">
<meta property="og:url" content="https://it-infra-meetup.org/">
<meta property="og:locale" content="ja_JP">
<meta property="og:image" content="https://it-infra-meetup.org/VRChat_Group.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="675">
<meta property="og:image:alt" content="ITインフラ集会">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@it_infra_meetup">
<meta name="twitter:title" content="ITインフラ集会">
<meta name="twitter:description" content="<same as A1 description>">
<meta name="twitter:image" content="https://it-infra-meetup.org/VRChat_Group.png">
```
`og:image`/`twitter:image` must be absolute URLs. Dimensions reflect the resized OG image (B4).
The OG image stays **PNG** — AVIF is not reliably supported by OG crawlers (X/Discord/Slack/LINE/FB).

### A3. JSON-LD structured data (in `index.html`)
```html
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
```
`logo` points at the generated `icon-512.png` (not the oversized 2000² source, which is no
longer deployed — see B3).

### A4. `public/robots.txt`
```
User-agent: *
Allow: /

Sitemap: https://it-infra-meetup.org/sitemap.xml
```

### A5. `public/sitemap.xml`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://it-infra-meetup.org/</loc>
  </url>
</urlset>
```
Homepage only (hash routing). `<lastmod>` omitted to avoid a stale static value.

---

## Part B — Image optimization

### Source/deliverable separation

Introduce `apps/website/branding/` (NOT deployed — outside `public/` and `src/`) to hold
high-resolution **masters**. `public/` holds only **deliverables** (what ships). A committed
script regenerates deliverables from masters idempotently.

- **Move to `branding/`:** `ITlnfra.png` (4045²-wide), `it-infra-lt.png`, `it-infra-writing.png`,
  `it-infra-lt-photo.png`, `favicon.png` (2000²), `VRChat_Group.png` (2048×1152), and
  `lts/*.jpg` (×40, 1920×1080 masters → `branding/lts/`).
- **Delete (orphaned, unreferenced):** `public/ITlogodayo.png`, `public/it-infra-community.png`.

### Format strategy (in-page images): AVIF + original-format fallback

Each in-page image becomes a `<picture>`: an AVIF `<source>` for modern browsers plus an
`<img>` fallback in the original (alpha-capable) format, both resized to proper display size.
Two files per image; the fallback guarantees universal correctness (covers older Safari etc.),
AVIF serves the modern majority.

| Image(s) | Master | Deliverables (in `public/`) | Target size | Notes |
| --- | --- | --- | --- | --- |
| Hero `ITlnfra` | 4045×1245 PNG (alpha) | `ITlnfra.avif` + `ITlnfra.png` | width 960 (≈960×295) | above-the-fold → eager load |
| Atmosphere ×3 | 560×320 PNG (alpha) | `<name>.avif` + `<name>.png` | 560×320 (native) | win is format; below-fold → lazy |
| LT gallery ×40 | 1920×1080 JPEG | `lts/<date>.avif` + `lts/<date>.jpg` | 800×450 | thumbnails; lazy load |

If `magick identify` confirms an Atmosphere PNG is fully opaque, its fallback may be emitted as
JPEG (smaller); otherwise keep PNG to preserve alpha.

### B1. Component changes (wrap `<img>` in `<picture>`, add dimensions + loading hints)

**`HeroSection.vue`** — the `ITlnfra` image:
```html
<picture>
  <source :srcset="`${baseUrl}ITlnfra.avif`" type="image/avif">
  <img :src="`${baseUrl}ITlnfra.png`" alt="ITインフラ集会" width="960" height="295" decoding="async">
</picture>
```

**`AtmosphereSection.vue`** — each item image: wrap in `<picture>`, derive the `.avif` path from
the item's `img` (replace extension), add `width="560" height="320"`, `loading="lazy"`,
`decoding="async"`, and a meaningful `alt` (use the item `title`/`description`).

**`LtCard.vue`** — the thumbnail:
```html
<picture v-if="image">
  <source :srcset="avifSrc" type="image/avif">
  <img :src="image" :alt="title" width="800" height="450" loading="lazy" decoding="async">
</picture>
```
with `const avifSrc = computed(() => image?.replace(/\.(jpe?g|png)$/i, '.avif'))`. The existing
`v-else` no-image placeholder is unchanged.

`ltImagePaths.ts` is unchanged (still points at `.jpg`); LtCard derives the `.avif` sibling.

### B2. Generation script: `apps/website/scripts/optimize-images.sh`

Documents/automates regeneration from `branding/` → `public/` (run locally when images change;
output is committed). Sketch:
```bash
set -euo pipefail
cd "$(dirname "$0")/.."        # apps/website

# Hero (resize 960w, keep alpha)
magick branding/ITlnfra.png -resize 960x        -strip public/ITlnfra.png
magick branding/ITlnfra.png -resize 960x -quality 55 public/ITlnfra.avif

# Atmosphere ×3 (native 560×320)
for n in it-infra-lt it-infra-writing it-infra-lt-photo; do
  magick "branding/$n.png" -strip            "public/$n.png"
  magick "branding/$n.png" -quality 55       "public/$n.avif"
done

# LT gallery ×40 (1920×1080 → 800×450)
for f in branding/lts/*.jpg; do
  b="$(basename "$f" .jpg)"
  magick "$f" -resize 800x450 -strip -quality 82 "public/lts/$b.jpg"
  magick "$f" -resize 800x450 -quality 50        "public/lts/$b.avif"
done
```
(`avifenc` is available as an alternative for finer AVIF tuning if `magick` quality is
insufficient.)

### B3. Favicon set (from `branding/favicon.png`)
```bash
magick branding/favicon.png -define icon:auto-resize=16,32,48 public/favicon.ico
magick branding/favicon.png -resize 180x180 public/apple-touch-icon.png
magick branding/favicon.png -resize 32x32   public/favicon-32x32.png
magick branding/favicon.png -resize 16x16   public/favicon-16x16.png
magick branding/favicon.png -resize 192x192 public/icon-192.png
magick branding/favicon.png -resize 512x512 public/icon-512.png
```
`<head>` links (replace the broken `/vite.svg` line):
```html
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
```
The 2000² source lives only in `branding/` and is not deployed.

`public/site.webmanifest`:
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

### B4. OG image resize (`branding/VRChat_Group.png` → `public/VRChat_Group.png`)
```bash
magick branding/VRChat_Group.png -resize 1200x675 -strip public/VRChat_Group.png
```
Stays PNG (crisp logo/text, no AVIF for OG). 16:9 preserved (2048×1152 → 1200×675), matching the
`og:image:width/height` in A2.

---

## Files touched

| File | Change |
| --- | --- |
| `apps/website/index.html` | Meta/OG/Twitter/canonical/theme-color, favicon links, JSON-LD; remove `vite.svg` link |
| `apps/website/src/components/sections/HeroSection.vue` | `<img>` → `<picture>` (AVIF + PNG), width/height |
| `apps/website/src/components/sections/AtmosphereSection.vue` | `<img>` → `<picture>` ×3, alt/dims/lazy |
| `apps/website/src/components/lt/LtCard.vue` | `<img>` → `<picture>`, `avifSrc` computed, dims/lazy |
| `apps/website/scripts/optimize-images.sh` | New — regeneration script |
| `apps/website/branding/**` | New — high-res masters (moved out of `public/`) |
| `apps/website/public/robots.txt` | New |
| `apps/website/public/sitemap.xml` | New |
| `apps/website/public/site.webmanifest` | New |
| `apps/website/public/favicon.ico`, `apple-touch-icon.png`, `favicon-16x16.png`, `favicon-32x32.png`, `icon-192.png`, `icon-512.png` | New (generated) |
| `apps/website/public/ITlnfra.{avif,png}`, `it-infra-*.{avif,png}`, `lts/*.{avif,jpg}` | Regenerated (optimized/resized) + new `.avif` |
| `apps/website/public/VRChat_Group.png` | Resized to 1200×675 |
| `apps/website/public/ITlogodayo.png`, `public/it-infra-community.png` | Deleted (orphaned) |

## Verification / acceptance criteria

1. `pnpm build:website` succeeds (`vue-tsc -b` passes; no lint regressions).
2. Built `dist/index.html` contains the title, description, canonical, theme-color, all
   OG/Twitter tags, favicon links, and both JSON-LD blocks.
3. `dist/` contains `robots.txt`, `sitemap.xml`, `site.webmanifest`, all icon files, and for each
   in-page image both an `.avif` and its fallback.
4. Both JSON-LD blocks pass Google's Rich Results Test / Schema Markup Validator (no errors).
5. `og:image`, `twitter:image`, `og:url`, canonical, and `Organization.logo` are absolute
   `https://it-infra-meetup.org/...` URLs.
6. `pnpm --filter website preview`: favicon loads (no 404); Hero, Atmosphere, and LT images render;
   AVIF served to AVIF-capable browsers, fallback otherwise (verify via DevTools Network).
7. `branding/` is excluded from the deployed `dist/` (only `public/` + bundled assets ship); the
   two orphaned PNGs no longer appear in `dist/`.
8. Total `dist/` image weight is materially lower than before (LT gallery ~7 MB → roughly ~2 MB).

## Notes

- No runtime store, router, Vite config, or CloudFront/S3 changes. Deployment stays fully
  automated via existing `release.yml`.
- Generated deliverables are committed (not built in CI) to keep the build/CI dependency surface
  unchanged; `optimize-images.sh` records exact regeneration commands for future image updates.
