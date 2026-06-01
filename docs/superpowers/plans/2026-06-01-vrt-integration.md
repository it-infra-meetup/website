# VRT Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add self-hosted visual regression testing to `apps/website` using Vitest 4 Browser Mode (`toMatchScreenshot`), covering both routes per-section and key leaf components, with committed PNG baselines and an advisory-then-required CI check.

**Architecture:** A determinism harness mounts the real app/components in a headless Chromium via the Vitest Playwright provider. `@pinia/testing` stubs the network-loading store actions and seeds deterministic state; `vi.mock` fixes the ipify call; a seeded `Math.random`, paused GSAP global timeline, killed ScrollTriggers, and a `.vrt` body-class (which hides the dynamic terminal/log) make captures stable. Each HomeView section is captured by id; `/lt-list` blocks by class; leaf components in isolation. Baselines are generated in a digest-pinned Playwright Docker image (locally via a `pnpm vrt:update` Docker wrapper, and in CI), so local and CI pixels match.

**Tech Stack:** Vitest 4.1.7 browser mode, `@vitest/browser-playwright`, `vitest-browser-vue`, `@pinia/testing`, `playwright`, Vue 3.5 + Pinia + Vue Router, GSAP, GitHub Actions, pnpm workspace.

---

## Conventions used in this plan

- All commands run from the repo root `/home/a1678991/IdeaProjects/website` unless stated.
- The website workspace is targeted with `pnpm --filter website <cmd>`.
- Commit messages follow Conventional Commits (commitlint `commit-msg` hook enforces this) and end with the `Co-Authored-By` trailer used in this repo.
- Work happens on the existing branch `feat/vrt-integration` (already created; the design spec lives at `docs/superpowers/specs/2026-06-01-vrt-integration-design.md`). Do **not** push to `main`.
- Baselines are named `<name>-chromium-linux.png` by Vitest (test-name + browser + platform). They are committed to `apps/website/tests/vrt/__screenshots__/`.

## File structure (created/modified)

| File | Responsibility |
| --- | --- |
| `apps/website/package.json` | **Modify** — add VRT devDependencies + `test:vrt` / `test:vrt:update` scripts |
| `apps/website/vitest.config.ts` | **Create** — Vitest browser-mode project (chromium, vue plugin, `@` alias, setup file, screenshot defaults) |
| `apps/website/tests/vrt/vrt.css` | **Create** — `.vrt` body-class rules that neutralize dynamic regions |
| `apps/website/tests/vrt/setup.ts` | **Create** — global setup: load `vrt.css`, mock ipify, seed `Math.random`, add `.vrt` body class |
| `apps/website/tests/vrt/fixtures.ts` | **Create** — type-valid `Community` / `Event` / `EventDetail` fixtures |
| `apps/website/tests/vrt/harness.ts` | **Create** — `mountApp(path)`, `renderComponent(...)`, `freezeAndSettle()` |
| `apps/website/tests/vrt/components.vrt.test.ts` | **Create** — isolated leaf-component snapshots |
| `apps/website/tests/vrt/pages.vrt.test.ts` | **Create** — per-section page snapshots (2 routes × 2 viewports) |
| `apps/website/tests/vrt/__screenshots__/` | **Create** — committed baselines |
| `package.json` (root) | **Modify** — add `vrt:update` Docker-wrapper convenience script |
| `.github/workflows/vrt.yml` | **Create** — advisory PR check (runs comparisons in pinned Playwright container) |
| `.github/workflows/vrt-update-baselines.yml` | **Create** — `workflow_dispatch` job that regenerates + commits baselines |
| `apps/website/eslint.config.ts` | **Modify** — ignore `tests/vrt/__screenshots__` / allow test globs if lint complains |

---

## Task 1: Install tooling and create the Vitest browser-mode config

**Files:**
- Modify: `apps/website/package.json`
- Create: `apps/website/vitest.config.ts`

- [ ] **Step 1: Add dev dependencies to the website workspace**

Run:
```bash
pnpm --filter website add -D vitest@4.1.7 @vitest/browser-playwright@4.1.7 vitest-browser-vue @pinia/testing playwright
```
Expected: `pnpm-lock.yaml` updates; `apps/website/package.json` gains the five devDependencies. (`vitest`/`@vitest/browser-playwright` pin to `4.1.7` to match the version already resolved in the repo.)

