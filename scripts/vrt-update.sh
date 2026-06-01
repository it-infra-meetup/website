#!/usr/bin/env bash
# Regenerate VRT baselines inside the pinned Playwright image so the committed
# PNGs match what the CI VRT job (.github/workflows/vrt.yml) renders.
#
# Why a container: screenshot pixels depend on the OS + fonts. Generating on a
# dev machine (e.g. Arch) and comparing on CI (Ubuntu) drifts. Both this script
# and CI use the SAME digest-pinned image, so generate == compare.
#
# node_modules are shadowed with anonymous volumes so the container's Ubuntu
# install never clobbers the host's. Generated PNGs are chowned back to the
# invoking user (the container runs as root).
#
# Usage (from repo root):  pnpm vrt:update
set -euo pipefail

# Must match the `container.image` digest in .github/workflows/vrt.yml.
IMAGE="mcr.microsoft.com/playwright:v1.60.0-noble@sha256:9bd26ad900bb5e0f4dee75839e957a89ae89c2b7ab1e76050e559790e946b948"

docker run --rm \
  -e HOME=/root -e CI=1 \
  -e HOST_UID="$(id -u)" -e HOST_GID="$(id -g)" \
  -v "$PWD":/work \
  -v /work/node_modules \
  -v /work/apps/website/node_modules \
  -v /work/packages/vrc-ta-hub-client/node_modules \
  -w /work "$IMAGE" \
  sh -c '
    set -e
    npm install -g pnpm@11 >/dev/null 2>&1
    # Keep the pnpm store inside the (ephemeral) container fs so it is not
    # written into the mounted repo root.
    pnpm install --frozen-lockfile --store-dir /root/.pnpm-store
    pnpm --filter website test:vrt:update
    chown -R "$HOST_UID:$HOST_GID" apps/website/tests/vrt/__screenshots__
  '
