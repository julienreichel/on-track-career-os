import { test, expect } from '@playwright/test';
import { createFullExperience } from './utils/storyHelpers';

const timestamp = Date.now();
const EXPERIENCE_TITLE = `E2E Stories Experience ${timestamp}`;
const FREE_TEXT_INPUT = `
  I led a cross-functional program to modernize our fulfillment pipelines.
  We were facing 30% month-over-month churn because orders were delayed.
  I mapped the bottlenecks, automated the SLA alerts, and rolled out a reliability playbook.
  As a result, we cut support tickets in half and lifted renewal rates by 25%.
`;
const MANUAL_STORY_TITLE = `Manual KPI Story ${timestamp}`;

test.describe('Story workflow', () => {
  test.describe.configure({ mode: 'serial' });

  let experienceId: string | null = null;
  let freeTextStoryTitle: string | null = null;

  test('creates an experience for story flows', async ({ page }) => {
    experienceId = await createFullExperience(page, EXPERIENCE_TITLE);
    expect(experienceId).toBeTruthy();
  });

  test('auto-generates stories from an experience with achievements and KPIs', async ({ page }) => {
    expect(experienceId).toBeTruthy();
    await page.goto(`/profile/experiences/${experienceId}/stories`);
    await page.waitForLoadState('networkidle');

    const autoGenerateButton = page.getByRole('button', { name: /Auto-generate Stories/i });
    await autoGenerateButton.click();

    const viewButton = page.getByRole('button', { name: /View/i }).first();
    await expect(viewButton).toBeVisible({ timeout: 60000 });
    await viewButton.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.locator('p').first()).not.toHaveText('');
    await expect(dialog.getByRole('heading', { name: /Achievements/i })).toBeVisible();
    await expect(
      dialog.getByRole('heading', { name: /Key Performance Indicators/i })
    ).toBeVisible();

    await dialog
      .getByRole('button', { name: /^Close$/i })
      .last()
      .click();
  });

  test('generates a story from free text with AI achievements and KPIs', async ({ page }) => {
    expect(experienceId).toBeTruthy();
    await page.goto(`/profile/experiences/${experienceId}/stories/new`);
    await page.waitForLoadState('networkidle');

    await page
      .getByRole('heading', { name: /Generate from Free Text/i })
      .first()
      .click();

    const freeTextTextarea = page.getByLabel(/Your Achievement Description/i);
    await freeTextTextarea.fill(FREE_TEXT_INPUT);
    await page.getByRole('button', { name: /Generate from Free Text/i }).click();

    const storyTitleInput = page.getByLabel(/Story Title/i);
    await expect(storyTitleInput).not.toHaveValue('', { timeout: 60000 });
    freeTextStoryTitle = await storyTitleInput.inputValue();

    const kpiTags = page.locator('[data-testid="kpis-tags"]');
    await expect(kpiTags).toBeVisible({ timeout: 60000 });
    await expect(kpiTags).toContainText(/\S/, { timeout: 60000 });

    await page
      .getByRole('button', { name: /^Save$/i })
      .last()
      .click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(new RegExp(`/profile/experiences/${experienceId}/stories$`));
    await expect(page.getByText(freeTextStoryTitle!)).toBeVisible({ timeout: 10000 });
  });

  test('creates a manual STAR story, generates KPIs, and finds it globally', async ({ page }) => {
    expect(experienceId).toBeTruthy();
    await page.goto(`/profile/experiences/${experienceId}/stories/new`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('heading', { name: /Manual Entry/i }).click();

    await page.getByLabel(/Story Title/i).fill(MANUAL_STORY_TITLE);
    await page
      .getByLabel(/Situation/i)
      .fill('Our release cadence stalled because deployments failed weekly.');
    await page
      .getByLabel(/Task/i)
      .fill('Own the modernization program and restore predictable releases.');
    await page
      .getByLabel(/Action/i)
      .fill('Created automated test gates, added observability, and trained squads on SRE.');
    await page
      .getByLabel(/Result/i)
      .fill('Deployment lead time dropped by 70% and customer escalations fell sharply.');

    await page.getByRole('button', { name: /Generate Achievements/i }).click();

    const achievementsTags = page.locator('[data-testid="achievements-tags"]');
    const manualKpiTags = page.locator('[data-testid="kpis-tags"]');
    await expect(achievementsTags).toBeVisible({ timeout: 60000 });
    await expect(manualKpiTags).toBeVisible({ timeout: 60000 });
    await expect(achievementsTags).toContainText(/\S/, { timeout: 60000 });
    await expect(manualKpiTags).toContainText(/\S/, { timeout: 60000 });

    await page
      .getByRole('button', { name: /^Save$/i })
      .last()
      .click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(new RegExp(`/profile/experiences/${experienceId}/stories$`));
    await expect(page.getByText(MANUAL_STORY_TITLE)).toBeVisible({ timeout: 10000 });

    await page.goto('/profile/stories');
    await page.waitForTimeout(500);
    await page.waitForLoadState('networkidle');
    const storiesSearch = page.getByPlaceholder(/Search stories/i);
    await storiesSearch.fill(MANUAL_STORY_TITLE);
    await page.waitForTimeout(500);
    await expect(page.getByRole('heading', { level: 3, name: MANUAL_STORY_TITLE })).toBeVisible({
      timeout: 20000,
    });
  });
});
