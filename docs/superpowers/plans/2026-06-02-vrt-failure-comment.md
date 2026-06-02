# VRT Failure PR-Comment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When the VRT CI check fails on a PR, post/update a single PR comment showing each failed test's Original | Current | Diff images inline.

**Architecture:** The `vrt` job uploads failure images as an artifact. A new `report` job (failure-only, normal runner) runs `scripts/vrt-report.mjs`, which collects each failed test's image trio, publishes them to an in-repo orphan branch `vrt-report` (the public repo makes `raw.githubusercontent.com` URLs render inline), and upserts a marked PR comment. A cleanup workflow removes a PR's images on close.

**Tech Stack:** Node 24 (ESM, stdlib only — `fetch`, `fs`, `child_process`/`git`), GitHub Actions, GitHub REST API.

---

## Conventions
- Run from repo root `/home/a1678991/IdeaProjects/website`. Branch: `feat/vrt-integration` (this joins PR #42).
- Conventional Commits; `scope-enum` = [frontend, ci, infra, tool, vrc-ta-hub-client]. Use `ci:` for workflow/script commits (no scope) and `docs:` as needed. Commit trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- Workflows must pass `mise run actions:lint` (actionlint + zizmor) and pin actions to commit SHAs.
- The repo is **public** (`it-infra-meetup/website`).

## Failure-artifact layout (verified)
On a `toMatchScreenshot` mismatch, Vitest writes:
- Original (committed baseline): `apps/website/tests/vrt/__screenshots__/<testFile>/<name>-chromium-linux.png`
- Current: `apps/website/.vitest-attachments/tests/vrt/<testFile>/<name>-actual-chromium-linux.png`
- Diff: `apps/website/.vitest-attachments/tests/vrt/<testFile>/<name>-diff-chromium-linux.png`

`<testFile>` (e.g. `components.vrt.test.ts`) is the immediate parent dir of the images in BOTH trees. `<name>` is the `toMatchScreenshot` name and is globally unique across the suite (`uipagination-*`, `ltcard-*`, `next-event-*`, `home-*`, `ltlist-*`). The presence of an `-actual-` file is the per-test failure signal.

## File structure
| File | Responsibility |
| --- | --- |
| `scripts/vrt-report.mjs` | **Create** — collect failed-test trios, publish to `vrt-report` branch, upsert PR comment. Dry-run mode for local testing. |
| `.github/workflows/vrt.yml` | **Modify** — rename failure artifact to `vrt-failure-images`; add `report` job. |
| `.github/workflows/vrt-report-cleanup.yml` | **Create** — on PR close, delete `pr-<N>/` from `vrt-report`. |

---

## Task 1: `scripts/vrt-report.mjs` — collection + markdown (dry-run)

**Files:** Create `scripts/vrt-report.mjs`

- [ ] **Step 1: Write the script (collection + markdown + dry-run; side effects stubbed until Task 2)**

Create `scripts/vrt-report.mjs`:
```javascript
#!/usr/bin/env node
// Build (and in non-dry-run mode, publish) a VRT failure report for a PR.
// Reads Vitest's failure artifacts, hosts the images on the `vrt-report`
// orphan branch, and upserts a PR comment with Original|Current|Diff tables.
import {
  readdirSync, existsSync, mkdirSync, rmSync, copyFileSync, mkdtempSync, writeFileSync,
} from 'node:fs'
import { join, basename, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'

const { PR_NUMBER, COMMIT_SHA, REPO, GH_TOKEN, VRT_REPORT_DRY_RUN } = process.env
const DRY_RUN = Boolean(VRT_REPORT_DRY_RUN)

const ATTACH_DIR = 'apps/website/.vitest-attachments'
const BASELINE_DIR = 'apps/website/tests/vrt/__screenshots__'
const HOST_BRANCH = 'vrt-report'
const MARKER = '<!-- vrt-report -->'
const ACTUAL_SUFFIX = '-actual-chromium-linux.png'
const BASELINE_SUFFIX = '-chromium-linux.png'
const DIFF_SUFFIX = '-diff-chromium-linux.png'

function listFiles(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => join(e.parentPath, e.name))
}

function collectFailures() {
  const failures = []
  for (const actual of listFiles(ATTACH_DIR).filter((f) => f.endsWith(ACTUAL_SUFFIX))) {
    const testFile = basename(dirname(actual))
    const name = basename(actual).slice(0, -ACTUAL_SUFFIX.length)
    const original = join(BASELINE_DIR, testFile, `${name}${BASELINE_SUFFIX}`)
    const diff = join(dirname(actual), `${name}${DIFF_SUFFIX}`)
    if (!existsSync(original)) {
      console.warn(`WARN: no baseline for "${name}" at ${original}; skipping`)
      continue
    }
    failures.push({ name, original, actual, diff: existsSync(diff) ? diff : null })
  }
  return failures.sort((a, b) => a.name.localeCompare(b.name))
}

function buildComment(failures) {
  const rawBase = `https://raw.githubusercontent.com/${REPO}/${HOST_BRANCH}/pr-${PR_NUMBER}`
  const short = (COMMIT_SHA || '').slice(0, 7)
  let body = `${MARKER}\n## ⚠️ VRT failed — ${failures.length} test(s)`
  if (short) body += ` · \`${short}\``
  body += '\n\nVisual regression detected. If the change is intentional, regenerate '
    + 'baselines with `pnpm vrt:update` or the **VRT Update Baselines** workflow.\n'
  for (const f of failures) {
    const img = (kind) => `<img src="${rawBase}/${f.name}.${kind}.png" width="300">`
    body += `\n### \`${f.name}\`\n`
    body += '| Original | Current | Diff |\n| --- | --- | --- |\n'
    body += `| ${img('orig')} | ${img('actual')} | ${f.diff ? img('diff') : '_n/a_'} |\n`
  }
  return body
}

