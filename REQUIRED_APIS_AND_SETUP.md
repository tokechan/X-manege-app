# 必要な API 設定とセットアップ

## 開発環境で必要なエラー修正

### 1. Cloudflare Workers エラー修正

現在の問題：

- `RateLimiter` Durable Object が`index-simple.ts`でエクスポートされていない
- `pnpm`の署名検証エラー

### 2. フロントエンド開発サーバーエラー

- `pnpm`の署名検証エラー（corepack の問題）

## 本番環境で必要な API 設定

### Google 認証（OAuth）

**必要な環境変数：**

```bash
# Google Cloud Console で取得
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# NextAuth用
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your_random_secret_string
```

**設定手順：**

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクト作成
2. APIs & Services → Credentials で OAuth 2.0 Client ID を作成
3. 承認済みリダイレクト URI を設定：
   - 開発: `http://localhost:3000/api/auth/callback/google`
   - 本番: `https://your-domain.com/api/auth/callback/google`

### X (Twitter) API

**必要な環境変数：**

```bash
# X Developer Portal で取得
X_API_KEY=your_x_api_key
X_API_SECRET=your_x_api_secret
X_BEARER_TOKEN=your_x_bearer_token
X_ACCESS_TOKEN=your_x_access_token
X_ACCESS_TOKEN_SECRET=your_x_access_token_secret
```

**設定手順：**

1. [X Developer Portal](https://developer.twitter.com/) でアプリ作成
2. API Keys & Tokens で認証情報を生成
3. App permissions を "Read and write" に設定

### データベース（Turso/LibSQL）

**必要な環境変数：**

```bash
DATABASE_URL=libsql://your-database-url.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token
```

**設定手順：**

1. [Turso](https://turso.tech/) でアカウント作成
2. データベースを作成
3. Auth token を生成

### メール送信（Email Provider）

**必要な環境変数：**

```bash
# SMTPサーバー設定（例：Gmail, SendGrid, Resend）
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_email@gmail.com
EMAIL_SERVER_PASSWORD=your_app_password
EMAIL_FROM=noreply@your-domain.com

# または Resend を使用
RESEND_API_KEY=your_resend_api_key
```

### Cloudflare Workers 設定

**必要なバインディング：**

```toml
# wrangler.toml で設定
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"

[[r2_buckets]]
binding = "BACKUP_BUCKET"
bucket_name = "your-backup-bucket"

[[analytics_engine_datasets]]
binding = "ANALYTICS"
```

## セットアップの優先順位

### 即座に必要（開発継続のため）

1. **pnpm エラー修正** - `npm`を使用するか pnpm バージョン更新
2. **RateLimiter 修正** - Durable Object エクスポート問題
3. **簡単な API 動作確認**

### 短期（認証機能のため）

1. **Google OAuth 設定**
2. **NextAuth 設定**
3. **データベース接続**

### 中期（X 連携機能のため）

1. **X API 設定**
2. **メール送信設定**
3. **Cloudflare バインディング設定**

## 開発環境での暫定対応

### 1. pnpm エラー回避

```bash
# npmを使用
npm install
npm run dev

# またはpnpmバージョン更新
npm install -g pnpm@latest
```

### 2. API 開発サーバー修正

現在は`index-simple.ts`を使用しているため、Durable Object エラーは無視可能

### 3. モック認証

開発中はモック認証を使用して機能開発を継続可能

## セキュリティ考慮事項

1. **環境変数の管理**

   - `.env.local`は Git にコミットしない
   - 本番では 1Password やその他のシークレット管理ツールを使用

2. **CORS 設定**

   - 本番ドメインのみ許可
   - 開発環境とは別設定

3. **認証トークン**

   - 適切な有効期限設定
   - リフレッシュトークンの実装

4. **レート制限**
   - X API 制限の遵守
   - 適切なバックオフ戦略


