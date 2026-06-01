import { describe, test, expect } from 'vitest'
import { page } from 'vitest/browser'
import { renderComponent } from './harness'
import UIPagination from '@/components/ui/UIPagination.vue'

function locate(selector: string) {
  const el = document.querySelector(selector)
  if (!el) throw new Error(`element not found: ${selector}`)
  return page.elementLocator(el)
}

describe('UIPagination', () => {
  test('first page', async () => {
    await page.viewport(1280, 800)
    await renderComponent(UIPagination, { props: { currentPage: 1, totalPages: 5 } })
    await expect(locate('.pagination')).toMatchScreenshot('uipagination-first')
  })

  test('middle page', async () => {
    await page.viewport(1280, 800)
    await renderComponent(UIPagination, { props: { currentPage: 3, totalPages: 5 } })
    await expect(locate('.pagination')).toMatchScreenshot('uipagination-middle')
  })

  test('last page', async () => {
    await page.viewport(1280, 800)
    await renderComponent(UIPagination, { props: { currentPage: 5, totalPages: 5 } })
    await expect(locate('.pagination')).toMatchScreenshot('uipagination-last')
  })
})
