#!/usr/bin/env node
// Build (and in non-dry-run mode, publish) a VRT failure report for a PR.
// Reads Vitest's failure artifacts, hosts the images on the `vrt-report`
// orphan branch, and upserts a PR comment with Original|Current|Diff tables.
//
// Security: this runs in the privileged workflow_run context (write token), so
// it treats everything under the attachment/baseline dirs as UNTRUSTED — those
// images come from a bundle assembled by PR-controlled code. Test names are
// allowlist-validated before being interpolated into the comment or used as
// paths, and the target PR is resolved from a trusted head SHA (HEAD_SHA), not
// from anything in the bundle.
import {
  readdirSync, existsSync, mkdirSync, rmSync, copyFileSync, mkdtempSync, writeFileSync,
} from 'node:fs'
import { join, basename, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'

const {
  PR_NUMBER, HEAD_SHA, COMMIT_SHA, REPO, GH_TOKEN, VRT_REPORT_DRY_RUN,
} = process.env
const DRY_RUN = Boolean(VRT_REPORT_DRY_RUN)

// Overridable so the workflow_run job can point these at the downloaded bundle
// (the script never trusts the content, only re-hosts the images).
const ATTACH_DIR = process.env.VRT_ATTACH_DIR || 'apps/website/.vitest-attachments'
const BASELINE_DIR = process.env.VRT_BASELINE_DIR || 'apps/website/tests/vrt/__screenshots__'
const HOST_BRANCH = 'vrt-report'
const MARKER = '<!-- vrt-report -->'
const ACTUAL_SUFFIX = '-actual-chromium-linux.png'
const BASELINE_SUFFIX = '-chromium-linux.png'
const DIFF_SUFFIX = '-diff-chromium-linux.png'
// Test/file names are interpolated into the PR comment (HTML/markdown) and used
// as filesystem/branch paths. Vitest names are plain identifiers; reject
// anything else so a poisoned bundle cannot inject markup or traverse paths.
const SAFE_NAME = /^[A-Za-z0-9._-]+$/

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
    if (!SAFE_NAME.test(testFile) || !SAFE_NAME.test(name)) {
      console.warn(`WARN: skipping unsafe name (testFile="${testFile}", name="${name}")`)
      continue
    }
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

function buildComment(failures, prNumber) {
  const rawBase = `https://raw.githubusercontent.com/${REPO}/${HOST_BRANCH}/pr-${prNumber}`
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

// --- side effects ---
function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' })
}

function publishToBranch(failures, prNumber) {
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

  const prDir = join(tmp, `pr-${prNumber}`)
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
    git(tmp, 'commit', '--quiet', '-m', `vrt report pr-${prNumber} ${COMMIT_SHA || ''} [skip ci]`)
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

// Resolve the PR number from a trusted source. Prefer an explicitly-provided
// PR_NUMBER (local/dry-run); otherwise look it up from the trusted head SHA so
// a poisoned bundle cannot redirect the comment to an arbitrary PR.
async function resolvePrNumber() {
  if (PR_NUMBER) {
    if (!/^[0-9]+$/.test(PR_NUMBER)) throw new Error(`PR_NUMBER must be numeric, got "${PR_NUMBER}"`)
    return PR_NUMBER
  }
  if (!HEAD_SHA) throw new Error('need PR_NUMBER or HEAD_SHA to resolve the target PR')
  const pulls = await gh(`/repos/${REPO}/commits/${HEAD_SHA}/pulls`)
  const open = pulls.find((p) => p.state === 'open' && p.head?.sha === HEAD_SHA)
    || pulls.find((p) => p.state === 'open')
  if (!open) throw new Error(`no open PR found for ${HEAD_SHA}`)
  return String(open.number)
}

async function upsertComment(body, prNumber) {
  const comments = await gh(`/repos/${REPO}/issues/${prNumber}/comments?per_page=100`)
  const existing = comments.find((c) => typeof c.body === 'string' && c.body.includes(MARKER))
  if (existing) {
    await gh(`/repos/${REPO}/issues/comments/${existing.id}`, 'PATCH', { body })
    console.log(`Updated comment ${existing.id}`)
  } else {
    const created = await gh(`/repos/${REPO}/issues/${prNumber}/comments`, 'POST', { body })
    console.log(`Created comment ${created.id}`)
  }
}

async function main() {
  if (!REPO) throw new Error('missing required env REPO')
  const failures = collectFailures()
  if (failures.length === 0) {
    console.log('No VRT failures found; nothing to report.')
    return
  }
  console.log(`Found ${failures.length} failed test(s): ${failures.map((f) => f.name).join(', ')}`)
  if (DRY_RUN) {
    console.log(`--- DRY RUN: ${failures.length} trios collected ---`)
    console.log(buildComment(failures, PR_NUMBER || '0'))
    return
  }
  if (!GH_TOKEN) throw new Error('missing required env GH_TOKEN (non-dry-run)')
  const prNumber = await resolvePrNumber()
  const body = buildComment(failures, prNumber)
  publishToBranch(failures, prNumber)
  await upsertComment(body, prNumber)
  console.log(`VRT report published and comment upserted on PR #${prNumber}.`)
}

main().catch((e) => { console.error(e); process.exit(1) })
