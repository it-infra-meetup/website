# VRT Integration Design — `apps/website`

**Date:** 2026-06-01
**Status:** Approved (design); pending implementation plan
**Scope:** Add visual regression testing (VRT) to the `website` app only. The
`@vrc-ta-hub/client` package keeps its existing offline Vitest unit tests unchanged.

## 1. Goal & non-goals

### Goal

Catch unintended visual regressions on pull requests using committed-baseline
screenshots, reusing the repo's existing Vitest 4 toolchain. Cover both:

- **Page-level** — full scroll coverage of `/` (`HomeView`) and `/lt-list`
  (`LtListView`) via per-section screenshots at desktop and mobile viewports.
- **Component-level** — leaf components with prop variants that a page render does not
  fully exercise.

Baselines are self-hosted (PNGs committed to git). The CI check starts advisory and
is promoted to a required check once stable.

### Non-goals (YAGNI)

- No cloud VRT service (Chromatic / Argos / Lost Pixel). Decided: self-hosted PNGs.
- No cross-browser matrix. Chromium only initially; add Firefox/WebKit later only if a
  real need appears.
- No interaction/E2E testing. VRT here asserts appearance, not behavior.
- No snapshotting of the inherently-random surfaces themselves (terminal, system-log,
  data-stream canvas, circuit packets). These are neutralized, not asserted.
- No git-lfs. The PNG volume is tiny; revisit only if baseline count balloons.

## 2. Why this approach

Investigated three options against the constraints (private repo, committed PNGs,
both pages + components, a heavily animated site already on Vitest 4.1.7):

| Approach | Verdict |
| --- | --- |
| **A — All Vitest Browser Mode** (`toMatchScreenshot`) | **Chosen.** Reuses the runner already in the repo (`vitest@4.1.7`, `@vitest/browser-playwright` already resolved in the lockfile). One config, one baseline dir, one CI step. Determinism hooks run directly in the test before mount — the cleanest place to seed RNG, pre-seed Pinia stores, and pause GSAP. |
| B — All Playwright Test (`toHaveScreenshot`) | Rejected. Brand-new toolchain for a repo with none; Playwright Component Testing is experimental and lags new Vite majors (repo is on Vite 8) — risky for the component half. |
| C — Hybrid (Vitest components + Playwright pages) | Rejected. Two runners, two baseline dirs, two CI steps — disproportionate for a 2-route, ~12-component site. |

The hard part of VRT on this site is **determinism, not the tool** — that work is
identical across A/B/C, and A makes it easiest to inject.

### Key best-practice findings (mid-2026)

- **Disabling animations is insufficient.** Playwright's `animations:'disabled'`
  freezes only CSS animations/transitions; Vitest's "stable screenshot detection"
  waits for animations to *finish*. The site's GSAP timelines, the data-stream canvas,
  the scrolling system-log, and terminal typing never finish. The accepted practice
  for inherently-dynamic regions is to **neutralize/mask** them and **determinize**
  everything else (seed RNG, freeze time, pre-seed data, no live network).
- **Generate baselines in the same environment you compare in.** The dominant failure
  mode of committed-PNG VRT is generating baselines on a dev machine and diffing on
  Linux CI (anti-aliasing/font-rendering pixel drift). Fix: always generate baselines
  in a digest-pinned Playwright Docker image — the same image CI compares in.

Sources: Playwright visual-comparisons docs; Vitest 4 browser-mode visual-regression
docs; community guides on VRT for Vue with Vitest browser mode.

## 3. Determinism harness — the core of this design

A small `tests/vrt/harness.ts` exposes `mountApp(route)` and
`renderComponent(component, props)`. Both run these steps in order:

1. **Seed RNG, freeze time.** Replace `Math.random` with a seeded LCG; pin `Date` and
   `performance.now` to a fixed instant. This neutralizes `uiStore.updateLatency()`,
   the `Math.random` sub-packet durations in `useScrollAnimations`, and any relative
   date math in components.
2. **Stub network.** Replace global `fetch` to serve `clients/ipify.ts` from a fixture
   and reject everything else. Belt-and-suspenders — stores are pre-seeded, so the
   `@vrc-ta-hub/client` calls should never fire.
3. **Pre-seed Pinia.** `uiStore.setLoading(false)` (skips the `LoadingScreen` GSAP boot
   sequence); set `eventsStore.nextEvent` and `eventsStore.recentLts` from fixtures;
   fix `uiStore.latency`. **Never call `eventsStore.loadNext` / `loadRecentLts`** — this
   sidesteps both the network and the `new Date()`-derived date-window drift in the
   store.
4. **Mount.** Mount `App` (router pre-set to `route`) or the target component, with a
   fresh Pinia.
