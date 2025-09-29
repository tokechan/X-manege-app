# Git Workflow and Commit Guidelines

## Branch Strategy

We use a feature branch workflow with automated quality checks.

### Branch Naming Convention

- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `test/description` - Adding or updating tests
- `docs/description` - Documentation updates
- `chore/description` - Maintenance tasks

Examples:

- `feature/settings-page`
- `fix/auth-redirect-loop`
- `test/api-error-handling`

## Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

### Scopes

- `web` - Frontend changes
- `api` - Backend/API changes
- `auth` - Authentication related
- `ui` - UI components
- `db` - Database changes
- `config` - Configuration changes

### Examples

```
feat(web): add X account settings page with validation
fix(api): resolve rate limiting issue for Twitter API calls
test(web): add comprehensive tests for settings page
docs: update setup instructions for local development
refactor(auth): simplify user session management
chore(deps): update dependencies to latest versions
```

## Workflow Commands

Use the helper script for consistent workflow:

```bash
# Start new feature
./scripts/test-workflow.sh git new feature/my-feature

# Make your changes, then commit (runs all checks)
./scripts/test-workflow.sh git commit "feat(web): add new feature"

# Push branch
./scripts/test-workflow.sh git push

# Clean up after merge
./scripts/test-workflow.sh git cleanup
```

## Pre-commit Process

Before every commit, the following checks run automatically:

1. **ESLint** - Code linting and style checks
2. **TypeScript** - Type checking
3. **Tests** - Full test suite execution

If any check fails, the commit is rejected.

### Manual Pre-commit Check

```bash
# Run all pre-commit checks manually
./scripts/test-workflow.sh precommit

# Or use pnpm script
pnpm precommit
```

## Pull Request Guidelines

### Before Creating PR

- [ ] All tests pass locally
- [ ] Code is properly formatted
- [ ] Commit messages follow convention
- [ ] Branch is up to date with main
- [ ] Documentation is updated if needed

### PR Description Template

```markdown
## What

Brief description of changes

## Why

Explanation of why this change is needed

## How

Technical details of implementation

## Testing

- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] Edge cases considered

## Screenshots (if applicable)

[Add screenshots for UI changes]
```

## Code Review Process

1. **Automated Checks**: CI runs tests and quality checks
2. **Peer Review**: At least one team member reviews
3. **Manual Testing**: Test functionality in staging
4. **Merge**: Squash and merge after approval

## Merge Strategy

- Use "Squash and merge" for feature branches
- Keep commit history clean on main branch
- Delete feature branches after merge

## Hotfix Process

For urgent production fixes:

```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-issue

# Make minimal fix
# Run tests: pnpm test
# Commit: git commit -m "fix: critical issue description"

# Push and create PR
git push origin hotfix/critical-issue
```

## Branch Protection

Main branch is protected:

- Requires PR review
- Requires status checks to pass
- Requires branches to be up to date
- Restricts force pushes

## Common Git Commands

```bash
# Check current status
git status

# View commit history
git log --oneline

# Sync with remote
git fetch origin
git pull origin main

# Interactive rebase (clean up commits)
git rebase -i HEAD~3

# Undo last commit (keep changes)
git reset --soft HEAD~1

# View differences
git diff
git diff --staged
```

## Troubleshooting

- **Tests failing**: Run `pnpm test` to see specific failures
- **Type errors**: Run `pnpm type-check` to see TypeScript issues
- **Lint errors**: Run `pnpm lint` to see and auto-fix style issues
- **Merge conflicts**: Use VS Code's merge conflict resolver
- **Commit blocked**: Check pre-commit hook output for specific failures