// --- side effects (implemented in Task 2) ---
function publishToBranch(_failures) {
  throw new Error('publishToBranch not implemented yet')
}
async function upsertComment(_body) {
  throw new Error('upsertComment not implemented yet')
}

async function main() {
  for (const k of ['PR_NUMBER', 'REPO']) {
    if (!process.env[k]) throw new Error(`missing required env ${k}`)
  }
  const failures = collectFailures()
  if (failures.length === 0) {
    console.log('No VRT failures found; nothing to report.')
    return
  }
  console.log(`Found ${failures.length} failed test(s): ${failures.map((f) => f.name).join(', ')}`)
  const body = buildComment(failures)
  if (DRY_RUN) {
    console.log(`--- DRY RUN: ${failures.length} trios collected ---`)
    console.log(body)
    return
  }
  if (!GH_TOKEN) throw new Error('missing required env GH_TOKEN (non-dry-run)')
  publishToBranch(failures)
  await upsertComment(body)
  console.log('VRT report published and comment upserted.')
}

main().catch((e) => { console.error(e); process.exit(1) })
```

- [ ] **Step 2: Generate real failure artifacts**

Run (forces one mismatch, leaving baselines restorable via git):
```bash
cd /home/a1678991/IdeaProjects/website
rm -rf apps/website/.vitest-attachments
SS=apps/website/tests/vrt/__screenshots__/components.vrt.test.ts
cp "$SS/uipagination-last-chromium-linux.png" "$SS/uipagination-first-chromium-linux.png"
pnpm --filter website test:vrt 2>&1 | tail -5 || true
git checkout -- "$SS/uipagination-first-chromium-linux.png"
```
Expected: 1 failed test; `apps/website/.vitest-attachments/tests/vrt/components.vrt.test.ts/uipagination-first-actual-chromium-linux.png` (+ `-diff-`) now exist.

- [ ] **Step 3: Dry-run the script**

Run:
```bash
PR_NUMBER=42 COMMIT_SHA=$(git rev-parse HEAD) REPO=it-infra-meetup/website VRT_REPORT_DRY_RUN=1 node scripts/vrt-report.mjs
```
Expected: `Found 1 failed test(s): uipagination-first` and printed markdown containing the marker, a `### \`uipagination-first\`` heading, and a 3-column table with three `raw.githubusercontent.com/it-infra-meetup/website/vrt-report/pr-42/uipagination-first.{orig,actual,diff}.png` `<img>` URLs.

