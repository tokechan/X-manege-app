# Testing Rules and Guidelines

## Testing Philosophy

- **Test behavior, not implementation**: Focus on what the code does, not how it does it
- **Write tests first**: Use TDD approach for new features
- **Comprehensive coverage**: Aim for 80%+ test coverage
- **Fast feedback**: Use watch mode during development

## Test Structure

```typescript
describe('ComponentName', () => {
  describe('when condition', () => {
    it('should behave in expected way', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

## Testing Commands

```bash
# Run all tests
pnpm test

# Run tests in watch mode (recommended during development)
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Run specific app tests
cd apps/web && npm test
cd apps/api && npm test

# Use workflow helper
./scripts/test-workflow.sh test watch
```

## React Component Testing

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Always mock external dependencies
jest.mock('@/lib/auth', () => ({
  useAuth: jest.fn(),
}));

// Use descriptive test names
it('displays error message when form validation fails', async () => {
  const user = userEvent.setup();
  render(<MyComponent />);

  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(screen.getByText(/error message/i)).toBeInTheDocument();
});
```

## API Testing

```typescript
import { describe, it, expect, vi } from 'vitest';

// Mock external services
vi.mock('@/lib/twitter-api', () => ({
  fetchTweets: vi.fn(),
}));

// Test error scenarios
it('handles API errors gracefully', async () => {
  const mockError = new Error('API Error');
  vi.mocked(fetchTweets).mockRejectedValue(mockError);

  const result = await myApiFunction();

  expect(result.error).toBe('Failed to fetch tweets');
});
```

## Test Requirements

- **New features**: Must include comprehensive tests
- **Bug fixes**: Must include regression tests
- **Components**: Test user interactions and edge cases
- **API routes**: Test success, error, and validation scenarios
- **Utilities**: Test all code paths and edge cases

## Mocking Guidelines

- Mock external APIs and services
- Mock file system operations
- Mock time-dependent functions
- Don't mock the code under test
- Keep mocks simple and focused

## Pre-commit Testing

All tests must pass before code can be committed:

- Pre-commit hook automatically runs tests
- Use `./scripts/test-workflow.sh precommit` to run checks manually
- Fix failing tests before attempting to commit

## Coverage Requirements

- Maintain minimum 80% code coverage
- Focus on critical business logic
- Don't test trivial getters/setters
- Exclude configuration files from coverage
