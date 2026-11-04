import { defineConfig, loadEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

const MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/

/**
 * Emits index.analytics.html: a copy of index.html that also names the GA4
 * measurement ID. The app only loads GA when it finds that meta tag, so
 * index.html stays GA-free. The CDN picks the page by viewer country.
 *
 * Always emit the file, even without an ID: the CDN routes requests to it, so a
 * missing object would return 403 to those viewers.
 */
function analyticsHtml(measurementId: string | undefined): Plugin {
  return {
    name: 'analytics-html',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      if (measurementId && !MEASUREMENT_ID_PATTERN.test(measurementId)) {
        this.error(`Invalid GA measurement ID: ${measurementId}`)
      }
      const html = bundle['index.html']
      if (html?.type !== 'asset') {
        this.error('index.html is missing from the bundle')
      }
      const meta = measurementId
        ? `<meta name="ga-measurement-id" content="${measurementId}">\n  `
        : ''
      this.emitFile({
        type: 'asset',
        fileName: 'index.analytics.html',
        source: Buffer.from(html.source).toString().replace('</head>', `${meta}</head>`),
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',
  plugins: [
    vue(),
    analyticsHtml(loadEnv(mode, process.cwd(), 'VITE_').VITE_GA_MEASUREMENT_ID),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server:{
    port:9010,
    strictPort:true
  }
}))
