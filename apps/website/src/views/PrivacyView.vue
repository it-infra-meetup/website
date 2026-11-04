<template>
  <DataStreamBackground />

  <!-- Navigation -->
  <nav class="nav-bar">
    <RouterLink to="/" class="nav-link">
      <ArrowLeft class="w-4 h-4" />
      BACK TO TOP
    </RouterLink>
    <div class="font-mono text-xs text-primary">
      POLICY_MODE: READ_ONLY
    </div>
  </nav>

  <main class="privacy-main">
    <article class="privacy-container privacy-panel">
      <header class="mb-8">
        <h1 class="text-3xl md:text-4xl font-bold text-gray-800 mb-2 tracking-tighter">
          プライバシーポリシー
        </h1>
        <p class="text-gray-500 font-mono text-xs">
          制定日: {{ ESTABLISHED_AT }} / 改定日: {{ REVISED_AT }}
        </p>
      </header>

      <p>ITインフラ集会（以下「当コミュニティ」）は、本ウェブサイト（{{ SITE_URL }}、以下「本サイト」）における利用者情報の取り扱いについて、以下のとおり定めます。</p>

      <div class="policy-section">
        <h2>1. アクセス解析ツールについて</h2>
        <p>本サイトでは、利用状況を把握してサイトを改善するために、Google LLC が提供するアクセス解析ツール「Google アナリティクス」を利用しています。Google アナリティクスは Cookie などを使用してデータを収集します。このデータは匿名で収集されており、個人を特定するものではありません。</p>
        <p>なお、欧州経済領域、英国、スイスなど一部の国・地域からのアクセスでは、IP アドレスから判定した国に基づき、Google アナリティクスを読み込みません。</p>
        <h3>収集される主な情報</h3>
        <ul>
          <li>閲覧したページ、閲覧日時、滞在時間</li>
          <li>参照元（どのサイトやリンクから訪れたか）</li>
          <li>ブラウザ、OS、デバイスの種類、画面サイズ、言語設定</li>
          <li>IP アドレスから推定されるおおよその地域</li>
        </ul>
        <p>Google によるデータの取り扱いについては、<a :href="GOOGLE_PARTNER_SITES_URL" target="_blank" rel="noopener noreferrer">Google のサービスを使用するサイトやアプリから収集した情報の Google による使用</a>および<a :href="GOOGLE_PRIVACY_URL" target="_blank" rel="noopener noreferrer">Google プライバシーポリシー</a>をご確認ください。</p>
        <p>データの収集は、ブラウザの設定で Cookie を無効にするか、<a :href="GA_OPTOUT_URL" target="_blank" rel="noopener noreferrer">Google アナリティクス オプトアウト アドオン</a>を利用することで拒否できます。</p>
      </div>

      <div class="policy-section">
        <h2>2. その他の外部サービスへの通信</h2>
        <p>本サイトは、表示や機能のために次の外部サービスと通信します。</p>
        <ul>
          <li><strong>Google Fonts</strong>（Google LLC）: Web フォントの読み込み</li>
          <li><strong>ipify</strong>: トップページの演出で、閲覧者のグローバル IP アドレスを表示するための取得（取得した IP アドレスは閲覧者のブラウザ上でのみ使用し、当コミュニティは保存しません）</li>
          <li><strong>VRC技術学術ハブ（VRC TA Hub）API</strong>: イベント情報の取得</li>
        </ul>
        <p>これらの通信では、各サービスの提供元に IP アドレスやブラウザの情報などが送信されます。送信された情報は、各提供元のプライバシーポリシーに従って取り扱われます。</p>
      </div>

      <div class="policy-section">
        <h2>3. ポリシーの変更</h2>
        <p>当コミュニティは、必要に応じて本ポリシーを変更することがあります。変更後のポリシーは、本ページに掲載した時点から効力を生じるものとします。</p>
      </div>

      <div class="policy-section">
        <h2>4. お問い合わせ</h2>
        <p>本ポリシーに関するお問い合わせは、<a :href="DISCORD_URL" target="_blank" rel="noopener noreferrer">Discord</a>または<a :href="X_URL" target="_blank" rel="noopener noreferrer">X (@it_infra_meetup)</a>までご連絡ください。</p>
      </div>
    </article>
  </main>
</template>

<script setup lang="ts">
import {RouterLink} from 'vue-router'
import {ArrowLeft} from '@lucide/vue'
import DataStreamBackground from '@/components/layout/DataStreamBackground.vue'

const SITE_URL = 'https://it-infra-meetup.org/'
const ESTABLISHED_AT = '2026年11月2日'
const REVISED_AT = '2026年11月5日'
const GOOGLE_PARTNER_SITES_URL = 'https://policies.google.com/technologies/partner-sites?hl=ja'
const GOOGLE_PRIVACY_URL = 'https://policies.google.com/privacy?hl=ja'
const GA_OPTOUT_URL = 'https://tools.google.com/dlpage/gaoptout?hl=ja'
const DISCORD_URL = 'https://discord.gg/7EtJz53ugA'
const X_URL = 'https://x.com/it_infra_meetup'
</script>

<style scoped>
/* Navigation (LtListView と同じ見た目) */
.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  padding: 1rem 2rem;
  z-index: 50;
  display: flex;
  justify-content: space-between;
  align-items: center;
  pointer-events: auto;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.8), transparent);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-weight: bold;
  color: var(--text-color);
  text-decoration: none;
  transition: color 0.2s;
}

.nav-link:hover {
  color: var(--primary-color);
}

.text-primary {
  color: #ff9900;
}

.privacy-main {
  position: relative;
  z-index: 10;
  padding-top: 80px;
  padding-bottom: 40px;
  min-height: 100vh;
  pointer-events: none;
}

.privacy-container {
  pointer-events: auto;
  max-width: 800px;
  margin: 0 auto;
}

.privacy-panel {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-color);
  border-top: 4px solid var(--primary-color);
  border-radius: 8px;
  padding: 2.5rem 3rem;
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.1);
  font-family: 'Noto Sans JP', sans-serif;
  color: var(--text-color);
  line-height: 1.9;
  font-size: 0.95rem;
}

.policy-section {
  margin-top: 2.5rem;
}

.privacy-panel h2 {
  font-size: 1.15rem;
  font-weight: 700;
  padding-bottom: 0.4rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.privacy-panel h3 {
  font-size: 1rem;
  font-weight: 700;
  margin: 1.25rem 0 0.5rem;
}

.privacy-panel p + p {
  margin-top: 0.75rem;
}

.privacy-panel ul {
  list-style: disc;
  padding-left: 1.5rem;
  margin: 0.5rem 0 1rem;
}

.privacy-panel a {
  color: var(--primary-color);
  text-decoration: underline;
  text-underline-offset: 2px;
  overflow-wrap: anywhere;
}

/* Responsive */
@media (max-width: 900px) {
  .privacy-container {
    margin: 0 1rem;
  }

  .privacy-panel {
    padding: 1.75rem 1.25rem;
  }

  .nav-bar {
    padding: 1rem;
  }
}
</style>
