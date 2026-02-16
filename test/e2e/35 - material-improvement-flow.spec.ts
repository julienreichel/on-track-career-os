import { test, expect, type Locator, type Page } from '@playwright/test';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const JOB_FIXTURE = join(__dirname, 'fixtures', 'job-description.txt');

async function createAnalyzedJobAndMatch(page: Page): Promise<string> {
  await page.goto('/jobs');
  await page.waitForLoadState('networkidle');

  await page.getByRole('link', { name: /^Analyze Job$/i }).first().click();
  await expect(page).toHaveURL(/\/jobs\/new/);

  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(JOB_FIXTURE);
  await page.waitForURL(/\/jobs\/[0-9a-f-]+$/i, { timeout: 30000 });

  const url = page.url();
  const match = url.match(/\/jobs\/([0-9a-f-]+)$/i);
  if (!match?.[1]) {
    throw new Error('Expected created job ID in URL.');
  }
  const jobId = match[1];

  await page.goto(`/jobs/${jobId}/match`);
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /generate match/i }).first().click();
  await expect(page.getByText('Overall Match Score')).toBeVisible({ timeout: 60000 });

  return jobId;
}

async function selectImprovementPresets(page: Page) {
  await page.locator('[data-testid="material-feedback-presets"]').click();
  await page.getByRole('option', { name: 'More concise' }).click();
  await page.getByRole('option', { name: 'Show clearer value' }).click();
  await page.keyboard.press('Escape');
}

async function expectMarkdownChanged(markdown: Locator, before: string) {
  await expect
    .poll(async () => ((await markdown.textContent()) ?? '').trim(), { timeout: 60000 })
    .not.toBe(before.trim());
}

test.describe('C3 material improvement happy paths', () => {
  test.describe.configure({ mode: 'serial' });

  test('CV: feedback + improve updates markdown', async ({ page }) => {
    const jobId = await createAnalyzedJobAndMatch(page);

    await page.goto(`/jobs/${jobId}/match`);
    const generateCvButton = page.getByRole('button', { name: /generate tailored cv/i });
    await expect(generateCvButton).toBeVisible();
    await generateCvButton.click();

    await Promise.race([
      page.waitForURL(/\/applications\/cv\/[0-9a-f-]+$/i, { timeout: 60000 }),
      page.waitForURL(/\/applications\/cv\/new\?jobId=/i, { timeout: 60000 }),
    ]);

    if (/\/applications\/cv\/new\?jobId=/i.test(page.url())) {
      const continueGenerateButton = page.getByRole('button', { name: /^generate cv$/i });
      await expect(continueGenerateButton).toBeVisible();
      await continueGenerateButton.click();
      await page.waitForURL(/\/applications\/cv\/[0-9a-f-]+$/i, { timeout: 60000 });
    }

    const markdown = page.locator('.doc-markdown');
    await expect(markdown).toBeVisible();
    const before = (await markdown.textContent()) ?? '';

    await page.getByRole('button', { name: 'Get feedback' }).click();
    await expect(page.locator('[data-testid="material-feedback-score"]')).toBeVisible({
      timeout: 20000,
    });

    await page.getByRole('button', { name: 'Show details' }).click();
    await expect(page.locator('[data-testid="material-feedback-details"]')).toBeVisible();

    await selectImprovementPresets(page);
    await page.getByRole('button', { name: 'Improve' }).click();

    await expectMarkdownChanged(markdown, before);
  });

  test('Cover letter: feedback + improve updates markdown', async ({ page }) => {
    const jobId = await createAnalyzedJobAndMatch(page);

    await page.goto(`/jobs/${jobId}/match`);
    await page.getByRole('button', { name: /generate cover letter/i }).click();
    await page.waitForURL(/\/applications\/cover-letters\/[0-9a-f-]+$/i, { timeout: 60000 });

    const markdown = page.locator('.doc-markdown');
    await expect(markdown).toBeVisible();
    const before = (await markdown.textContent()) ?? '';

    await page.getByRole('button', { name: 'Get feedback' }).click();
    await expect(page.locator('[data-testid="material-feedback-score"]')).toBeVisible({
      timeout: 20000,
    });

    await page.getByRole('button', { name: 'Show details' }).click();
    await expect(page.locator('[data-testid="material-feedback-details"]')).toBeVisible();

    await selectImprovementPresets(page);
    await page.getByRole('button', { name: 'Improve' }).click();

    await expectMarkdownChanged(markdown, before);
  });
});
