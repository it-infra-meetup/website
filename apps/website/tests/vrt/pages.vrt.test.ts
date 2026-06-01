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
