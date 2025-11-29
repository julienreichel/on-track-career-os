# Testing Strategy

This project follows [Nuxt's testing best practices](https://nuxt.com/docs/getting-started/testing) with separate unit and integration tests.

## Test Structure

```
test/
├── unit/                    # Unit tests (business logic, services, composables)
│   ├── domain/             # Domain layer tests
│   ├── application/        # Application layer tests
│   └── vitest.config.ts    # Unit test configuration
└── integration/            # Integration tests (components, pages, flows)
    └── vitest.config.ts    # Integration test configuration
```

## Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Watch mode (all tests)
npm run test:watch

# UI mode
npm run test:ui

# Coverage report
npm run test:coverage
```

## Test Environment

- **Environment**: Nuxt environment with happy-dom
- **Framework**: Vitest with @nuxt/test-utils
- **Coverage**: v8 provider

## Writing Tests

### Unit Tests

Unit tests focus on isolated business logic without full Nuxt context:

- Domain models and services
- Repository patterns (with dependency injection)
- Composables (with mocked dependencies)
- Utility functions

**Example:**

```typescript
// test/unit/domain/user-profile/UserProfileService.spec.ts
import { describe, it, expect } from 'vitest';
import { UserProfileService } from '@/domain/user-profile/UserProfileService';

describe('UserProfileService', () => {
  it('should get full user profile', async () => {
    // Test implementation
  });
});
```

### Integration Tests

Integration tests verify component interactions and page flows with full Nuxt context:

- Component behavior
- Page routing and navigation
- State management across components
- API integration

**Example:**

```typescript
// test/integration/pages/login.spec.ts
import { describe, it, expect } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import LoginPage from '@/pages/login.vue';

describe('Login Page', () => {
  it('should render authenticator', async () => {
    const component = await mountSuspended(LoginPage);
    expect(component.html()).toContain('authenticator');
  });
});
```

## Coverage Goals

- **Target**: 80%+ coverage for all domain and application layers
- **Focus**: Business logic over UI components
- **Reports**: Located in `coverage/` (gitignored)

## Dependencies

- `vitest` - Test runner
- `@nuxt/test-utils` - Nuxt-specific test utilities
- `happy-dom` - Lightweight DOM implementation
- `@vitest/coverage-v8` - Coverage reporting
- `@vitest/ui` - UI for test debugging
