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

  // Click sign in button - Amplify uses [data-amplify-button] attribute
  const signInButton = page
    .locator(
      'button[data-amplify-button]:has-text("Sign in"), button[data-amplify-button]:has-text("Sign In")'
    )
    .first();
  await signInButton.waitFor({ state: 'visible', timeout: 5000 });

  // Wait a moment for any validation to complete
  const SHORT_DELAY_MS = 500;
  await page.waitForTimeout(SHORT_DELAY_MS);

  // Click and wait for navigation
  await Promise.all([
    page.waitForNavigation({ timeout: 15000 }).catch(() => {}),
    signInButton.click(),
  ]);

  // Wait for successful authentication
  // After login, we should be redirected away from the login page
  // OR navigation happens OR sign in button disappears
  await Promise.race([
    page.waitForURL(/^(?!.*login).*$/, { timeout: 15000 }).catch(() => {}),
    page.waitForNavigation({ timeout: 15000 }).catch(() => {}),
    signInButton.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {}),
  ]);

  // CRITICAL: Wait for Amplify auth tokens to be stored
  // Amplify stores tokens in localStorage/IndexedDB which takes time
  await page.waitForTimeout(3000);

  // Verify authentication by navigating to a protected route
  await page.goto('/profile');
  await page.waitForLoadState('networkidle');

  // Ensure we're not redirected back to login
  await page.waitForTimeout(2000);
  const currentUrl = page.url();

  if (currentUrl.includes('/login')) {
    // Check for any error messages on the page
    const errorText = await page.locator('[class*="error"], [role="alert"]').allTextContents();
    throw new Error(`Authentication failed - still on login page. Errors: ${errorText.join(', ')}`);
  }

  // Save signed-in state to reuse in all tests
  await page.context().storageState({ path: authFile });
});
