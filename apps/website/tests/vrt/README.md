# Visual Regression Testing (VRT)

Vitest browser-mode screenshot tests for the website. They mount the real app /
components in headless Chromium (via `@vitest/browser-playwright`), neutralise
everything non-deterministic, capture screenshots, and compare them against
committed baselines.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm vrt:update` | **Regenerate baselines in the pinned Docker image** (matches CI). Requires Docker. |
| `pnpm --filter website test:vrt` | Compare against committed baselines (host browser). |
| `pnpm --filter website test:vrt:update` | Regenerate baselines using the **host** browser. |

### Baselines are environment-specific

Screenshot pixels depend on the OS + fonts. The committed baselines are rendered
in the digest-pinned Playwright image (`mcr.microsoft.com/playwright:v1.60.0-noble@sha256:…`),
which is also what CI (`.github/workflows/vrt.yml`) uses — so **generate ==
compare**.

Running `pnpm --filter website test:vrt` directly on your host (e.g. Arch/macOS)
will likely report diffs even with no real change, because your local fonts
differ from the image. Treat **CI as the source of truth**. To update baselines
after an intentional UI change, run `pnpm vrt:update` (regenerates in the image)
and review `git diff` on `tests/vrt/__screenshots__/`, or run the **VRT Update
Baselines** workflow (`workflow_dispatch`) which commits new baselines to your
branch.

The pinned image digest lives in two places that must stay in sync:
`scripts/vrt-update.sh` and `.github/workflows/vrt.yml` (+ `vrt-update-baselines.yml`).

## What is covered

- **Components** (`components.vrt.test.ts`): `UIPagination` (first/middle/last),
  `LtCard` (with/without image), `NextEventCard` (populated/empty).
- **Pages** (`pages.vrt.test.ts`): each of the 6 HomeView sections (`#hero`,
  `#about`, `#atmosphere`, `#events`, `#topics`, `#join`) and the `/lt-list`
  blocks (`.archive-header`, `.archive-grid`, `.pagination`), each at desktop
  (1280×800), mobile (390×844), and the guaranteed minimum size (375×800).

## How determinism is achieved

- `setup.ts` — loads the app's global CSS (so themed components render), mocks
  `@/clients/ipify` to a fixed IP, seeds `Math.random`, and adds the `.vrt` body
  class on each test.
- `vrt.css` — hides the inherently non-deterministic regions (terminal/system-log
  content via `.console-top`/`.console-bottom`; the data-stream background) while
  keeping the console panel chrome; kills residual CSS animation/transition.
- `harness.ts` — `mountApp` / `renderComponent` mount with a seeded
  `@pinia/testing` store (loader actions are no-op spies → no network; loading
  screen skipped), provide the `@lucide/vue` context, then `freezeAndSettle()`
  pauses GSAP, kills ScrollTriggers, and waits for fonts + layout.
- `fixtures.ts` — deterministic `Event` / `EventDetail` data the components render.

Only platform-tagged baselines (`*-chromium-linux.png`) are committed;
`__screenshots__/.gitignore` keeps Vitest's failure artifacts out of git.

## CI rollout

`.github/workflows/vrt.yml` runs on every PR but is **advisory** (not a required
check) initially. Once it is stable across a few PRs, add the **Visual
Regression** check to `main`'s branch-protection required status checks to make
it blocking.
