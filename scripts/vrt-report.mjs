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