- [ ] **Step 4: Commit**
```bash
git add scripts/vrt-report.mjs
git commit -m "$(cat <<'EOF'
ci: add VRT failure report collector (dry-run)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Add image publish + comment upsert (real side effects)

**Files:** Modify `scripts/vrt-report.mjs`

- [ ] **Step 1: Replace the two stub functions**

Replace the `// --- side effects (implemented in Task 2) ---` block (the `publishToBranch` and `upsertComment` stubs) with:
```javascript
// --- side effects ---
function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' })
}

function publishToBranch(failures) {
  const url = `https://x-access-token:${GH_TOKEN}@github.com/${REPO}.git`
  const tmp = mkdtempSync(join(tmpdir(), 'vrt-report-'))
  let existed = true
  try {
    execFileSync('git', ['clone', '--quiet', '--depth', '1', '--single-branch',
      '--branch', HOST_BRANCH, url, tmp], { stdio: ['ignore', 'pipe', 'pipe'] })
  } catch {
    existed = false
    git(tmp, 'init', '--quiet', '--initial-branch', HOST_BRANCH)
  }
  git(tmp, 'config', 'user.name', 'github-actions[bot]')
  git(tmp, 'config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com')

  const prDir = join(tmp, `pr-${PR_NUMBER}`)
  rmSync(prDir, { recursive: true, force: true })
  mkdirSync(prDir, { recursive: true })
  for (const f of failures) {
    copyFileSync(f.original, join(prDir, `${f.name}.orig.png`))
    copyFileSync(f.actual, join(prDir, `${f.name}.actual.png`))
    if (f.diff) copyFileSync(f.diff, join(prDir, `${f.name}.diff.png`))
  }
  if (!existed) {
    writeFileSync(join(tmp, 'README.md'),
      'Auto-managed VRT failure images (see scripts/vrt-report.mjs). Do not edit by hand.\n')
  }
  git(tmp, 'add', '--all')
  if (git(tmp, 'status', '--porcelain').trim()) {
    git(tmp, 'commit', '--quiet', '-m', `vrt report pr-${PR_NUMBER} ${COMMIT_SHA || ''} [skip ci]`)
    execFileSync('git', ['-C', tmp, 'push', '--quiet', url, `HEAD:${HOST_BRANCH}`],
      { stdio: ['ignore', 'pipe', 'pipe'] })
  } else {
    console.log('vrt-report: images unchanged; skipping push')
  }
  rmSync(tmp, { recursive: true, force: true })
}

async function gh(path, method = 'GET', body) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`GitHub API ${method} ${path} -> ${res.status}: ${await res.text()}`)
  return res.json()
}

async function upsertComment(body) {
  const comments = await gh(`/repos/${REPO}/issues/${PR_NUMBER}/comments?per_page=100`)
  const existing = comments.find((c) => typeof c.body === 'string' && c.body.includes(MARKER))
  if (existing) {
    await gh(`/repos/${REPO}/issues/comments/${existing.id}`, 'PATCH', { body })
    console.log(`Updated comment ${existing.id}`)
  } else {
    const created = await gh(`/repos/${REPO}/issues/${PR_NUMBER}/comments`, 'POST', { body })
    console.log(`Created comment ${created.id}`)
  }
}
```

- [ ] **Step 2: Re-generate failure artifacts (same as Task 1 Step 2)**
```bash
cd /home/a1678991/IdeaProjects/website
rm -rf apps/website/.vitest-attachments
SS=apps/website/tests/vrt/__screenshots__/components.vrt.test.ts
cp "$SS/uipagination-last-chromium-linux.png" "$SS/uipagination-first-chromium-linux.png"
pnpm --filter website test:vrt 2>&1 | tail -3 || true
git checkout -- "$SS/uipagination-first-chromium-linux.png"
```

- [ ] **Step 3: Run the script for real against PR #42 (end-to-end local validation)**
```bash
PR_NUMBER=42 COMMIT_SHA=$(git rev-parse HEAD) REPO=it-infra-meetup/website \
  GH_TOKEN=$(gh auth token) node scripts/vrt-report.mjs