- [ ] **Step 2: Install the Chromium browser binary**

Run:
```bash
pnpm --filter website exec playwright install chromium
```
Expected: Playwright downloads Chromium. (This is the local browser; CI installs it inside the container.)

- [ ] **Step 3: Create the Vitest browser config**

Create `apps/website/vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { playwright } from '@vitest/browser-playwright'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['tests/vrt/**/*.vrt.test.ts'],
    setupFiles: ['./tests/vrt/setup.ts'],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: 'chromium' }],
      // Default viewport; individual tests call page.viewport() to switch.
      viewport: { width: 1280, height: 800 },
      expect: {
        toMatchScreenshot: {
          comparatorName: 'pixelmatch',
          comparatorOptions: {
            // Per-pixel colour tolerance; loosened for sub-pixel AA noise.
            threshold: 0.2,
            // Page snapshots are busy — allow a small fraction of differing pixels.
            allowedMismatchedPixelRatio: 0.02,
          },
        },
      },
    },
  },
})
```

- [ ] **Step 4: Add the VRT scripts to the website package**

In `apps/website/package.json`, add to `"scripts"`:
```json
    "test:vrt": "vitest run --config vitest.config.ts",
    "test:vrt:update": "vitest run --config vitest.config.ts --update"
```

- [ ] **Step 5: Verify the runner starts (no tests yet)**

Run:
```bash
pnpm --filter website test:vrt
```
Expected: Vitest launches browser mode and reports `No test files found, exiting with code 1` (or similar). This confirms the browser provider boots without a config error. A non-zero exit here is expected because no `*.vrt.test.ts` exists yet.

- [ ] **Step 6: Commit**

```bash
git add apps/website/package.json apps/website/vitest.config.ts pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
test(website): add Vitest browser-mode config for VRT

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Dynamic-region neutralization CSS and global setup

**Files:**
- Create: `apps/website/tests/vrt/vrt.css`
- Create: `apps/website/tests/vrt/setup.ts`

- [ ] **Step 1: Create the `.vrt` neutralization stylesheet**

Create `apps/website/tests/vrt/vrt.css`:
```css
/* Applied only when <body class="vrt"> — see tests/vrt/setup.ts.
   Keeps the console panel chrome but hides the dynamic terminal/log children,
   and stops any residual CSS motion. */

/* InteractiveTerminal root (.console-top) and SystemLogStream root (.console-bottom):
   keep the surrounding .console-side panel (bg + divider), hide the dynamic content. */
body.vrt .console-top,
body.vrt .console-bottom {
  visibility: hidden;
}

/* Belt-and-suspenders: neutralise any CSS animation/transition that survives. */
body.vrt *,
body.vrt *::before,
body.vrt *::after {
  animation: none !important;
  transition: none !important;
  caret-color: transparent !important;
}
```

- [ ] **Step 2: Create the global setup file**

Create `apps/website/tests/vrt/setup.ts`:
```typescript
import { beforeEach, vi } from 'vitest'
import './vrt.css'

// Deterministic IP so HeroSection's CONNECTION_ID hash is stable and no
// network call is made. HeroSection imports fetchPublicIp from '@/clients/ipify'.
vi.mock('@/clients/ipify', () => ({
  fetchPublicIp: () => Promise.resolve('203.0.113.42'),
}))

// Seeded PRNG so Math.random-driven values are stable:
// uiStore.updateLatency, HeroSection.randomConnectionId, useScrollAnimations packet durations.
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

beforeEach(() => {
  Math.random = mulberry32(0x1f2e3d4c)
  document.body.classList.add('vrt')
})
```

- [ ] **Step 3: Type-check passes**

Run:
```bash
pnpm --filter website exec vue-tsc -b --noEmit
```
Expected: PASS (no errors). The `vi.mock` path `@/clients/ipify` resolves via the alias.

- [ ] **Step 4: Commit**

```bash
git add apps/website/tests/vrt/vrt.css apps/website/tests/vrt/setup.ts
git commit -m "$(cat <<'EOF'
test(website): add VRT determinism setup and neutralization CSS

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Deterministic fixtures

**Files:**
- Create: `apps/website/tests/vrt/fixtures.ts`

- [ ] **Step 1: Create the fixtures module**

