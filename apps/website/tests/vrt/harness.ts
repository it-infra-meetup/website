import { vi } from 'vitest'
import { render } from 'vitest-browser-vue'
import { createTestingPinia } from '@pinia/testing'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/all'
import router from '@/router'
import App from '@/App.vue'
import { nextEventFixture, recentLtsFixture } from './fixtures'

/** Pinia initial state shared by app and component mounts. Seeds the data the
 *  components display and flips ui.isLoading off so the LoadingScreen is skipped.
 *  With stubActions:true, eventsStore.loadNext/loadRecentLts become no-op spies,
 *  so the onMounted loaders never hit the network. */
function makePinia() {
  return createTestingPinia({
    stubActions: true,
    createSpy: vi.fn,
    initialState: {
      ui: { isLoading: false, isModalOpen: false, latency: 12 },
      events: {
        nextEvent: nextEventFixture,
        recentLts: recentLtsFixture,
        error: null,
        recentLtsError: null,
        loading: false,
        recentLtsLoading: false,
      },
    },
  })
}

/** Freeze JS-driven motion and wait for the page to settle, then it is safe to
 *  screenshot. CSS animations are already disabled by the Playwright provider
 *  and by vrt.css. */
export async function freezeAndSettle(): Promise<void> {
  gsap.globalTimeline.pause()
  ScrollTrigger.getAll().forEach((t) => t.kill())
  await document.fonts.ready
  // Let async onMounted work (ipify mock → connectionId) and layout settle.
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}

/** Mount the full app at the given route. */
export async function mountApp(path: string) {
  await router.push(path)
  await router.isReady()
  const screen = render(App, { global: { plugins: [makePinia(), router] } })
  await freezeAndSettle()
  return screen
}

/** Mount a single component in isolation (pinia + router available). */
export async function renderComponent(
  component: Parameters<typeof render>[0],
  options: Parameters<typeof render>[1] = {},
) {
  const screen = render(component, {
    global: { plugins: [makePinia(), router] },
    ...options,
  })
  await freezeAndSettle()
  return screen
}
