import { test as setup } from '@playwright/test';

/**
 * Authentication setup for E2E tests
 *
 * This file handles login before running tests. The authenticated state
 * is saved and reused across all tests to avoid repeated logins.
 */

const authFile = 'test-results/.auth/user.json';

const TEST_USER = {
  email: 'test@example.com',
  password: 'ThisIsAPassword1234*',
};

setup('authenticate', async ({ page }) => {
  // Navigate to the app (will redirect to login if not authenticated)
  await page.goto('/');

  // Wait for Amplify UI login form to load
  // Check for email input field (Amplify Authenticator uses specific selectors)
  const emailInput = page.locator('input[name="username"], input[type="email"]').first();
  await emailInput.waitFor({ state: 'visible', timeout: 10000 });

  // Fill in credentials
  await emailInput.fill(TEST_USER.email);

  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  await passwordInput.fill(TEST_USER.password);

  // Click sign in button - wait for it to be ready
  const signInButton = page
    .locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Sign In")')
    .first();
  await signInButton.waitFor({ state: 'visible', timeout: 5000 });

  // Wait a moment for any validation to complete
  const SHORT_DELAY_MS = 500;
  await page.waitForTimeout(SHORT_DELAY_MS);

  await signInButton.click();

  // Wait for successful authentication
  // After login, we should be redirected away from the login page
  // Wait for navigation to complete or for authenticated content to appear
  await page.waitForURL(/^(?!.*sign-in).*$/, { timeout: 15000 });

  // Verify we're authenticated by checking for authenticated content
  // (adjust this based on your app's structure after login)
  const AUTH_SETTLE_DELAY_MS = 2000;
  await page.waitForTimeout(AUTH_SETTLE_DELAY_MS); // Give time for auth state to settle

  // Save signed-in state to reuse in all tests
  await page.context().storageState({ path: authFile });

  console.log('✓ Authentication successful - state saved');
});
