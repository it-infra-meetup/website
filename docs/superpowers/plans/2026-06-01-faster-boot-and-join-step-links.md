# Faster Boot Screen + Inline Join-Step Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the landing site's boot animation ~4× faster and hyperlink the proper nouns in the "HOW TO JOIN" steps.

**Architecture:** Two independent changes in `apps/website`. (1) Divide every GSAP timing in `LoadingScreen.vue` by 4. (2) Centralize external URLs in a new `consts/links.ts`, add one global `.inline-link` style, and convert the Hero "HOW TO JOIN" step titles from plain strings to `{ text, href? }[]` segment arrays so the proper noun in each step renders as an inline link; the Hero's existing Group/Discord buttons reuse the same consts.

**Tech Stack:** Vue 3 (`<script setup>` SFC), TypeScript, Vite, Tailwind 4, GSAP, pnpm workspace.

**Testing note:** The website has no test harness (per `CLAUDE.md`; Vitest runs only in `@vrc-ta-hub/client`). Verification for every task is `pnpm typecheck` + `pnpm lint` + a manual `pnpm dev` check — not unit tests. Run all commands from the repo root.

---

## File Structure

- **Modify** `apps/website/src/components/ui/LoadingScreen.vue` — boot-animation timings ÷4.
- **Create** `apps/website/src/consts/links.ts` — canonical external URLs.
- **Modify** `apps/website/src/assets/main.css` — add global `.inline-link` class.
- **Modify** `apps/website/src/components/sections/HeroSection.vue` — segment-array step titles, inline links, buttons reuse consts.

---

### Task 1: Speed up the boot screen

**Files:**
- Modify: `apps/website/src/components/ui/LoadingScreen.vue:26-60`

- [ ] **Step 1: Divide every GSAP timing by 4**

In `LoadingScreen.vue`, replace the `onMounted` timeline block. Current code:

```ts
onMounted(() => {
  const tl = gsap.timeline({
    delay: 0.3,
    onComplete: () => {
      setTimeout(() => {
        uiStore.setLoading(false)
      }, 300)
    }
  })

  if (loaderBar.value && percentText.value) {
    // プログレスバーとパーセンテージを同時にアニメーション
    tl.to(loaderBar.value, {
      width: "100%",
      duration: 2,
      ease: "power2.inOut"
    })
    .to(percentText.value, {
      innerText: "100%",
      duration: 2,
      snap: { innerText: 1 },
      ease: "power2.inOut",
      onUpdate: function() {
        if (percentText.value) {
          const value = Math.round(parseFloat(percentText.value.innerText))
          percentText.value.innerText = value + "%"
        }
      }
    }, "<")
    .to(".loader", {
      y: "-100%",
      duration: 0.8,
      ease: "power2.inOut"
    }, "+=0.3")
  }
})
```

Replace with (only the numeric timings change — `0.3→0.075`, `2→0.5`, `2→0.5`, `300→75`, `0.8→0.2`, `"+=0.3"→"+=0.075"`):

```ts
onMounted(() => {
  const tl = gsap.timeline({
    delay: 0.075,
    onComplete: () => {
      setTimeout(() => {
        uiStore.setLoading(false)
      }, 75)
    }
  })

  if (loaderBar.value && percentText.value) {
    // プログレスバーとパーセンテージを同時にアニメーション
    tl.to(loaderBar.value, {
      width: "100%",
      duration: 0.5,
      ease: "power2.inOut"
    })
    .to(percentText.value, {
      innerText: "100%",
      duration: 0.5,
      snap: { innerText: 1 },
      ease: "power2.inOut",
      onUpdate: function() {
        if (percentText.value) {
          const value = Math.round(parseFloat(percentText.value.innerText))
          percentText.value.innerText = value + "%"
        }
      }
    }, "<")
    .to(".loader", {
      y: "-100%",
      duration: 0.2,
      ease: "power2.inOut"
    }, "+=0.075")
  }
})
```

- [ ] **Step 2: Type-check**

Run: `pnpm typecheck`
Expected: PASS (no errors).

- [ ] **Step 3: Lint**

Run: `pnpm lint`
Expected: PASS (no errors).

- [ ] **Step 4: Manual check**

Run: `pnpm dev`, open http://localhost:9010. Expected: the "SYSTEM BOOT SEQUENCE" screen fills, settles, and slides up in roughly **1 second** (was ~3.7s), then the site shows. Stop the dev server when done.

- [ ] **Step 5: Commit**

