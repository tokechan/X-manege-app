# Cursor Rules Documentation

This directory contains modular Cursor rules for the X-manage-app project. Each file focuses on specific aspects of development to provide targeted guidance.

## Rule Files Overview

### 📋 `rules` - Main Configuration

The primary rules file containing:

- Project overview and tech stack
- Key development principles
- File structure guidelines
- Basic workflow instructions

### 🧪 `testing.md` - Testing Guidelines

Comprehensive testing standards including:

- Testing philosophy and approach
- Test structure and organization
- React and API testing patterns
- Coverage requirements and pre-commit testing

### 🔄 `git-workflow.md` - Git & Version Control

Git workflow and commit standards:

- Branch naming conventions
- Conventional commit format
- Pre-commit checks and automation
- Pull request guidelines

### 🎨 `code-style.md` - Code Standards

Code quality and style guidelines:

- TypeScript best practices
- React component patterns
- Naming conventions
- Import/export standards
- Performance optimization

### 🏗️ `architecture.md` - System Architecture

Technical architecture and patterns:

- System design overview
- API design patterns
- Database schema patterns
- State management strategies
- Performance and deployment

### 🔒 `security.md` - Security Guidelines

Security best practices and standards:

- Authentication and authorization
- Data encryption and protection
- Input validation and sanitization
- Security monitoring and incident response

## How to Use These Rules

### For Cursor IDE

Cursor automatically reads these rule files and uses them to provide context-aware assistance. The modular structure allows Cursor to:

1. **Understand project context** from the main `rules` file
2. **Provide testing guidance** when working on test files
3. **Suggest proper git workflows** during version control operations
4. **Enforce code standards** during development
5. **Consider security implications** when handling sensitive data

### For Development Team

Each file serves as:

- **Reference documentation** for specific development areas
- **Onboarding material** for new team members
- **Decision-making guide** for technical choices
- **Quality assurance checklist** during code reviews

## Quick Reference Commands

```bash
# Testing
pnpm test                    # Run all tests
pnpm test:watch             # Watch mode
./scripts/test-workflow.sh test coverage

# Git Workflow
./scripts/test-workflow.sh git new feature/name
./scripts/test-workflow.sh git commit "feat: message"
./scripts/test-workflow.sh precommit

# Quality Checks
pnpm lint                   # Code linting
pnpm type-check            # TypeScript validation
pnpm precommit             # All pre-commit checks
```

## Rule File Maintenance

### When to Update Rules

- Adding new technologies or patterns
- Changing development workflows
- Learning from security incidents
- Updating testing strategies
- Modifying deployment processes

### How to Update Rules

1. Edit the relevant rule file
2. Test changes with real development scenarios
3. Get team consensus on significant changes
4. Update related documentation and scripts
5. Communicate changes to the team

## Integration with Development Tools

### Cursor IDE Integration

- Rules are automatically loaded by Cursor
- Context-aware suggestions based on current file type
- Intelligent code completion following project patterns
- Automated refactoring suggestions

### Automation Integration

- Pre-commit hooks enforce testing and quality rules
- CI/CD pipelines validate architecture patterns
- Security scans check against security guidelines
- Performance monitoring validates optimization rules

## Best Practices for Rule Usage

### For Developers

1. **Read relevant rules** before starting new features
2. **Reference specific sections** when making technical decisions
3. **Follow established patterns** shown in examples
4. **Ask questions** if rules are unclear or conflicting

### For Code Reviews

1. **Check compliance** with established patterns
2. **Reference specific rule sections** in review comments
3. **Suggest improvements** based on guidelines
4. **Ensure security** requirements are met

### For Project Maintenance

1. **Keep rules up to date** with actual practices
2. **Remove outdated** guidelines and examples
3. **Add new patterns** as they emerge
4. **Maintain consistency** across all rule files

## Contributing to Rules

When contributing to these rules:

- Focus on practical, actionable guidance
- Include concrete examples
- Consider impact on development velocity
- Ensure consistency with existing patterns
- Test changes with real development scenarios

## Questions and Support

If you have questions about these rules or need clarification:

1. Check existing examples in the codebase
2. Review related documentation
3. Ask team members for guidance
4. Propose rule improvements through PRs

Remember: These rules are living documents that should evolve with the project and team needs.
