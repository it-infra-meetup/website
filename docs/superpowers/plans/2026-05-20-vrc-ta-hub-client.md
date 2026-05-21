# VRC TA Hub TypeScript Client — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the single-app repo into a pnpm monorepo and add a workspace-internal `@vrc-ta-hub/client` package that gives the Vue 3 frontend type-safe, **zod v4** validated access to the public read-only endpoints of `https://vrc-ta-hub.com/api/v1/`.

**Architecture:** Standard pnpm monorepo (`apps/website/` + `packages/vrc-ta-hub-client/`). Schemas are **hand-written** in zod v4 (the OpenAPI codegen tools available today emit zod v3 syntax and produce unreliable output for this API — see spec amendment). A factory-style client wraps the schemas; methods return `Result<T, ClientError>` (no throws). Tests are Vitest-driven against committed fixtures only — no network in CI.

**Tech Stack:** pnpm 10 workspaces, Vite 8 + Vue 3.5, TypeScript 6, **Zod 4**, Vitest 2, tsx, semantic-release, lefthook, commitlint.

**Spec:** `docs/superpowers/specs/2026-05-20-vrc-ta-hub-client-design.md` (see the "Amendments" section at the top).

**Execution model:** Four phases. Each phase ships as its own PR. The main session creates a branch, dispatches a subagent for the phase tasks, then pushes and opens the PR. The next phase does **not** start until the prior PR is merged.

---

## File Plan

### Files created

- `apps/website/` (directory; receives moved files)
- `apps/website/package.json` (new — split from root)
- `apps/website/tsconfig.json`, `apps/website/tsconfig.app.json`, `apps/website/tsconfig.node.json` (moved verbatim — no edits)
- `apps/website/vite.config.ts`, `apps/website/postcss.config.js`, `apps/website/tailwind.config.js` (moved verbatim)
- `apps/website/index.html`, `apps/website/src/**`, `apps/website/public/**` (moved verbatim)
- `packages/vrc-ta-hub-client/package.json`
- `packages/vrc-ta-hub-client/tsconfig.json`
- `packages/vrc-ta-hub-client/vitest.config.ts`
- `packages/vrc-ta-hub-client/README.md`
- `packages/vrc-ta-hub-client/src/schemas.ts` — hand-written zod v4 schemas
- `packages/vrc-ta-hub-client/src/result.ts`
- `packages/vrc-ta-hub-client/src/errors.ts`
- `packages/vrc-ta-hub-client/src/url.ts`
- `packages/vrc-ta-hub-client/src/client.ts`
- `packages/vrc-ta-hub-client/src/index.ts`
- `packages/vrc-ta-hub-client/scripts/lib.ts`
- `packages/vrc-ta-hub-client/scripts/refresh-fixtures.ts`
- `packages/vrc-ta-hub-client/tests/__fixtures__/community.json`
- `packages/vrc-ta-hub-client/tests/__fixtures__/event.json`
- `packages/vrc-ta-hub-client/tests/__fixtures__/event_detail.json`
- `packages/vrc-ta-hub-client/tests/__fixtures__/openapi.yaml`
- `packages/vrc-ta-hub-client/tests/schemas.test.ts`
- `packages/vrc-ta-hub-client/tests/result.test.ts`
- `packages/vrc-ta-hub-client/tests/url-builder.test.ts`
- `packages/vrc-ta-hub-client/tests/client.test.ts`

### Files modified

- `package.json` (root) — workspace shell; runtime deps removed
- `pnpm-workspace.yaml` — adds `packages:` entry
- `eslint.config.ts` — broaden globs, node globals for nested configs, test overrides
- `commitlint.config.mjs` — add `vrc-ta-hub-client` to `scope-enum`
- `release.config.mjs` — repoint exec plugin to filtered build + new dist path
- `.github/workflows/*.yml` — build/test/deploy paths updated; client test step added
- `apps/website/src/stores/<new-store>.ts` and `apps/website/src/views/HomeView.vue` — integration call site

### Files NOT moved (stay at repo root)

`pnpm-workspace.yaml`, `pnpm-lock.yaml`, `.gitignore`, `.github/`, `.vscode/`, `.idea/`, `aws/`, `mise.toml`, `mise.lock`, `lefthook.yaml`, `eslint.config.ts`, `commitlint.config.mjs`, `release.config.mjs`, `CHANGELOG.md`, `README.md`, new root `package.json`.

---

## Phase 1 — Monorepo restructure & tooling

**Goal:** Move the Vue app into `apps/website/`, split the root `package.json` into a workspace shell + an app package, update tooling configs (eslint, commitlint, release, GitHub Actions) so everything still works. **No client code yet.**

**Acceptance:**
- `pnpm install` from a fresh clone succeeds.
- `pnpm --filter website build` produces `apps/website/dist/index.html`.
- `pnpm --filter website dev` starts on port 9010 and the home page renders.
- `pnpm lint` and `pnpm --filter website typecheck` both succeed.
- `mise run actions:lint` passes.
- A test commit using `feat(vrc-ta-hub-client): probe` passes commitlint; `feat(client): probe` is rejected.

**Branch:** `feat/monorepo-restructure`
**PR title:** `feat(infra): convert to pnpm monorepo (apps/website + packages/*)`
**Commit scope:** `infra`

### Task 1.1 — Update `pnpm-workspace.yaml`

**Files:**
- Modify: `pnpm-workspace.yaml`

- [ ] **Step 1: Edit `pnpm-workspace.yaml`**

Replace existing content with:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
minimumReleaseAge: 4320
```

- [ ] **Step 2: Verify pnpm parses the workspace**

Run: `pnpm install --frozen-lockfile 2>&1 | tail -5`
Expected: completes without "ERR_PNPM_NO_PROJECT_MANIFEST" errors. May warn that no packages match the new globs yet — that's fine.

### Task 1.2 — Move Vue app files into `apps/website/`

**Files:**
- Create: `apps/website/` directory
- Move (via `git mv`): `src/`, `public/`, `index.html`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tailwind.config.js`, `postcss.config.js`

- [ ] **Step 1: Create the target directory**

Run: `mkdir -p apps/website`

- [ ] **Step 2: Move files with git history preserved**

Run:
```bash
git mv src apps/website/src
git mv public apps/website/public
git mv index.html apps/website/index.html
git mv vite.config.ts apps/website/vite.config.ts
git mv tsconfig.json apps/website/tsconfig.json
git mv tsconfig.app.json apps/website/tsconfig.app.json
git mv tsconfig.node.json apps/website/tsconfig.node.json
git mv tailwind.config.js apps/website/tailwind.config.js
git mv postcss.config.js apps/website/postcss.config.js
```

- [ ] **Step 3: Verify the move**

Run: `ls apps/website/`
Expected: `src public index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json tailwind.config.js postcss.config.js`

Run: `ls`
Expected: no `src`, `public`, `index.html`, `vite.config.ts`, `tsconfig*.json`, `tailwind.config.js`, or `postcss.config.js` at the root.

### Task 1.3 — Create `apps/website/package.json`

**Files:**
- Create: `apps/website/package.json`

- [ ] **Step 1: Write the file**

```json
{
  "name": "website",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "dev:host": "vite --host",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "vue-tsc -b --noEmit",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  },
  "dependencies": {
    "@lucide/vue": "1.16.0",
    "gsap": "3.15.0",
    "pinia": "3.0.4",
    "vue": "3.5.34",
    "vue-router": "5.0.7"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "4.3.0",
    "@types/node": "25.8.0",
    "@vitejs/plugin-vue": "6.0.7",
    "@vue/tsconfig": "0.9.1",
    "autoprefixer": "10.5.0",
    "eslint-plugin-vue": "^10.9.1",
    "postcss": "8.5.14",
    "tailwindcss": "4.3.0",
    "vite": "8.0.13",
    "vue-tsc": "3.2.9"
  }
}
```

`@vrc-ta-hub/client` is NOT listed yet — Phase 4 adds it. `eslint-plugin-vue`
lives here (not at root) because only the Vue app needs it.

### Task 1.4 — Replace root `package.json` with a workspace shell

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Replace contents**