Create `apps/website/tests/vrt/fixtures.ts`. These are type-valid objects matching the `@vrc-ta-hub/client` schemas (`Community` has 20 fields; `Event` embeds a `Community`; `EventDetail` embeds an `Event`). Only the fields the components read need realistic values; the rest are filled to satisfy the types.
```typescript
import type { Community, Event, EventDetail } from '@vrc-ta-hub/client'

export const communityFixture: Community = {
  id: 30,
  name: 'ITインフラ集会',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  start_time: '22:00:00',
  duration: 90,
  weekdays: ['Sat'],
  frequency: 'weekly',
  organizers: 'ITインフラ集会',
  group_url: 'https://vrc.group/ITINFRA.0000',
  group_id: 'grp_00000000-0000-0000-0000-000000000000',
  organizer_url: 'https://example.com',
  sns_url: 'https://example.com',
  discord: 'https://discord.gg/example',
  twitter_hashtag: '#ITインフラ集会',
  poster_image: null,
  description: 'VRChatのITインフラ集会',
  platform: 'All',
  tags: ['インフラ', 'LT'],
  allow_poster_repost: true,
}

// NextEventCard reads: date, weekday, start_time, duration.
export const nextEventFixture: Event = {
  id: 1001,
  community: communityFixture,
  date: '2026-07-04',
  start_time: '22:00:00',
  duration: 90,
  weekday: 'Sat',
}

// EventsSection reads: id, event.date, theme, speaker.
function makeDetail(
  id: number,
  date: string,
  theme: string,
  speaker: string,
): EventDetail {
  return {
    id,
    event: { ...nextEventFixture, id, date },
    start_time: '22:10:00',
    duration: 15,
    youtube_url: null,
    slide_url: null,
    thumbnail_image: null,
    speaker,
    theme,
    additional_info: '',
  }
}

export const recentLtsFixture: EventDetail[] = [
  makeDetail(2003, '2026-05-30', 'Kubernetesでのネットワーク設計', 'alice'),
  makeDetail(2002, '2026-05-23', '自宅ラックの冷却最適化', 'bob'),
  makeDetail(2001, '2026-05-16', 'おうちLANのVLAN運用', 'carol'),
]
```

- [ ] **Step 2: Type-check passes**

Run:
```bash
pnpm --filter website exec vue-tsc -b --noEmit
```
Expected: PASS. If a field name/type mismatch appears, reconcile against `packages/vrc-ta-hub-client/src/schemas.ts`.

- [ ] **Step 3: Commit**

```bash
git add apps/website/tests/vrt/fixtures.ts
git commit -m "$(cat <<'EOF'
test(website): add deterministic VRT fixtures

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: The determinism harness

**Files:**
- Create: `apps/website/tests/vrt/harness.ts`

- [ ] **Step 1: Create the harness**

Create `apps/website/tests/vrt/harness.ts`:
```typescript
import type { Component } from 'vue'
import { render } from 'vitest-browser-vue'
import { createTestingPinia } from '@pinia/testing'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/all'
import router from '@/router'
import App from '@/App.vue'
import { nextEventFixture, recentLtsFixture } from './fixtures'

/** Pinia initial state shared by app and component mounts. Seeds the data the
 *  components display and flips ui.isLoading off so the LoadingScreen is skipped.
 *  With stubActions:true, eventsStore.loadNext/loadRecentLts become no-op spies,
 *  so the onMounted loaders never hit the network. */
function makePinia() {
  return createTestingPinia({
    stubActions: true,
    initialState: {
      ui: { isLoading: false, isModalOpen: false, latency: 12 },
      events: {
        nextEvent: nextEventFixture,
        recentLts: recentLtsFixture,
        error: null,
        recentLtsError: null,
        loading: false,
        recentLtsLoading: false,
      },
    },
  })
}

/** Freeze JS-driven motion and wait for the page to settle, then it is safe to
 *  screenshot. CSS animations are already disabled by the Playwright provider
 *  and by vrt.css. */
export async function freezeAndSettle(): Promise<void> {
  gsap.globalTimeline.pause()
  ScrollTrigger.getAll().forEach((t) => t.kill())
  await document.fonts.ready
  // Let async onMounted work (ipify mock → connectionId) and layout settle.
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}

/** Mount the full app at the given route. */
export async function mountApp(path: string) {
  await router.push(path)
  await router.isReady()
  const screen = render(App, { global: { plugins: [makePinia(), router] } })
  await freezeAndSettle()
  return screen
}

