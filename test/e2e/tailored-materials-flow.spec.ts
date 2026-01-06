import { test, expect } from '@playwright/test';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const JOB_FIXTURE = join(__dirname, 'fixtures', 'job-description.txt');

test.describe('Tailored materials workflow', () => {
  test.describe.configure({ mode: 'serial' });

  let jobTitle: string | null = null;
  let jobId: string | null = null;
  let coverLetterId: string | null = null;

  test('1. Setup: create analyzed job from fixture', async ({ page }) => {
    test.setTimeout(120000);

    await page.goto('/jobs');
    await page.waitForLoadState('networkidle');

    const addJobLink = page.getByRole('link', { name: /add job/i }).first();
    await expect(addJobLink).toBeVisible();
    await addJobLink.click();

    await expect(page).toHaveURL(/\/jobs\/new/);
    const fileInput = page.locator('input[type="file"]').first();
    await expect(fileInput).toBeVisible();
    await fileInput.setInputFiles(JOB_FIXTURE);

    await page.waitForURL(/\/jobs\/[0-9a-f-]+$/i, { timeout: 60000 });
    const titleInput = page.locator('[data-testid="job-title-input"]');
    await expect(titleInput).toBeVisible({ timeout: 60000 });

    jobTitle = `E2E Tailored Job ${Date.now()}`;
    await titleInput.fill(jobTitle);
    const saveButton = page.locator('[data-testid="job-save-button"]');
    await saveButton.click();
    await expect(saveButton).toBeDisabled({ timeout: 10000 });

    const jobDetailUrl = page.url();
    const jobIdMatch = jobDetailUrl.match(/\/jobs\/([0-9a-f-]+)$/i);
    if (!jobIdMatch) {
      throw new Error('Expected job ID in job detail URL.');
    }
    jobId = jobIdMatch[1];
  });

  test('2. Generate matching summary', async ({ page }) => {
    if (!jobId) {
      test.skip(true, 'Job not created.');
      return;
    }

    await page.goto(`/jobs/${jobId}/match`);
    await page.waitForLoadState('networkidle');

    const generateButton = page.getByRole('button', { name: /generate match/i }).first();
    await expect(generateButton).toBeVisible();
    await generateButton.click();

    const summaryHeading = page.getByText('Overall Match Score');
    await expect(summaryHeading).toBeVisible({ timeout: 60000 });
  });

  test('3. Generate tailored cover letter from match page', async ({ page }) => {
    if (!jobId || !jobTitle) {
      test.skip(true, 'Job not created.');
      return;
    }

    await page.goto(`/jobs/${jobId}/match`);
    await page.waitForLoadState('networkidle');

    const generateCoverLetter = page.getByRole('button', { name: /generate cover letter/i });
    await expect(generateCoverLetter).toBeVisible();
    await generateCoverLetter.click();

    await page.waitForURL(/\/cover-letters\/[0-9a-f-]+$/i, { timeout: 60000 });
    const coverLetterUrl = page.url();
    const coverLetterMatch = coverLetterUrl.match(/\/cover-letters\/([0-9a-f-]+)$/i);
    if (!coverLetterMatch) {
      throw new Error('Expected cover letter ID in URL.');
    }
    coverLetterId = coverLetterMatch[1];

    const content = page.locator('.prose');
    await expect(content).toBeVisible();
    await expect(content).not.toBeEmpty();

    const jobLink = page.getByRole('link', { name: /view job/i });
    await expect(jobLink).toBeVisible();
    await expect(jobLink).toHaveAttribute('href', `/jobs/${jobId}`);
  });

  test('4. Cleanup: delete cover letter and job', async ({ page }) => {
    if (!jobTitle || !jobId || !coverLetterId) {
      test.skip(true, 'Missing data for cleanup.');
      return;
    }

    await page.goto('/cover-letters');
    await page.waitForLoadState('networkidle');

    const coverLetterHeading = page.getByRole('heading', {
      name: new RegExp(`Cover Letter\\s+—\\s+${jobTitle}`, 'i'),
    });
    await expect(coverLetterHeading).toBeVisible();

    const deleteButton = page.getByRole('button', { name: 'Delete', exact: true });
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /^Delete$/i }).click();

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
    const jobDialog = page.getByRole('dialog');
    await expect(jobDialog).toBeVisible();
    await jobDialog.getByRole('button', { name: /^Delete$/i }).click();
    await expect(jobCard).toHaveCount(0);
  });
});
