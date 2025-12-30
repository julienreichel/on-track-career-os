import { test, expect } from '@playwright/test';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const JOB_FIXTURE = join(__dirname, 'fixtures', 'job-description.txt');

test.describe('Job analysis workflow', () => {
  test('user can upload, review, and edit a job description', async ({ page }) => {
    await page.goto('/jobs');
    await page.waitForLoadState('networkidle');

    // Ensure jobs list header and breadcrumb link exist
    await expect(page.getByRole('link', { name: 'Jobs' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Jobs' })).toBeVisible();
    const addJobLink = page.getByRole('link', { name: /add job/i }).first();
    await expect(addJobLink).toBeVisible();
    await addJobLink.click();

    await expect(page).toHaveURL(/\/jobs\/new/);

    const fileInput = page.locator('input[type="file"]').first();
    await expect(fileInput).toBeVisible();
    await fileInput.setInputFiles(JOB_FIXTURE);

    // Uploading triggers parsing + AI analysis, wait for redirect
    await page.waitForURL(/\/jobs\/[0-9a-f-]+$/i, { timeout: 60000 });
    const titleInput = page.locator('[data-testid="job-title-input"]');
    await expect(titleInput).toBeVisible({ timeout: 60000 });

    // Update the title and save
    const newTitle = `Head of Engineering Automation ${Date.now()}`;
    await titleInput.fill(newTitle);
    const saveButton = page.locator('[data-testid="job-save-button"]');
    await saveButton.click();
    await expect(saveButton).toBeDisabled({ timeout: 10000 });

    // Return to job list and verify the new job exists
    await page.goto('/jobs');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="job-card"] h3', { hasText: newTitle })).toBeVisible({
      timeout: 20000,
    });

    // Open the job from the list to confirm navigation
    const newJobCard = page
      .locator('[data-testid="job-card"]')
      .filter({ has: page.locator('h3', { hasText: newTitle }) });
    await newJobCard.getByRole('button', { name: /view job/i }).click();
    await expect(page).toHaveURL(/\/jobs\/[0-9a-f-]+$/i);
    await expect(page.locator('[data-testid="job-title-input"]')).toHaveValue(newTitle);
  });
});
