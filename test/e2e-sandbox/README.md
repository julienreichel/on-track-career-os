# E2E Sandbox Integration Tests

These tests run against a **live Amplify sandbox environment** and validate the complete backend integration including:

- **Auth flows**: User signup, post-confirmation Lambda triggers
- **GraphQL operations**: Mutations, queries with real authorization
- **Lambda functions**: AI operations, custom resolvers
- **AWS services**: Cognito, AppSync, Lambda integration

## Prerequisites

**Sandbox must be running:**

```bash
npx ampx sandbox --once
```

This creates a temporary AWS environment with all resources deployed.

**Auto-Confirmation Setup:**

The project includes a **Pre Sign-up Lambda trigger** (`amplify/auth/pre-signup/handler.ts`) that automatically:

- Confirms users (no verification code required)
- Verifies email addresses
- Enables immediate testing without manual verification

**Environment Protection**:

```typescript
const environment = env.AMPLIFY_ENVIRONMENT || 'production';
const isSandbox = environment === 'sandbox' || environment === 'dev';

if (isSandbox) {
  // Auto-confirm only in sandbox/dev
  event.response.autoConfirmUser = true;
  event.response.autoVerifyEmail = true;
} else {
  // Production: require normal email verification
}
```

This is **automatically enabled only in sandbox/dev environments**. Production requires normal email verification.

## Running Tests

```bash
# Run all sandbox tests
npm run test:sandbox

# Run specific test file
npm run test:sandbox -- auth/post-confirmation.spec.ts

# Watch mode
npm run test:sandbox -- --watch
```

## Test Strategy

### What to Test

- ✅ **Critical user flows** that span multiple AWS services
- ✅ **Lambda triggers** (post-confirmation, resolvers)
- ✅ **Authorization rules** (owner-based access, field-level security)
- ✅ **GraphQL schema** validation (input types, required fields)
- ✅ **AI operations** integration with real Lambda functions

### What NOT to Test

- ❌ Unit logic (covered by unit tests)
- ❌ UI components (covered by Nuxt tests)
- ❌ Utility functions (covered by amplify tests)

## Test Cleanup

**Important**: Always clean up test data to avoid polluting the sandbox:

```typescript
afterEach(async () => {
  // Delete test users
  // Delete test profiles
  // Clean up test data
});
```

**Known Issue**: User cleanup requires either:

1. Using unique emails per test run (e.g., `test-${Date.now()}@example.com`) ✅ Currently implemented
2. Using Cognito Admin API for cleanup (requires additional permissions)
3. Resetting sandbox between test runs: `npx ampx sandbox delete && npx ampx sandbox --once`

**Current Strategy**: Tests use timestamp-based unique emails to avoid conflicts.

## CI Integration

Sandbox tests are **optional in CI** due to:

- Require deployed environment
- Slower execution (~30s-2min per test)
- AWS resource consumption

Run manually or in nightly builds:

```bash
# Manual trigger
npm run test:sandbox

# CI: Only on specific branches or manual workflow dispatch
```

## Environment Configuration

Tests use `amplify_outputs.json` to connect to the sandbox:

- Auth: Cognito User Pool
- Data: AppSync GraphQL API
- Region: Auto-detected from outputs

No additional configuration needed if sandbox is running.
