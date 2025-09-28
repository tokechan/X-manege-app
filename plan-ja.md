# X-manage-app — 実装計画（日本語版）

`README.md` の要件とスタックに沿った、現実的で反復可能な実装計画です。各マイルストーンは単独で出荷可能（shippable）で、チェック可能なタスク、受け入れ基準、未決事項を含みます。

## 指針（Guiding Principles）

- 小さく作って小さく出す。反復しやすい粒度に刻む。
- エッジ環境（Cloudflare）に親和的、型安全（TypeScript ＋ Drizzle）を優先。
- 早期に観測可能性（Sentry）を導入し、コアフローにテスト（Unit/E2E）を付与。

## 成功基準（Success Criteria）

- ユーザー名/パスワードなしの認証（Google OAuth／メールマジックリンク）。
- ユーザーが自身の X アカウントを接続できる。
- X API からポスト分析データを取得し、Postgres に保存できる。
- UI でポストと主要メトリクスを参照・基本フィルタ可能。
- CI/CD が Lint/型チェック/テストを通し、main へマージで自動デプロイ。

---

## アーキテクチャ（高レベル）

- フロントエンド: Next.js（App Router）+ React, Tailwind CSS v4, shadcn/ui
- バックエンド API: Hono（Cloudflare Workers）
- データベース: Postgres（マネージド: Neon/Supabase など）、ORM: Drizzle
- ジョブ/スケジューリング: Cloudflare Cron Triggers → Hono のジョブルート
- 観測: Sentry（フロント/バック）
- ホスティング: Cloudflare Pages（web）＋ Cloudflare Workers（api）
- CI/CD: GitHub Actions + pnpm

推奨リポジトリ構成（pnpm ワークスペースのモノレポ例）:

```
.
├─ apps/
│  ├─ web/            # Next.js フロントエンド
│  └─ api/            # Hono（Workers）バックエンド
├─ packages/
│  └─ ui/             # 共有 UI/テーマ（必要なら）
├─ drizzle/           # スキーマとマイグレーション
├─ .github/workflows/ # CI/CD
└─ plan.md
```

---

## データモデル（初版）

- users: アプリ内ユーザー
- accounts: OAuth プロバイダ（Google/Email）とユーザーの紐付け
- sessions: セッション（採用する認証ライブラリに応じて）
- x_accounts: 接続された X アカウント（ユーザー単位）
- x_tokens: X のアクセストークン/リフレッシュトークン
- x_posts: 管理/追跡対象のポスト
- x_post_metrics: メトリクスの時系列（impressions, likes, reposts, replies, bookmarks, profile_clicks, link_clicks）
- x_sync_jobs: 同期ジョブの履歴

原則: 書き込みモデルは狭く、メトリクスは追記型で履歴を保持。

---

## マイルストーン M0 — プロジェクト初期化（1–2 日）

タスク

- [ ] pnpm とワークスペースでリポジトリ初期化
- [ ] `apps/web`（Next.js, TypeScript, App Router）をスキャフォールド
- [ ] Tailwind v4 と shadcn/ui を設定（ベース UI 導入）
- [ ] `apps/api`（Hono on Cloudflare Workers）をスキャフォールド
- [ ] Drizzle ORM を導入し、Postgres 接続（Neon/Supabase）を設定
- [ ] ESLint 9 を設定（TypeScript ルール）
- [ ] Sentry SDK を導入（DSN はシークレットで注入）
- [ ] GitHub Actions（lint, type-check, build）を追加

受け入れ基準

- [ ] `pnpm i && pnpm -w build` が通る
- [ ] ルート `/` が TRON トーンの最小 UI で描画される
- [ ] API のヘルスエンドポイントが Workers で応答

---

## マイルストーン M1 — 認証（2–4 日）

アプローチ

- `apps/web` で Auth.js（NextAuth）を採用し、Google OAuth／メールリンクを構成。
- users/accounts/sessions を Drizzle + Postgres に永続化。

タスク

- [ ] Google OAuth（Client ID/Secret）を設定
- [ ] メールマジックリンク（プロバイダ or SMTP）を設定
- [ ] Drizzle スキーマ作成: users, accounts, sessions
- [ ] アプリルートを保護し、サインイン/アウト UI を実装
- [ ] E2E: サインインフロー（Playwright）

受け入れ基準

- [ ] パスワードなしで Google（またはメール）認証が成功
- [ ] ユーザー行が保存され、リロード後もセッション再検証

---

## マイルストーン M2 — X アカウント接続（3–5 日）

アプローチ