```
Expected: `Created comment <id>` (or `Updated`). The `vrt-report` branch is created with `pr-42/uipagination-first.{orig,actual,diff}.png`.

- [ ] **Step 4: Verify the hosted images are publicly fetchable and the comment exists**
```bash
for k in orig actual diff; do
  echo -n "$k: "; curl -s -o /dev/null -w "%{http_code}\n" \
    "https://raw.githubusercontent.com/it-infra-meetup/website/vrt-report/pr-42/uipagination-first.$k.png"
done
gh pr view 42 --json comments --jq '.comments[] | select(.body | contains("<!-- vrt-report -->")) | .url'
```
Expected: three `200`s, and the comment URL. Open the comment URL and confirm the three images render side by side.

- [ ] **Step 5: Clean up the validation comment (VRT is not actually failing on #42)**
```bash
CID=$(gh api "repos/it-infra-meetup/website/issues/42/comments" --jq '.[] | select(.body|contains("<!-- vrt-report -->")) | .id' | head -1)
[ -n "$CID" ] && gh api -X DELETE "repos/it-infra-meetup/website/issues/comments/$CID" && echo "deleted test comment $CID"
```
(The `vrt-report` branch + `pr-42/` images may remain; they are harmless and will be reused/cleaned by the cleanup workflow when #42 closes.)

- [ ] **Step 6: Commit**
```bash
git add scripts/vrt-report.mjs
git commit -m "$(cat <<'EOF'
ci: publish VRT failure images to vrt-report branch and upsert PR comment

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Wire the `report` job into `vrt.yml`

**Files:** Modify `.github/workflows/vrt.yml`

- [ ] **Step 1: Resolve pinned SHAs for the new actions**
```bash
for a in actions/download-artifact actions/setup-node; do
  t=$(gh api "repos/$a/releases/latest" --jq .tag_name)
  s=$(gh api "repos/$a/git/refs/tags/$t" --jq .object.sha)
  echo "$a $t $s"
done
```
Record each `SHA # TAG` for use below.

- [ ] **Step 2: Rename the failure artifact in the `vrt` job**

In `.github/workflows/vrt.yml`, change the upload step's `name: vrt-diffs` to `name: vrt-failure-images` (leave `path: apps/website/.vitest-attachments/` and `if-no-files-found: ignore` as-is).

- [ ] **Step 3: Append the `report` job** (use the SHAs from Step 1 for download-artifact/setup-node; reuse the checkout SHA already in this file):
```yaml
  report:
    name: Report failures
    needs: vrt
    if: ${{ always() && needs.vrt.result == 'failure' }}
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
        with:
          persist-credentials: false

      - uses: actions/download-artifact@<SHA> # <TAG>
        with:
          name: vrt-failure-images
          path: apps/website/.vitest-attachments

      - uses: actions/setup-node@<SHA> # <TAG>
        with:
          node-version: 24

      - name: Build and post VRT failure report
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PR_NUMBER: ${{ github.event.pull_request.number }}
          COMMIT_SHA: ${{ github.event.pull_request.head.sha }}
          REPO: ${{ github.repository }}
        run: node scripts/vrt-report.mjs
```

- [ ] **Step 4: Lint**
```bash
mise run actions:lint
```
Expected: PASS (no actionlint/zizmor findings). All `github.event` values reach the script via `env:` (not interpolated in `run:`), satisfying zizmor.

- [ ] **Step 5: Commit**
```bash
git add .github/workflows/vrt.yml
git commit -m "$(cat <<'EOF'
ci: post VRT failure image comment from a report job

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Cleanup workflow

**Files:** Create `.github/workflows/vrt-report-cleanup.yml`

- [ ] **Step 1: Create the workflow**
```yaml
name: VRT Report Cleanup

on:
  pull_request:
    types: [closed]

permissions:
  contents: read

