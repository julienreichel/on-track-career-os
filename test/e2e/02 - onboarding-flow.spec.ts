import { test, expect } from '@playwright/test';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CV_FIXTURE = join(__dirname, 'fixtures', 'test-cv.txt');

function generateTestUser() {
  const timestamp = Date.now();
  return {
    email: `e2e-onboarding-${timestamp}@example.com`,
    password: 'TestPassword123!',
    name: `E2E Onboarding User ${timestamp}`,
  };
}

test.describe('Onboarding wizard', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('routes new users to onboarding and completes phase 1', async ({ page }) => {
    const testUser = generateTestUser();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const createAccountTab = page
      .locator('button#signUp-tab, button[role="tab"]:has-text("Create Account")')
      .first();
    await createAccountTab.waitFor({ state: 'visible', timeout: 10000 });
    await createAccountTab.click();

    await page.waitForTimeout(500);

    await page
      .locator('input[name="email"], input[autocomplete="username"]')
      .first()
      .fill(testUser.email);
    await page
      .locator('input[name="password"][autocomplete="new-password"]')
      .first()
      .fill(testUser.password);
    await page.locator('input[name="confirm_password"]').first().fill(testUser.password);
    await page
      .locator('input[name="name"], input[autocomplete="name"]')
      .first()
      .fill(testUser.name);

    const createAccountButton = page
      .locator('button[data-amplify-button]:has-text("Create Account")')
      .first();
    await createAccountButton.waitFor({ state: 'visible', timeout: 5000 });

    await Promise.all([
      page.waitForNavigation({ timeout: 15000 }).catch(() => {}),
      createAccountButton.click(),
    ]);

    await expect(page.getByRole('link', { name: /Start onboarding/i })).toBeVisible({
      timeout: 10000,
    });
    await page.getByRole('link', { name: /Start onboarding/i }).click();
    await expect(page).toHaveURL(/\/onboarding$/);
    await expect(page.getByText(/Upload your CV/i)).toBeVisible({ timeout: 15000 });

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(CV_FIXTURE);

    const importButton = page.getByRole('button', { name: /Import experiences/i });
    await expect(importButton).toBeVisible({ timeout: 30000 });
    await importButton.click();

    await expect(page.getByText(/Confirm profile basics/i)).toBeVisible({ timeout: 20000 });

    await page.getByPlaceholder('John Doe').fill(testUser.name);
    await page.getByPlaceholder('you[at]example.com').fill(testUser.email);
    await page.getByPlaceholder('+1 415 555 0101').fill('+1 415 555 0101');
    await page.getByPlaceholder('e.g., Eligible to work in EU & US').fill('Eligible to work in US');

    const socialInput = page.getByPlaceholder('https://linkedin.com/in/you');
    await socialInput.fill('https://linkedin.com/in/test-user');
    await socialInput.press('Enter');
    await expect(page.getByText('https://linkedin.com/in/test-user')).toBeVisible();

    const skillsInput = page.getByPlaceholder('e.g., Vue.js');
    await skillsInput.fill('Vue.js');
    await skillsInput.press('Enter');
    await expect(page.getByText('Vue.js')).toBeVisible();

    const languagesInput = page.getByPlaceholder('e.g., English');
    await languagesInput.fill('English');
    await languagesInput.press('Enter');
    await expect(page.getByText('English')).toBeVisible();

    const continueButton = page.getByRole('button', { name: /Continue/i });
    await expect(continueButton).toBeEnabled();
    await continueButton.click();

    await expect(page.getByText(/You're ready to move forward/i)).toBeVisible({ timeout: 20000 });
  });
});
