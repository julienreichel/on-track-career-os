import { test, expect, type Locator, type Page } from '@playwright/test';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const JOB_FIXTURE = join(__dirname, 'fixtures', 'job-description.txt');

async function createAnalyzedJobAndMatch(page: Page): Promise<string> {
  await page.goto('/jobs');
  await page.waitForLoadState('networkidle');

  await page
    .getByRole('link', { name: /^Analyze Job$/i })
    .first()
    .click();
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
  await page
    .getByRole('button', { name: /generate match/i })
    .first()
    .click();
  await expect(page.getByText('Overall Match Score')).toBeVisible({ timeout: 60000 });

  return jobId;
}

async function selectImprovementPresets(page: Page) {
  await page.locator('[data-testid="material-feedback-presets"]').click();
  await page.getByRole('option', { name: 'More concise' }).click();
  await page.getByRole('option', { name: 'Show clearer value' }).click();
  await page.getByRole('option', { name: 'Make it more story-driven' }).click();
  await page.keyboard.press('Escape');
}

async function expectMarkdownChanged(markdown: Locator, before: string) {
  const after = ((await markdown.textContent()) ?? '').trim();
  expect(after).not.toBe(before.trim());
}

async function waitForImproveCompletion(page: Page) {
  await expect(page.getByRole('button', { name: /^Get feedback$/i })).toBeVisible({
    timeout: 90000,
  });
}

async function openTailoredCvFromMatch(page: Page, jobId: string): Promise<Locator> {
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
  return markdown;
}

async function openTailoredCoverLetterFromMatch(page: Page, jobId: string): Promise<Locator> {
  await page.goto(`/jobs/${jobId}/match`);
  await page.getByRole('button', { name: /generate cover letter/i }).click();
  await page.waitForURL(/\/applications\/cover-letters\/[0-9a-f-]+$/i, { timeout: 60000 });

  const markdown = page.locator('.doc-markdown');
  await expect(markdown).toBeVisible();
  return markdown;
}

async function runFeedbackFlow(page: Page) {
  await test.step('Generate feedback', async () => {
    await page.getByRole('button', { name: 'Get feedback' }).click();
    await expect(page.locator('[data-testid="material-feedback-score"]')).toBeVisible({
      timeout: 20000,
    });
  });

  await test.step('Expand feedback details', async () => {
    await page.getByRole('button', { name: 'Show details' }).click();
    await expect(page.locator('[data-testid="material-feedback-details"]')).toBeVisible();
  });
}

async function runImprovementFlow(page: Page, markdown: Locator, before: string) {
  await test.step('Select improvement presets', async () => {
    await selectImprovementPresets(page);
  });

  await test.step('Generate improvement', async () => {
    await page.getByRole('button', { name: 'Improve' }).click();
    await waitForImproveCompletion(page);
  });

  await test.step('Verify markdown updated', async () => {
    await expectMarkdownChanged(markdown, before);
  });
}

test.describe('C3 material improvement happy paths', () => {
  test('CV + cover letter: feedback + improve updates markdown', async ({ page }) => {
    test.setTimeout(120000);

    const jobId = await test.step('Setup: create analyzed job and match once', async () =>
      createAnalyzedJobAndMatch(page)
    );

    await test.step('CV flow', async () => {
      const markdown = await test.step('Setup: open tailored CV editor', async () =>
        openTailoredCvFromMatch(page, jobId)
      );
      const before = (await markdown.textContent()) ?? '';
      await runFeedbackFlow(page);
      await runImprovementFlow(page, markdown, before);
    });

    await test.step('Cover letter flow', async () => {
      const markdown = await test.step('Setup: open tailored cover letter editor', async () =>
        openTailoredCoverLetterFromMatch(page, jobId)
      );
      const before = (await markdown.textContent()) ?? '';
      await runFeedbackFlow(page);
      await runImprovementFlow(page, markdown, before);
    });
  });
});