5. **Freeze animations.** After mount: `gsap.globalTimeline.pause()`,
   `ScrollTrigger.killAll()`, disable ticker lag smoothing. Freezes the circuit side and
   all scroll-driven motion at the scroll-top state.
6. **Neutralize dynamic regions** via a `.vrt` class added to `<body>` (see §4.3).
7. **Settle.** `await document.fonts.ready` plus one rAF tick, then screenshot.

## 4. What gets snapshotted

### 4.1 Pages — per-section scroll coverage

The content sections are **static and always in the DOM**: of the six HomeView sections,
only `HeroSection` uses GSAP, and there is no `IntersectionObserver` or scroll-reveal —
the five below-fold sections (`AboutSection`, `AtmosphereSection`, `EventsSection`,
`TopicsSection`, `JoinSection`) render fully regardless of scroll position. The only
scroll-coupled motion is the decorative circuit/data-stream background, which the harness
freezes. A single viewport screenshot would therefore miss everything below the fold;
instead **each section is captured as its own baseline** (full scroll coverage).

Scroll each element below into view and screenshot it (the frozen background painted
behind it is captured too), at **desktop 1280×800** and **mobile 390×844**:

| Route | Captured elements |
| --- | --- |
| `/` (`HomeView`) | `#hero`, `#about`, `#atmosphere`, `#events`, `#topics`, `#join` |
| `/lt-list` (`LtListView`) | `.archive-header`, `.archive-grid`, `UIPagination` |

Per-section element captures are used rather than one tall full-page screenshot because
the background layer is `position: fixed` and smears/pins when a tall page is stitched.
Because GSAP is frozen at scroll-top, the background appears in its top state behind every
section — deterministic. A section taller than the viewport is still captured in full
(element screenshots capture the whole element box).

Viewports are applied per Vitest browser instance (or via the browser-context resize
command); the implementer confirms the exact Vitest 4 API during the plan phase. Both
viewports must be exercised. Dynamic regions are neutralized per §4.3 before capture.

### 4.2 Components — leaf components with prop variants

The six content sections are already captured in real page context by §4.1, so they are
**not** re-snapshotted in isolation. Isolated snapshots are reserved for leaf components
whose meaningful prop variants a single page render does not exercise, rendered via
`vitest-browser-vue` `render()` with fixed props:

- `LtCard` — with image, and without image (placeholder fallback)
- `NextEventCard` — populated event, and empty / no-event state
- `UIPagination` — first page, a middle page, last page

This list is tunable; start here and expand only if a real gap appears.

**Deliberately not snapshotted:** `CircuitSvg`, `DataStreamBackground`, `SystemLogStream`,
`InteractiveTerminal`. Their content is nondeterministic by nature; they are neutralized
inside the per-section page captures rather than asserted on their own.

### 4.3 Dynamic-region neutralization (`tests/vrt/vrt.css`)

Applied only when `<body class="vrt">`. The site's background layer
(`SplitBackground`) is `position: fixed; inset: 0; z-index: 0` — it sits *behind*
`<main>`. Because it is fixed and below the content in stacking order, hiding parts of
it **cannot shift `<main>`'s layout**.

**Terminal & system-log (desktop only).** `ConsoleSide` holds `InteractiveTerminal`
(root `.console-top`) and `SystemLogStream` (root `.console-bottom`). Keep the console
panel chrome (background color + divider, so the split-screen aesthetic still reads),
hide only the dynamic children:

```css
.vrt .console-top,
.vrt .console-bottom {
  visibility: hidden;
}
```

`ConsoleSide` is already `display: none` below 899px, so the **mobile** viewport
excludes the terminal/log entirely — this neutralization is desktop-only by nature.

**Circuit side.** Frozen deterministically by the harness (`globalTimeline.pause()` +
`ScrollTrigger.killAll()` + seeded RNG) at scroll-top. If it still proves flaky in
practice, add its root to the same `.vrt` hide list — no harness change required.

**Data-stream canvas (`/lt-list`).** `DataStreamBackground` renders via rAF using
`Math.random`. Seeded RNG plus paused animation should freeze it; if residual flake
remains, hide it via the `.vrt` class as well.

## 5. Baseline management — Docker-pinned, CI as source of truth

Baselines are committed PNGs under `apps/website/tests/vrt/__screenshots__/`
(Vitest tags filenames by platform/browser, e.g. `*-chromium-linux.png`).

- **Generation environment is fixed.** Baselines are always generated in the same
  digest-pinned Playwright Docker image CI compares in
  (`mcr.microsoft.com/playwright:v<ver>-jammy@sha256:<digest>`).
