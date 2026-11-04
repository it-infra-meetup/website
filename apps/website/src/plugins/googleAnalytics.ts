import type { Router } from 'vue-router'

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

/**
 * Google Analytics 4 (gtag.js) を読み込み、ルート遷移ごとに page_view を送信する。
 *
 * - HTML に `<meta name="ga-measurement-id">` があるときだけ有効になる。
 *   このタグは本番ビルドの `index.analytics.html` にのみ含まれ、CDN が閲覧者の国に応じて
 *   配信する HTML を選ぶ。`index.html` やローカル開発・PR ビルド・VRT では何も読み込まない。
 * - ハッシュ履歴 (`/#/lt-list`) のままだと GA4 のレポート上はすべて `/` に集約されるため、
 *   `page_location` には `origin + to.fullPath` (例: `https://example.org/lt-list`) を仮想 URL として送る。
 * - 自動 page_view と二重計測にならないよう、`send_page_view: false` を指定する。
 *   GA4 管理画面の拡張計測「ブラウザの履歴イベントに基づくページの変更」も無効にすること。
 */
export function setupGoogleAnalytics(router: Router): void {
  const measurementId = document.querySelector<HTMLMetaElement>('meta[name="ga-measurement-id"]')?.content
  if (!measurementId) return

  window.dataLayer = window.dataLayer || []
  // gtag.js は配列ではなく arguments オブジェクトそのものが push されることを前提にしている
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', measurementId, { send_page_view: false })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
  document.head.appendChild(script)

  let previousLocation: string | undefined = document.referrer || undefined
  router.afterEach((to, _from, failure) => {
    if (failure) return
    const pageLocation = `${window.location.origin}${to.fullPath}`
    window.gtag('event', 'page_view', {
      page_location: pageLocation,
      page_title: document.title,
      ...(previousLocation ? { page_referrer: previousLocation } : {}),
    })
    previousLocation = pageLocation
  })
}
