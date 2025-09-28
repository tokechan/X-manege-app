# Contributing to X-manage-app

## Project Management

This project uses GitHub Issues and Milestones to track progress according to the implementation plan in `plan.md`.

### Milestones

- **M0 - Project Bootstrap** (1-2 days): Basic project setup and tooling
- **M1 - Authentication** (2-4 days): User auth with Better Auth
- **M2 - Connect X Account** (3-5 days): X OAuth integration
- **M3 - Analytics Ingestion** (4-7 days): X API data fetching and storage
- **M4 - Manage & View Posts** (3-6 days): UI for post management
- **M5 - Hardening & Observability** (2-4 days): Production readiness

### Issue Management

1. **Create Issues**: Use issue templates for consistency
2. **Assign Labels**: Use milestone labels (e.g., `milestone-m0`) and type labels
3. **Set Assignees**: Assign to team members with clear ownership
4. **Link to Milestones**: Associate issues with appropriate GitHub Milestones
5. **Track Progress**: Update issue status and check off tasks as completed

### Workflow

1. All work should be done in feature branches
2. Create Pull Requests for code review
3. Link PRs to related issues using keywords (e.g., "Closes #123")
4. Ensure CI passes before merging
5. Update `plan.md` checklist items as tasks are completed

### Development Setup

See `README.md` for development environment setup instructions.

### Testing

- **Unit Tests**: Use Vitest for business logic testing
- **E2E Tests**: Use Playwright for user journey testing
- **Coverage**: Maintain minimum coverage thresholds

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Configuration in `.eslintrc.js`
- **Formatting**: Prettier with project configuration
- **Commits**: Use conventional commit messages

## Getting Help

- Check existing issues and documentation first
- Create an issue with the appropriate template
- Tag relevant team members for review
