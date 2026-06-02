import { describe, test, expect } from 'vitest'
import { page } from 'vitest/browser'
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
  // 保証する最小ディスプレイサイズ。#hero がこの高さに収まらず縦に伸びる
  // ケースの回帰を直接検証する。
  { name: 'mobile-min', w: 375, h: 800 },
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

const LTLIST_BLOCKS = [
  { sel: '.archive-header', name: 'header' },
  { sel: '.archive-grid', name: 'grid' },
  { sel: '.pagination', name: 'pagination' },
] as const

describe('LtListView blocks', () => {
  for (const vp of VIEWPORTS) {
    for (const block of LTLIST_BLOCKS) {
      test(`${block.name} @ ${vp.name}`, { timeout: 30000 }, async () => {
        await page.viewport(vp.w, vp.h)
        await mountApp('/lt-list')
        if (block.sel === '.archive-grid') {
          const imgs = Array.from(document.querySelectorAll('.archive-grid img'))
          const imgWait = Promise.all(
            imgs.map((img) => {
              const i = img as HTMLImageElement
              return i.complete ? Promise.resolve() : new Promise((r) => { i.onload = i.onerror = () => r(null) })
            }),
          )
          await Promise.race([imgWait, new Promise((r) => setTimeout(r, 5000))])
        }
        await expect(locate(block.sel)).toMatchScreenshot(`ltlist-${block.name}-${vp.name}`)
      })
    }
  }
})
