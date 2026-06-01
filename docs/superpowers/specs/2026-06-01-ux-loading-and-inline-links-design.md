# UX improvements: faster boot screen + inline instruction links

- **Date:** 2026-06-01
- **Status:** Proposed
- **Scope:** `apps/website`

## Goals

Two independent UX improvements to the ITインフラ集会 landing site:

1. **Faster first view** — make the "SYSTEM BOOT SEQUENCE" loading screen ~4× faster.
2. **Actionable join instructions** — hyperlink the proper nouns in the "HOW TO JOIN"
   steps so newcomers can reach Discord / VRChat / the group directly.

### Non-goals

- Linking descriptive marketing prose (`AboutSection`, `JoinSection`).
- Linking `NextEventCard`'s "VRChat Group+ Instance" text.
- Linking the decorative fake terminal / system-log strings or ASCII (`TARGET: VRChat_Group`).
- Refactoring the existing button components beyond the small DRY win noted below.

---

## Change 1 — Loading screen speed-up

**File:** `apps/website/src/components/ui/LoadingScreen.vue`

The boot screen is purely decorative: it animates a GSAP timeline and never waits on real
data (the events fetch in `eventsStore` runs independently). So shortening it is safe and has
no effect on data readiness.

Divide every timing value in the GSAP timeline by 4:

| Timing | Current | New |
| --- | --- | --- |
| Timeline `delay` | `0.3` | `0.075` |
| Progress-bar fill `duration` | `2` | `0.5` |
| Percent-text `duration` | `2` | `0.5` |
| Slide-up `duration` | `0.8` | `0.2` |
| Gap before slide-up | `"+=0.3"` | `"+=0.075"` |
| Post-complete `setTimeout` | `300` ms | `75` ms |

Total runtime: **≈3.7s → ≈0.9s**. The visual sequence (fill → settle → slide up) is unchanged.

---

## Change 2 — Inline links in the "HOW TO JOIN" steps

**Files:** `apps/website/src/components/sections/HeroSection.vue`, new
`apps/website/src/consts/links.ts`, `apps/website/src/assets/main.css`

Only the numbered **HOW TO JOIN** instruction steps get links — not the descriptive prose.

### New canonical URLs — `src/consts/links.ts`

```ts
export const DISCORD_URL = 'https://discord.gg/7EtJz53ugA'
export const VRCHAT_REGISTER_URL = 'https://vrchat.com/home/register'
export const VRCHAT_DOWNLOAD_URL = 'https://hello.vrchat.com'
export const VRCHAT_GROUP_URL =
  'https://vrchat.com/home/group/grp_caa820c4-7aa6-48bc-a7bc-593376245419'
export const VRCHAT_GROUP_INSTANCES_URL =
  'https://vrchat.com/home/group/grp_caa820c4-7aa6-48bc-a7bc-593376245419/instances'
```

### Global inline-link style — `src/assets/main.css`

Add one custom class alongside the existing `.glass-panel` / `.bracket` classes, so every
inline link styles identically and matches the theme:

```css
.inline-link {
  color: var(--primary-color);
  text-decoration: underline;
  text-underline-offset: 2px;
  text-decoration-thickness: 1px;
  transition: color 0.2s, text-shadow 0.2s;
}

.inline-link:hover {
  text-shadow: 0 0 6px rgba(0, 123, 255, 0.5);
}
```

Links open in a new tab using the convention already in the codebase:
`target="_blank" rel="noopener noreferrer"`.

### HeroSection.vue — data model + render

Change `JoinStep.title` from `string` to an ordered array of text segments. A segment with an
`href` renders as an `.inline-link`; a plain segment renders as text. This links just the proper
noun (matching the one-word style), is type-safe, and avoids `v-html`. `description` stays a
plain `string`.

```ts
type TextSegment = { text: string; href?: string }

type JoinStep = {
  title: TextSegment[]
  description?: string
}
```

Title render (replaces `{{ step.title }}`):

```html
<p class="text-sm font-bold main-text mb-1">
  <template v-for="(seg, i) in step.title" :key="i"><a
    v-if="seg.href"
    :href="seg.href"
    target="_blank"
    rel="noopener noreferrer"
    class="inline-link"
  >{{ seg.text }}</a><template v-else>{{ seg.text }}</template></template>
</p>
```

Descriptions remain plain single-paragraph strings (`<p class="text-xs muted-text">`), unchanged
from the current component.

### Steps (final order and content)

Step numbers are auto-generated from the array index (`index + 1`), so ordering is just array
order. **Bold** = the linked segment.

| # | Title (linked word bold) | Target | Description |
| --- | --- | --- | --- |
| 1 | **Discord**サーバーに参加 | `DISCORD_URL` | Discordサーバーで他のコミュニティメンバーと交流できます。参加方法などの質問も受け付けています。 |
| 2 | **VRChat**に登録 | `VRCHAT_REGISTER_URL` | — |
| 3 | **VRChat**をダウンロード | `VRCHAT_DOWNLOAD_URL` | 対応: Windows / Linux / Android / iOS |
| 4 | **VRChatグループ**に参加 | `VRCHAT_GROUP_URL` | 事前にグループに入っておくと、簡単に参加できます。 |
| 5 | **Group+インスタンス**にJoin！ → full title `開催時刻になったらGroup+インスタンスにJoin！` | `VRCHAT_GROUP_INSTANCES_URL` | — |

Resulting `joinSteps` array:

```ts
const joinSteps: JoinStep[] = [
  {
    title: [{ text: 'Discord', href: DISCORD_URL }, { text: 'サーバーに参加' }],
    description: 'Discordサーバーで他のコミュニティメンバーと交流できます。参加方法などの質問も受け付けています。',
  },
  {
    title: [{ text: 'VRChat', href: VRCHAT_REGISTER_URL }, { text: 'に登録' }],
  },
  {
    title: [{ text: 'VRChat', href: VRCHAT_DOWNLOAD_URL }, { text: 'をダウンロード' }],
    description: '対応: Windows / Linux / Android / iOS',
  },
  {
    title: [{ text: 'VRChatグループ', href: VRCHAT_GROUP_URL }, { text: 'に参加' }],
    description: '事前にグループに入っておくと、簡単に参加できます。',
  },
  {
    title: [
      { text: '開催時刻になったら' },
      { text: 'Group+インスタンス', href: VRCHAT_GROUP_INSTANCES_URL },
      { text: 'にJoin！' },
    ],
  },
]
```

### DRY win

While editing `HeroSection.vue`, point its existing "Group Page" and Discord **buttons** at
`VRCHAT_GROUP_URL` / `DISCORD_URL` from `links.ts` (same values, removes the hardcoded
duplication). The X (Twitter) button URL stays inline — not part of this change set.

---

## Verification

- `pnpm typecheck` — the segment-array model change must type-check (`vue-tsc -b`).
- `pnpm lint` — flat config is type-aware; new code must pass.
- Manual: `pnpm dev` →
  - Boot screen is noticeably snappy (~1s).
  - All five step links render as underlined blue inline links, glow on hover, and open the
    correct page in a new tab.
- No automated tests for the site (tests live only in `@vrc-ta-hub/client`).
