/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** GA4 の測定 ID (例: `G-XXXXXXXXXX`)。未設定なら GA を読み込まない。 */
  readonly VITE_GA_MEASUREMENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
