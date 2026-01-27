import { test, expect, type Page } from '@playwright/test';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, writeFileSync } from 'fs';
import { createExperience, createManualStory } from './utils/storyHelpers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CV_FIXTURE = join(__dirname, 'fixtures', 'test-cv.txt');
const JOB_FIXTURE = join(__dirname, 'fixtures', 'job-description.txt');
const STORAGE_STATE_PATH = `test-results/.auth/happy-path-${Date.now()}.json`;

mkdirSync('test-results/.auth', { recursive: true });
writeFileSync(STORAGE_STATE_PATH, JSON.stringify({ cookies: [], origins: [] }));

function generateTestUser() {
  const timestamp = Date.now();
  return {
    email: `e2e-happy-${timestamp}@example.com`,
    password: 'TestPassword123!',
    name: `E2E Happy User ${timestamp}`,
  };
}

async function signUp(page: Page, user: { email: string; password: string; name: string }) {
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
    .fill(user.email);
  await page
    .locator('input[name="password"][autocomplete="new-password"]')
    .first()
    .fill(user.password);
  await page.locator('input[name="confirm_password"]').first().fill(user.password);
  await page.locator('input[name="name"], input[autocomplete="name"]').first().fill(user.name);

  const createAccountButton = page
    .locator('button[data-amplify-button]:has-text("Create Account")')
    .first();
  await createAccountButton.waitFor({ state: 'visible', timeout: 5000 });

  await Promise.all([
    page.waitForNavigation({ timeout: 15000 }).catch(() => {}),
    createAccountButton.click(),
  ]);
}

