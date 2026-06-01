#!/usr/bin/env bash
# Regenerate optimized image deliverables in public/ from masters in branding/.
# Requires ImageMagick 7 with AVIF (libheif). Run from anywhere; output is committed.
set -euo pipefail
cd "$(dirname "$0")/.."   # -> apps/website

mkdir -p public/lts

# --- Hero logo: 4045x1245 -> 2048w (long side, crisp on HiDPI), keep alpha ---
magick branding/ITlnfra.png -resize 2048x -strip -define png:compression-level=9 public/ITlnfra.png
magick branding/ITlnfra.png -resize 2048x -quality 55 public/ITlnfra.avif

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