/** Mount a single component in isolation (pinia + router available). */
export async function renderComponent(
  component: Component,
  options: Record<string, unknown> = {},
) {
  const screen = render(component, {
    global: { plugins: [makePinia(), router] },
    ...options,
  })
  await freezeAndSettle()
  return screen
}
```

- [ ] **Step 2: Type-check passes**

Run:
```bash
pnpm --filter website exec vue-tsc -b --noEmit
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/website/tests/vrt/harness.ts
git commit -m "$(cat <<'EOF'
test(website): add VRT mount/freeze harness

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Prove the pipeline with one component snapshot (UIPagination)

`UIPagination` has no store/network/animation dependency, so it isolates whether the screenshot pipeline itself works before adding harder components.

**Files:**
- Create: `apps/website/tests/vrt/components.vrt.test.ts`
- Test: same file

- [ ] **Step 1: Write the first snapshot test**

Create `apps/website/tests/vrt/components.vrt.test.ts`:
```typescript
import { describe, test, expect } from 'vitest'
import { page } from '@vitest/browser/context'
import { renderComponent } from './harness'
import UIPagination from '@/components/ui/UIPagination.vue'

function locate(selector: string) {
  const el = document.querySelector(selector)
  if (!el) throw new Error(`element not found: ${selector}`)
  return page.elementLocator(el)
}

describe('UIPagination', () => {
  test('first page', async () => {
    await page.viewport(1280, 800)
    await renderComponent(UIPagination, { props: { currentPage: 1, totalPages: 5 } })
    await expect(locate('.pagination')).toMatchScreenshot('uipagination-first')
  })

  test('middle page', async () => {
    await page.viewport(1280, 800)
    await renderComponent(UIPagination, { props: { currentPage: 3, totalPages: 5 } })
    await expect(locate('.pagination')).toMatchScreenshot('uipagination-middle')
  })

  test('last page', async () => {
    await page.viewport(1280, 800)
    await renderComponent(UIPagination, { props: { currentPage: 5, totalPages: 5 } })
    await expect(locate('.pagination')).toMatchScreenshot('uipagination-last')
  })
})
```

- [ ] **Step 2: Run without baselines to confirm they are created**

Run:
```bash
pnpm --filter website test:vrt:update
```
Expected: PASS; three PNGs created under `apps/website/tests/vrt/__screenshots__/components.vrt.test.ts/` named `uipagination-first-chromium-<platform>.png`, etc.

- [ ] **Step 3: Visually inspect the generated baselines**

Open the three PNGs and confirm each shows the pagination bar with the correct active page highlighted and PREV/NEXT disabled states. If wrong, fix the test/props and re-run Step 2.

- [ ] **Step 4: Run again to confirm a clean comparison**

Run:
```bash
pnpm --filter website test:vrt
```
Expected: PASS (3 tests) comparing against the just-created baselines.

- [ ] **Step 5: Commit**

```bash
git add apps/website/tests/vrt/components.vrt.test.ts apps/website/tests/vrt/__screenshots__
git commit -m "$(cat <<'EOF'
test(website): VRT snapshots for UIPagination

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

> **Note on baseline parity:** the PNGs generated locally in Steps 2–5 carry your host's platform tag and pixels. The authoritative baselines are regenerated in the pinned Docker image in Task 9/10 so they match CI. If you are on Linux and have Docker, run `pnpm vrt:update` (added in Task 8) instead of `test:vrt:update` from here on to generate CI-matching baselines directly.

---

## Task 6: Component snapshots for LtCard and NextEventCard

**Files:**
- Modify: `apps/website/tests/vrt/components.vrt.test.ts`

- [ ] **Step 1: Find a real LT image to use for the with-image variant**

Run:
```bash
ls apps/website/public/lts | head -5
```
Expected: a list of image files (e.g. `20251206.jpg`). Pick one real filename and use it as `IMAGE_PATH = '/lts/<that-file>'` in the next step (a real file avoids a broken-image render).

- [ ] **Step 2: Add LtCard and NextEventCard tests**

Append to `apps/website/tests/vrt/components.vrt.test.ts` (use the real image path from Step 1 for `IMAGE_PATH`):
```typescript
import LtCard from '@/components/lt/LtCard.vue'
import NextEventCard from '@/components/sections/NextEventCard.vue'

const IMAGE_PATH = '/lts/REPLACE_WITH_REAL_FILE.jpg'