```bash
git add apps/website/src/components/ui/LoadingScreen.vue
git commit -m "perf: speed up boot screen animation 4x"
```

---

### Task 2: Add link consts and the inline-link style

**Files:**
- Create: `apps/website/src/consts/links.ts`
- Modify: `apps/website/src/assets/main.css`

- [ ] **Step 1: Create the consts file**

Create `apps/website/src/consts/links.ts` with exactly:

```ts
// Canonical external URLs used by the site. Centralized so the same link
// is not duplicated across components.
export const DISCORD_URL = 'https://discord.gg/7EtJz53ugA'
export const VRCHAT_REGISTER_URL = 'https://vrchat.com/home/register'
export const VRCHAT_DOWNLOAD_URL = 'https://hello.vrchat.com'
export const VRCHAT_GROUP_URL =
  'https://vrchat.com/home/group/grp_caa820c4-7aa6-48bc-a7bc-593376245419'
export const VRCHAT_GROUP_INSTANCES_URL =
  'https://vrchat.com/home/group/grp_caa820c4-7aa6-48bc-a7bc-593376245419/instances'
```

- [ ] **Step 2: Add the global `.inline-link` class**

In `apps/website/src/assets/main.css`, append this block to the "カスタムクラス" (custom classes) area — i.e. after the existing `.glass-panel` / `.bracket` rules, before the `:root`-unrelated layout rules is fine; appending at the end of the file is acceptable since CSS specificity is unaffected:

```css
/* インラインリンク（本文中のリンク用） */
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

- [ ] **Step 3: Type-check**

Run: `pnpm typecheck`
Expected: PASS. (The consts file is valid TS; nothing imports it yet, which is fine — exported members are not flagged as unused.)

- [ ] **Step 4: Lint**

Run: `pnpm lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/website/src/consts/links.ts apps/website/src/assets/main.css
git commit -m "feat: add external link consts and inline-link style"
```

---

### Task 3: Link proper nouns in the HOW TO JOIN steps

**Files:**
- Modify: `apps/website/src/components/sections/HeroSection.vue` (imports ~111-114, `JoinStep` type + `joinSteps` ~118-138, title render ~41-43, Group/Discord buttons ~56-91)

- [ ] **Step 1: Import the link consts**

In `HeroSection.vue`'s `<script setup>`, the current imports are:

```ts
import {ref, onMounted} from 'vue'
import {fetchPublicIp} from '@/clients/ipify'
import NextEventCard from '@/components/sections/NextEventCard.vue'
```

Add the consts import below them:

```ts
import {ref, onMounted} from 'vue'
import {fetchPublicIp} from '@/clients/ipify'
import NextEventCard from '@/components/sections/NextEventCard.vue'
import {
  DISCORD_URL,
  VRCHAT_REGISTER_URL,
  VRCHAT_DOWNLOAD_URL,
  VRCHAT_GROUP_URL,
  VRCHAT_GROUP_INSTANCES_URL,
} from '@/consts/links'
```

- [ ] **Step 2: Replace the `JoinStep` type and `joinSteps` data**

Current code:

```ts
type JoinStep = {
  title: string
  description?: string
}

const joinSteps: JoinStep[] = [
  {
    title: "VRChatをダウンロード",
  },
  {
    title: "Discordサーバーに参加",
    description: "ITインフラ集会のDiscordサーバーで開催時期について詳細を知ることができます"
  },
  {
    title: 'VRChatグループに参加',
    description: '事前に以下のリンクからグループに参加してください。'
  },
  {
    title: '隔週開催のGroup+インスタンスにJoin！',
  }
]
```

Replace with (title becomes a segment array; new order Discord → register → download → group → instance; updated descriptions; device list on the download step):

```ts
type TextSegment = {
  text: string
  href?: string
}

type JoinStep = {
  title: TextSegment[]
  description?: string
}

const joinSteps: JoinStep[] = [
  {
    title: [{text: 'Discord', href: DISCORD_URL}, {text: 'サーバーに参加'}],
    description: 'Discordサーバーで他のコミュニティメンバーと交流できます。参加方法などの質問も受け付けています。',
  },
  {
    title: [{text: 'VRChat', href: VRCHAT_REGISTER_URL}, {text: 'に登録'}],
  },
  {
    title: [{text: 'VRChat', href: VRCHAT_DOWNLOAD_URL}, {text: 'をダウンロード'}],
    description: '対応: Windows / Linux / Android / iOS',
  },
  {
    title: [{text: 'VRChatグループ', href: VRCHAT_GROUP_URL}, {text: 'に参加'}],
    description: '事前にグループに入っておくと、簡単に参加できます。',
  },
  {
    title: [
      {text: '開催時刻になったら'},
      {text: 'Group+インスタンス', href: VRCHAT_GROUP_INSTANCES_URL},
      {text: 'にJoin！'},
    ],
  },
]
```

- [ ] **Step 3: Render the title segments**

Current title paragraph in the template (inside the `v-for="(step, index) in joinSteps"` loop):

```html
<p class="text-sm font-bold main-text mb-1">
  {{ step.title }}