- `apps/api` で X の OAuth 2.0（スコープにより 1.0a の検討も）を実装。
- `x_tokens` にトークンを安全に保存（DB 側の暗号化または KMS 等）。

タスク

- [ ] X API キーを取得し、CI/Workers シークレットに設定
- [ ] 接続/切断エンドポイントを Hono で実装
- [ ] UI に「X を接続」ボタンと接続ハンドル表示を追加
- [ ] `x_accounts` と `x_tokens` を保存（リフレッシュ/有効期限管理）
- [ ] E2E: 接続してステータスが見える

受け入れ基準

- [ ] サインイン済ユーザーが X アカウントを接続/切断できる
- [ ] 有効期限切れ時に自動リフレッシュが機能

---

## マイルストーン M3 — 分析データの取り込み（4–7 日）

アプローチ

- X API v2 からポストとメトリクスを取得。
- `x_posts` に正規化したポストを保存、`x_post_metrics` にスナップショットを追記。
- Cloudflare Cron Triggers から Hono のジョブルートを定期実行。

タスク

- [ ] Drizzle スキーマ定義: x_posts, x_post_metrics, x_sync_jobs
- [ ] `syncPosts` ジョブ実装（手動トリガー + cron）
- [ ] 初回接続で過去 30–90 日分をバックフィル
- [ ] Unit: マッピング/Upsert/メトリクス統合のテスト
- [ ] レート制限/リトライ（ジッター付き）

受け入れ基準

- [ ] 初回同期でポスト＋メトリクスが保存される
- [ ] 差分同期が重複なく追記される

---

## マイルストーン M4 — ポストの管理と閲覧（3–6 日）

アプローチ

- 最小で高速な UI。リスト/フィルタ/詳細で主要メトリクスを把握。
- ストレッチ: 後続でドラフト作成/投稿機能を検討。

タスク

- [ ] ポスト一覧（主要メトリクス列を表示）
- [ ] フィルタ（期間/種類/閾値: 最低インプレッション等）
- [ ] 詳細ドロワー/ページ（メトリクスのタイムライン、原データ表示）
- [ ] shadcn/ui を TRON トーンでテーマ
- [ ] E2E: 一覧 → フィルタ → 詳細の一連操作

受け入れ基準

- [ ] ユーザーが自身のポストと主要メトリクスを安定して閲覧可能
- [ ] フィルタと詳細表示が十分に高速

---

## マイルストーン M5 — 強化（運用/監視/CI）（2–4 日）

タスク

- [ ] Sentry: トレース＋エラーバウンダリ（web）、ミドルウェア（api）
- [ ] GitHub Actions: テストマトリクス（Unit+E2E）、プレビュー配信
- [ ] シークレット運用のドキュメント化、トークンローテーション
- [ ] 429/5xx の指数バックオフと健全な再試行
- [ ] Workers の構造化ログ/アクセスログ
- [ ] `README.md` にランブック/運用手順を追記

受け入れ基準

- [ ] CI が Lint/型/テストでマージをガード
- [ ] Sentry のトレース/エラーが有用に可視化

---

## テスト戦略

- Unit: 取り込み/マッピング/リデューサ等のビジネスロジック（Vitest）
- Integration: API ハンドラ（インメモリ/モック Postgres, X API は MSW）
- E2E: 認証 →X 接続 → 初回同期 → 閲覧のコアジャーニー（Playwright）

---

## デプロイ戦略

- 環境: `preview`（PR 毎）, `staging`, `production`
- `apps/web`: Cloudflare Pages（必要に応じて Functions）
- `apps/api`: Cloudflare Workers（専用ルートと cron）
- Postgres: マネージド（Neon/Supabase）＋ Drizzle でマイグレーション

---

## 未決事項（要判断）

- 1 ユーザーあたり複数の X アカウントを許可するか？
- 取得・可視化するメトリクスの確定（impressions, likes, reposts, replies, bookmarks, link/profile clicks 等）
- バックフィル期間（30/60/90 日）と同期頻度（毎時/毎日）の方針
- v1 でメール認証も必須か（Google のみで十分か）
- データ保持/削除ポリシー、エクスポート要件
- データ所在/リージョン要件

---

## Done の定義（DoD）

- すべてのマイルストーン受け入れ基準を満たす
- リリース後 7 日間、Sentry のクリティカルエラーが発生しない
- E2E グリーン、主要ビューの P95 < 500ms
- ドキュメント（README, ランブック）更新済み

---

## この計画の使い方

- 各マイルストーンを GitHub Milestone とし、タスクを Issue に分解。
- 本ファイルのチェックボックスを進捗の単一情報源として更新。
