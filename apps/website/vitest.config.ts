import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { playwright } from '@vitest/browser-playwright'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['tests/vrt/**/*.vrt.test.ts'],
    setupFiles: ['./tests/vrt/setup.ts'],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: 'chromium' }],
      // Default viewport; individual tests call page.viewport() to switch.
      viewport: { width: 1280, height: 800 },
      expect: {
        toMatchScreenshot: {
          comparatorName: 'pixelmatch',
          comparatorOptions: {
            // Per-pixel colour tolerance; loosened for sub-pixel AA noise.
            threshold: 0.2,
            // Page snapshots are busy — allow a small fraction of differing pixels.
            allowedMismatchedPixelRatio: 0.02,
          },
        },
      },
    },
  },
})