</p>
```

Replace with a per-segment render (segments with `href` become inline links; the no-whitespace layout between `</a>` and `<template>` avoids stray spaces inside Japanese text):

```html
<p class="text-sm font-bold main-text mb-1">
  <template v-for="(seg, segIndex) in step.title" :key="segIndex"><a
    v-if="seg.href"
    :href="seg.href"
    target="_blank"
    rel="noopener noreferrer"
    class="inline-link"
  >{{ seg.text }}</a><template v-else>{{ seg.text }}</template></template>
</p>
```

Leave the description paragraph (`<p class="text-xs muted-text">{{ step.description }}</p>`) unchanged.

- [ ] **Step 4: Point the existing Group and Discord buttons at the consts**

In the "Official Links" block, the Group Page anchor currently hardcodes the URL:

```html
<a
  href="https://vrchat.com/home/group/grp_caa820c4-7aa6-48bc-a7bc-593376245419" target="_blank"
  rel="noopener noreferrer"
  class="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-white/50 border border-[var(--primary-color)]/20 rounded hover:bg-[var(--primary-color)]/10 hover:border-[var(--primary-color)] transition-all muted-text hover:text-[var(--primary-color)]"
>
```

Change its `href` to a binding (keep every other attribute identical):

```html
<a
  :href="VRCHAT_GROUP_URL" target="_blank"
  rel="noopener noreferrer"
  class="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-white/50 border border-[var(--primary-color)]/20 rounded hover:bg-[var(--primary-color)]/10 hover:border-[var(--primary-color)] transition-all muted-text hover:text-[var(--primary-color)]"
>
```

The Discord anchor currently is:

```html
<a
  href="https://discord.gg/7EtJz53ugA" target="_blank" rel="noopener noreferrer"
  class="p-2 bg-white/50 border border-gray-200 rounded hover:border-[#5865F2] hover:text-[#5865F2] hover:bg-white transition-all text-gray-400"
>
```

Change its `href` to a binding:

```html
<a
  :href="DISCORD_URL" target="_blank" rel="noopener noreferrer"
  class="p-2 bg-white/50 border border-gray-200 rounded hover:border-[#5865F2] hover:text-[#5865F2] hover:bg-white transition-all text-gray-400"
>
```

Leave the X (Twitter) anchor (`href="https://x.com/it_infra_meetup"`) unchanged.

- [ ] **Step 5: Type-check**

Run: `pnpm typecheck`
Expected: PASS. (`step.title` is now `TextSegment[]`; the `v-for` over it and `seg.href`/`seg.text` access type-check.)

- [ ] **Step 6: Lint**

Run: `pnpm lint`
Expected: PASS.

- [ ] **Step 7: Manual check**

Run: `pnpm dev`, open http://localhost:9010, find the "HOW TO JOIN" card. Expected:
- Five steps in order: Discordサーバーに参加 / VRChatに登録 / VRChatをダウンロード / VRChatグループに参加 / 開催時刻になったらGroup+インスタンスにJoin！
- The proper noun in each step (`Discord`, `VRChat`, `VRChat`, `VRChatグループ`, `Group+インスタンス`) is an underlined blue link that glows on hover and opens the correct page in a new tab:
  - Discord → discord.gg/7EtJz53ugA
  - VRChatに登録 → vrchat.com/home/register
  - VRChatをダウンロード → hello.vrchat.com
  - VRChatグループ → the group page
  - Group+インスタンス → the group `/instances` page
- Step 3 shows `対応: Windows / Linux / Android / iOS` beneath it.
- The "Group Page" and Discord buttons below still open the group and Discord respectively.
Stop the dev server when done.

- [ ] **Step 8: Commit**

```bash
git add apps/website/src/components/sections/HeroSection.vue
git commit -m "feat: link proper nouns in HOW TO JOIN steps"
```

---

## Done

All three tasks committed on branch `feat/faster-boot-and-join-step-links`. Open a PR to `main` (direct pushes are blocked by the pre-push hook).