```json
{
  "name": "it-infra-monorepo",
  "private": true,
  "version": "1.1.0",
  "type": "module",
  "packageManager": "pnpm@10.20.0",
  "scripts": {
    "dev": "pnpm --filter website dev",
    "build": "pnpm -r --filter \"./apps/*\" --filter \"./packages/*\" build",
    "build:website": "pnpm --filter website build",
    "lint": "pnpm -r lint && eslint --no-error-on-unmatched-pattern '*.config.{ts,mjs,js}'",
    "lint:fix": "pnpm -r lint:fix && eslint --fix --no-error-on-unmatched-pattern '*.config.{ts,mjs,js}'",
    "test": "pnpm -r --filter \"./packages/*\" test",
    "typecheck": "pnpm -r --filter \"./packages/*\" --filter \"./apps/*\" typecheck",
    "fixtures:refresh": "pnpm --filter @vrc-ta-hub/client fixtures:refresh",
    "commitlint": "commitlint",
    "semantic-release": "semantic-release"
  },
  "devDependencies": {
    "@commitlint/cli": "^21.0.1",
    "@commitlint/config-conventional": "^21.0.1",
    "@eslint/js": "^10.0.1",
    "@semantic-release/changelog": "^6.0.3",
    "@semantic-release/exec": "^7.1.0",
    "@semantic-release/git": "^10.0.1",
    "eslint": "^10.4.0",
    "globals": "^17.6.0",
    "jiti": "^2.7.0",
    "semantic-release": "^25.0.3",
    "typescript": "6.0.3",
    "typescript-eslint": "^8.59.3"
  }
}
```

### Task 1.5 — Reinstall dependencies

- [ ] **Step 1: Reinstall**

Run: `pnpm install`
Expected: lockfile updates to reflect the new workspace topology (root + `apps/website` importers).

### Task 1.6 — Per-package ESLint configs

We split ESLint into one config per workspace package plus a minimal root
config. Each package owns its own lint rules; the root only lints its own
config files (`release.config.mjs`, `commitlint.config.mjs`,
`eslint.config.ts` itself). `eslint`, `@eslint/js`, `typescript-eslint`,
`jiti`, `globals` stay at the root (hoisted to children); `eslint-plugin-vue`
is local to `apps/website/` (already moved there in Task 1.3).

**Files:**
- Modify: `eslint.config.ts` (at repo root) — shrink to root-only scope
- Create: `apps/website/eslint.config.ts`
- Create: a fresh root `tsconfig.json` if not already present — it must cover
  `*.config.{ts,mjs,js}` so `projectService` resolves
- Verify: `apps/website/tsconfig.app.json` already covers
  `eslint.config.ts` via `include` (the `*.config.ts` glob inside the app);
  if not, the app's tsconfig needs adjustment

- [ ] **Step 1: Rewrite the root `eslint.config.ts`**

```ts
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    ignores: ["**/dist/**", "**/node_modules/**", "apps/**", "packages/**"],
  },
  {
    files: ["*.config.{ts,mjs,js}"],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.nodeBuiltin },
    },
  },
]);
```

- [ ] **Step 2: Ensure root `tsconfig.json` covers root configs**

The root needs a tsconfig that includes `*.config.{ts,mjs,js}` so ESLint's
`projectService` can typecheck them. If `tsconfig.json` does not already exist
at the repo root (the original was moved into `apps/website/`), create it:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ESNext"],
    "types": ["node"],
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "allowJs": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force"
  },
  "include": ["*.config.js", "*.config.mjs", "*.config.ts", "*.config.mts"]
}
```

- [ ] **Step 3: Create `apps/website/eslint.config.ts`**

```ts
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  pluginVue.configs["flat/recommended"],
  { ignores: ["dist/**", "node_modules/**"] },
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.browser },
    },
    rules: { "no-undef": "off" },
  },
  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: {
        extraFileExtensions: [".vue"],
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        parser: tseslint.parser,
      },
    },
    rules: {
      "vue/max-attributes-per-line": ["error", {
        singleline: { max: 5 },
        multiline:  { max: 5 },
      }],
    },
  },
  {
    files: ["*.config.{ts,mjs,js}"],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.nodeBuiltin },
    },
  },
]);
```

`packages/vrc-ta-hub-client/eslint.config.ts` lands in Phase 2 (Task 2.1), after
the package exists.

- [ ] **Step 4: Run lint from both scopes**

Run: `pnpm --filter website lint 2>&1 | tail -10`
Expected: passes (may show pre-existing warnings in moved Vue code, but
no new errors introduced by the eslint split).

Run: `cd /Users/210408/priv/it-infra-website && pnpm exec eslint --no-error-on-unmatched-pattern '*.config.{ts,mjs,js}'`
Expected: passes (root config-files lint cleanly).

Run: `pnpm lint`
Expected: invokes `pnpm -r lint` (website) + the root config-files lint.
Should pass.

### Task 1.7 — Update `commitlint.config.mjs`

**Files:**
- Modify: `commitlint.config.mjs`

- [ ] **Step 1: Add the new scope**

```js
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "subject-case": [0],
    "scope-enum": [
      2,
      "always",
      [
        "frontend",
        "ci",
        "infra",
        "tool",
        "vrc-ta-hub-client",
      ],
    ],
  },
};
```

- [ ] **Step 2: Smoke-test**

Run: `echo 'feat(vrc-ta-hub-client): probe' | pnpm commitlint`
Expected: exits 0.

Run: `echo 'feat(client): probe' | pnpm commitlint`
Expected: exits non-zero with `scope must be one of ...`.

### Task 1.8 — Update `release.config.mjs`

**Files:**
- Modify: `release.config.mjs`

- [ ] **Step 1: Update only the `@semantic-release/exec` entry**

Open `release.config.mjs`. Locate the existing block:
```js
[
  "@semantic-release/exec",
  {
    prepareCmd: "pnpm build",
    publishCmd:
      "aws s3 sync dist/ s3://it-infra-meetup/website/ --delete",
  },
],
```

Replace it with:
```js
[
  "@semantic-release/exec",
  {
    prepareCmd: "pnpm --filter website build",
    publishCmd:
      "aws s3 sync apps/website/dist/ s3://it-infra-meetup/website/ --delete",
  },
],
```

Leave `@semantic-release/commit-analyzer`, `@semantic-release/release-notes-generator`, `@semantic-release/changelog`, `@semantic-release/npm` (with `npmPublish: false`), `@semantic-release/github`, and `@semantic-release/git` (assets: `["CHANGELOG.md", "package.json", "pnpm-lock.yaml"]`) unchanged.

- [ ] **Step 2: Dry-run semantic-release**

Run: `pnpm semantic-release --dry-run --no-ci 2>&1 | head -40`
Expected: parses the config without throwing.

### Task 1.9 — Update GitHub Actions workflows

**Files:**
- Modify: every workflow under `.github/workflows/*.yml` that references `pnpm build`, `dist/`, or `src/`

- [ ] **Step 1: List affected workflows**

Run: `grep -lE 'pnpm build|/dist/|^\s*-\s*src/' .github/workflows/*.yml || echo "none"`
Expected: zero or more file paths.

- [ ] **Step 2: For each workflow, apply these substitutions**

- `pnpm build` → `pnpm build:website` (root script that filters to website).
- `dist/` (when used as a path arg, e.g. S3 sync source, upload-artifact `path:`) → `apps/website/dist/`.
- Before the build step, **add** a step that runs the client tests so the deploy is gated by the test suite once the client lands:

  ```yaml
  - name: Test packages
    run: pnpm test
  ```

  Safe to add now: `pnpm test` exits 0 when no packages match the filter.

- [ ] **Step 3: Lint workflows**

Run: `mise run actions:lint`
Expected: actionlint + zizmor pass.

### Task 1.10 — Verify the website still builds & dev-serves

- [ ] **Step 1: Build**

Run: `pnpm build:website`
Expected: `apps/website/dist/index.html` exists; no TS errors.

- [ ] **Step 2: Dev server smoke check**

Run (background): `pnpm dev`
Wait for `Local: http://localhost:9010/`.
Run: `curl -sS -o /dev/null -w "HTTP %{http_code}\n" http://localhost:9010/`
Expected: `HTTP 200`.
Stop the dev server.

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: passes.

### Task 1.11 — Commit and push

- [ ] **Step 1: Stage and commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat(infra): convert to pnpm monorepo (apps/website + packages/*)

- Move Vue app from repo root to apps/website/ (history preserved via git mv).
- Split root package.json: root becomes workspace shell; runtime deps live in apps/website/package.json.
- pnpm-workspace.yaml lists apps/* and packages/*.
- eslint.config.ts: broaden ignores, node globals for nested config files, console-allowed in tests/scripts.
- commitlint.config.mjs: add 'vrc-ta-hub-client' to scope-enum.
- release.config.mjs: exec plugin now runs 'pnpm --filter website build' and syncs apps/website/dist/.
- .github/workflows: build/deploy paths updated; client test step inserted (no-op until Phase 2).

No client code in this PR; that lands in Phase 2.
EOF
)"
```

- [ ] **Step 2: Push and open PR**

```bash
git push -u origin feat/monorepo-restructure
gh pr create --title "feat(infra): convert to pnpm monorepo (apps/website + packages/*)" --body "$(cat <<'EOF'
## Summary
- Convert single-app repo to pnpm monorepo.
- Vue app moves to `apps/website/`; `packages/` reserved for `@vrc-ta-hub/client`.
- Root `package.json` becomes the workspace shell; runtime deps relocate to `apps/website/package.json`.
- Tooling (eslint, commitlint, release, GH Actions) updated.

## Test plan
- [ ] `pnpm install` succeeds on a clean clone
- [ ] `pnpm build:website` produces `apps/website/dist/`
- [ ] `pnpm dev` serves the home page on :9010
- [ ] `pnpm lint`, `pnpm typecheck`, `mise run actions:lint` all pass
- [ ] commitlint accepts `feat(vrc-ta-hub-client): ...` and rejects `feat(client): ...`

Design spec: `docs/superpowers/specs/2026-05-20-vrc-ta-hub-client-design.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**Wait for Phase 1 PR to be merged before starting Phase 2.**

---

## Phase 2 — Scaffold client package + capture fixtures

**Goal:** Create `packages/vrc-ta-hub-client/` with package.json (zod v4), tsconfig, vitest config, README, and the `refresh-fixtures.ts` script. Run the script. Commit the JSON fixtures and the `openapi.yaml` snapshot. **No source code yet** — Phase 3 writes the schemas + client.

**Acceptance:**
- `pnpm install` succeeds with the new package present.
- `pnpm --filter @vrc-ta-hub/client fixtures:refresh` writes 3 JSON files + `openapi.yaml` under `tests/__fixtures__/`.
- `pnpm -r typecheck` passes (no source files yet, but config must be valid).
- `pnpm -r test` exits 0 (Vitest with no test files is fine).

**Branch:** `feat/vrc-ta-hub-client-scaffold`
**PR title:** `feat(vrc-ta-hub-client): scaffold package and capture fixtures`
**Commit scope:** `vrc-ta-hub-client`

### Task 2.1 — Scaffold package metadata

**Files:**
- Create: `packages/vrc-ta-hub-client/package.json`
- Create: `packages/vrc-ta-hub-client/tsconfig.json`
- Create: `packages/vrc-ta-hub-client/vitest.config.ts`
- Create: `packages/vrc-ta-hub-client/eslint.config.ts`
- Create: `packages/vrc-ta-hub-client/README.md`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "@vrc-ta-hub/client",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "fixtures:refresh": "node scripts/refresh-fixtures.ts"
  },
  "dependencies": {
    "zod": "^4.4.0"
  },
  "devDependencies": {
    "typescript": "6.0.3",
    "vitest": "^2.1.0"
  }
}
```

Note: no `tsx` dependency. Node 24 (pinned via `mise.toml`) strips
TypeScript types natively, so `node scripts/foo.ts` runs `.ts` source
directly. The tsconfig below enables `allowImportingTsExtensions` so
scripts can import each other with explicit `.ts` extensions (required at
runtime — native node won't remap `.js` → `.ts`).

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["src/**/*", "tests/**/*", "scripts/**/*", "*.config.ts", "*.config.mts"]
}
```

- [ ] **Step 3: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    pool: 'forks',
  },
})
```

