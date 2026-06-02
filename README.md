# it-infra-web-site

**ITインフラ集会** の Web サイト。VRChat 上で技術交流 / LT / 機材談義などのイベントを行う
コミュニティのランディングサイト。

公開 API([VRC TA Hub API](https://vrc-ta-hub.com/api/v1/))からイベント情報をライブ取得します。

## リポジトリ構成

pnpm workspace のモノレポ(`pnpm-workspace.yaml` → `apps/*`, `packages/*`)です。

| パッケージ                   | 名前                 | 概要                                                                                                                         |
| ---------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `apps/website`               | `website`            | サイト本体。Vue 3 + TypeScript + Vite                                                                                        |
| `packages/vrc-ta-hub-client` | `@vrc-ta-hub/client` | VRC TA Hub 読み取り API の内製クライアント(Zod v4 スキーマ + `Result` 型エラーハンドリング)。サイトから `workspace:*` で参照 |

## 技術スタック

- **フレームワーク:** Vue 3 (`<script setup>` SFC)
- **言語:** TypeScript
- **ビルドツール:** Vite 8
- **スタイル:** Tailwind CSS 4 + PostCSS + Autoprefixer
- **状態管理:** Pinia
- **ルーティング:** Vue Router 5
- **アニメーション:** GSAP(`ScrollTrigger`, `MotionPathPlugin`)
- **アイコン:** `@lucide/vue`
- **テスト:** Vitest (Unit, VRT)
- **バリデーション:** Zod v4(API クライアント)

## 前提条件

ツールのバージョンは [`mise.toml`](./mise.toml) に定義されています。

- Node.js 24
- pnpm 11
- lefthook / actionlint / zizmor / pinact

## セットアップ

初回は **順番どおりに** 両方を実行してください

```bash
# リポジトリをクローン
git clone <repository-url>
cd website

# ツールチェーンをインストール(Node / pnpm / リントツール)
mise install

# 依存パッケージをインストール
pnpm install
```

## コマンド

特記がない限りリポジトリのルートで実行します。

| タスク                                                | コマンド                      |
| ----------------------------------------------------- | ----------------------------- |
| 開発サーバー(→ http://localhost:9010、ポート固定)     | `pnpm dev`                    |
| 全体をビルド(packages → apps の順)                    | `pnpm build`                  |
| サイトのみビルド                                      | `pnpm build:website`          |
| Lint(全ワークスペース + ルートの `*.config.*`)        | `pnpm lint` / `pnpm lint:fix` |
| 型チェック(サイトは `vue-tsc -b`、パッケージは `tsc`) | `pnpm typecheck`              |
| テスト(Vitest、`packages/*` のみ)                     | `pnpm test`                   |
| API フィクスチャをライブ API から更新                 | `pnpm fixtures:refresh`       |
| Visual Regression Test のスナップショット更新         | `pnpm vrt:update`             |

特定のワークスペースだけを対象にする場合:

```bash
pnpm --filter @vrc-ta-hub/client test   # クライアントの単体テスト
pnpm --filter website dev               # `pnpm dev` と同等
```

## ディレクトリ構成

```
apps/website/
├── public/             # 公開画像・ロゴ・LT 画像
│   └── lts/            # LT 回ごとの画像
└── src/
    ├── assets/         # CSS(tailwind.css / main.css)
    ├── clients/        # API クライアントのラッパー
    ├── components/     # UI コンポーネント(sections / layout / terminal / circuit / ui / lt)
    ├── composables/    # Composition API ユーティリティ
    ├── consts/         # 定数定義(LT 履歴・画像パスなど)
    ├── router/         # Vue Router 設定
    ├── stores/         # Pinia ストア
    ├── views/          # ページコンポーネント(HomeView / LtListView)
    ├── App.vue         # ルートコンポーネント
    └── main.ts         # エントリーポイント

packages/vrc-ta-hub-client/
├── src/                # client / schemas / result / errors
└── tests/              # コミット済み JSON フィクスチャに対してオフラインで実行
```

## パスエイリアス

`@` → `apps/website/src/` として利用可能(`vite.config.ts` と `tsconfig` の双方で設定済み)。

```ts
import MyComponent from "@/components/MyComponent.vue";
```

## デプロイ

`main` へのマージで semantic-release が走り、サイトをビルドして S3
へ同期・CloudFront のキャッシュを無効化します。

## ライセンス

- **ソースコード:** [MIT License](./LICENSE)。
- **アセット（ロゴ・画像・LT スライド画像など、`apps/website/public/` 配下のファイル）:**
  各オリジナル作者に著作権が帰属します（All Rights Reserved）。許可なく複製・再配布・再利用はできません。