describe('LtCard', () => {
  test('with image', async () => {
    await page.viewport(420, 600)
    await renderComponent(LtCard, {
      props: {
        date: '2026.05.30',
        title: 'Kubernetesでのネットワーク設計',
        author: 'alice',
        image: IMAGE_PATH,
      },
    })
    // Wait for the image to finish loading so the capture is stable.
    await expect.element(locate('.lt-card img')).toBeVisible()
    await expect(locate('.lt-card')).toMatchScreenshot('ltcard-with-image')
  })

  test('without image (placeholder)', async () => {
    await page.viewport(420, 600)
    await renderComponent(LtCard, {
      props: {
        date: '2026.05.23',
        title: '自宅ラックの冷却最適化',
        author: 'bob',
      },
    })
    await expect(locate('.lt-card')).toMatchScreenshot('ltcard-no-image')
  })
})

describe('NextEventCard', () => {
  test('populated event', async () => {
    await page.viewport(480, 400)
    await renderComponent(NextEventCard)
    await expect(locate('[data-testid="next-event-card"]')).toMatchScreenshot('next-event-populated')
  })
})
```

- [ ] **Step 3: Generate and inspect baselines**

Run:
```bash
pnpm --filter website test:vrt:update
```
Expected: PASS; new baselines `ltcard-with-image-*`, `ltcard-no-image-*`, `next-event-populated-*`. Inspect: the with-image card shows the thumbnail; the no-image card shows the calendar placeholder; the NextEventCard shows `7月4日 (土)`, `22:00:00 – 23:30` JST (from the fixture).

- [ ] **Step 4: Confirm clean comparison**

Run:
```bash
pnpm --filter website test:vrt
```
Expected: PASS (all component tests).

- [ ] **Step 5: Commit**

```bash
git add apps/website/tests/vrt/components.vrt.test.ts apps/website/tests/vrt/__screenshots__
git commit -m "$(cat <<'EOF'
test(website): VRT snapshots for LtCard and NextEventCard

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Per-section page snapshots for HomeView (`/`)

**Files:**
- Create: `apps/website/tests/vrt/pages.vrt.test.ts`

- [ ] **Step 1: Write the HomeView per-section test**

Create `apps/website/tests/vrt/pages.vrt.test.ts`:
```typescript
import { describe, test, expect } from 'vitest'
import { page } from '@vitest/browser/context'
import { mountApp } from './harness'

function locate(selector: string) {
  const el = document.querySelector(selector)
  if (!el) throw new Error(`element not found: ${selector}`)
  return page.elementLocator(el)
}

const HOME_SECTIONS = ['hero', 'about', 'atmosphere', 'events', 'topics', 'join'] as const
const VIEWPORTS = [
  { name: 'desktop', w: 1280, h: 800 },
  { name: 'mobile', w: 390, h: 844 },
] as const

describe('HomeView sections', () => {
  for (const vp of VIEWPORTS) {
    for (const id of HOME_SECTIONS) {
      test(`#${id} @ ${vp.name}`, async () => {
        await page.viewport(vp.w, vp.h)
        await mountApp('/')
        await expect(locate(`#${id}`)).toMatchScreenshot(`home-${id}-${vp.name}`)
      })
    }
  }
})
```

- [ ] **Step 2: Generate and inspect baselines**

Run:
```bash
pnpm --filter website test:vrt:update
```
Expected: PASS; 12 new baselines (`home-hero-desktop`, … `home-join-mobile`). Inspect each:
- `#hero` shows `CONNECTION_ID: 0x...` (a fixed hash of `203.0.113.42`) and the embedded NextEventCard with the fixture date.
- `#events` shows the three fixture LTs (`Kubernetesでのネットワーク設計`, etc.).
- The left console panel chrome is present but its terminal/log content is blank (neutralized).
- Mobile captures have no console panel (it is `display:none` < 900px).

If a section shows residual animation/flake (e.g., circuit packets), add `body.vrt .split-bg` (or the specific root) to `vrt.css` and re-run.

- [ ] **Step 3: Confirm clean comparison (run twice to check stability)**

Run:
```bash
pnpm --filter website test:vrt && pnpm --filter website test:vrt
```
Expected: PASS both times. Two consecutive clean runs catch nondeterminism that a single run would miss.

- [ ] **Step 4: Commit**