- [ ] **Step 4: Write `eslint.config.ts`**

```ts
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  { ignores: ["dist/**", "node_modules/**"] },
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.nodeBuiltin },
    },
  },
  {
    files: ["tests/**", "scripts/**"],
    rules: { "no-console": "off" },
  },
]);
```

- [ ] **Step 5: Write `README.md`**

```markdown
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
```

- [ ] **Step 6: Install**

Run: `pnpm install`
Expected: installs `zod@^4.4.0`, `tsx`, `vitest`. Lockfile updated.

Verify zod v4 actually resolved:
Run: `pnpm --filter @vrc-ta-hub/client list zod 2>&1 | grep "zod "`
Expected: a line containing `zod 4.x.x` (NOT `3.x.x`).

- [ ] **Step 7: Sanity-check that the package is discoverable**

Run: `pnpm --filter @vrc-ta-hub/client exec node -e "console.log(process.cwd())"`
Expected: prints `.../packages/vrc-ta-hub-client`.

- [ ] **Step 8: Verify lint runs in the new package**

Run: `pnpm --filter @vrc-ta-hub/client lint`
Expected: passes (no source files yet, or a placeholder `src/index.ts` with `export {}`).

Run: `pnpm lint` from the repo root.
Expected: passes (runs website + client + root config-files lint).

### Task 2.2 — Refresh-fixtures script

**Files:**
- Create: `packages/vrc-ta-hub-client/scripts/lib.ts`
- Create: `packages/vrc-ta-hub-client/scripts/refresh-fixtures.ts`

- [ ] **Step 1: Write `scripts/lib.ts`**

```ts
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const PKG_ROOT = resolve(fileURLToPath(import.meta.url), '../..')
export const FIXTURES_DIR = resolve(PKG_ROOT, 'tests/__fixtures__')

export const API_BASE_URL = 'https://vrc-ta-hub.com'
export const SCHEMA_URL = `${API_BASE_URL}/api/schema/`

export async function writeFileEnsuringDir(filePath: string, contents: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, contents, 'utf-8')
}

export async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { headers: { Accept: 'application/json, application/yaml, */*' } })
  if (!response.ok) {
    throw new Error(`${url} -> HTTP ${response.status} ${response.statusText}`)
  }
  return await response.text()
}
```

- [ ] **Step 2: Write `scripts/refresh-fixtures.ts`**

```ts
import { resolve } from 'node:path'
import { API_BASE_URL, FIXTURES_DIR, SCHEMA_URL, fetchText, writeFileEnsuringDir } from './lib.ts'

const PUBLIC_ENDPOINTS: { name: string; path: string }[] = [
  { name: 'community.json',    path: '/api/v1/community/?format=json' },
  { name: 'event.json',        path: '/api/v1/event/?format=json' },
  { name: 'event_detail.json', path: '/api/v1/event_detail/?format=json' },
]

async function main(): Promise<void> {
  for (const ep of PUBLIC_ENDPOINTS) {
    const url = `${API_BASE_URL}${ep.path}`
    process.stdout.write(`GET ${url} ... `)
    const text = await fetchText(url)
    const pretty = JSON.stringify(JSON.parse(text), null, 2) + '\n'
    await writeFileEnsuringDir(resolve(FIXTURES_DIR, ep.name), pretty)
    process.stdout.write(`wrote ${ep.name}\n`)
  }

  process.stdout.write(`GET ${SCHEMA_URL} ... `)
  const schemaYaml = await fetchText(SCHEMA_URL)
  await writeFileEnsuringDir(resolve(FIXTURES_DIR, 'openapi.yaml'), schemaYaml)
  process.stdout.write('wrote openapi.yaml\n')
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
```

- [ ] **Step 3: Run the script**

