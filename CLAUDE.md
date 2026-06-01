# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

This is the website for **ITインフラ集会** — a tech meetup community that holds events
(技術交流 / LT / 機材談義) on **VRChat**. The site is a single-page marketing/landing app
with an "infrastructure terminal" cyberpunk aesthetic, plus a workspace-internal API client
that pulls live event data from the public [VRC TA Hub API](https://vrc-ta-hub.com/api/v1/).

## Repository layout

pnpm workspace monorepo (`pnpm-workspace.yaml` → `apps/*`, `packages/*`):

- **`apps/website`** (`website`) — Vue 3 (`<script setup>` SFC) + TypeScript + Vite 8 +
  Tailwind 4 + Pinia + Vue Router 5 + GSAP. The actual site.
- **`packages/vrc-ta-hub-client`** (`@vrc-ta-hub/client`) — internal TS client for the VRC TA
  Hub read-only API. Hand-written Zod v4 schemas, `Result`-based error handling, Vitest tests
  run **offline** against committed JSON fixtures. Consumed by the website via `workspace:*`.

## Toolchain & setup

Versions are pinned in `mise.toml` (Node 24, pnpm 11, lefthook, actionlint, zizmor). First-time
setup needs both steps, in order:

```bash
mise install      # installs Node/pnpm/lint tools; postinstall runs `lefthook install`
pnpm install
```

## Common commands

Run from the repo root unless noted:

| Task | Command |
| --- | --- |
| Dev server (→ http://localhost:9010, strict port) | `pnpm dev` |
| Build everything (packages then apps) | `pnpm build` |
| Build only the site | `pnpm build:website` |
| Lint (all workspaces + root `*.config.*`) | `pnpm lint` / `pnpm lint:fix` |
| Type-check (`vue-tsc -b` for site, `tsc` for packages) | `pnpm typecheck` |
| Test (Vitest, **packages only** — the site has no tests) | `pnpm test` |
| Refresh API fixtures from the live API | `pnpm fixtures:refresh` |

Targeting one workspace / one test:

```bash
pnpm --filter @vrc-ta-hub/client test                          # client unit tests
pnpm --filter @vrc-ta-hub/client exec vitest run tests/client.test.ts   # one file
pnpm --filter @vrc-ta-hub/client exec vitest run -t "name"     # one test by name
pnpm --filter website dev                                       # equivalent to `pnpm dev`
```

## Architecture

### Website (`apps/website/src`)

- **Routing** uses **hash history** (`createWebHashHistory`) — required because the site is
  served as static files from S3/CloudFront. Two routes: `/` → `HomeView`, `/lt-list` →
  `LtListView` (lazy). `@` is aliased to `src/` (set in both `vite.config.ts` and tsconfig).
- **State lives in Pinia stores** (`src/stores/`), all written as setup stores:
  - `eventsStore` — the only store that hits the network. It uses `@vrc-ta-hub/client` to fetch
    the next upcoming event and recent LTs, **filtered server-side to community id `30`**
    (ITインフラ集会). Aborted network errors are intentionally swallowed (not real errors).
  - `uiStore`, `circuitStore`, `systemLogStore`, `terminalStore` — drive the themed UI: the
    interactive fake terminal, the scrolling system-log stream, and the animated PCB-circuit
    background. These are presentation state, not data.
- **Components** are grouped by role under `src/components/` (`sections/`, `layout/`,
  `terminal/`, `circuit/`, `ui/`, `lt/`). `HomeView` composes the `sections/*` blocks in order.
- **Static LT history** is hardcoded in `src/consts/lts.ts` (keyed by date string, e.g.
  `20251206`) with images mapped in `src/consts/ltImagePaths.ts` → files under `public/lts/`.
  This is separate from the live event data the `eventsStore` fetches; add a new past LT by
  adding an image to `public/lts/` and entries to both consts files.
- GSAP plugins (`ScrollTrigger`, `MotionPathPlugin`) are registered globally in `main.ts`.

### API client (`packages/vrc-ta-hub-client/src`)

- `createClient()` returns a `Client` with `list*`/`get*` methods for `community`, `event`, and
  `event_detail`. No exceptions are thrown: every call returns a `Result<T, ClientError>`
  (`result.ts`); use the `isOk` / `isErr` guards. `ClientError` is a tagged union of
  `network` / `http` / `validation` kinds (`errors.ts`).
- Responses are validated with Zod schemas (`schemas.ts`) before being returned. Schemas are the
  source of truth and are verified against committed fixtures in `tests/__fixtures__/`. Note
  `EventWeekdayEnum` deliberately accepts both cased (`Thu`) and uppercase (`THU`) weekday
  variants plus `''`, because the live API returns all three.
- `fetch` and `baseUrl` are injectable via `ClientOptions` (used by tests to stay offline).
  `tests/` exercise the client against fixtures, so they never touch the network; only
  `pnpm fixtures:refresh` does, regenerating the fixtures + `openapi.yaml` snapshot.

## Conventions & workflow

- **Conventional Commits are enforced** by commitlint via a lefthook `commit-msg` hook
  (`@commitlint/config-conventional`). Releases are driven by semantic-release from these.
- **Direct pushes to `main` are blocked** by a lefthook `pre-push` hook. Branch and open a PR.
- **ESLint flat config is type-aware** (`recommendedTypeChecked` + `projectService`). Each
  workspace has its own `eslint.config.ts`; the root config only lints top-level `*.config.*`
  files (it ignores `apps/**` and `packages/**`, which are linted by their own configs).
- GitHub Actions workflows must pass `actionlint` + `zizmor` (run via `mise run actions:lint`,
  also wired into the pre-commit hook) and are pinned to commit hashes.
- **Release/deploy:** merging to `main` triggers `release.yml` → semantic-release builds the
  site and runs `aws s3 sync apps/website/dist → s3://$S3_BUCKET_NAME` plus a CloudFront
  invalidation. The bucket, CloudFront distribution, AWS role, and region come from repo
  **variables** (`vars.*`), not secrets. Deployment is fully automated — do not deploy manually.
