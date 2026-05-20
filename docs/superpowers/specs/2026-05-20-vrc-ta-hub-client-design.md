# VRC TA Hub TypeScript Client — Design

- **Date:** 2026-05-20
- **Status:** Approved (design); pending implementation plan
- **Owners:** a1678991
- **Spec location:** `docs/superpowers/specs/2026-05-20-vrc-ta-hub-client-design.md`

## 1. Purpose

Provide a pure-TypeScript, zod-validated client for the **public read-only** subset
of the VRC TA Hub API (`https://vrc-ta-hub.com/api/v1/`). The client lives in a
new package inside this repository (converted to a pnpm monorepo) and is
consumed by the existing Vue 3 frontend.

Goals:

- Type-safe, runtime-validated access to the three public list/retrieve resources.
- Zero hidden network behaviour: no auto-retry, no caching, no rate-limit handling.
- Small surface (six methods) so the package stays easy to reason about.
- Schemas derived from the upstream OpenAPI schema so server drift is detectable.

Non-goals (explicit):

- Auth-gated endpoints (`/event-details/`, `/recurrence-rules/`, `/recurrence-preview/`).
- `/community/gathering-list/` action (Japanese-keyed, special-purpose).
- Retries, request caching, rate-limit handling, request deduplication.
- Publishing the client to npm.
- Vitest for `apps/website` (only the client package gets tests in v1).
- TanStack Query / Pinia integration helpers.
- A scheduled drift-detection CI job (deferred — can add later).

## 2. Background — the upstream API

Authoritative OpenAPI schema: `https://vrc-ta-hub.com/api/schema/`
(drf-spectacular, OpenAPI 3.0.3, ~29 KB).

### Public read-only endpoints (covered by this client)

| Path                             | Returns                                                | Filter query params                                                                                                          |
|----------------------------------|--------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| `GET /api/v1/community/`         | `Community[]` (flat JSON array, no pagination wrapper) | `name` (icontains), `weekdays` (contains)                                                                                    |
| `GET /api/v1/community/{id}/`    | `Community`                                            | —                                                                                                                            |
| `GET /api/v1/event/`             | `Event[]` (flat array, today-onward)                   | `name` (community__name icontains), `weekday`, `start_date` (gte), `end_date` (lte)                                          |
| `GET /api/v1/event/{id}/`        | `Event`                                                | —                                                                                                                            |
| `GET /api/v1/event_detail/`      | `EventDetail[]` (flat array)                           | `theme` (icontains), `speaker` (icontains), `start_date` (event__date gte), `end_date` (lte), `start_time` (exact, HH:MM:SS) |
| `GET /api/v1/event_detail/{id}/` | `EventDetail`                                          | —                                                                                                                            |

All public list endpoints return a flat JSON array (no `count`/`next`/`results` wrapper).
`?format=json` is supplied internally on every request.

### Auth-gated endpoints (NOT covered)

| Path                                           | Why excluded                                                                                                    |
|------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| `/api/v1/event-details/` (CRUD, multipart PDF) | Bearer API key required; out of scope for v1.                                                                   |
| `/api/v1/recurrence-rules/`                    | Superuser only.                                                                                                 |
| `/api/v1/recurrence-preview/`                  | Auth-gated.                                                                                                     |
| `/api/v1/community/gathering-list/`            | Japanese-keyed action endpoint for a specific VRChat in-world tool; data is derivable from `listCommunities()`. |

### Confirmed shapes (from server `serializers.py`)

- **Community**:
  `id, name, created_at, updated_at, start_time ("HH:MM"), duration, weekdays (WeekdayEnum[]), frequency, organizers, group_url, group_id (str|null), organizer_url, sns_url, discord, twitter_hashtag, poster_image (str|null), description, platform (PlatformEnum), tags (string[]), allow_poster_repost`
- **Event**: `id, community: Community, date ("YYYY-MM-DD"), start_time ("HH:MM"), duration, weekday`
- **EventDetail**:
  `id, event: Event, start_time ("HH:MM:SS"), duration, youtube_url (str|null), slide_url (str|null), thumbnail_image (str|null), speaker, theme, additional_info`
