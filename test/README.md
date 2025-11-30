# Testing Strategy

This project follows [Nuxt's testing best practices](https://nuxt.com/docs/getting-started/testing) using **Vitest projects** (workspace approach).

## Test Structure

```
test/
├── unit/                    # Unit tests - Node environment (fast!)
│   ├── domain/             # Domain layer (repositories, services)
│   ├── application/        # Application layer (composables)
│   └── data/               # Data layer (GraphQL utilities)
├── amplify/                # Amplify tests - Lambda functions (Node env)
│   ├── auth/               # Auth Lambda handlers
│   └── data/               # Data Lambda handlers (AI operations)
├── nuxt/                   # Nuxt tests - Nuxt runtime environment
│   └── layouts/            # Layout components with i18n, routing
└── e2e-sandbox/            # E2E tests against live Amplify sandbox
    ├── auth/               # Auth flows (signup, post-confirmation)
    ├── graphql/            # GraphQL operations (mutations, queries)
    └── ai-operations/      # AI Lambda integration tests
```

## Running Tests

```bash
# Run all tests (unit + nuxt projects)
npm test

# Run unit tests only (Node environment - fast)
npm run test:unit

# Run Amplify tests only (Lambda handlers - fast)
npm run test:amplify

# Run Nuxt tests only (Nuxt runtime environment)
npm run test:nuxt

# Run E2E sandbox tests (requires live Amplify sandbox)
npm run test:sandbox

# Watch mode (all tests)
npm run test:watch

# UI mode
npm run test:ui

# Coverage report
npm run test:coverage
```

## Test Environment

- **Configuration**: Single `vitest.config.ts` with Vitest projects
- **Unit tests**: Node environment (no Nuxt overhead, very fast)
- **Amplify tests**: Node environment for Lambda handlers
- **Nuxt tests**: Nuxt environment with happy-dom, i18n, auto-imports
- **E2E Sandbox tests**: Node environment with live AWS services
- **Framework**: Vitest 3.2.4 with @nuxt/test-utils
- **Coverage**: v8 provider with 80% threshold

## Writing Tests

### Unit Tests (Node Environment)

Unit tests focus on isolated business logic without full Nuxt context:

- Domain models and services
- Repository patterns (with dependency injection)
- Composables (with mocked dependencies)
- Utility functions
- GraphQL query builders

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

### Nuxt Tests (Nuxt Runtime Environment)

Nuxt tests verify components/features requiring Nuxt runtime:

- Layout components with i18n
- Components using Nuxt auto-imports
- Routing and navigation
- Plugin integration
- Full Nuxt context features

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

### E2E Sandbox Tests (Optional)

E2E sandbox tests validate complete backend integration against a live Amplify sandbox environment. See `test/e2e-sandbox/README.md` for details.

**Prerequisites**: `npx ampx sandbox --once` must be running

**Run**: `npm run test:sandbox`

**Note**: These tests are slower (~30s-2min) and optional in CI.

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