```bash
git add apps/website/tests/vrt/pages.vrt.test.ts apps/website/tests/vrt/__screenshots__
git commit -m "$(cat <<'EOF'
test(website): per-section VRT snapshots for HomeView

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Page snapshots for LtListView (`/lt-list`) + local Docker baseline script

**Files:**
- Modify: `apps/website/tests/vrt/pages.vrt.test.ts`
- Modify: `package.json` (root)

- [ ] **Step 1: Add the `/lt-list` block test**

Append to `apps/website/tests/vrt/pages.vrt.test.ts`:
```typescript
const LTLIST_BLOCKS = ['.archive-header', '.archive-grid', '.pagination'] as const

describe('LtListView blocks', () => {
  for (const vp of VIEWPORTS) {
    for (const sel of LTLIST_BLOCKS) {
      const label = sel.replace('.', '')
      test(`${label} @ ${vp.name}`, async () => {
        await page.viewport(vp.w, vp.h)
        await mountApp('/lt-list')
        await expect(locate(sel)).toMatchScreenshot(`ltlist-${label}-${vp.name}`)
      })
    }
  }
})
```
> `.pagination` only renders when `totalPages > 1` (see `UIPagination`). The `/lt-list` view paginates `src/consts/lts.ts`; if that const currently yields a single page, the `.pagination` element will be absent and `locate` will throw. In that case, drop `.pagination` from `LTLIST_BLOCKS` (it is already covered in isolation by Task 5) and keep `.archive-header` + `.archive-grid`.

- [ ] **Step 2: Generate and inspect baselines**

Run:
```bash
pnpm --filter website test:vrt:update
```
Expected: PASS; new `ltlist-*` baselines. Inspect: header with "LT Archives" + apply button; grid of LtCards from `consts/lts.ts`; the data-stream background is frozen/static behind them.

- [ ] **Step 3: Add the Docker-wrapped local update script (root `package.json`)**

In the root `package.json` `"scripts"`, add (single line; `$PWD` resolves at run time). Replace `<IMAGE>` with the pinned image string produced in Task 9 Step 1:
```json
    "vrt:update": "docker run --rm -v \"$PWD\":/work -w /work <IMAGE> sh -c 'corepack enable && pnpm install --frozen-lockfile && pnpm --filter website exec playwright install chromium && pnpm --filter website test:vrt:update'"
```
> This regenerates baselines inside the exact image CI uses, so committed PNGs match CI. Until Task 9 fixes `<IMAGE>`, leave this script out and use `pnpm --filter website test:vrt:update` locally.

- [ ] **Step 4: Confirm clean comparison**

Run:
```bash
pnpm --filter website test:vrt
```
Expected: PASS (all page + component tests).

- [ ] **Step 5: Commit**

```bash
git add apps/website/tests/vrt/pages.vrt.test.ts apps/website/tests/vrt/__screenshots__ package.json
git commit -m "$(cat <<'EOF'
test(website): VRT snapshots for LtListView + docker baseline script

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Advisory CI workflow + authoritative baselines

**Files:**
- Create: `.github/workflows/vrt.yml`
- Modify: `apps/website/tests/vrt/__screenshots__/` (regenerated in-container baselines)

- [ ] **Step 1: Determine the pinned Playwright image**

Run:
```bash
pnpm --filter website ls playwright
docker pull mcr.microsoft.com/playwright:v<VERSION>-noble   # use the playwright version from the line above
docker inspect --format='{{index .RepoDigests 0}}' mcr.microsoft.com/playwright:v<VERSION>-noble
```
Expected: a string like `mcr.microsoft.com/playwright@sha256:<digest>`. Record the full pinned reference `mcr.microsoft.com/playwright:v<VERSION>-noble@sha256:<digest>` — this is `<IMAGE>` used here and in Task 8 Step 3.

- [ ] **Step 2: Create the advisory VRT workflow**