- **WeekdayEnum**: `Sun | Mon | Tue | Wed | Thu | Fri | Sat | Other`
- **PlatformEnum**: `All | PC`

## 3. Repository layout

The repository today is a single Vue 3 + Vite app at the root (`pnpm-workspace.yaml`
exists but contains no `packages:` entry). The conversion moves the Vue app under
`apps/website/` and adds the new client at `packages/vrc-ta-hub-client/`.

```
/
├─ apps/
│  └─ website/                    # current Vue app moves here
│     ├─ src/                     # was /src
│     ├─ public/                  # was /public
│     ├─ index.html               # was /index.html
│     ├─ vite.config.ts           # was /vite.config.ts (alias '@' still → ./src)
│     ├─ tsconfig.json, tsconfig.app.json, tsconfig.node.json
│     ├─ tailwind.config.js, postcss.config.js
│     └─ package.json             # name: "website", private, depends on workspace:* client
├─ packages/
│  └─ vrc-ta-hub-client/
│     ├─ src/
│     │  ├─ generated/
│     │  │  └─ schemas.ts         # openapi-zod-client output (committed)
│     │  ├─ client.ts             # hand-written factory + Result wiring
│     │  ├─ errors.ts             # ClientError discriminated union
│     │  ├─ result.ts             # Result<T, E> helpers
│     │  └─ index.ts              # public surface
│     ├─ tests/
│     │  ├─ __fixtures__/
│     │  │  ├─ community.json
│     │  │  ├─ event.json
│     │  │  ├─ event_detail.json
│     │  │  └─ openapi.yaml       # snapshot of /api/schema/ at time of last codegen
│     │  ├─ schemas.test.ts
│     │  ├─ client.test.ts
│     │  └─ url-builder.test.ts
│     ├─ scripts/
│     │  ├─ codegen.ts            # runs openapi-zod-client on /api/schema/
│     │  └─ refresh-fixtures.ts   # hits public endpoints, writes fixtures
│     ├─ tsconfig.json
│     ├─ vitest.config.ts
│     └─ package.json             # name: "@vrc-ta-hub/client", private
├─ aws/                           # unchanged
├─ .github/                       # workflow paths updated
├─ eslint.config.ts               # ignores src/generated, extends globs
├─ commitlint.config.mjs          # unchanged (no scope restriction)
├─ lefthook.yaml                  # path globs updated
├─ release.config.mjs             # asset paths updated; single root release tag
├─ pnpm-workspace.yaml            # adds packages: apps/* + packages/*
├─ mise.toml, mise.lock           # unchanged
└─ package.json                   # workspace shell only
```

Path aliases: `@/*` continues to resolve to `apps/website/src/*` via
`apps/website/tsconfig.app.json` (no callers change).

## 4. Codegen pipeline

**Source of truth:** `https://vrc-ta-hub.com/api/schema/` (drf-spectacular).

**Tool:** `openapi-zod-client` (Astahmer) — used as a *zod-schema generator only*.
We discard its generated zodios client and consume only the emitted
`z.object(...)` / `z.enum(...)` declarations.

**Pipeline (`packages/vrc-ta-hub-client/scripts/codegen.ts`):**

1. Fetch `/api/schema/` to `.cache/openapi.yaml` (also written to `tests/__fixtures__/openapi.yaml`).
2. Run `openapi-zod-client` programmatically against the cached schema. The
   library's default template includes a zodios `Api` constant alongside the
   zod schemas; we strip that constant (either via a custom Handlebars template
   or a small post-processing step on the emitted source) so only the zod
   schema declarations remain.
3. Filter the output to the schemas this client exposes: `Community`, `Event`,
   `EventDetail`, `WeekdayEnum`, `PlatformEnum`. Auth-gated request/response
   schemas are dropped.
4. Write to `src/generated/schemas.ts` (committed).
5. Run `prettier --write` then `eslint --fix` on the output.

Invocation: `pnpm --filter @vrc-ta-hub/client codegen`. Codegen never runs as
part of `install`/`build` — the output is committed.

**Generated module shape:**