Run: `pnpm --filter @vrc-ta-hub/client fixtures:refresh`
Expected:
```
GET https://vrc-ta-hub.com/api/v1/community/?format=json ... wrote community.json
GET https://vrc-ta-hub.com/api/v1/event/?format=json ... wrote event.json
GET https://vrc-ta-hub.com/api/v1/event_detail/?format=json ... wrote event_detail.json
GET https://vrc-ta-hub.com/api/schema/ ... wrote openapi.yaml
```

- [ ] **Step 4: Verify the fixtures**

Run: `ls -la packages/vrc-ta-hub-client/tests/__fixtures__/`
Expected: `community.json` (>50 KB), `event.json` (>500 KB), `event_detail.json` (>800 KB), `openapi.yaml` (>25 KB).

Run: `head -c 80 packages/vrc-ta-hub-client/tests/__fixtures__/community.json`
Expected: starts with `[\n  {\n    "id":`.

### Task 2.3 — Add a no-op typecheck guard

`tsconfig.json` `include` lists `src/**/*` and `tests/**/*`. With no files there, `tsc --noEmit` returns "No inputs were found" and exits non-zero, which is annoying. Quick fix: add a minimal placeholder.

**Files:**
- Create: `packages/vrc-ta-hub-client/src/.gitkeep` (empty file)
- Create: `packages/vrc-ta-hub-client/tests/.gitkeep` (empty file)
- Modify: `packages/vrc-ta-hub-client/tsconfig.json` — relax `noEmit` errors during scaffold

- [ ] **Step 1: Add `allowJs: false` and `noEmit` tolerance**

Actually the cleanest fix is to drop the no-inputs error by adding `noEmitOnError: false` plus a small dummy module that gets deleted in Phase 3.

Create `packages/vrc-ta-hub-client/src/index.ts` with a single placeholder line:

```ts
export {}  // placeholder; Phase 3 fills this in
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @vrc-ta-hub/client typecheck`
Expected: passes.

- [ ] **Step 3: Test (no test files yet, vitest exits 0)**

Run: `pnpm --filter @vrc-ta-hub/client test`
Expected: `No test files found, exiting with code 0` (vitest default). If it exits non-zero, add `--passWithNoTests` to the `test` script.

If vitest 2.x defaults differ and exit non-zero, change the `test` script in `packages/vrc-ta-hub-client/package.json` to `"vitest run --passWithNoTests"` for this phase only; Phase 3 will revert it.

### Task 2.4 — Commit and push

- [ ] **Step 1: Stage and commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat(vrc-ta-hub-client): scaffold package and capture fixtures

- New workspace package @vrc-ta-hub/client (private, ESM, source-exported, zod v4).
- scripts/refresh-fixtures.ts: captures /api/v1/community/, /event/, /event_detail/ as pretty-printed JSON fixtures plus /api/schema/ as openapi.yaml.
- vitest + tsconfig wired; placeholder src/index.ts.

No schemas or client implementation yet; that lands in Phase 3.
EOF
)"
```

- [ ] **Step 2: Push and PR**

```bash
git push -u origin feat/vrc-ta-hub-client-scaffold
gh pr create --title "feat(vrc-ta-hub-client): scaffold package and capture fixtures" --body "$(cat <<'EOF'
## Summary
- New `packages/vrc-ta-hub-client/` workspace package, configured for **zod v4**.
- `refresh-fixtures.ts` captures the three public list endpoints + the OpenAPI schema snapshot.
- All four fixture files committed for offline testing.

## Test plan
- [ ] `pnpm install` succeeds; lockfile shows `zod 4.x`
- [ ] `pnpm --filter @vrc-ta-hub/client fixtures:refresh` reproduces the committed fixtures
- [ ] `pnpm -r typecheck` passes
- [ ] `pnpm -r test` passes (no test files yet)

Design spec: `docs/superpowers/specs/2026-05-20-vrc-ta-hub-client-design.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**Wait for Phase 2 PR to be merged before starting Phase 3.**

---

## Phase 3 — Schemas + client implementation + full test suite

**Goal:** Replace the placeholder `index.ts` with the real package: hand-write zod v4 schemas, then build the client via TDD. All six methods (`listCommunities`, `getCommunity`, `listEvents`, `getEvent`, `listEventDetails`, `getEventDetail`) return `Result<T, ClientError>`.

**Acceptance:**
- `pnpm --filter @vrc-ta-hub/client test` runs 4 test files, all passing offline.
- `pnpm --filter @vrc-ta-hub/client typecheck` passes.
- `pnpm lint` passes.
- The public surface in `src/index.ts` matches spec §5.
- No network calls during tests.

**Branch:** `feat/vrc-ta-hub-client-impl`
**PR title:** `feat(vrc-ta-hub-client): implement zod v4 schemas + Result-returning fetch client`
**Commit scope:** `vrc-ta-hub-client`

### Task 3.1 — Hand-write `src/schemas.ts` and verify against fixtures (TDD)

**Files:**
- Create: `packages/vrc-ta-hub-client/tests/schemas.test.ts`
- Replace: `packages/vrc-ta-hub-client/src/schemas.ts`

- [ ] **Step 1: Write the failing test**

`tests/schemas.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { Community, Event, EventDetail } from '../src/schemas'
import communityFixture from './__fixtures__/community.json'
import eventFixture from './__fixtures__/event.json'
import eventDetailFixture from './__fixtures__/event_detail.json'

describe('schemas vs. captured fixtures', () => {
  it('Community schema parses every record in community.json', () => {
    const result = z.array(Community).safeParse(communityFixture)
    if (!result.success) console.error(JSON.stringify(result.error.issues, null, 2))
    expect(result.success).toBe(true)
  })

  it('Event schema parses every record in event.json', () => {
    const result = z.array(Event).safeParse(eventFixture)
    if (!result.success) console.error(JSON.stringify(result.error.issues, null, 2))
    expect(result.success).toBe(true)
  })

  it('EventDetail schema parses every record in event_detail.json', () => {
    const result = z.array(EventDetail).safeParse(eventDetailFixture)
    if (!result.success) console.error(JSON.stringify(result.error.issues, null, 2))
    expect(result.success).toBe(true)
  })

  it('Community fixture exercises nullable group_id and poster_image', () => {
    const parsed = z.array(Community).parse(communityFixture)
    expect(parsed.some((c) => c.group_id === null)).toBe(true)
    expect(parsed.some((c) => c.poster_image === null)).toBe(true)
  })

  it('weekdays is always a non-empty array of weekday codes', () => {
    const parsed = z.array(Community).parse(communityFixture)
    for (const c of parsed) {
      expect(Array.isArray(c.weekdays)).toBe(true)
      expect(c.weekdays.length).toBeGreaterThan(0)
    }
  })
})
```

- [ ] **Step 2: Run, expect failure**

Run: `pnpm --filter @vrc-ta-hub/client test tests/schemas.test.ts`
Expected: FAIL — either `Cannot find module '../src/schemas'` or schemas don't exist.

- [ ] **Step 3: Replace `src/index.ts` placeholder and write `src/schemas.ts`**

First, **delete** the placeholder content in `src/index.ts` so it doesn't conflict — Phase 3 final step rewrites it.

Then write `src/schemas.ts`:
```ts
import { z } from 'zod'