jobs:
  cleanup:
    name: Remove PR VRT images
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - name: Delete this PR's images from the vrt-report branch
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PR_NUMBER: ${{ github.event.pull_request.number }}
          REPO: ${{ github.repository }}
        run: |
          set -euo pipefail
          url="https://x-access-token:${GH_TOKEN}@github.com/${REPO}.git"
          tmp="$(mktemp -d)"
          if ! git clone --quiet --depth 1 --single-branch --branch vrt-report "$url" "$tmp"; then
            echo "No vrt-report branch; nothing to clean."
            exit 0
          fi
          cd "$tmp"
          if [ ! -d "pr-${PR_NUMBER}" ]; then
            echo "No images for PR ${PR_NUMBER}."
            exit 0
          fi
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git rm --quiet -r "pr-${PR_NUMBER}"
          git commit --quiet -m "vrt report cleanup pr-${PR_NUMBER} [skip ci]"
          git push --quiet "$url" "HEAD:vrt-report"
          echo "Removed pr-${PR_NUMBER} images."
```

- [ ] **Step 2: Lint**
```bash
mise run actions:lint
```
Expected: PASS. `PR_NUMBER`/`REPO`/`GH_TOKEN` are env vars referenced as `${PR_NUMBER}` etc. in the shell (not `${{ }}` expressions), so no template-injection finding.

- [ ] **Step 3: Commit**
```bash
git add .github/workflows/vrt-report-cleanup.yml
git commit -m "$(cat <<'EOF'
ci: clean up VRT report images when a PR closes

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: End-to-end CI validation (deliberate, reverted)

**Files:** none committed permanently — this is a temporary push to exercise the CI `report` job.

- [ ] **Step 1: Push the branch so the new workflow + script are on the PR**
```bash
git push
```

- [ ] **Step 2: Introduce a temporary, obvious VRT failure and push it**
```bash
SS=apps/website/tests/vrt/__screenshots__/components.vrt.test.ts
cp "$SS/uipagination-last-chromium-linux.png" "$SS/uipagination-first-chromium-linux.png"
git add "$SS/uipagination-first-chromium-linux.png"
git commit -m "test(frontend): TEMP break a baseline to exercise VRT report [skip-release]"
git push
```

- [ ] **Step 3: Watch the VRT + report jobs**
```bash
gh pr checks 42 --watch --interval 20
gh run list --workflow=vrt.yml --limit 1
```
Expected: `Visual Regression` fails; the `report` job runs and succeeds.

- [ ] **Step 4: Confirm the comment was posted by CI with rendered images**
```bash
gh pr view 42 --json comments --jq '.comments[] | select(.body|contains("<!-- vrt-report -->")) | .url'
```
Open the URL; confirm the `uipagination-first` Original | Current | Diff images render.

- [ ] **Step 5: Revert the temporary failure**
```bash
git checkout -- apps/website/tests/vrt/__screenshots__/components.vrt.test.ts 2>/dev/null || true
git revert --no-edit HEAD   # reverts the TEMP-break commit
git push
```
Expected: VRT passes again on the next run. (The stale failure comment can be removed manually or left until #42 closes, when cleanup runs.)

---

## Self-Review

**Spec coverage:**
- §3.1 artifact rename → Task 3 Step 2. ✓
- §3.2 `report` job (needs/if/permissions/env-passed values) → Task 3 Step 3. ✓
- §3.3 script: collect (Task 1), publish to orphan branch + upsert comment (Task 2), dry-run (Task 1 Step 1/3), skip-when-none (`collectFailures` empty → returns early). ✓
- §3.4 cleanup workflow → Task 4. ✓
- §5 comment format (marker, heading w/ short SHA, per-test 3-col table) → `buildComment` (Task 1). ✓
- §6 security (env-passed values, tokenized push, persist-credentials false, SHA pins, actionlint+zizmor) → Tasks 3–4. ✓
- §7 testing (forced mismatch dry-run + e2e) → Task 1 Steps 2–3, Task 2 Steps 2–4, Task 5. ✓

**Placeholder scan:** `<SHA> # <TAG>` in Task 3 are explicit lookups resolved in Task 3 Step 1 (not vague TODOs). No other placeholders.

**Type/name consistency:** `vrt-failure-images` (artifact) consistent across Task 3 Steps 2–3. `vrt-report` (branch), `<!-- vrt-report -->` (marker), `pr-<N>/<name>.{orig,actual,diff}.png` (paths) consistent across script, comment URLs, and cleanup. `collectFailures`/`buildComment`/`publishToBranch`/`upsertComment`/`gh`/`git` names consistent between Tasks 1 and 2.