```ts
// AUTO-GENERATED. Do not edit. Run `pnpm codegen` to refresh.
import {z} from 'zod'

export const WeekdayEnum = z.enum(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Other'])
export const PlatformEnum = z.enum(['All', 'PC'])

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

TypeScript types are derived via `z.infer<typeof X>` — single source of truth.

## 5. Public API surface

`packages/vrc-ta-hub-client/src/index.ts`:

```ts
export {createClient} from './client'
export type {
    Client,
    ClientOptions,
    CallOptions,
    Community,
    Event,
    EventDetail,
    WeekdaySymbol,
    PlatformSymbol,
    ListCommunitiesParams,
    ListEventsParams,
    ListEventDetailsParams,
} from './client'
export type {ClientError, HttpError, NetworkError, ValidationError} from './errors'
export {ok, err, isOk, isErr, type Result} from './result'
```

`createClient` returns a flat factory client (Approach A from brainstorming):

```ts
export interface ClientOptions {
    /** Defaults to 'https://vrc-ta-hub.com'. Trailing slash is normalized off. */
    baseUrl?: string
    /** Defaults to globalThis.fetch. Inject for tests or custom transport. */
    fetch?: typeof globalThis.fetch
}

export interface CallOptions {
    signal?: AbortSignal
}

export interface Client {
    listCommunities(params?: ListCommunitiesParams, opts?: CallOptions): Promise<Result<Community[], ClientError>>

    getCommunity(id: number, opts?: CallOptions): Promise<Result<Community, ClientError>>

    listEvents(params?: ListEventsParams, opts?: CallOptions): Promise<Result<Event[], ClientError>>

    getEvent(id: number, opts?: CallOptions): Promise<Result<Event, ClientError>>

    listEventDetails(params?: ListEventDetailsParams, opts?: CallOptions): Promise<Result<EventDetail[], ClientError>>

    getEventDetail(id: number, opts?: CallOptions): Promise<Result<EventDetail, ClientError>>
}

export interface ListCommunitiesParams {
    name?: string            // icontains
    weekdays?: WeekdaySymbol // single weekday code; server uses __contains on the array
}

export interface ListEventsParams {
    name?: string            // matches community__name icontains
    weekday?: WeekdaySymbol
    start_date?: string      // YYYY-MM-DD, gte
    end_date?: string        // YYYY-MM-DD, lte
}

export interface ListEventDetailsParams {
    theme?: string           // icontains
    speaker?: string         // icontains
    start_date?: string      // event__date gte
    end_date?: string        // event__date lte
    start_time?: string      // HH:MM:SS exact
}
```

`WeekdaySymbol` and `PlatformSymbol` are exported aliases for
`z.infer<typeof WeekdayEnum>` and `z.infer<typeof PlatformEnum>` respectively.

`?format=json` is **always** added by the client; it is **not** a user-supplied
parameter. DRF pagination params are not exposed (the public endpoints return
flat arrays).

## 6. Internal request flow

```
client.listEvents(params, opts)
  ├─ build URL: ${baseUrl}/api/v1/event/?format=json&...params  (skip undefined)
  ├─ fetch(url, { signal: opts.signal, headers: { Accept: 'application/json' } })
  │    └─ if fetch throws → err({ kind: 'network', cause, aborted })
  ├─ if !response.ok → err({ kind: 'http', status, statusText, url, body: <≤2048 chars> })
  ├─ response.json() → if throws → err({ kind: 'network', cause, aborted: false })
  ├─ z.array(Event).safeParse(json) → if !success → err({ kind: 'validation', issues, url })
  └─ ok(parsed.data)
```

Conventions:

- Methods **never throw**. Only programmer errors (e.g., `getCommunity(-1)`) may
  throw `TypeError` at the call boundary.
- `baseUrl` trailing slash is trimmed so consumers can pass either form.
- URL building uses `URLSearchParams`; entries with `undefined` value are skipped
  (no `?name=undefined`).
- Numeric `id` is interpolated as a path segment, not a query param.

## 7. Error model

Plain-object discriminated union — not classes.

`packages/vrc-ta-hub-client/src/result.ts`:

```ts
export type Result<T, E> = { ok: true; data: T } | { ok: false; error: E }

