# @vrc-ta-hub/client

Workspace-internal TypeScript client for the public read-only endpoints of the
[VRC TA Hub API](https://vrc-ta-hub.com/api/v1/). Schemas are hand-written in
Zod v4 and verified against committed JSON fixtures.

See `docs/superpowers/specs/2026-05-20-vrc-ta-hub-client-design.md`.

## Scripts

- `pnpm fixtures:refresh` — refresh `tests/__fixtures__/*.json` and the
  `openapi.yaml` snapshot from the live API.
- `pnpm test` — run Vitest against committed fixtures (offline).
- `pnpm typecheck` — `tsc --noEmit`.