Create `.github/workflows/vrt.yml` (replace `<IMAGE>` with the pinned reference from Step 1; keep the existing repo convention of SHA-pinned actions — copy the exact `uses:` SHAs from `.github/workflows/lint.yml`):
```yaml
name: VRT

on:
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  vrt:
    name: Visual Regression
    runs-on: ubuntu-latest
    container:
      image: <IMAGE>
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
        with:
          persist-credentials: false

      - uses: jdx/mise-action@1648a7812b9aeae629881980618f079932869151 # v4.0.1

      - name: Get pnpm store directory
        run: echo "STORE_PATH=$(pnpm store path --silent)" >> "$GITHUB_ENV"

      - uses: actions/cache@27d5ce7f107fe9357f9df03efb73ab90386fccae # v5.0.5
        with:
          path: ${{ env.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - run: pnpm install --frozen-lockfile

      - name: Install Chromium (matches installed playwright)
        run: pnpm --filter website exec playwright install chromium

      - name: Run visual regression tests
        run: pnpm --filter website test:vrt

      - name: Upload diff artifacts on failure
        if: failure()
        uses: actions/upload-artifact@65c4c4a1ddee5b72f698fdd19549f0f0fb45cf08 # v4.6.0
        with:
          name: vrt-diffs
          path: apps/website/tests/vrt/__screenshots__/**/*-(actual|diff).png
          if-no-files-found: ignore
```
> If `mise-action` cannot run inside the container, replace it with `run: corepack enable` and rely on the container's Node; the playwright `noble`/`jammy` images ship Node. Confirm `actions/upload-artifact` SHA against the repo's other workflows or the latest release before committing (it is not used elsewhere yet).

- [ ] **Step 3: Lint the workflow (actionlint + zizmor)**

Run:
```bash
mise run actions:lint
```
Expected: PASS. Fix any actionlint/zizmor findings (e.g., add `persist-credentials: false`, which is already set). The glob in the artifact path may need quoting adjustments per actionlint.

- [ ] **Step 4: Regenerate authoritative baselines in the pinned image**

Run (after adding `vrt:update` with the real `<IMAGE>` in Task 8 Step 3):
```bash
pnpm vrt:update
```
Expected: all baselines under `__screenshots__/` are rewritten with `-chromium-linux.png` tags and CI-matching pixels. Re-inspect a couple to confirm they still look correct. `git status` shows modified PNGs.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/vrt.yml apps/website/tests/vrt/__screenshots__
git commit -m "$(cat <<'EOF'
ci: add advisory VRT workflow and container-generated baselines

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Baseline-update workflow (CI write-back path)

**Files:**
- Create: `.github/workflows/vrt-update-baselines.yml`

- [ ] **Step 1: Create the manual update workflow**

Create `.github/workflows/vrt-update-baselines.yml` (uses the same `<IMAGE>`; verify the `git-auto-commit-action` SHA against its latest release before committing):
```yaml
name: VRT Update Baselines

on:
  workflow_dispatch:
    inputs:
      branch:
        description: Branch to regenerate baselines on
        required: true

permissions:
  contents: read

jobs:
  update:
    name: Regenerate baselines
    runs-on: ubuntu-latest
    permissions:
      contents: write
    container:
      image: <IMAGE>
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
        with:
          ref: ${{ inputs.branch }}
          persist-credentials: false

      - uses: jdx/mise-action@1648a7812b9aeae629881980618f079932869151 # v4.0.1

      - run: pnpm install --frozen-lockfile

      - name: Install Chromium
        run: pnpm --filter website exec playwright install chromium

      - name: Regenerate baselines
        run: pnpm --filter website test:vrt:update

      - name: Commit updated baselines
        uses: stefanzweifel/git-auto-commit-action@e348103e9026cc0eee72ae06630dbe30c8bf7a79 # v5.1.0
        with:
          commit_message: "test(website): update VRT baselines [skip ci]"
          file_pattern: apps/website/tests/vrt/__screenshots__/**
          branch: ${{ inputs.branch }}
```

- [ ] **Step 2: Lint the workflow**

Run:
```bash
mise run actions:lint
```
Expected: PASS. zizmor may warn about `contents: write` + checkout; keep `persist-credentials: false` and let the auto-commit action use the job token. Address any high-severity finding before committing.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/vrt-update-baselines.yml
git commit -m "$(cat <<'EOF'
ci: add manual VRT baseline-update workflow

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Documentation and rollout notes

**Files:**
- Modify: `CLAUDE.md` (add a short VRT section) and/or create `apps/website/tests/vrt/README.md`

- [ ] **Step 1: Document the VRT workflow**