export const WeekdayEnum = z.enum(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Other'])
export type WeekdaySymbol = z.infer<typeof WeekdayEnum>

export const PlatformEnum = z.enum(['All', 'PC'])
export type PlatformSymbol = z.infer<typeof PlatformEnum>

export const Community = z.object({
  id: z.number().int(),
  name: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  start_time: z.string(),
  duration: z.number().int(),
  weekdays: z.array(WeekdayEnum),
  frequency: z.string(),
  organizers: z.string(),
  group_url: z.string(),
  group_id: z.string().nullable(),
  organizer_url: z.string(),
  sns_url: z.string(),
  discord: z.string(),
  twitter_hashtag: z.string(),
  poster_image: z.string().nullable(),
  description: z.string(),
  platform: PlatformEnum,
  tags: z.array(z.string()),
  allow_poster_repost: z.boolean(),
})
export type Community = z.infer<typeof Community>

export const Event = z.object({
  id: z.number().int(),
  community: Community,
  date: z.string(),
  start_time: z.string(),
  duration: z.number().int(),
  weekday: WeekdayEnum,
})
export type Event = z.infer<typeof Event>

export const EventDetail = z.object({
  id: z.number().int(),
  event: Event,
  start_time: z.string(),
  duration: z.number().int(),
  youtube_url: z.string().nullable(),
  slide_url: z.string().nullable(),
  thumbnail_image: z.string().nullable(),
  speaker: z.string(),
  theme: z.string(),
  additional_info: z.string(),
})
export type EventDetail = z.infer<typeof EventDetail>
```

Also update `src/index.ts` to:
```ts
export {}  // populated at the end of Phase 3
```

(The full public surface comes in Task 3.6.)

- [ ] **Step 4: Run, expect pass**

Run: `pnpm --filter @vrc-ta-hub/client test tests/schemas.test.ts`
Expected: 5 tests pass.

- [ ] **Step 5: If any test fails**

Read the printed `issues`. The fix is in `src/schemas.ts`. Common discrepancies and resolutions:
- A field observed as `null` but the schema marks it non-null → add `.nullable()`.
- A field absent from a record → add `.optional()`.
- An enum value the schema doesn't list → extend the enum.

Re-run until green. Do **not** weaken the schema unnecessarily — only loosen what the fixture proves is required.

- [ ] **Step 6: Commit**

```bash
git add packages/vrc-ta-hub-client/src/schemas.ts packages/vrc-ta-hub-client/src/index.ts packages/vrc-ta-hub-client/tests/schemas.test.ts
git commit -m "feat(vrc-ta-hub-client): hand-write zod v4 schemas verified against fixtures"
```

### Task 3.2 — `result.ts` (TDD)

**Files:**
- Create: `packages/vrc-ta-hub-client/src/result.ts`
- Create: `packages/vrc-ta-hub-client/tests/result.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/result.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { ok, err, isOk, isErr, type Result } from '../src/result'

describe('Result helpers', () => {
  it('ok() returns { ok: true, data }', () => {
    expect(ok(42)).toEqual({ ok: true, data: 42 })
  })

  it('err() returns { ok: false, error }', () => {
    expect(err('boom')).toEqual({ ok: false, error: 'boom' })
  })

  it('isOk narrows to data branch', () => {
    const r: Result<number, string> = ok(7)
    if (isOk(r)) {
      const n: number = r.data
      expect(n).toBe(7)
    } else {
      throw new Error('expected ok')
    }
  })

  it('isErr narrows to error branch', () => {
    const r: Result<number, string> = err('nope')
    if (isErr(r)) {
      const e: string = r.error
      expect(e).toBe('nope')
    } else {
      throw new Error('expected err')
    }
  })
})
```

- [ ] **Step 2: Run, expect failure**

Run: `pnpm --filter @vrc-ta-hub/client test tests/result.test.ts`
Expected: FAIL — `Cannot find module '../src/result'`.

- [ ] **Step 3: Implement `src/result.ts`**

```ts
export type Result<T, E> = { ok: true; data: T } | { ok: false; error: E }

export const ok = <T>(data: T): Result<T, never> => ({ ok: true, data })
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error })

export const isOk = <T, E>(r: Result<T, E>): r is { ok: true; data: T } => r.ok
export const isErr = <T, E>(r: Result<T, E>): r is { ok: false; error: E } => !r.ok
```

- [ ] **Step 4: Run, expect pass**

Run: `pnpm --filter @vrc-ta-hub/client test tests/result.test.ts`
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/vrc-ta-hub-client/src/result.ts packages/vrc-ta-hub-client/tests/result.test.ts
git commit -m "feat(vrc-ta-hub-client): add Result type and helpers"
```

### Task 3.3 — `errors.ts` (types only)

**Files:**
- Create: `packages/vrc-ta-hub-client/src/errors.ts`

Zod v4 removed `z.ZodIssue` as a runtime export. The type is at `zod/v4/core`.

- [ ] **Step 1: Write `src/errors.ts`**

```ts
import type { $ZodIssue } from 'zod/v4/core'

export interface HttpError {
  kind: 'http'
  status: number
  statusText: string
  url: string
  /** Raw response body text, capped at 2048 chars. Null if reading the body failed. */
  body: string | null
}

export interface NetworkError {
  kind: 'network'
  url: string
  /** The original error thrown by fetch (or response.json()). */
  cause: unknown
  /** True when the call was cancelled via AbortSignal. */
  aborted: boolean
}

export interface ValidationError {
  kind: 'validation'
  url: string
  issues: $ZodIssue[]
}

export type ClientError = HttpError | NetworkError | ValidationError
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @vrc-ta-hub/client typecheck`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add packages/vrc-ta-hub-client/src/errors.ts
git commit -m "feat(vrc-ta-hub-client): define ClientError discriminated union"
```

### Task 3.4 — `url.ts` (TDD)

**Files:**
- Create: `packages/vrc-ta-hub-client/src/url.ts`
- Create: `packages/vrc-ta-hub-client/tests/url-builder.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/url-builder.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { buildUrl, normalizeBaseUrl } from '../src/url'

describe('normalizeBaseUrl', () => {
  it('strips trailing slash', () => {
    expect(normalizeBaseUrl('https://vrc-ta-hub.com/')).toBe('https://vrc-ta-hub.com')
  })

  it('leaves a clean URL alone', () => {
    expect(normalizeBaseUrl('https://vrc-ta-hub.com')).toBe('https://vrc-ta-hub.com')
  })

  it('strips multiple trailing slashes', () => {
    expect(normalizeBaseUrl('https://vrc-ta-hub.com///')).toBe('https://vrc-ta-hub.com')
  })
})

describe('buildUrl', () => {
  it('joins base + path with format=json', () => {
    expect(buildUrl('https://vrc-ta-hub.com', '/api/v1/community/', {})).toBe(
      'https://vrc-ta-hub.com/api/v1/community/?format=json',
    )
  })

  it('skips undefined params', () => {
    expect(buildUrl('https://vrc-ta-hub.com', '/api/v1/event/', { name: undefined, weekday: 'Mon' })).toBe(
      'https://vrc-ta-hub.com/api/v1/event/?format=json&weekday=Mon',
    )
  })

  it('skips null params', () => {
    expect(buildUrl('https://vrc-ta-hub.com', '/api/v1/event/', { name: null })).toBe(
      'https://vrc-ta-hub.com/api/v1/event/?format=json',
    )
  })

  it('encodes special chars', () => {
    expect(buildUrl('https://vrc-ta-hub.com', '/api/v1/community/', { name: 'VRC通信' })).toBe(
      'https://vrc-ta-hub.com/api/v1/community/?format=json&name=VRC%E9%80%9A%E4%BF%A1',
    )
  })

  it('passes through numbers and booleans by string conversion', () => {
    expect(buildUrl('https://vrc-ta-hub.com', '/api/v1/event/', { id: 42, flag: true })).toBe(
      'https://vrc-ta-hub.com/api/v1/event/?format=json&id=42&flag=true',
    )
  })

  it('honors a baseUrl with trailing slash via normalizeBaseUrl', () => {
    expect(buildUrl(normalizeBaseUrl('https://vrc-ta-hub.com/'), '/api/v1/community/', {})).toBe(
      'https://vrc-ta-hub.com/api/v1/community/?format=json',
    )
  })
})
```

- [ ] **Step 2: Run, expect failure**

Run: `pnpm --filter @vrc-ta-hub/client test tests/url-builder.test.ts`
Expected: FAIL — `Cannot find module '../src/url'`.

- [ ] **Step 3: Implement `src/url.ts`**

```ts
export type QueryValue = string | number | boolean | undefined | null

export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '')
}

export function buildUrl(
  normalizedBaseUrl: string,
  path: string,
  params: Record<string, QueryValue>,
): string {
  const search = new URLSearchParams()
  search.set('format', 'json')
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    search.append(key, String(value))
  }
  return `${normalizedBaseUrl}${path}?${search.toString()}`
}
```

- [ ] **Step 4: Run, expect pass**

Run: `pnpm --filter @vrc-ta-hub/client test tests/url-builder.test.ts`
Expected: all 9 tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/vrc-ta-hub-client/src/url.ts packages/vrc-ta-hub-client/tests/url-builder.test.ts
git commit -m "feat(vrc-ta-hub-client): add URL builder (format=json, skip undefined, trim slash)"
```

