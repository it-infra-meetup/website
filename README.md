# it-infra-web-site-2

IT インフラ Web サイト — Vue 3 + TypeScript + Vite

## 技術スタック

- **フレームワーク:** Vue 3 (`<script setup>` SFC)
- **言語:** TypeScript
- **ビルドツール:** Vite 8
- **スタイル:** Tailwind CSS 4 + PostCSS + Autoprefixer
- **状態管理:** Pinia
- **ルーティング:** Vue Router 5
- **アニメーション:** GSAP
- **アイコン:** Lucide Vue

## 前提条件

- Node.js 24.11+（`^22.18.0 || >=24.11.0`）
- pnpm 10.20+

> `.mise.toml` で Node / pnpm のバージョンが定義されています。

## セットアップ

```bash
# リポジトリをクローン
git clone <repository-url>
cd it-infra-web-site-2

# mise でツールチェーンをインストール（初回のみ）
mise install

# 依存パッケージをインストール
pnpm install
```

## 開発

```bash
# 開発サーバーを起動 (http://localhost:9010)
pnpm dev

# 型チェック + プロダクションビルド
pnpm build

# ビルド成果物をプレビュー
pnpm preview
```

## ディレクトリ構成

```
public/             # 公開画像・ロゴ・LT 画像
├── lts/            # LT 回ごとの画像
src/
├── assets/         # CSS（tailwind.css / main.css）
├── components/     # 共通コンポーネント
├── composables/    # Composition API ユーティリティ
├── consts/         # 定数定義
├── router/         # Vue Router 設定
├── stores/         # Pinia ストア
├── views/          # ページコンポーネント
├── App.vue         # ルートコンポーネント
└── main.ts         # エントリーポイント
```

## パスエイリアス

`@` → `src/` として利用可能（`vite.config.ts` で設定済み）。

```ts
import MyComponent from '@/components/MyComponent.vue'
```
