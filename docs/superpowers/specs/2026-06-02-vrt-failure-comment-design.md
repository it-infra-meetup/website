# VRT Failure PR-Comment — Design

**Date:** 2026-06-02
**Status:** Approved (design); pending implementation plan
**Builds on:** `2026-06-01-vrt-integration-design.md` (the VRT suite + `vrt.yml`).
**Scope:** When the VRT CI check fails on a PR, post a PR comment showing each
failed test's **Original | Current | Diff** images inline. Self-hosted images
(the repo is public); no external service.

## 1. Goal & non-goals

### Goal
Make VRT failures reviewable at a glance: a single PR comment with, per failed
test, a 3-column table (Original / Current / Diff) of the rendered images and the
commit it reflects.

### Non-goals (YAGNI)
- No fork-PR support. Uses a `pull_request`-triggered job; fork PRs get the
  normal failing check but no image comment (decided).
- No success-state comment management beyond what falls out of update-in-place;
  a stale "failed" comment is mitigated by a commit-SHA stamp and by deleting a
  PR's images on close (not by a success-path job).
- No external image host (S3, third-party). Images live on an in-repo orphan
  branch; the public repo makes `raw.githubusercontent.com` URLs render inline.
- No change to the VRT pass/fail logic or baselines.

## 2. Why this approach
The repo is **public**, so GitHub's image proxy can fetch the repo's own raw
content — images committed to an in-repo branch render inline in PR comments.
This avoids S3/AWS coupling in the test workflow and any third-party host.

Vitest's `toMatchScreenshot` failure output is deterministic and name-keyed,
which makes collecting each failed test's trio a glob:
- **Original (reference):** `apps/website/tests/vrt/__screenshots__/<rel>/<name>-chromium-linux.png`
- **Current (actual):** `apps/website/.vitest-attachments/<rel>/<name>-actual-chromium-linux.png`
- **Diff:** `apps/website/.vitest-attachments/<rel>/<name>-diff-chromium-linux.png`

where `<rel>` is the test file path (e.g. `tests/vrt/components.vrt.test.ts`)
and `<name>` is the `toMatchScreenshot` name (e.g. `uipagination-first`). The
presence of an `-actual-` file is the per-test failure signal.

## 3. Components

### 3.1 `vrt.yml` — `vrt` job (existing, minor change)
Runs the suite in the pinned Playwright container. On failure, upload
`apps/website/.vitest-attachments/` as artifact **`vrt-failure-images`** (rename
from the current `vrt-diffs`; it already uploads on failure). The job's pass/fail
is unchanged (advisory).

### 3.2 `vrt.yml` — `report` job (new)
- `needs: vrt`, `if: ${{ always() && needs.vrt.result == 'failure' }}`,
  `runs-on: ubuntu-latest`.
- `permissions: { contents: write, pull-requests: write }`.
- Steps: checkout PR head (for committed baselines; `persist-credentials: false`)
  → `actions/download-artifact` (`vrt-failure-images` → `apps/website/.vitest-attachments/`)
  → set up Node → `node scripts/vrt-report.mjs` with env `PR_NUMBER`,
  `COMMIT_SHA`, `REPO`, `GH_TOKEN` (values passed via `env:` from
  `github.event`/`secrets`, never interpolated into `run:` scripts, to satisfy
  zizmor).

### 3.3 `scripts/vrt-report.mjs` (new)
Pure Node (no deps beyond Node stdlib + `git`/`gh` via `child_process`). Reads
env, performs:
1. **Collect:** glob `apps/website/.vitest-attachments/**/*-actual-chromium-linux.png`.
   For each, derive `name`, `rel`, locate the original under `__screenshots__`
   and the `-diff-` sibling. Skip (with a logged warning) any whose original is
   missing. If none found → exit 0 without commenting.
2. **Publish images** to orphan branch `vrt-report` under
   `pr-<PR_NUMBER>/<rel-with-slashes-flattened>__<name>.{orig,actual,diff}.png`:
   shallow-fetch or create the branch (orphan if absent), replace `pr-<N>/`,
   commit, push via tokenized URL. Idempotent / overwrite-per-PR.
3. **Build comment markdown:** marker `<!-- vrt-report -->`, heading
   `⚠️ VRT failed — <N> test(s) · <short-sha>`, then per test a `### \`<name>\``
   line followed by a 3-column table embedding the three
   `https://raw.githubusercontent.com/<REPO>/vrt-report/pr-<N>/...png` URLs.
   (A changed-pixel ratio is intentionally omitted in v1 — it lives only in the
   test stderr, not the image artifacts; the Diff column conveys the change.)
4. **Post/update comment:** find an existing comment containing the marker via
   the issues API; update it if present, else create. (Use `gh api` or `fetch`
   with `GH_TOKEN`.)

### 3.4 `vrt-report-cleanup.yml` (new)
`on: pull_request: { types: [closed] }`, `permissions: { contents: write }`,
`runs-on: ubuntu-latest`. Removes `pr-<N>/` from the `vrt-report` branch
(tokenized push; no-op if the folder/branch is absent). PR number via `env:`.

## 4. Data flow
`vrt` (container) → `vrt-failure-images` artifact → `report` (ubuntu: git+node)
→ orphan `vrt-report` branch (image CDN) + PR comment. The orphan branch never
intersects `main` or the S3/CloudFront deploy.

## 5. Comment format (illustrative)
```markdown
<!-- vrt-report -->
## ⚠️ VRT failed — 2 test(s) · a1b2c3d

Visual regression detected. Review the changes; if intentional, regenerate
baselines (`pnpm vrt:update` or the **VRT Update Baselines** workflow).

### `home-hero-desktop`
| Original | Current | Diff |
| --- | --- | --- |
| ![orig](https://raw.githubusercontent.com/it-infra-meetup/website/vrt-report/pr-42/pages__home-hero-desktop.orig.png) | ![cur](…actual.png) | ![diff](…diff.png) |
```

## 6. Security / conventions
- `pull_request` trigger (not `pull_request_target`); elevated permissions only
  on the `report`/cleanup jobs.
- All `github.event` / input values reach shell + Node via `env:`, never
  inlined in `run:` (zizmor template-injection).
- Tokenized `git push` with `persist-credentials: false` (zizmor artipacked).
- Workflows pinned to commit SHAs; must pass `actionlint` + `zizmor`
  (`mise run actions:lint`).

## 7. Testing
- Locally force a mismatch (overwrite one baseline) to generate real
  `.vitest-attachments` output, then run `scripts/vrt-report.mjs` in a
  dry-run mode (env flag to skip git push + comment) and assert it discovers the
  correct trios and emits the expected markdown.
- actionlint + zizmor on both workflows.
- End-to-end validated by an intentionally-failing VRT run on the PR.

## 8. Build sequence
1. `scripts/vrt-report.mjs` with a dry-run mode; unit-verify collection +
   markdown against forced-failure artifacts.
2. Add image publish + comment post/update to the script; bootstrap the
   `vrt-report` orphan branch.
3. Add the `report` job to `vrt.yml`; rename the failure artifact.
4. Add `vrt-report-cleanup.yml`.
5. actionlint + zizmor; end-to-end test via a deliberate failing run.