### Task 3.5 — `client.ts` — first method via TDD (`listCommunities`)

**Files:**
- Create: `packages/vrc-ta-hub-client/src/client.ts`
- Create: `packages/vrc-ta-hub-client/tests/client.test.ts`

- [ ] **Step 1: Write the failing test for the happy path**

`tests/client.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { createClient } from '../src/client'
import { isOk, isErr } from '../src/result'
import communityFixture from './__fixtures__/community.json'

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  })
}

describe('createClient', () => {
  it('listCommunities returns ok(data) and calls the right URL', async () => {
    const calls: { url: string; init?: RequestInit }[] = []
    const fakeFetch: typeof fetch = async (input, init) => {
      calls.push({ url: String(input), init })
      return jsonResponse(communityFixture)
    }

    const client = createClient({ fetch: fakeFetch })
    const r = await client.listCommunities({ name: 'VRC', weekdays: 'Sat' })

    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe(
      'https://vrc-ta-hub.com/api/v1/community/?format=json&name=VRC&weekdays=Sat',
    )
    expect(isOk(r)).toBe(true)
    if (isOk(r)) {
      expect(r.data.length).toBe((communityFixture as unknown[]).length)
    }
  })
})
```

- [ ] **Step 2: Run, expect failure**

Run: `pnpm --filter @vrc-ta-hub/client test tests/client.test.ts`
Expected: FAIL — `Cannot find module '../src/client'`.

- [ ] **Step 3: Implement `src/client.ts`**

```ts
import { z } from 'zod'
import {
  Community,
  Event,
  EventDetail,
  type WeekdaySymbol,
} from './schemas'
import type { ClientError } from './errors'
import { err, ok, type Result } from './result'
import { buildUrl, normalizeBaseUrl, type QueryValue } from './url'

export interface ClientOptions {
  /** Defaults to 'https://vrc-ta-hub.com'. Trailing slash is normalized off. */
  baseUrl?: string
  /** Defaults to globalThis.fetch. Inject for tests or custom transport. */
  fetch?: typeof globalThis.fetch
}

export interface CallOptions {
  signal?: AbortSignal
}

export interface ListCommunitiesParams {
  name?: string
  weekdays?: WeekdaySymbol
}

export interface ListEventsParams {
  name?: string
  weekday?: WeekdaySymbol
  start_date?: string
  end_date?: string
}

export interface ListEventDetailsParams {
  theme?: string
  speaker?: string
  start_date?: string
  end_date?: string
  start_time?: string
}

export interface Client {
  listCommunities(params?: ListCommunitiesParams, opts?: CallOptions): Promise<Result<Community[], ClientError>>
  getCommunity(id: number, opts?: CallOptions): Promise<Result<Community, ClientError>>
  listEvents(params?: ListEventsParams, opts?: CallOptions): Promise<Result<Event[], ClientError>>
  getEvent(id: number, opts?: CallOptions): Promise<Result<Event, ClientError>>
  listEventDetails(params?: ListEventDetailsParams, opts?: CallOptions): Promise<Result<EventDetail[], ClientError>>
  getEventDetail(id: number, opts?: CallOptions): Promise<Result<EventDetail, ClientError>>
}

const DEFAULT_BASE_URL = 'https://vrc-ta-hub.com'
const BODY_PREVIEW_CAP = 2048

async function request<T>(
  fetchImpl: typeof fetch,
  url: string,
  schema: z.ZodType<T>,
  signal: AbortSignal | undefined,
): Promise<Result<T, ClientError>> {
  let response: Response
  try {
    response = await fetchImpl(url, {
      signal,
      headers: { Accept: 'application/json' },
    })
  } catch (cause) {
    return err({
      kind: 'network',
      url,
      cause,
      aborted: cause instanceof DOMException && cause.name === 'AbortError',
    })
  }

  if (!response.ok) {
    let body: string | null = null
    try {
      body = (await response.text()).slice(0, BODY_PREVIEW_CAP)
    } catch {
      body = null
    }
    return err({
      kind: 'http',
      status: response.status,
      statusText: response.statusText,
      url,
      body,
    })
  }

  let raw: unknown
  try {
    raw = await response.json()
  } catch (cause) {
    return err({ kind: 'network', url, cause, aborted: false })
  }

  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return err({ kind: 'validation', url, issues: parsed.error.issues })
  }
  return ok(parsed.data)
}

export function createClient(options: ClientOptions = {}): Client {
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? DEFAULT_BASE_URL)
  const fetchImpl = options.fetch ?? globalThis.fetch

  const list = <T>(
    path: string,
    params: Record<string, QueryValue>,
    schema: z.ZodType<T[]>,
    signal?: AbortSignal,
  ): Promise<Result<T[], ClientError>> =>
    request<T[]>(fetchImpl, buildUrl(baseUrl, path, params), schema, signal)

  const retrieve = <T>(
    path: string,
    id: number,
    schema: z.ZodType<T>,
    signal?: AbortSignal,
  ): Promise<Result<T, ClientError>> =>
    request<T>(fetchImpl, buildUrl(baseUrl, `${path}${id}/`, {}), schema, signal)

  return {
    listCommunities: (params = {}, opts) =>
      list<Community>(
        '/api/v1/community/',
        { name: params.name, weekdays: params.weekdays },
        z.array(Community),
        opts?.signal,
      ),
    getCommunity: (id, opts) => retrieve<Community>('/api/v1/community/', id, Community, opts?.signal),

    listEvents: (params = {}, opts) =>
      list<Event>(
        '/api/v1/event/',
        { name: params.name, weekday: params.weekday, start_date: params.start_date, end_date: params.end_date },
        z.array(Event),
        opts?.signal,
      ),
    getEvent: (id, opts) => retrieve<Event>('/api/v1/event/', id, Event, opts?.signal),

    listEventDetails: (params = {}, opts) =>
      list<EventDetail>(
        '/api/v1/event_detail/',
        {
          theme: params.theme,
          speaker: params.speaker,
          start_date: params.start_date,
          end_date: params.end_date,
          start_time: params.start_time,
        },
        z.array(EventDetail),
        opts?.signal,
      ),
    getEventDetail: (id, opts) => retrieve<EventDetail>('/api/v1/event_detail/', id, EventDetail, opts?.signal),
  }
}
```

- [ ] **Step 4: Run, expect pass**

Run: `pnpm --filter @vrc-ta-hub/client test tests/client.test.ts`
Expected: the one test passes.

- [ ] **Step 5: Run all tests + typecheck**

Run: `pnpm --filter @vrc-ta-hub/client test && pnpm --filter @vrc-ta-hub/client typecheck`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add packages/vrc-ta-hub-client/src/client.ts packages/vrc-ta-hub-client/tests/client.test.ts
git commit -m "feat(vrc-ta-hub-client): implement Result-returning fetch client (listCommunities + plumbing)"
```

### Task 3.6 — Extend `client.test.ts` with the full coverage matrix

**Files:**
- Modify: `packages/vrc-ta-hub-client/tests/client.test.ts`

- [ ] **Step 1: Append the additional tests**

Add to the bottom of `tests/client.test.ts`:

```ts
import eventFixture from './__fixtures__/event.json'
import eventDetailFixture from './__fixtures__/event_detail.json'

function stubFetch(handler: (url: string, init?: RequestInit) => Promise<Response> | Response): typeof fetch {
  return async (input, init) => handler(String(input), init)
}

