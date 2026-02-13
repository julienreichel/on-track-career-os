import { test, expect } from '@playwright/test';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const JOB_FIXTURE = join(__dirname, 'fixtures', 'job-description.txt');

test.describe('Application strength workflow', () => {
  test('user can evaluate pasted CV text for a job', async ({ page }) => {
    await page.goto('/jobs');
    await page.waitForLoadState('networkidle');

    const addJobLink = page.getByRole('link', { name: /Analyze Job/i }).first();
    await expect(addJobLink).toBeVisible();
    await addJobLink.click();

    await expect(page).toHaveURL(/\/jobs\/new/);
    const fileInput = page.locator('input[type="file"]').first();
    await expect(fileInput).toBeVisible();
    await fileInput.setInputFiles(JOB_FIXTURE);

    await page.waitForURL(/\/jobs\/[0-9a-f-]+$/i, { timeout: 30000 });

    await expect(page.getByRole('link', { name: /Application strength/i })).toBeVisible({
      timeout: 10000,
    });
    await page.getByRole('link', { name: /Application strength/i }).click();

    await expect(page).toHaveURL(/\/jobs\/[0-9a-f-]+\/application-strength$/i);

    const cvText = page.locator('[data-testid="application-strength-cv-text"]');
    await expect(cvText).toBeVisible({ timeout: 10000 });
    await cvText.fill(
      'Senior product manager with 9 years of experience leading cross-functional launches, defining roadmaps, and improving conversion by 18 percent.'
    );

    const evaluateButton = page.locator('[data-testid="application-strength-evaluate"]');
    await expect(evaluateButton).toBeEnabled();
    await evaluateButton.click();

    await expect(page.locator('[data-testid="application-strength-results"]')).toBeVisible({
      timeout: 60000,
    });
    await expect(page.locator('[data-testid^="application-strength-dimension-"]')).toHaveCount(5, {
      timeout: 20000,
    });
    const improvements = page.locator('[data-testid^="application-strength-improvement-"]');
    await expect
      .poll(async () => improvements.count(), { timeout: 20000 })
      .toBeGreaterThanOrEqual(2);
  });
});
