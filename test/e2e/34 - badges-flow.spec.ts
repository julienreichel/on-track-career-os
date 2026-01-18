import { test, expect } from '@playwright/test';
import { createExperience } from './utils/storyHelpers';

test.describe('Badge flow', () => {
  test('earns badges and shows the toast only once', async ({ page }) => {
    const ensureProfileBasics = async () => {
      await page.goto('/profile/full?mode=edit');
      await page.waitForLoadState('networkidle');

      await page.getByRole('textbox', { name: /Full Name/i }).first().fill('E2E Badge User');
      await page.getByPlaceholder('Senior Software Engineer').first().fill('Senior Software Engineer');
      await page.getByPlaceholder('San Francisco, CA').first().fill('San Francisco, CA');
      await page.getByPlaceholder('Senior').first().fill('Senior');
      await page.getByPlaceholder('you[at]example.com').first().fill('e2e-badge@example.com');
      await page.getByPlaceholder('+1 415 555 0101').first().fill('+1 415 555 0101');
      await page
        .getByPlaceholder('e.g., Eligible to work in EU & US')
        .first()
        .fill('Eligible to work in US');

      const addTag = async (placeholder: string, value: string) => {
        const input = page.getByPlaceholder(placeholder).first();
        await input.fill(value);
        await input.press('Enter');
      };

      await addTag('https://linkedin.com/in/you', 'https://linkedin.com/in/e2e-badge');
      await addTag('e.g., Vue.js', 'Vue.js');
      await addTag('e.g., English', 'English');

      await page.locator('button[type="submit"]:has-text("Save")').first().click();
      await page.waitForTimeout(1500);
    };

    await ensureProfileBasics();

    const titles = [
      `E2E Badge Experience ${Date.now()}-1`,
      `E2E Badge Experience ${Date.now()}-2`,
      `E2E Badge Experience ${Date.now()}-3`,
    ];

    for (const title of titles) {
      const experienceId = await createExperience(page, title);
      expect(experienceId).toBeTruthy();
    }

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const badgeGrid = page.getByTestId('badge-grid');
    await expect(badgeGrid).toBeVisible();
    await expect(badgeGrid.getByTestId('badge-pill-grounded')).toBeVisible();

    await expect(page.getByText(/New badge earned/i)).toBeVisible({ timeout: 10000 });

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/New badge earned/i)).toHaveCount(0);
  });
});
