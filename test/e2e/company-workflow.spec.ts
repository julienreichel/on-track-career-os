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

  test('1. Create company from research notes', async ({ page }) => {
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

    await page.getByRole('button', { name: /save company/i }).click();
    await expect(page).toHaveURL(/\/companies\/[0-9a-f-]+$/i, { timeout: 60000 });
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('company-analyze-button')).toBeVisible({ timeout: 60000 });
    companyDetailUrl = page.url();
  });

  test('2. Analyze company and generate canvas', async ({ page }) => {
    expect(companyDetailUrl).toBeTruthy();
    await page.goto(companyDetailUrl!);
    await page.waitForLoadState('networkidle');

    await page.getByTestId('company-analyze-button').click();
    await expect(page.getByTestId('company-productsServices-tags')).toBeVisible();
    await expect(page.getByPlaceholder('https://example.com')).not.toHaveValue('');
    const analyzedNameInput = page.getByPlaceholder('e.g., Atlas Robotics');
    companySearchName = (await analyzedNameInput.inputValue()) || COMPANY_NAME;

    await page.getByRole('button', { name: /generate canvas/i }).click();
    await expect(page.getByTestId('canvas-valuePropositions-tags')).toContainText(/.+/);
    await expect(page.getByTestId('canvas-customerSegments-tags')).toContainText(/.+/);

    const valuePropInput = page.getByTestId('canvas-valuePropositions-input');
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

  test('3. Upload job, link company, and verify navigation', async ({ page }) => {
    expect(companyDetailUrl).toBeTruthy();

    await page.goto('/jobs');
    await page.waitForLoadState('networkidle');
    await page.getByRole('link', { name: /add job/i }).click();
    await expect(page).toHaveURL('/jobs/new');
    await page.waitForLoadState('networkidle');

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(JOB_FIXTURE);
    await page.waitForURL(/\/jobs\/[0-9a-f-]+$/i, { timeout: 60000 });
    jobDetailUrl = page.url();

    const jobTitleInput = page.getByTestId('job-title-input');
    await jobTitleInput.fill(JOB_TITLE);
    const saveJobButton = page.getByTestId('job-save-button');
    await saveJobButton.click();
    await expect(saveJobButton).toBeDisabled({ timeout: 10000 });

    const clearLinkButton = page.getByTestId('job-company-clear');
    await clearLinkButton.click();
    await expect(clearLinkButton).toBeHidden({ timeout: 10000 });

    const selectorSearch = page.getByTestId('company-selector-search');
    await expect(selectorSearch).toBeEnabled({ timeout: 10000 });
    await selectorSearch.fill(companySearchName);
    await page
      .getByTestId('company-selector-option')
      .filter({ hasText: companySearchName })
      .first()
      .click();

    await expect(page.getByTestId('job-company-clear')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: 'View company' })).toBeVisible();

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('link', { name: 'View company' })).toBeVisible();

    await page.getByRole('link', { name: 'View company' }).click();
    await expect(page).toHaveURL(companyDetailUrl!);

    expect(jobDetailUrl).toBeTruthy();
    await page.goto(jobDetailUrl!);
    await expect(page.getByTestId('job-title-input')).toHaveValue(JOB_TITLE);
    await expect(page.getByRole('link', { name: 'View company' })).toBeVisible();
  });
});