Create `apps/website/tests/vrt/README.md`:
```markdown
# Visual Regression Testing

Vitest browser-mode screenshot tests for the website.

- Run comparisons: `pnpm --filter website test:vrt`
- Update baselines (CI-matching, requires Docker): `pnpm vrt:update`
- Update baselines (host-local, pixels may not match CI): `pnpm --filter website test:vrt:update`

Baselines live in `__screenshots__/` and are committed. They must be generated in
the pinned Playwright image (via `pnpm vrt:update` or the "VRT Update Baselines"
workflow) so they match the CI comparison environment.

Determinism: `setup.ts` mocks ipify + seeds Math.random + adds the `.vrt` body class;
`harness.ts` stubs store actions via @pinia/testing, seeds fixtures, skips the loading
screen, pauses GSAP, and kills ScrollTriggers. Dynamic regions (terminal, system-log)
are hidden by `vrt.css`.

The PR check (`vrt.yml`) is advisory. To make it required, add the "Visual Regression"
check to the `main` branch protection's required status checks in GitHub settings.
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/tests/vrt/README.md
git commit -m "$(cat <<'EOF'
docs(website): document VRT workflow and rollout

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: Open the PR (advisory phase)**

Run:
```bash
git push -u origin feat/vrt-integration
gh pr create --base main --title "feat(website): visual regression testing" --body "Adds Vitest browser-mode VRT (pages per-section + key components) with committed baselines and an advisory CI check. See docs/superpowers/specs/2026-06-01-vrt-integration-design.md."
```
Expected: PR opened; the `VRT` check runs and reports (non-blocking).

- [ ] **Step 4: Manual rollout step (no code)**

After the check is green and stable across a few PRs, a repo admin adds the **Visual Regression** check to `main` branch protection's required status checks to promote it from advisory to required. Document the date this happens.

---

## Self-Review

**1. Spec coverage:**
- §1 scope (pages + components, self-hosted PNGs, advisory→required) → Tasks 5–8 (snapshots), Task 9/10 (baselines/CI), Task 11 Step 4 (promotion). ✓
- §2 tooling A (Vitest browser mode) → Task 1. ✓
- §3 determinism harness (seed RNG, stub network, pre-seed Pinia, skip loader, freeze GSAP, neutralize, settle) → Task 2 (setup/css) + Task 4 (harness). The spec's "pre-seed + never call loaders" is realized via `@pinia/testing` `stubActions` (loaders fire in onMounted but are no-ops) — a faithful refinement, noted in Task 4. ✓
- §4.1 per-section pages (`#hero…#join`, lt-list blocks, 2 viewports) → Tasks 7–8. ✓
- §4.2 leaf components (LtCard variants, NextEventCard, UIPagination states) → Tasks 5–6. ✓
- §4.3 neutralization (keep console chrome, hide `.console-top`/`.console-bottom`) → Task 2 Step 1. ✓
- §5 Docker-pinned baselines, CI source of truth, local Docker wrapper → Task 8 Step 3 + Task 9 + Task 10. ✓
- §6 CI workflow (pinned container, pnpm install, artifacts, actionlint/zizmor, advisory) → Task 9. ✓
- §7 file layout, scripts, no pre-build needed → Tasks 1–4, 8, 11. ✓
- §8 thresholds → Task 1 Step 3 (global) + per-call override capability. ✓

**2. Placeholder scan:** `<IMAGE>`, `<VERSION>`, `<digest>`, and `REPLACE_WITH_REAL_FILE.jpg` are explicit lookup steps (Task 9 Step 1, Task 6 Step 1), not vague TODOs — each has a command that produces the concrete value. No "add error handling"-style placeholders.

**3. Type consistency:** `mountApp`/`renderComponent`/`freezeAndSettle`, `nextEventFixture`/`recentLtsFixture`/`communityFixture`, and the `locate()` helper are named consistently across Tasks 4–8. Store names (`ui`, `events`) match the `defineStore` ids in `uiStore.ts`/`eventsStore.ts`. `test:vrt` / `test:vrt:update` / `vrt:update` script names are consistent across Tasks 1, 8, 9, 11.

**Known refinements vs the approved spec (flag to user):**
- The spec said "pre-seed Pinia and never call loadNext/loadRecentLts." Because those run in `onMounted`, the plan instead stubs them via `@pinia/testing` (`stubActions: true`) and seeds `initialState` — same deterministic outcome, no network.
- CI uses `runs-on: ubuntu-latest` with `container: <pinned playwright image>` and `playwright install chromium` to match the npm-resolved browser, rather than relying solely on the image's bundled browser version.