- **Primary update path — CI workflow.** A manual **"Update VRT baselines"** workflow
  (`workflow_dispatch`, optionally PR-label-triggered) runs the suite with
  `--update` inside the pinned container and commits the regenerated PNGs back to the
  PR branch. Generates in the exact CI environment; requires no Docker on the dev's
  machine. Needs `contents: write` and a zizmor-clean checkout (no credential
  persistence leak) — flagged as a security-review item for the plan.
- **Convenience path — local Docker.** `pnpm vrt:update` wraps the update in
  `docker run mcr.microsoft.com/playwright:<pinned>` so local refreshes also match CI.
  Running the bare `test:vrt:update` on the host is allowed only for iteration; the
  committed baselines must come from the pinned image.

## 6. CI workflow (`.github/workflows/vrt.yml`)

- **Trigger:** `pull_request: [main]`.
- **Environment:** job runs inside
  `container: mcr.microsoft.com/playwright:v<ver>-jammy@sha256:<digest>` for render
  parity with baseline generation.
- **Steps:** `actions/checkout` (`persist-credentials: false`) → `jdx/mise-action` →
  `pnpm install --frozen-lockfile` → `pnpm --filter website test:vrt`. On failure,
  upload the actual + diff images as an artifact.
- **Conventions:** must pass `actionlint` + `zizmor`; all actions pinned to commit
  SHAs, matching the existing workflows.
- **Advisory → required:** initially **not** in branch-protection required checks — it
  runs and reports pass/fail but does not block merges. After it is stable across a few
  PRs, add it to the required-checks set. No `continue-on-error` (that would hide real
  failures).

## 7. File layout & developer workflow

```
apps/website/
  vitest.config.ts              # NEW: browser-mode test project (chromium)
  package.json                  # NEW scripts: test:vrt, test:vrt:update
  tests/vrt/
    harness.ts                  # determinism + mountApp() / renderComponent()
    fixtures.ts                 # fixed Event / EventDetail / IP data
    vrt.css                     # ".vrt" body-class neutralization rules
    components.vrt.test.ts       # isolated component snapshots
    pages.vrt.test.ts           # full-route snapshots @ 2 viewports
    __screenshots__/            # COMMITTED baselines (platform/browser-tagged PNGs)
```

New devDependencies (hoisted to the `website` workspace): `@vitest/browser-playwright`,
`vitest-browser-vue`, `playwright`, and `vitest` (the website currently has no test
runner of its own).

Commands:

- `pnpm --filter website test:vrt` — run comparisons against committed baselines.
- `pnpm --filter website test:vrt:update` — refresh baselines (host; iteration only).
- `pnpm vrt:update` — Docker-wrapped refresh that matches the CI environment.

No `pnpm build` is required before VRT: Vitest browser mode serves the app through Vite,
which resolves the `@vrc-ta-hub/client` workspace dependency (it exports `./src/index.ts`)
and transforms TypeScript on the fly.

## 8. Thresholds

Start with per-pixel `threshold: 0.2`; pages use a looser `maxDiffPixelRatio` (~0.01–0.02),
components tighter. Tune after the first CI runs. Per-target thresholds are configured at
the `toMatchScreenshot` call site so a busy page and a small component do not share one
tolerance.

## 9. Risks & mitigations

- **Residual animation flake.** If freezing GSAP + seeded RNG is not enough for the
  circuit/data-stream regions, add their roots to the `.vrt` hide list — no harness
  change.
- **Font rendering drift.** Fully mitigated by generating *and* comparing inside the same
  pinned Docker image; `await document.fonts.ready` guards web-font load.
- **Baselines generated on the wrong host.** Mitigated by making the CI update workflow
  the source of truth and Docker-wrapping the local update.
- **Vitest browser VRT is newer than Playwright's.** Accepted; the repo is already on
  Vitest 4.1.7, the matcher uses the well-understood pixelmatch comparator, and the
  surface is small.
- **CI workflow committing to PR branches.** Security-sensitive; reviewed against zizmor
  with least-privilege permissions and no credential persistence.

## 10. Build sequence

1. Add devDeps + `vitest.config.ts` browser project + `test:vrt` / `test:vrt:update`
   scripts.
2. Build the harness, fixtures, and `vrt.css` neutralization.
3. Author 2–3 leaf-component snapshots first to prove determinism, then expand to the
   §4.2 set.
4. Author the per-section page snapshots (§4.1: 6 home sections + 3 lt-list blocks, each
   at desktop and mobile).
5. Generate baselines via the CI "Update VRT baselines" workflow; commit them.
6. Add `vrt.yml` as an advisory CI check (Docker-pinned).
7. Stabilize across a few PRs, then promote it to a required check.
