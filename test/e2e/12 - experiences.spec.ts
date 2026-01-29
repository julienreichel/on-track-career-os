import { test, expect } from '@playwright/test';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createExperience } from './utils/storyHelpers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CV_FIXTURE = join(__dirname, 'fixtures', 'test-cv.txt');
const MANUAL_EXPERIENCE_TITLE = `E2E Manual Experience ${Date.now()}`;

test.describe('Experience workflow', () => {
  test.describe.configure({ mode: 'serial' });

  let manualExperienceId: string | null = null;
  let updatedCompanyName: string | null = null;

  test('imports experiences via CV upload flow from the listing page', async ({ page }) => {
    await page.goto('/profile/experiences');
    await page.waitForLoadState('networkidle');

    await page.getByRole('link', { name: /Upload Your CV/i }).click();
    await expect(page).toHaveURL(/\/profile\/cv-upload$/);

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(CV_FIXTURE);

    const importButton = page.getByRole('button', { name: /Confirm/i });
    await expect(importButton).toBeVisible({ timeout: 30000 });
    await importButton.click();

    await expect(
      page.getByText(/imported \d+ experience\(s\), updated \d+ experience\(s\)/i)
    ).toBeVisible({ timeout: 20000 });
    await page.getByRole('button', { name: /View Experiences/i }).click();

    await expect(page).toHaveURL(/\/profile\/experiences$/);
    await expect(
      page
        .locator('[data-testid="experience-card"]')
        .filter({ hasText: /Senior Software Engineer/i })
        .first()
    ).toBeVisible({ timeout: 20000 });
  });

  test('creates an experience manually', async ({ page }) => {
    manualExperienceId = await createExperience(page, MANUAL_EXPERIENCE_TITLE);
    await page.goto('/profile/experiences');
    await page.waitForLoadState('networkidle');

    await expect(
      page.locator('[data-testid="experience-card"]').filter({ hasText: MANUAL_EXPERIENCE_TITLE })
    ).toBeVisible({ timeout: 20000 });
  });

  test('edits the manual experience and saves the changes', async ({ page }) => {
    expect(manualExperienceId).toBeTruthy();
    updatedCompanyName = `Updated Company ${Date.now()}`;

    await page.goto(`/profile/experiences/${manualExperienceId}`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Edit', exact: true }).click();
    await expect(page.getByLabel(/Company Name/i)).toBeVisible({ timeout: 10000 });

    await page.getByLabel(/Company Name/i).fill(updatedCompanyName);
    await page
      .getByLabel(/Responsibilities/i)
      .fill('Drove platform reliability improvements and automation.');
    await page
      .getByLabel(/Tasks/i)
      .fill('Led automation rollout and coordinated cross-team delivery.');

    await page.getByRole('button', { name: /Save/i }).click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(new RegExp(`/profile/experiences/${manualExperienceId}$`));
    const header = page.getByRole('heading', { level: 1, name: MANUAL_EXPERIENCE_TITLE });
    await expect(header).toBeVisible({ timeout: 20000 });
    await expect(
      page.locator('[data-slot="description"]', { hasText: updatedCompanyName })
    ).toBeVisible({
      timeout: 20000,
    });
  });

  test('opens the stories page for the manual experience and sees empty state', async ({
    page,
  }) => {
    expect(manualExperienceId).toBeTruthy();

    await page.goto('/profile/experiences');
    await page.waitForLoadState('networkidle');

    const manualCard = page
      .locator('[data-testid="experience-card"]')
      .filter({ hasText: MANUAL_EXPERIENCE_TITLE })
      .first();

    await manualCard.getByRole('button', { name: /View Stories/i }).click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(new RegExp(`/profile/experiences/${manualExperienceId}/stories`));
    await expect(page.getByText(/No stories yet for this experience/i)).toBeVisible({
      timeout: 10000,
    });
  });
});