describe('createClient — full surface', () => {
  it('getCommunity hits /api/v1/community/{id}/', async () => {
    const seen: string[] = []
    const client = createClient({
      fetch: stubFetch((url) => {
        seen.push(url)
        return jsonResponse((communityFixture as Array<{ id: number }>)[0])
      }),
    })
    const r = await client.getCommunity(101)
    expect(seen[0]).toBe('https://vrc-ta-hub.com/api/v1/community/101/?format=json')
    expect(isOk(r)).toBe(true)
  })

  it('listEvents forwards filter params', async () => {
    const seen: string[] = []
    const client = createClient({
      fetch: stubFetch((url) => {
        seen.push(url)
        return jsonResponse(eventFixture)
      }),
    })
    const r = await client.listEvents({ start_date: '2026-05-20', end_date: '2026-06-01', weekday: 'Wed', name: 'VRC' })
    expect(seen[0]).toBe(
      'https://vrc-ta-hub.com/api/v1/event/?format=json&name=VRC&weekday=Wed&start_date=2026-05-20&end_date=2026-06-01',
    )
    expect(isOk(r)).toBe(true)
  })

  it('getEvent hits /api/v1/event/{id}/', async () => {
    const seen: string[] = []
    const client = createClient({
      fetch: stubFetch((url) => {
        seen.push(url)
        return jsonResponse((eventFixture as Array<{ id: number }>)[0])
      }),
    })
    await client.getEvent(4490)
    expect(seen[0]).toBe('https://vrc-ta-hub.com/api/v1/event/4490/?format=json')
  })

  it('listEventDetails forwards filter params', async () => {
    const seen: string[] = []
    const client = createClient({
      fetch: stubFetch((url) => {
        seen.push(url)
        return jsonResponse(eventDetailFixture)
      }),
    })
    await client.listEventDetails({ theme: 'math', speaker: 'eda', start_date: '2026-05-20', end_date: '2026-08-01', start_time: '21:00:00' })
    expect(seen[0]).toBe(
      'https://vrc-ta-hub.com/api/v1/event_detail/?format=json&theme=math&speaker=eda&start_date=2026-05-20&end_date=2026-08-01&start_time=21%3A00%3A00',
    )
  })

  it('getEventDetail hits /api/v1/event_detail/{id}/', async () => {
    const seen: string[] = []
    const client = createClient({
      fetch: stubFetch((url) => {
        seen.push(url)
        return jsonResponse((eventDetailFixture as Array<{ id: number }>)[0])
      }),
    })
    await client.getEventDetail(266)
    expect(seen[0]).toBe('https://vrc-ta-hub.com/api/v1/event_detail/266/?format=json')
  })

  it('returns http error on non-2xx with body preview', async () => {
    const client = createClient({
      fetch: stubFetch(() => new Response('upstream exploded', { status: 500, statusText: 'Internal Server Error' })),
    })
    const r = await client.listEvents()
    expect(isErr(r)).toBe(true)
    if (isErr(r) && r.error.kind === 'http') {
      expect(r.error.status).toBe(500)
      expect(r.error.statusText).toBe('Internal Server Error')
      expect(r.error.body).toBe('upstream exploded')
    } else {
      throw new Error('expected http error')
    }
  })

  it('returns http 404 from getCommunity', async () => {
    const client = createClient({
      fetch: stubFetch(() => new Response('Not found', { status: 404, statusText: 'Not Found' })),
    })
    const r = await client.getCommunity(99999)
    expect(isErr(r)).toBe(true)
    if (isErr(r) && r.error.kind === 'http') {
      expect(r.error.status).toBe(404)
    } else {
      throw new Error('expected http error')
    }
  })

  it('caps body preview at 2048 chars', async () => {
    const big = 'x'.repeat(5000)
    const client = createClient({
      fetch: stubFetch(() => new Response(big, { status: 502, statusText: 'Bad Gateway' })),
    })
    const r = await client.listEvents()
    if (isErr(r) && r.error.kind === 'http') {
      expect(r.error.body?.length).toBe(2048)
    } else {
      throw new Error('expected http error')
    }
  })

  it('returns validation error on malformed JSON shape', async () => {
    const client = createClient({
      fetch: stubFetch(() => jsonResponse({ not: 'an array' })),
    })
    const r = await client.listEvents()
    expect(isErr(r)).toBe(true)
    if (isErr(r)) expect(r.error.kind).toBe('validation')
  })

  it('returns network error when fetch throws', async () => {
    const client = createClient({
      fetch: stubFetch(() => {
        throw new TypeError('failed to fetch')
      }),
    })
    const r = await client.listEvents()
    if (isErr(r) && r.error.kind === 'network') {
      expect(r.error.aborted).toBe(false)
      expect(r.error.cause).toBeInstanceOf(TypeError)
    } else {
      throw new Error('expected network error')
    }
  })

  it('returns network error with aborted=true on AbortError', async () => {
    const client = createClient({
      fetch: stubFetch(() => {
        throw new DOMException('aborted', 'AbortError')
      }),
    })
    const r = await client.listEvents()
    if (isErr(r) && r.error.kind === 'network') {
      expect(r.error.aborted).toBe(true)
    } else {
      throw new Error('expected aborted network error')
    }
  })

  it('forwards AbortSignal to fetch', async () => {
    const seenSignals: (AbortSignal | undefined)[] = []
    const ctrl = new AbortController()
    const client = createClient({
      fetch: stubFetch((_url, init) => {
        seenSignals.push(init?.signal ?? undefined)
        return jsonResponse(communityFixture)
      }),
    })
    await client.listCommunities({}, { signal: ctrl.signal })
    expect(seenSignals[0]).toBe(ctrl.signal)
  })

  it('honors custom baseUrl with trailing slash', async () => {
    const seen: string[] = []
    const client = createClient({
      baseUrl: 'https://staging.example.com/',
      fetch: stubFetch((url) => {
        seen.push(url)
        return jsonResponse(communityFixture)
      }),
    })
    await client.listCommunities()
    expect(seen[0]).toBe('https://staging.example.com/api/v1/community/?format=json')
  })
})
```

- [ ] **Step 2: Run, expect all passing**

Run: `pnpm --filter @vrc-ta-hub/client test`
Expected: all suites pass (schemas / result / url-builder / client).

- [ ] **Step 3: Commit**

```bash
git add packages/vrc-ta-hub-client/tests/client.test.ts
git commit -m "test(vrc-ta-hub-client): cover full surface, error mapping, abort, custom baseUrl"
```

### Task 3.7 — Public surface (`index.ts`)

**Files:**
- Modify: `packages/vrc-ta-hub-client/src/index.ts`

- [ ] **Step 1: Replace placeholder with the real public surface**

```ts
export { createClient } from './client'
export type {
  Client,
  ClientOptions,
  CallOptions,
  ListCommunitiesParams,
  ListEventsParams,
  ListEventDetailsParams,
} from './client'

export {
  Community,
  Event,
  EventDetail,
  WeekdayEnum,
  PlatformEnum,
} from './schemas'
export type {
  WeekdaySymbol,
  PlatformSymbol,
} from './schemas'

export type {
  ClientError,
  HttpError,
  NetworkError,
  ValidationError,
} from './errors'

export { ok, err, isOk, isErr, type Result } from './result'
```

- [ ] **Step 2: Add a smoke test for the public surface**

Append to `tests/client.test.ts`:

```ts
import * as publicSurface from '../src/index'

describe('public surface', () => {
  it('exports createClient and Result helpers as functions', () => {
    expect(typeof publicSurface.createClient).toBe('function')
    expect(typeof publicSurface.ok).toBe('function')
    expect(typeof publicSurface.err).toBe('function')
    expect(typeof publicSurface.isOk).toBe('function')
    expect(typeof publicSurface.isErr).toBe('function')
  })

  it('exports the zod schemas', () => {
    expect(typeof publicSurface.Community.safeParse).toBe('function')
    expect(typeof publicSurface.Event.safeParse).toBe('function')
    expect(typeof publicSurface.EventDetail.safeParse).toBe('function')
  })
})
```

- [ ] **Step 3: Run all tests, typecheck, lint**

Run: `pnpm --filter @vrc-ta-hub/client test && pnpm --filter @vrc-ta-hub/client typecheck && pnpm lint`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add packages/vrc-ta-hub-client/src/index.ts packages/vrc-ta-hub-client/tests/client.test.ts
git commit -m "feat(vrc-ta-hub-client): expose public surface (createClient, schemas, types, Result)"
```

### Task 3.8 — Push and open PR

- [ ] **Step 1: Push branch**

Run: `git push -u origin feat/vrc-ta-hub-client-impl`

- [ ] **Step 2: Open PR**

