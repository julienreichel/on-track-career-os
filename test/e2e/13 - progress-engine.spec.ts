import { test, expect } from '@playwright/test';

test.describe('Progress Engine', () => {
  test('shows a next action on the dashboard', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    const banner = page.getByTestId('progress-banner');
    await expect(banner).toBeVisible();

    const primaryCta = page.getByTestId('progress-primary-cta');
    await expect(primaryCta).toBeVisible();
    await expect(primaryCta).toHaveText(/.+/);
  });
});