export const ok = <T>(data: T): Result<T, never> => ({ok: true, data})
export const err = <E>(error: E): Result<never, E> => ({ok: false, error})
export const isOk = <T, E>(r: Result<T, E>): r is { ok: true; data: T } => r.ok
export const isErr = <T, E>(r: Result<T, E>): r is { ok: false; error: E } => !r.ok
```

No `map`/`andThen` combinators in v1 (YAGNI).

`packages/vrc-ta-hub-client/src/errors.ts`:

```ts
import type {z} from 'zod'

export interface HttpError {
    kind: 'http'
    status: number
    statusText: string
    url: string
    body: string | null   // capped at 2048 chars
}

export interface NetworkError {
    kind: 'network'
    url: string
    cause: unknown
    aborted: boolean      // true when the call was cancelled via AbortSignal
}

export interface ValidationError {
    kind: 'validation'
    url: string
    issues: z.ZodIssue[]
}

export type ClientError = HttpError | NetworkError | ValidationError
```

Rationale for plain objects (vs. classes): matches the Result pattern, serializes
cleanly through Pinia/devtools, and avoids `instanceof` cross-bundle issues.

Consumer pattern in the Vue app:

```ts
const r = await client.listEvents({start_date: today()})
if (!isOk(r)) {
    switch (r.error.kind) {
        case 'http':
            uiStore.notifyError(`API ${r.error.status}`);
            break
        case 'network':
            uiStore.notifyError(r.error.aborted ? 'cancelled' : 'offline');
            break
        case 'validation':
            console.error('schema drift', r.error.issues);
            break
    }
    return
}
this.events = r.data
```

## 8. Testing strategy

**Framework:** Vitest (added as a dev dep on the client package only).
**No network in CI.** Fixtures are committed; refresh is manual.

Files:

```
packages/vrc-ta-hub-client/tests/
├─ __fixtures__/
│  ├─ community.json         # captured from /api/v1/community/?format=json
│  ├─ event.json
│  ├─ event_detail.json
│  └─ openapi.yaml           # snapshot of /api/schema/ at time of last codegen
├─ schemas.test.ts           # zod parses every record in every fixture
├─ client.test.ts            # client.* against an injected fetch returning fixtures
└─ url-builder.test.ts       # query param assembly
```

`schemas.test.ts` asserts:

- `z.array(Community).safeParse(communityFixture).success === true` (and Event, EventDetail).
- Every element validates (not just shape — all records).
- Spot-checks for shape oddities discovered during exploration:
  `group_id` and `poster_image` may be `null`; `discord`/`sns_url` may be empty
  strings; `weekdays` is a non-empty array of `WeekdayEnum` (including `'Other'`).

`client.test.ts` injects a stub `fetch` and asserts, for each method:

1. Built URL matches expected path + query string.
2. `ok: true` with parsed data on 200.
3. `err({ kind: 'http', status: 500 })` on 500.
4. `err({ kind: 'http', status: 404 })` on 404 (e.g., `getCommunity(99999)`).
5. `err({ kind: 'validation', ... })` when stub returns malformed JSON.
6. `err({ kind: 'network', aborted: true })` when stub rejects with `AbortError`.
7. `signal` is forwarded into the `fetch` call's init.

`url-builder.test.ts` asserts:

- `undefined` params are omitted.
- Multiple params are encoded correctly.
- `baseUrl` with and without trailing slash both work.
- Numeric `id` becomes a path segment, not a query param.

Scripts:

```jsonc
// packages/vrc-ta-hub-client/package.json (scripts)
{
  "test":             "vitest run",
  "test:watch":       "vitest",
  "typecheck":        "tsc --noEmit",
  "codegen":          "tsx scripts/codegen.ts",
  "fixtures:refresh": "tsx scripts/refresh-fixtures.ts"
}
```

CI runs `pnpm test` and `pnpm typecheck` (the root scripts shown in §9, which
filter to `packages/*` for tests and to `packages/*` + `apps/*` for typecheck).
Neither touches the network.

No coverage threshold is enforced. Three things must pass: schemas validate
fixtures, URL building is right, error mapping is right.

## 9. Repo restructure & release workflow changes

### Move (history-preserving)

```bash
mkdir -p apps/website
git mv src public index.html vite.config.ts \
       tsconfig.json tsconfig.app.json tsconfig.node.json \
       tailwind.config.js postcss.config.js \
       apps/website/
mkdir -p packages/vrc-ta-hub-client
```

Stays at root: `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `.gitignore`, `.github/`,
`.vscode/`, `.idea/`, `aws/`, `mise.toml`, `mise.lock`, `lefthook.yaml`,
`eslint.config.ts`, `commitlint.config.mjs`, `release.config.mjs`,
`CHANGELOG.md`, `README.md`, new root `package.json`.

### `pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
minimumReleaseAge: 4320
```

### Root `package.json` (workspace shell)

Single source for the repo version + semantic-release toolchain. Runtime
website deps move into `apps/website/package.json`.

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
    "lint": "eslint . --cache --cache-strategy content --cache-location ./node_modules/.tmp/eslintcache",
    "lint:fix": "eslint . --cache --cache-strategy content --cache-location ./node_modules/.tmp/eslintcache --fix",
    "test": "pnpm -r --filter \"./packages/*\" test",
    "typecheck": "pnpm -r --filter \"./packages/*\" --filter \"./apps/*\" typecheck",
    "codegen": "pnpm --filter @vrc-ta-hub/client codegen",
    "commitlint": "commitlint",
    "semantic-release": "semantic-release"
  },
  "devDependencies": {
    "@commitlint/cli": "^21.0.1",
    "@commitlint/config-conventional": "^21.0.1",
    "@semantic-release/changelog": "^6.0.3",
    "@semantic-release/exec": "^7.1.0",
    "@semantic-release/git": "^10.0.1",
    "@eslint/js": "^10.0.1",
    "eslint": "^10.4.0",
    "eslint-plugin-vue": "^10.9.1",
    "globals": "^17.6.0",
    "jiti": "^2.7.0",
    "semantic-release": "^25.0.3",
    "typescript": "6.0.3",
    "typescript-eslint": "^8.59.3"
  }
}
```

### `apps/website/package.json`

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
    "typecheck": "vue-tsc -b --noEmit"
  },
  "dependencies": {
    "@lucide/vue": "1.16.0",
    "@vrc-ta-hub/client": "workspace:*",
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
    "postcss": "8.5.14",
    "tailwindcss": "4.3.0",
    "vite": "8.0.13",
    "vue-tsc": "3.2.9"
  }
}
```

### `packages/vrc-ta-hub-client/package.json`

```json
{
  "name": "@vrc-ta-hub/client",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "codegen": "tsx scripts/codegen.ts",
    "fixtures:refresh": "tsx scripts/refresh-fixtures.ts"
  },
  "dependencies": {
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "openapi-zod-client": "^1.18.0",
    "tsx": "^4.19.0",
    "typescript": "6.0.3",
    "vitest": "^2.1.0"
  }
}
```

### ESLint

`eslint.config.ts` changes:

- Replace the existing `{ ignores: ['dist/**'] }` block with one that ignores
  workspace `dist/`, `node_modules/`, and the generated zod module:
  `{ ignores: ['**/dist/**', '**/node_modules/**', 'packages/*/src/generated/**'] }`.
- Broaden the Node-globals override from `./*.config.{ts,mjs,js}` to also match
  nested workspace config files: `['./*.config.{ts,mjs,js}', 'apps/*/*.config.{ts,mjs,js}', 'packages/*/*.config.{ts,mjs,js}']`.
  Otherwise the new `apps/website/vite.config.ts` and `packages/vrc-ta-hub-client/vitest.config.ts`
  won't get Node globals.
- Add a test-file override so console logging in fixture tooling is allowed:
  `{ files: ['packages/*/tests/**', 'packages/*/scripts/**'], rules: { 'no-console': 'off' } }`.

### `release.config.mjs`

Single semantic-release pipeline tied to the root tag; only the website is
released. The existing plugin list and order are preserved
(`commit-analyzer` → `release-notes-generator` → `changelog` → `npm` (publish
off) → `exec` → `github` → `git`). Two concrete changes:

1. The `@semantic-release/exec` `prepareCmd` changes from `pnpm build` to
   `pnpm --filter website build`, and the `publishCmd` is repointed at the new
   build output path.
2. No other plugin changes; `pnpm-lock.yaml` remains in `@semantic-release/git`
   assets.

```js
// release.config.mjs — only the exec plugin entry changes
[
    '@semantic-release/exec',
    {
        prepareCmd: 'pnpm --filter website build',
        publishCmd: 'aws s3 sync apps/website/dist/ s3://it-infra-meetup/website/ --delete',
    },
],
// other plugins unchanged:
// - '@semantic-release/npm' { npmPublish: false }
// - '@semantic-release/github'
// - '@semantic-release/git' { assets: ['CHANGELOG.md', 'package.json', 'pnpm-lock.yaml'], message: ... }
```

The client package stays at `version: 0.0.0` (private, workspace-only) and is
not independently versioned. `@semantic-release/npm` continues to run with
`npmPublish: false` to update the root `package.json` version only;
`apps/website/package.json` and `packages/vrc-ta-hub-client/package.json`
versions stay frozen. `commitlint` does not restrict scopes, so no config
change is needed for the new scope.

### Commit-message scopes

`commitlint.config.mjs` enforces a closed `scope-enum`. Today it allows
`[frontend, ci, infra, tool]`. The migration adds the new package scope:

```js
"scope-enum"
:
[
    2,
    "always",
    [
        "frontend",
        "ci",
        "infra",
        "tool",
        "vrc-ta-hub-client",   // added
    ],
],
```

Convention:

- Changes inside `apps/website/` use `feat(frontend): ...` (unchanged).
- Changes inside `packages/vrc-ta-hub-client/` use **`feat(vrc-ta-hub-client): ...`**.
- Repo-level restructure / monorepo / release-workflow changes use
  `feat(infra): ...` or `chore(infra): ...`.

(Generic `client` was rejected as a scope because it is ambiguous with other
"client" concepts.)

### GitHub Actions

Workflows under `.github/workflows/` are updated:

- Build step changes from `pnpm build` at root → `pnpm build:website` (or runs
  inside `apps/website/`).
- S3 deploy step's source path changes from `dist/` → `apps/website/dist/`.
- A new step `pnpm -r --filter "./packages/*" test` runs before deploy so the
  client's Vitest suite gates the release.

### Lefthook

Current `lefthook.yaml` has no `src/**` globs — its hooks scope to
`.github/**/*.yaml`, `mise.toml`, and commit-msg. No changes are required.
(Mentioned here so the migration step doesn't accidentally invent edits.)

### Migration order (PR sequencing)

1. Add `packages:` entry to `pnpm-workspace.yaml`.
2. `git mv` Vue app to `apps/website/`; split `package.json`; verify
   `pnpm install` + `pnpm build:website` work.
3. Scaffold `packages/vrc-ta-hub-client/` (empty `src/index.ts`, vitest config,
   tsconfig).
4. Update `eslint.config.ts`, `commitlint.config.mjs` (add `vrc-ta-hub-client`
   to `scope-enum`), `release.config.mjs`, and `.github/workflows/*`.
5. Run codegen, write hand-written client + tests; commit fixtures.
6. Integrate the smallest possible call site in the Vue app (single store
   action) to prove the pipeline end-to-end.

Step 2 is the only step that risks breaking the user-visible website, so it is
kept mechanical (no behavioural changes) before any client code lands.

## 10. Open questions / follow-ups

- **Drift-detection CI** — a weekly job that reruns codegen and fails on diff
  may be added later, once the first integration is live.
- **Vitest at `apps/website`** — Vue component tests are out of scope here but
  may be useful once the client is integrated; revisit when there is a concrete
  reason.
- **Pagination** — none of the covered endpoints paginate today. If the upstream
  ever adds pagination, the client will need a follow-up to expose page params
  and a paged-iterator helper.
