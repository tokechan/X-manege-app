# M0 Issues 作成スクリプト

## GitHub CLI 使用版

```bash
# GitHub CLIをインストール (macOS)
brew install gh

# GitHub認証
gh auth login

# M0 Milestone作成
gh api repos/:owner/:repo/milestones \
  --method POST \
  --field title="Milestone M0 - Project Bootstrap" \
  --field description="Basic project setup and tooling (1-2 days)" \
  --field due_on="2024-01-03T23:59:59Z"

# Issue 1: pnpm workspaces
gh issue create \
  --title "[M0] Initialize repo with pnpm and workspaces" \
  --body "Set up the basic monorepo structure with pnpm workspaces.

**Acceptance Criteria:**
- [ ] pnpm-workspace.yaml configured
- [ ] Root package.json with workspace scripts
- [ ] Apps and packages directories created
- [ ] Basic .gitignore in place

**Technical Notes:**
- Follow the structure defined in plan.md
- Ensure workspace scripts work across all packages" \
  --label "milestone-m0,setup,high-priority" \
  --milestone "Milestone M0 - Project Bootstrap"

# Issue 2: Next.js scaffold
gh issue create \
  --title "[M0] Scaffold apps/web (Next.js, TypeScript, App Router)" \
  --body "Create the Next.js frontend application with TypeScript and App Router.

**Acceptance Criteria:**
- [ ] Next.js 14+ with App Router configured
- [ ] TypeScript strict mode enabled
- [ ] Basic page structure created
- [ ] Development server runs successfully

**Technical Notes:**
- Use latest Next.js with App Router
- Configure for Cloudflare Pages deployment" \
  --label "milestone-m0,frontend,high-priority" \
  --milestone "Milestone M0 - Project Bootstrap"

# 他のIssueも同様に作成...
```

## 手動作成版

1. GitHub リポジトリの「Issues」タブで「New Issue」
2. 「Milestone M0 - Project Bootstrap」テンプレートを選択
3. 必要に応じて内容を調整
4. 「milestone-m0」ラベルを追加
5. 適切な担当者を設定
6. 「Submit new issue」をクリック
