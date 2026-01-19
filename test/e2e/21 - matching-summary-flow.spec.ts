import { test, expect } from '@playwright/test';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const JOB_FIXTURE = join(__dirname, 'fixtures', 'job-description.txt');

test.describe('Matching summary workflow', () => {
  test.describe.configure({ mode: 'serial' });

  let jobTitle: string | null = null;
  let jobId: string | null = null;

  test('1. Setup: create analyzed job from fixture', async ({ page }) => {
    await page.goto('/jobs');
    await page.waitForLoadState('networkidle');

    const addJobLink = page.getByRole('link', { name: /add job/i }).first();
    await expect(addJobLink).toBeVisible();
    await addJobLink.click();

    await expect(page).toHaveURL(/\/jobs\/new/);
    const fileInput = page.locator('input[type="file"]').first();
    await expect(fileInput).toBeVisible();
    await fileInput.setInputFiles(JOB_FIXTURE);

    await page.waitForURL(/\/jobs\/[0-9a-f-]+$/i, { timeout: 20000 });
    await expect(async () => {
      const editButton = page.getByRole('button', { name: /^Edit$/ });
      await expect(editButton).toBeVisible({ timeout: 5000 });
      await editButton.scrollIntoViewIfNeeded();
      await editButton.click();
      await expect(page.locator('[data-testid="job-title-input"]')).toBeVisible({
        timeout: 2000,
      });
    }).toPass({ timeout: 20000 });

    const titleInput = page.locator('[data-testid="job-title-input"]');

    jobTitle = `E2E Match Job ${Date.now()}`;
    await titleInput.fill(jobTitle);
    await page.waitForTimeout(500);

    await expect(async () => {
      const saveButton = page.getByRole('button', { name: /^Save$/i });
      await expect(saveButton).toBeVisible({ timeout: 2000 });
      await expect(saveButton).toBeEnabled();
      await saveButton.scrollIntoViewIfNeeded();
      await saveButton.click();
    }).toPass({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /^Edit$/ })).toBeVisible({ timeout: 10000 });

    const jobDetailUrl = page.url();
    const jobIdMatch = jobDetailUrl.match(/\/jobs\/([0-9a-f-]+)$/i);
    if (!jobIdMatch) {
      throw new Error('Expected job ID in job detail URL.');
    }
    jobId = jobIdMatch[1];
  });

  test('2. Navigate to job detail from jobs list', async ({ page }) => {
    if (!jobTitle || !jobId) {
      test.skip(true, 'Job not created.');
      return;
    }

    await page.goto('/jobs');
    await page.waitForLoadState('networkidle');

    const jobCard = page
      .locator('[data-testid="job-card"]')
      .filter({ has: page.locator('h3', { hasText: jobTitle }) });
    await expect(jobCard).toBeVisible({ timeout: 20000 });

    await jobCard.getByRole('button', { name: /view/i }).click();
    await expect(page).toHaveURL(new RegExp(`/jobs/${jobId}$`, 'i'));
  });

  test('3. Open match page and generate summary', async ({ page }) => {
    if (!jobTitle || !jobId) {
      test.skip(true, 'Job not created.');
      return;
    }

    await page.goto(`/jobs/${jobId}`);
    await page.waitForLoadState('networkidle');

    const matchLink = page.getByRole('link', { name: /view match/i }).first();
    await expect(matchLink).toBeVisible();
    await matchLink.click();

    await expect(page).toHaveURL(new RegExp(`/jobs/${jobId}/match$`, 'i'));
    await page.waitForLoadState('networkidle');

    const breadcrumb = page.getByRole('navigation', { name: /breadcrumb/i }).first();
    await expect(breadcrumb).toContainText(jobTitle);
    await expect(breadcrumb).toContainText('Match');

    const emptyStateHeading = page.getByRole('heading', { name: /no matching summary yet/i });
    const generateButton = page.getByRole('button', { name: /generate match/i });
    await expect(generateButton).toBeVisible();
    await generateButton.click();
    await expect(emptyStateHeading).toBeHidden({ timeout: 60000 });

    const summaryHeading = page.getByText('Overall Match Score');
    await expect(summaryHeading).toBeVisible({ timeout: 60000 });
  });

  test('4. Summary sections render with structured content', async ({ page }) => {
    if (!jobId) {
      test.skip(true, 'Job not created.');
      return;
    }

    await page.goto(`/jobs/${jobId}/match`);
    await page.waitForLoadState('networkidle');

    const summaryHeading = page.getByText('Overall Match Score');
    await expect(summaryHeading).toBeVisible({ timeout: 60000 });
    const reasoningSection = page.getByText('Key Assessment Points');
    await expect(reasoningSection).toBeVisible();
    const reasoningItems = reasoningSection.locator('..').locator('..').getByRole('listitem');
    await expect(reasoningItems.first()).toBeVisible();
  });

  test('5. Reload persists matching summary', async ({ page }) => {
    if (!jobId) {
      test.skip(true, 'Job not created.');
      return;
    }

    await page.goto(`/jobs/${jobId}/match`);
    await page.waitForLoadState('networkidle');

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('matching-empty-generate')).toHaveCount(0);
    const summaryHeading = page.getByText('Overall Match Score');
    await expect(summaryHeading).toBeVisible();
    const reasoningSection = page.getByText('Key Assessment Points');
    const reasoningItems = reasoningSection.locator('..').locator('..').getByRole('listitem');
    await expect(reasoningItems.first()).toBeVisible();
  });

  test('6. Cleanup: delete created job', async ({ page }) => {
    if (!jobTitle) {
      test.skip(true, 'Job not created.');
      return;
    }

    await page.goto('/jobs');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder('Search jobs...');
    if ((await searchInput.count()) > 0) {
      await searchInput.fill(jobTitle);
    }

    const jobCard = page
      .locator('[data-testid="job-card"]')
      .filter({ has: page.locator('h3', { hasText: jobTitle }) });

    if ((await jobCard.count()) === 0) {
      test.skip(true, 'Job already deleted.');
      return;
    }

    await jobCard.getByRole('button', { name: /delete/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /^Delete$/i }).click();
    await expect(jobCard).toHaveCount(0);
  });
});