```bash
gh pr create --title "feat(vrc-ta-hub-client): implement zod v4 schemas + Result-returning fetch client" --body "$(cat <<'EOF'
## Summary
- Hand-written zod v4 schemas (`Community`, `Event`, `EventDetail`, `WeekdayEnum`, `PlatformEnum`); verified against captured fixtures.
- `Result<T, ClientError>` type and helpers.
- `ClientError` discriminated union (`HttpError | NetworkError | ValidationError`), `issues: $ZodIssue[]` (zod v4).
- URL builder (always appends `format=json`, skips undefined/null params, trims trailing slash from baseUrl).
- `createClient()` factory exposing 6 methods: `list/get` × `Communities`, `Events`, `EventDetails`. AbortSignal forwarded per call. Body preview capped at 2048 chars on HTTP errors.

## Test plan
- [ ] `pnpm --filter @vrc-ta-hub/client test` — all suites pass offline (schemas/result/url-builder/client)
- [ ] `pnpm --filter @vrc-ta-hub/client typecheck` passes
- [ ] `pnpm lint` passes

Design spec: `docs/superpowers/specs/2026-05-20-vrc-ta-hub-client-design.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**Wait for Phase 3 PR to be merged before starting Phase 4.**

---

## Phase 4 — Frontend integration

**Goal:** Wire `@vrc-ta-hub/client` into the Vue app via a single, small integration call site that proves the pipeline end-to-end without touching unrelated frontend code. Create a small `eventsStore` and a one-line badge on `HomeView`.

**Acceptance:**
- `apps/website/package.json` declares `@vrc-ta-hub/client: "workspace:*"`.
- A new Pinia store calls one client method on mount.
- The home page mounts, calls the action on `onMounted`, and renders either the count or an error string.
- `pnpm build:website` succeeds.
- `pnpm dev` shows the integration working in a browser at `http://localhost:9010/`.
- `pnpm typecheck`, `pnpm lint`, `pnpm test` all pass.

**Branch:** `feat/integrate-vrc-ta-hub-client`
**PR title:** `feat(frontend): integrate @vrc-ta-hub/client for upcoming event count`
**Commit scope:** `frontend`

### Task 4.1 — Add the workspace dependency

**Files:**
- Modify: `apps/website/package.json`

- [ ] **Step 1: Add the dependency**

Run: `pnpm --filter website add @vrc-ta-hub/client@workspace:*`
Expected: adds `"@vrc-ta-hub/client": "workspace:*"` to `apps/website/package.json`; updates lockfile.

- [ ] **Step 2: Sanity-check the import**

Run:
```bash
pnpm --filter website exec node --input-type=module -e "
import { createClient } from '@vrc-ta-hub/client';
console.log(typeof createClient);
"
```
Expected: prints `function`.

### Task 4.2 — Match existing Pinia style

- [ ] **Step 1: Read one of the existing stores**

Read `apps/website/src/stores/uiStore.ts` (or any other existing store). Note whether the codebase uses **setup syntax** (`defineStore('name', () => { const x = ref(); ... return { x } })`) or **options syntax** (`defineStore('name', { state, actions })`).

Match the existing pattern in the new store. The skeleton below shows the **options** syntax; convert if the codebase uses setup syntax.

### Task 4.3 — Create `eventsStore.ts`

**Files:**
- Create: `apps/website/src/stores/eventsStore.ts`

- [ ] **Step 1: Write the store (options syntax shown — convert if needed)**

```ts
import { defineStore } from 'pinia'
import { createClient, isOk, type ClientError } from '@vrc-ta-hub/client'

const client = createClient()

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

interface State {
  count: number | null
  error: ClientError | null
  loading: boolean
}

export const useEventsStore = defineStore('events', {
  state: (): State => ({ count: null, error: null, loading: false }),
  actions: {
    async loadUpcoming() {
      this.loading = true
      this.error = null
      const result = await client.listEvents({ start_date: todayIso() })
      this.loading = false
      if (isOk(result)) {
        this.count = result.data.length
      } else {
        this.error = result.error
      }
    },
  },
})
```

### Task 4.4 — Wire the store into `HomeView.vue`

**Files:**
- Modify: `apps/website/src/views/HomeView.vue`

- [ ] **Step 1: Read the current `HomeView.vue`**

Run: `cat apps/website/src/views/HomeView.vue | head -80`
Note the existing `<script setup lang="ts">` block, the template structure, and where a small banner would fit unobtrusively (e.g., right under the page heading).

- [ ] **Step 2: Add to the `<script setup lang="ts">` block**

```ts
import { onMounted, computed } from 'vue'
import { useEventsStore } from '@/stores/eventsStore'

const eventsStore = useEventsStore()

onMounted(() => {
  void eventsStore.loadUpcoming()
})

const eventsBadge = computed(() => {
  if (eventsStore.loading) return '読み込み中…'
  if (eventsStore.error) return '今月の予定: 取得失敗'
  if (eventsStore.count === null) return ''
  return `今月の予定: ${eventsStore.count} 件`
})
```

- [ ] **Step 3: Add a single banner element to the template**

Place near the top of the existing layout, where it won't disrupt the design:

```html
<p
  v-if="eventsBadge"
  class="text-sm text-slate-500"
  data-testid="events-badge"
>{{ eventsBadge }}</p>
```

### Task 4.5 — Typecheck, build, manual browser check

- [ ] **Step 1: Typecheck**

Run: `pnpm typecheck`
Expected: passes.

- [ ] **Step 2: Build**

Run: `pnpm build:website`
Expected: passes; `apps/website/dist/index.html` produced.

- [ ] **Step 3: Manual browser check (REQUIRED for UI changes)**

Run (background): `pnpm dev`
Wait for `Local: http://localhost:9010/`.

Open `http://localhost:9010/` in a browser. Verify:
- Page mounts without console errors.
- The badge text `今月の予定: N 件` (with a real number) appears, OR `今月の予定: 取得失敗` if offline.
- Network tab shows a single request to `https://vrc-ta-hub.com/api/v1/event/?format=json&start_date=YYYY-MM-DD`.

Stop the dev server.

If you cannot test in a real browser (e.g., headless environment), say so explicitly in the PR description. Do **not** claim "working" without a verified browser load.

- [ ] **Step 4: Lint**

Run: `pnpm lint`
Expected: passes.

### Task 4.6 — Commit and PR

- [ ] **Step 1: Stage and commit**

```bash
git add apps/website/package.json apps/website/src/stores/eventsStore.ts apps/website/src/views/HomeView.vue pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
feat(frontend): integrate @vrc-ta-hub/client for upcoming event count

- Add @vrc-ta-hub/client workspace dependency to apps/website.
- New Pinia store eventsStore with loadUpcoming() action calling client.listEvents({ start_date }).
- HomeView shows a small badge with the upcoming event count, or 取得失敗 on error.
- All errors handled via Result; no throws.
EOF
)"
```

- [ ] **Step 2: Push and open PR**

```bash
git push -u origin feat/integrate-vrc-ta-hub-client
gh pr create --title "feat(frontend): integrate @vrc-ta-hub/client for upcoming event count" --body "$(cat <<'EOF'
## Summary
- Wire `@vrc-ta-hub/client` into the Vue app via a new Pinia store (`eventsStore`).
- `HomeView` shows a small badge with the upcoming-event count; falls back to `取得失敗` if the call returns a `ClientError`.
- Pipeline end-to-end proven: monorepo → workspace dep → zod-validated fetch → Vue.

## Test plan
- [ ] `pnpm build:website` succeeds
- [ ] `pnpm dev` serves; home page badge renders with a real number
- [ ] Network tab shows `GET /api/v1/event/?format=json&start_date=...`
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test` all pass

Closes the integration scoped in `docs/superpowers/specs/2026-05-20-vrc-ta-hub-client-design.md`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Post-merge checklist (after Phase 4 ships)

- [ ] Confirm the next semantic-release run produces the expected version bump.
- [ ] Confirm the S3 deploy from `apps/website/dist/` succeeds.
- [ ] Decide whether to refresh fixtures on a schedule (deferred from §10 of the spec).
- [ ] Decide whether to add Vitest to `apps/website` for component tests (deferred from §10 of the spec).
