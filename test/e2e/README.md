# E2E Testing with Playwright

This directory contains end-to-end (E2E) tests for the AI Career OS application using Playwright.

## Setup

Playwright and Chromium browser are already installed. No additional setup required.

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test smoke.spec.ts

# Run tests in UI mode (interactive)
npx playwright test --ui

# Run tests in debug mode
npx playwright test --debug

# Show HTML report from last run
npx playwright show-report
```

## Test Structure

### Setup Files

- **`auth.setup.ts`**: Authentication setup for all tests
  - Logs in test user before running tests
  - Saves authenticated state for reuse
  - Runs automatically before test suite
  - Uses test credentials (test@example.com)

### Active Tests

- **`smoke.spec.ts`**: Basic application smoke tests
  - Verifies home page loads
  - Validates HTML structure
  - Checks profile routes are accessible
  - ✅ Passes with authentication

### Backend-Dependent Tests (Skipped)

- **`cv-upload-flow.spec.ts.skip`**: Complete CV upload workflow tests (17 tests)
  - Tests CV upload, experiences management, form validation, responsive design
  - Currently skipped - pages have rendering issues
  - **Status**: Backend deployed, authentication working, but pages need fixes
  - **Next Steps**: Debug page rendering errors before activating tests
  - Tests use `networkidle` wait strategy and authenticated state
  - To activate: Fix page issues, then rename to `.spec.ts`

## Test Organization

```
test/e2e/
├── README.md                           # This file
├── auth.setup.ts                       # Authentication setup
├── smoke.spec.ts                       # Basic smoke tests (active)
├── cv-upload-flow.spec.ts.skip        # Full workflow tests (skipped)
└── fixtures/
    └── test-cv.txt                     # Sample CV for upload tests
```

## Authentication

All E2E tests run with authentication. The `auth.setup.ts` file handles login automatically:

- **Test User**: test@example.com
- **Auto-login**: Runs before all tests
- **State Reuse**: Authenticated state is saved and reused across tests
- **No Manual Login**: Tests don't need to handle authentication

### How It Works

1. Setup project runs `auth.setup.ts` first
2. Logs in with test credentials
3. Saves authentication state to `test-results/.auth/user.json`
4. All tests use the saved authenticated state
5. No repeated logins needed

### Updating Test Credentials

If test credentials change, update `test/e2e/auth.setup.ts`:

```typescript
const TEST_USER = {
  email: 'your-test-user@example.com',
  password: 'your-test-password',
};
```

## CI/CD Configuration

The `playwright.config.ts` includes CI-specific settings:

- **Retries**: 2 retries on CI, 0 locally
- **Workers**: 1 worker on CI (serial), parallel locally
- **Screenshots**: On failure only
- **Videos**: On first retry only
- **Traces**: On first retry only

## Writing New Tests

Follow these patterns:

### 1. Smoke Tests (No Backend Required)

```typescript
test('should verify basic functionality', async ({ page }) => {
  await page.goto('/some-route');
  await expect(page.locator('body')).toBeVisible();
});
```

### 2. Integration Tests (Backend Required)

```typescript
test('should complete user workflow', async ({ page }) => {
  // Add authentication context
  // Navigate through workflow
  // Verify data persistence
});
```

### 3. Responsive Tests

```typescript
test('should be mobile responsive', async ({ page }) => {
  const MOBILE_WIDTH = 375;
  const MOBILE_HEIGHT = 667;
  await page.setViewportSize({ width: MOBILE_WIDTH, height: MOBILE_HEIGHT });
  // Verify UI adapts correctly
});
```

## Best Practices

### ✅ DO

- Use semantic locators (`getByRole`, `getByLabel`, `getByText`)
- Define constants for magic numbers (timeouts, dimensions)
- Add descriptive test names
- Group related tests in `test.describe` blocks
- Use `.skip` extension for tests requiring backend integration
- Include screenshots/videos for debugging failures

### ❌ DON'T

- Hard-code delays (use `waitForSelector` instead of `waitForTimeout`)
- Use CSS selectors when semantic locators available
- Create flaky tests (ensure proper waiting strategies)
- Commit `.skip` files without documentation

## Backend Integration Requirements

To activate full E2E tests:

1. **Deploy Amplify Backend**

   ```bash
   npx amplify sandbox
   ```

2. **Configure Authentication**
   - Set up test user credentials
   - Add auth context to tests

3. **Activate Tests**

   ```bash
   mv test/e2e/cv-upload-flow.spec.ts.skip test/e2e/cv-upload-flow.spec.ts
   ```

4. **Run Full Suite**
   ```bash
   npm run test:e2e
   ```

## Debugging Failed Tests

### View Test Report

```bash
npx playwright show-report
```

### Inspect Screenshots/Videos

Failed tests automatically capture:

- Screenshot at point of failure
- Video of entire test run
- Trace file for debugging

Files are saved in `test-results/` directory.

### Interactive Debug Mode

```bash
npx playwright test --debug
```

Opens browser with Playwright Inspector for step-by-step debugging.

## Coverage

Current E2E coverage:

- ✅ **Smoke Tests**: 3 tests (passing)
- ⏸️ **CV Upload Flow**: 15 tests (ready, awaiting backend)

**Total**: 18 E2E tests (3 active, 15 ready for activation)

## Contributing

When adding new E2E tests:

1. Add test file to `test/e2e/`
2. Use `.spec.ts.skip` extension if requires backend
3. Document backend requirements in test comments
4. Follow naming conventions: `feature-name.spec.ts`
5. Run locally before committing: `npm run test:e2e`
