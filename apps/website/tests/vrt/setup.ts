import { beforeEach, vi } from 'vitest'
// Load the app's global styles the same way main.ts does, so themed components
// render with their real Tailwind utilities + CSS theme variables (e.g.
// --primary-color). Without these, themed elements render unstyled (e.g. the
// active pagination button would be white-on-transparent and invisible).
// vrt.css is imported LAST so its neutralization overrides win.
import '@/assets/tailwind.css'
import '@/assets/main.css'
import './vrt.css'

// Deterministic IP so HeroSection's CONNECTION_ID hash is stable and no
// network call is made. HeroSection imports fetchPublicIp from '@/clients/ipify'.
vi.mock('@/clients/ipify', () => ({
  fetchPublicIp: () => Promise.resolve('203.0.113.42'),
}))

// Seeded PRNG so Math.random-driven values are stable:
// uiStore.updateLatency, HeroSection.randomConnectionId, useScrollAnimations packet durations.
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

beforeEach(() => {
  Math.random = mulberry32(0x1f2e3d4c)
  document.body.classList.add('vrt')
})
