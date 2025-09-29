# Development Workflow Guide

## 🎯 **現在のワークフロー概要**

### ローカル開発

- **軽量 pre-commit**: 基本チェックのみ（開発を妨げない）
- **快適なコミット**: テスト失敗でブロックされない
- **迅速な反復**: アイデアをすぐに形にできる

### CI/CD（GitHub Actions）

- **本格的品質チェック**: 全テスト + Linting + Type Check
- **セキュリティ監査**: 脆弱性チェック
- **ビルド確認**: デプロイ可能性の検証

## 🚨 **重要：品質保証について**

### 現在の状況

```
ローカル: 軽量チェック ✅ → コミット成功
GitHub: 本格チェック ❌ → でもマージ可能 ⚠️
```

### 推奨設定（ブランチ保護）

```
ローカル: 軽量チェック ✅ → コミット成功
GitHub: 本格チェック ❌ → マージブロック 🛡️
```

## 📋 **開発者向けベストプラクティス**

### 1. **日常的な開発フロー**

```bash
# 機能ブランチで開発
git checkout -b feature/awesome-feature

# 開発・テスト（ローカルで確認）
npm test  # 個別に実行して確認

# コミット（軽量チェックのみ）
git add .
git commit -m "feat: add awesome feature"

# プッシュしてCI確認
git push origin feature/awesome-feature
```

### 2. **CI 失敗時の対応**

#### A. **Linting エラー**

```bash
# ローカルで確認・修正
cd apps/web
npm run lint

# 自動修正可能な場合
npm run lint -- --fix

# 修正後再コミット
git add .
git commit -m "fix: resolve linting issues"
git push
```

#### B. **TypeScript エラー**

```bash
# ローカルで確認
cd apps/web
npm run type-check

# エラー箇所を修正後
git add .
git commit -m "fix: resolve type errors"
git push
```

#### C. **テスト失敗**

```bash
# ローカルでテスト実行
cd apps/web
npm test

# 失敗したテストを修正
# または新機能に対応したテストを更新

git add .
git commit -m "fix: update tests for new feature"
git push
```

### 3. **緊急時の対応**

#### Hotfix の場合

```bash
# mainから直接hotfixブランチ作成
git checkout main
git checkout -b hotfix/critical-fix

# 最小限の修正
# ...

# 通常通りプルリクエスト
git push origin hotfix/critical-fix
```

#### 本当の緊急時

- 管理者権限でブランチ保護を一時的にバイパス
- **必ず後で修正コミットを追加**

## 🎨 **開発効率を保つコツ**

### 1. **ローカルでの事前チェック**

```bash
# プッシュ前に軽く確認
./scripts/test-workflow.sh precommit

# 特定の問題だけチェック
cd apps/web && npm run lint
cd apps/web && npm test
```

### 2. **段階的なコミット**

```bash
# 機能実装
git commit -m "feat: implement core functionality"

# テスト追加
git commit -m "test: add comprehensive tests"

# Lint修正
git commit -m "style: fix linting issues"
```

### 3. **プルリクエストのベストプラクティス**

- **小さく分割**: 大きな変更は複数の PR に分ける
- **説明的なタイトル**: 変更内容が分かりやすい
- **テスト戦略**: 新機能のテスト方法を説明

## 🔄 **チーム協業**

### コードレビューのポイント

- **機能的な観点**: 要件を満たしているか
- **設計の観点**: 拡張性・保守性
- **品質の観点**: CI でカバーできない部分

### コミュニケーション

- **CI 失敗時**: Slack やコメントで状況共有
- **ブロック解除**: レビュアーへの明確な説明
- **学習機会**: 失敗から学んだことをチームで共有

## 📊 **メリット・デメリット**

### ✅ **メリット**

- **開発速度**: ローカルでの躓きが大幅減少
- **品質保証**: CI 環境での本格チェック
- **チーム効率**: 並列開発がスムーズ
- **学習効果**: CI 結果から改善点を学習

### ⚠️ **注意点**

- **CI 依存**: 品質チェックが CI 頼み
- **修正コスト**: CI 失敗後の修正が必要
- **ブランチ保護**: 設定しないとマージリスク

## 🎯 **成功の鍵**

1. **ブランチ保護ルール** の適切な設定
2. **チーム全体** でのワークフロー理解
3. **継続的改善** で CI 設定を最適化
4. **コミュニケーション** でブロックを最小化