test.describe('Discovery flow', () => {
  const user = generateTestUser();
  let jobId: string | null = null;

  test.use({ storageState: STORAGE_STATE_PATH });
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await signUp(page, user);
    await page.context().storageState({ path: STORAGE_STATE_PATH });
    await page.close();
  });

  const expectBadgeToast = async (page: Page, badgeTitle: string) => {
    const toast = page.locator('[role="alert"]').filter({ hasText: badgeTitle });
    await expect(toast.first()).toBeVisible({ timeout: 15000 });
  };

  const expectProgressCta = async (page: Page, label: RegExp, href?: RegExp) => {
    const cta = page.getByTestId('progress-primary-cta');
    await expect(cta).toBeVisible({ timeout: 10000 });
    await expect(cta).toHaveText(label);
    if (href) {
      await expect(cta).toHaveAttribute('href', href);
    }
  };

  test('Phase 1 onboarding + Grounded badge', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('link', { name: /Start onboarding/i })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByTestId('progress-primary-cta')).toHaveCount(0);
    await page.getByRole('link', { name: /Start onboarding/i }).click();
    await expect(page).toHaveURL(/\/onboarding$/);
    await expect(page.getByText(/Upload your CV/i)).toBeVisible();

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(CV_FIXTURE);

    const importButton = page.getByRole('button', { name: /Confirm/i });
    await expect(importButton).toBeVisible({ timeout: 30000 });
    await importButton.click();

    const fillProfileBasics = async () => {
      await expect(page.getByText(/Confirm profile basics/i)).toBeVisible({ timeout: 20000 });
      await page.getByPlaceholder('John Doe').fill(user.name);
      await page.getByPlaceholder('you[at]example.com').fill(user.email);
      await page.getByPlaceholder('+41 79 555 0101').fill('+1 415 555 0101');
      await page
        .getByPlaceholder('e.g., B Permit, Swiss citizen, ..')
        .fill('Eligible to work in US');

      const addTag = async (placeholder: string, value: string) => {
        const input = page.getByPlaceholder(placeholder);
        await input.fill(value);
        await input.press('Enter');
      };

      await addTag('https://linkedin.com/in/you', 'https://linkedin.com/in/e2e-happy');
      await addTag('e.g., Vue.js', 'Vue.js');
      await addTag('e.g., English', 'English');
    };

    await fillProfileBasics();

    const onboardingIssue = page.getByText(/Onboarding issue/i);
    if (await onboardingIssue.isVisible()) {
      await page.reload();
      await page.waitForLoadState('networkidle');
      await fillProfileBasics();
    }
    const continueButton = page.getByRole('button', { name: /Continue/i });
    await expect(continueButton).toBeEnabled();
    await continueButton.click();

    await expect(page.getByText(/You're ready to move forward/i)).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByRole('link', { name: /Analyze a job/i })).toBeVisible();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('progress-primary-cta')).toHaveText(/Upload a job/i);
    await expectBadgeToast(page, 'Grounded');
    await expect(page.getByTestId('badge-pill-grounded')).toBeVisible({ timeout: 20000 });
  });

  test('Phase 2A job upload + match + badge', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expectProgressCta(page, /Upload a job/i, /\/jobs\/new$/);

    await page.goto('/jobs');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('guidance-empty-state')).toBeVisible({ timeout: 10000 });
    await page.getByRole('link', { name: /Add a job/i }).click();
    await expect(page).toHaveURL(/\/jobs\/new/);

    const jobInput = page.locator('input[type="file"]').first();
    await jobInput.setInputFiles(JOB_FIXTURE);

    await page.waitForURL(/\/jobs\/[0-9a-f-]+$/i, { timeout: 20000 });
    const jobIdMatch = page.url().match(/\/jobs\/([0-9a-f-]+)$/i);
    expect(jobIdMatch).toBeTruthy();
    jobId = jobIdMatch ? jobIdMatch[1] : null;
    if (!jobId) return;

    await page.goto(`/jobs/${jobId}/match`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Overall Match Score/i)).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('button', { name: /Generate tailored CV/i })).toBeVisible({
      timeout: 20000,
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expectBadgeToast(page, 'Job Clarity');
    await expect(page.getByTestId('badge-pill-jobClarity')).toBeVisible({ timeout: 20000 });
  });

  test('Phase 2B identity completion + badge', async ({ page }) => {
    test.setTimeout(60000); // Increase timeout for canvas generation in CI

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expectProgressCta(page, /Deepen your profile/i, /\/profile\/full\?mode=edit$/);

    await page.goto('/profile/full?mode=edit');
    await page.waitForLoadState('networkidle');

    const addTag = async (placeholder: string, value: string) => {
      const input = page.getByPlaceholder(placeholder).first();
      await input.fill(value);
      await input.press('Enter');
    };

    await addTag('e.g., Lead cross-functional teams', 'Lead cross-functional teams');
    await addTag('e.g., Integrity', 'Integrity');

    await page.locator('button[type="submit"]:has-text("Save")').first().click();
    await page.waitForTimeout(1500);

    const storyExperienceId = await createExperience(
      page,
      `E2E Happy Story Experience ${Date.now()}`
    );
    expect(storyExperienceId).toBeTruthy();
    if (!storyExperienceId) return;

    const storyResult = await createManualStory(page, storyExperienceId);
    expect(storyResult.saved).toBe(true);

    await page.goto('/profile/canvas');
    await page.waitForLoadState('networkidle');

    const generateCanvasButton = page.getByRole('button', { name: /Generate Canvas/i });
    if (await generateCanvasButton.isVisible()) {
      await generateCanvasButton.click();
      await page.waitForSelector('[class*="animate-spin"]', { state: 'hidden', timeout: 30000 });
    }

    await expect(page.getByRole('heading', { name: /Value Proposition/i })).toBeVisible({
      timeout: 20000,
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await expectBadgeToast(page, 'Identity Defined');
    await expect(page.getByTestId('badge-pill-identityDefined')).toBeVisible({ timeout: 20000 });
  });

  test('Phase 3 materials triad + Application Complete badge', async ({ page }) => {
    test.setTimeout(60000); // Increase timeout for material generation + badge computation in CI

    expect(jobId).toBeTruthy();
    if (!jobId) return;

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expectProgressCta(page, /Create tailored materials/i, /\/jobs$/);

    await page.goto(`/jobs/${jobId}/match`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Generate tailored CV/i }).click();
    await page.waitForURL(/\/applications\/cv\/new(\?|$)/i, { timeout: 30000 });

    const generateButtons = page.getByRole('button', { name: /Generate CV/i });
    await generateButtons.first().click();

    await page.waitForURL(/\/applications\/cv\/[0-9a-f-]+$/i, { timeout: 60000 });
    await expect(page.getByRole('link', { name: /View job/i })).toBeVisible({
      timeout: 20000,
    });
    await page.getByRole('link', { name: /View job/i }).click();

    await page.waitForURL(new RegExp(`/jobs/${jobId}$`), { timeout: 20000 });
    await page.getByRole('link', { name: /Match/i }).click();
    await page.waitForURL(new RegExp(`/jobs/${jobId}/match$`), { timeout: 20000 });
    const generateCoverLetter = page.getByRole('button', { name: /Generate cover letter/i });
    await expect(generateCoverLetter).toBeVisible({ timeout: 20000 });
    await generateCoverLetter.click();

    await page.waitForURL(/\/applications\/cover-letters\/[0-9a-f-]+$/i, { timeout: 30000 });
    await expect(page.getByRole('link', { name: /View job/i })).toBeVisible({
      timeout: 20000,
    });
    await page.getByRole('link', { name: /View job/i }).click();

    await page.waitForURL(new RegExp(`/jobs/${jobId}$`), { timeout: 20000 });
    await page.getByRole('link', { name: /Match/i }).click();
    await page.waitForURL(new RegExp(`/jobs/${jobId}/match$`), { timeout: 20000 });
    const generateSpeech = page.getByRole('button', { name: /Generate speech/i });
    await expect(generateSpeech).toBeVisible({ timeout: 20000 });
    await generateSpeech.click();

    await page.waitForURL(/\/applications\/speech\/[0-9a-f-]+$/i, { timeout: 30000 });

    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await expectBadgeToast(page, 'Application Complete');
    await expect(page.getByTestId('badge-pill-applicationComplete')).toBeVisible({
      timeout: 20000,
    });
  });
});
