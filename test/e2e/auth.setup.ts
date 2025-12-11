import { test as setup } from '@playwright/test';

/**
 * Authentication setup for E2E tests
 *
 * This file creates a new user for each test run and saves the authenticated
 * state to be reused across all tests.
 */

const authFile = 'test-results/.auth/user.json';

/**
 * Generate unique test user credentials for each test run
 */
function generateTestUser() {
  const timestamp = Date.now();
  return {
    email: `e2e-test-${timestamp}@example.com`,
    password: 'TestPassword123!',
    name: `E2E Test User ${timestamp}`,
  };
}

setup('authenticate', async ({ page }) => {
  const testUser = generateTestUser();

  // Navigate to the app (will redirect to login if not authenticated)
  await page.goto('/');

  // Wait for Amplify UI authenticator to load
  await page.waitForLoadState('networkidle');

  // Click on "Create Account" tab
  const createAccountTab = page
    .locator('button#signUp-tab, button[role="tab"]:has-text("Create Account")')
    .first();
  await createAccountTab.waitFor({ state: 'visible', timeout: 10000 });
  await createAccountTab.click();

  // Wait for signup form to be visible
  await page.waitForTimeout(500);

  // Fill in the signup form
  // Email field
  const emailInput = page.locator('input[name="email"], input[autocomplete="username"]').first();
  await emailInput.waitFor({ state: 'visible', timeout: 5000 });
  await emailInput.fill(testUser.email);

  // Password field
  const passwordInput = page.locator('input[name="password"][autocomplete="new-password"]').first();
  await passwordInput.fill(testUser.password);

  // Confirm Password field
  const confirmPasswordInput = page.locator('input[name="confirm_password"]').first();
  await confirmPasswordInput.fill(testUser.password);

  // Name field
  const nameInput = page.locator('input[name="name"], input[autocomplete="name"]').first();
  await nameInput.fill(testUser.name);

  // Click "Create Account" button
  const createAccountButton = page
    .locator('button[data-amplify-button]:has-text("Create Account")')
    .first();
  await createAccountButton.waitFor({ state: 'visible', timeout: 5000 });

  // Wait a moment for validation
  await page.waitForTimeout(500);

  // Click and wait for account creation + auto-login
  await Promise.all([
    page.waitForNavigation({ timeout: 15000 }).catch(() => {}),
    createAccountButton.click(),
  ]);

  // Verify authentication by navigating to a protected route
  await page.goto('/profile');
  await page.waitForLoadState('networkidle');

  // Ensure we're not redirected back to login
  const currentUrl = page.url();

  if (currentUrl.includes('/login') || currentUrl.includes('sign')) {
    // Check for any error messages on the page
    const errorText = await page.locator('[class*="error"], [role="alert"]').allTextContents();
    throw new Error(
      `Account creation/authentication failed. User: ${testUser.email}. Errors: ${errorText.join(', ')}`
    );
  }

  // Log successful user creation for debugging
  console.log(`✓ Created and authenticated test user: ${testUser.email}`);

  // Save signed-in state to reuse in all tests
  await page.context().storageState({ path: authFile });
});
