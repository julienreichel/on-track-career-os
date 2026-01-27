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
const COMPANY_UPLOAD_TEXT = [
  COMPANY_NAME,
  'Acme Systems builds AI workflow tooling for mid-market logistics teams.',
  'Products: Orchestrator platform, Insight Dashboard, Automation SDK.',
  'Markets: North America, EU ecommerce operations, healthcare logistics.',
  'Customers include DHL Innovation Hub and FastShip Labs.',
  'Website: https://acme-systems.test',
  'Strategy: Expand integrations with WMS providers.',
  'Compliance: SOC2 Type II and ISO27001.',
  'Financials: 40% YoY growth, 120 enterprise customers.',
  'Team: 180 employees across Zurich, Berlin, and Toronto.',
  'Competitive landscape: FastShip Labs, LogiFlow, ParcelMind.',
  'Value prop: Reduce fulfillment costs by 18% on average.',
  'Go-to-market: Partner-led and product-led motions.',
  'Ops focus: automation, reliability, and auditability.',
  'Research notes: '.padEnd(120, 'x'),
  'Additional notes: '.padEnd(120, 'y'),
].join('\n');

test.describe('Company workflow', () => {
  test.describe.configure({ mode: 'serial' });

  let companyDetailUrl: string | null = null;
  let jobDetailUrl: string | null = null;
  let companySearchName = COMPANY_NAME;

  test('creates company from upload', async ({ page }) => {
    await page.goto('/companies');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Companies', level: 1 })).toBeVisible();
    await page.getByRole('link', { name: /add company/i }).click();
    await expect(page).toHaveURL('/companies/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: `company-${timestamp}.txt`,
      mimeType: 'text/plain',
      buffer: Buffer.from(COMPANY_UPLOAD_TEXT),
    });
    await expect(page).toHaveURL(/\/companies\/[0-9a-f-]+$/i, { timeout: 60000 });
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: COMPANY_NAME, level: 1 })).toBeVisible({
      timeout: 20000,
    });
    companyDetailUrl = page.url();
    companySearchName = COMPANY_NAME;
  });

  test('shows uploaded notes in edit mode', async ({ page }) => {
    expect(companyDetailUrl).toBeTruthy();
    await page.goto(companyDetailUrl!);
    await page.waitForLoadState('networkidle');

    await page
      .getByRole('button', { name: /^Edit$/i })
      .first()
      .click();
    const notesInput = page.getByLabel('Research notes');
    await expect(notesInput).toBeVisible({ timeout: 10000 });
    await expect(notesInput).toHaveValue(new RegExp(COMPANY_NAME));
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

    await page.getByRole('button', { name: /save/i }).click();
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
