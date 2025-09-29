# GitHub Branch Protection Setup Guide

## ブランチ保護ルールの設定

GitHub リポジトリで以下の設定を行うことを強く推奨します：

### 1. Settings → Branches → Add rule

**Protected branch:** `main`

### 2. 必須設定項目

#### ✅ **Restrict pushes that create files**

- 直接 push を防ぐ

#### ✅ **Require a pull request before merging**

- プルリクエスト必須

#### ✅ **Require status checks to pass before merging**

- CI 通過必須
- **Required status checks:**
  - `Lint & Type Check`
  - `Run Tests`
  - `Build Check`
  - `Security Audit`

#### ✅ **Require branches to be up to date before merging**

- 最新状態必須

#### ✅ **Require conversation resolution before merging**

- レビューコメント解決必須

#### ✅ **Restrict pushes that create files**

- 管理者も含めてルール適用

### 3. 追加推奨設定

#### ✅ **Require review from CODEOWNERS**

- コードオーナーレビュー必須

#### ✅ **Dismiss stale reviews when new commits are pushed**

- 新しいコミット時に古いレビュー無効化

#### ✅ **Require signed commits**

- 署名付きコミット必須（セキュリティ向上）

## 設定後の効果

### ✅ **品質保証**

- CI が失敗したプルリクエストはマージ不可
- 全てのテストと Linting が通過必須

### ✅ **チーム協業**

- 必ずコードレビューが実行される
- 問題の早期発見・修正

### ✅ **安全性**

- main ブランチへの直接 push 防止
- 破壊的変更の防止

## ワークフロー例

```bash
# 1. 機能ブランチ作成
git checkout -b feature/new-feature

# 2. 開発・コミット（軽量pre-commitで快適）
git add .
git commit -m "feat: add new feature"

# 3. プッシュ
git push origin feature/new-feature

# 4. GitHub でプルリクエスト作成
# → CI が自動実行される

# 5. CI通過 + レビュー完了後のみマージ可能
```

## 緊急時の対応

### Hotfix 用の例外設定

```yaml
# .github/workflows/ci.yml に追加
on:
  push:
    branches: [main, dev, hotfix/*] # hotfixブランチも含める
```

### 管理者権限での緊急マージ

- GitHub 設定で「Allow administrators to bypass」を有効化
- 緊急時のみ使用し、後で修正コミットを追加
