import { describe, test, expect } from 'vitest'
import { page } from 'vitest/browser'
import { renderComponent } from './harness'
import UIPagination from '@/components/ui/UIPagination.vue'
import LtCard from '@/components/lt/LtCard.vue'
import NextEventCard from '@/components/sections/NextEventCard.vue'

const IMAGE_PATH = '/lts/20251206.jpg'

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

describe('LtCard', () => {
  test('with image', async () => {
    await page.viewport(420, 600)
    await renderComponent(LtCard, {
      props: {
        date: '2026.05.30',
        title: 'Kubernetesでのネットワーク設計',
        author: 'alice',
        image: IMAGE_PATH,
      },
    })
    await expect.element(locate('.lt-card img')).toBeVisible()
    await expect(locate('.lt-card')).toMatchScreenshot('ltcard-with-image')
  })

  test('without image (placeholder)', async () => {
    await page.viewport(420, 600)
    await renderComponent(LtCard, {
      props: {
        date: '2026.05.23',
        title: '自宅ラックの冷却最適化',
        author: 'bob',
      },
    })
    await expect(locate('.lt-card')).toMatchScreenshot('ltcard-no-image')
  })
})

describe('NextEventCard', () => {
  test('populated event', async () => {
    await page.viewport(480, 400)
    await renderComponent(NextEventCard)
    await expect(locate('[data-testid="next-event-card"]')).toMatchScreenshot('next-event-populated')
  })

  test('no upcoming event', async () => {
    await page.viewport(480, 400)
    await renderComponent(NextEventCard, {}, { nextEvent: null })
    await expect(locate('[data-testid="next-event-card"]')).toMatchScreenshot('next-event-empty')
  })
})
