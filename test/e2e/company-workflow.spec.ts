import { test, expect } from '@playwright/test';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const JOB_FIXTURE = join(__dirname, 'fixtures', 'job-description.txt');

const timestamp = Date.now();
const COMPANY_NAME = `E2E Canvas Company ${timestamp}`;
const JOB_TITLE = `E2E Canvas Job ${timestamp}`;
const CUSTOM_VALUE_PROP = `Custom integration ${timestamp}`;

test.describe('Company workflow', () => {
  test.describe.configure({ mode: 'serial' });

  let companyDetailUrl: string | null = null;
  let jobDetailUrl: string | null = null;
  let companySearchName = COMPANY_NAME;

  test('creates company from research notes', async ({ page }) => {
    await page.goto('/companies');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Companies', level: 1 })).toBeVisible();
    await page.getByRole('link', { name: /add company/i }).click();
    await expect(page).toHaveURL('/companies/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const companyNameInput = page.getByPlaceholder('e.g., Atlas Robotics');
    await companyNameInput.fill(COMPANY_NAME);
    await expect(companyNameInput).toHaveValue(COMPANY_NAME);
    await page
      .getByPlaceholder('Paste raw research notes...')
      .fill(
        [
          'Acme Systems builds AI workflow tooling for mid-market logistics teams.',
          'Products: Orchestrator platform, Insight Dashboard, Automation SDK.',
          'Markets: North America, EU ecommerce operations, healthcare logistics.',
          'Customers include DHL Innovation Hub and FastShip Labs.',
          'Website: https://acme-systems.test',
        ].join('\n')
      );

    await page.getByRole('button', { name: /^Save$/i }).click();
    await expect(page).toHaveURL(/\/companies\/[0-9a-f-]+$/i, { timeout: 60000 });
    await page.waitForLoadState('networkidle');
    await page
      .getByRole('button', { name: /^Edit$/i })
      .first()
      .click();
    await expect(page.getByRole('button', { name: /analyze company info/i })).toBeVisible({
      timeout: 60000,
    });
    companyDetailUrl = page.url();
  });

  test('runs AI analysis for company profile', async ({ page }) => {
    expect(companyDetailUrl).toBeTruthy();
    await page.goto(companyDetailUrl!);
    await page.waitForLoadState('networkidle');

    await page
      .getByRole('button', { name: /^Edit$/i })
      .first()
      .click();
    const analyzeButton = page.getByRole('button', { name: /analyze company info/i });
    const websiteInput = page.getByLabel('Website');

    let analysisSucceeded = false;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await analyzeButton.click();
      try {
        await expect(websiteInput).not.toHaveValue('', { timeout: 5000 });
        analysisSucceeded = true;
        break;
      } catch {
        if (attempt === 0) {
          await page.waitForTimeout(1000);
        }
      }
    }

    expect(analysisSucceeded).toBe(true);

    const analyzedNameInput = page.getByPlaceholder('e.g., Atlas Robotics');
    companySearchName = (await analyzedNameInput.inputValue()) || COMPANY_NAME;
  });

  test('generates company canvas via AI', async ({ page }) => {
    expect(companyDetailUrl).toBeTruthy();
    await page.goto(companyDetailUrl!);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /generate canvas/i }).click();
    const valuePropsSection = page.getByTestId('canvas-valuePropositions');
    await expect(valuePropsSection).toContainText(/.+/);
    const customerSegmentsSection = page.getByTestId('canvas-customerSegments');
    await expect(customerSegmentsSection).toContainText(/.+/);
  });

  test('saves manual canvas edits', async ({ page }) => {
    expect(companyDetailUrl).toBeTruthy();
    await page.goto(companyDetailUrl!);
    await page.waitForLoadState('networkidle');

    await page.getByTestId('company-canvas-edit').click();
    const valuePropInput = page.getByLabel('Value Propositions');
    await valuePropInput.fill(CUSTOM_VALUE_PROP);
    await valuePropInput.press('Enter');
    await expect(page.getByTestId('canvas-valuePropositions-tags')).toContainText(
      CUSTOM_VALUE_PROP
    );

    await page.getByRole('button', { name: /save canvas/i }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('canvas-valuePropositions-tags')).toContainText(
      CUSTOM_VALUE_PROP
    );
  });

  test('uploads job description fixture', async ({ page }) => {
    expect(companyDetailUrl).toBeTruthy();

    await page.goto('/jobs');
    await page.waitForLoadState('networkidle');
    await page.getByRole('link', { name: /add job/i }).click();
    await expect(page).toHaveURL('/jobs/new');
    await page.waitForLoadState('networkidle');

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(JOB_FIXTURE);
    await page.waitForURL(/\/jobs\/[0-9a-f-]+$/i, { timeout: 20000 });
    jobDetailUrl = page.url();

    await expect(async () => {
      const editButton = page.getByRole('button', { name: /^Edit$/i });
      await expect(editButton).toBeVisible({ timeout: 5000 });
      await editButton.scrollIntoViewIfNeeded();
      await editButton.click();
      await expect(page.getByLabel('Job title')).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 20000 });

    const jobTitleInput = page.getByLabel('Job title');
    await jobTitleInput.scrollIntoViewIfNeeded();
    await jobTitleInput.fill(JOB_TITLE);
    await page.waitForTimeout(500);

    await expect(async () => {
      const saveJobButton = page.getByRole('button', { name: /^Save$/i }).last();
      await expect(saveJobButton).toBeVisible({ timeout: 2000 });
      await expect(saveJobButton).toBeEnabled();
      await saveJobButton.scrollIntoViewIfNeeded();
      await saveJobButton.click();
    }).toPass({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /^Edit$/i })).toBeVisible({ timeout: 10000 });
  });

  test('links saved job to analyzed company', async ({ page }) => {
    expect(companyDetailUrl).toBeTruthy();
    expect(jobDetailUrl).toBeTruthy();

    await page.goto(jobDetailUrl!);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /^Edit$/i }).click();

    const clearLinkButton = page.getByRole('button', { name: /clear link/i });
    if (await clearLinkButton.isVisible()) {
      await clearLinkButton.click();
      await expect(clearLinkButton).toBeHidden({ timeout: 10000 });
    }

    const selectorSearch = page.getByPlaceholder(
      'Search companies by name, industry, or market...'
    );
    await expect(selectorSearch).toBeEnabled({ timeout: 10000 });
    await selectorSearch.fill(companySearchName);
    await page
      .getByRole('button', { name: new RegExp(companySearchName, 'i') })
      .first()
      .click();

    await expect(page.getByRole('button', { name: /clear link/i })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole('link', { name: /view company/i })).toBeVisible();

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('link', { name: /view company/i })).toBeVisible();

    await page.getByRole('link', { name: /view company/i }).click();
    
    // Verify we navigated to the correct company by checking the heading
    // (more resilient than exact URL match, especially with concurrent tests)
    await expect(page.getByRole('heading', { name: companySearchName, level: 1 })).toBeVisible({
      timeout: 10000,
    });
    await expect(page).toHaveURL(/\/companies\/[0-9a-f-]+$/i);
  });
});
