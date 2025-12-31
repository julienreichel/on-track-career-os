import { expect, type Page } from '@playwright/test';

/**
 * Shared helper utilities for experience + story creation flows used in
 * Playwright specs. These functions intentionally drive the UI the same way a
 * user would so we can reuse them across multiple end-to-end suites.
 */

export async function createExperience(
  page: Page,
  title: string,
  withFullData: boolean = false
): Promise<string | null> {
  await page.goto('/profile/experiences/new');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Fill required fields
  await page.locator('input[placeholder*="Senior Software Engineer"]').fill(title);
  await page.locator('input[type="date"]').first().fill('2024-01-01');

  // Fill optional fields if full data requested
  if (withFullData) {
    await page
      .locator('textarea[placeholder*="responsibility"]')
      .fill(
        'Led development team of 5 engineers\nArchitected cloud migration strategy\nImplemented CI/CD pipelines'
      );

    await page
      .locator('textarea[placeholder*="task"]')
      .fill(
        'Migrated legacy system to microservices reducing costs by 40%\nImplemented automated testing increasing coverage to 85%\nReduced deployment time from 2 hours to 15 minutes'
      );
  }

  // Scroll to bottom to see Save button
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);

  // Save the experience
  await page.locator('button[type="submit"]:has-text("Save Experience")').click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Navigate to experiences list to find the created experience by title
  await page.goto('/profile/experiences');
  await expect(page).toHaveURL(/\/profile\/experiences/);
  await expect(page.locator('h1', { hasText: 'Experiences' })).toBeVisible();

  const experienceCard = page
    .locator('[data-testid="experience-card"]')
    .filter({ hasText: title })
    .first();
  await expect(experienceCard).toBeVisible();

  await experienceCard.getByRole('button', { name: /Edit/i }).click();
  await page.waitForLoadState('domcontentloaded');

  await expect(page).toHaveURL(/\/profile\/experiences\/[a-f0-9-]+$/);

  // Extract experience ID from URL
  const url = page.url();
  const match = url.match(/\/experiences\/([a-f0-9-]+)/);
  return match ? match[1] : null;
}

export async function createFullExperience(page: Page, title: string): Promise<string | null> {
  return createExperience(page, title, true);
}

export async function createManualStory(
  page: Page,
  experienceId: string,
  content?: string
): Promise<{ saved: boolean; title: string | null }> {
  try {
    await page.goto(`/profile/experiences/${experienceId}/stories/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check if we're on a valid page (not 404)
    const has404 = (await page.locator('text=/404|not found/i').count()) > 0;
    if (has404) {
      console.warn('Story creation page not found (404) - feature not yet implemented');
      return { saved: false, title: null };
    }

    // Step 1: Click on "Manual Entry" mode
    const manualEntryButton = page.getByRole('heading', { name: /Manual Entry/i });
    await manualEntryButton.click();
    await page.waitForTimeout(500);

    // Check if STAR form fields exist
    const textareaCount = await page.locator('textarea').count();
    if (textareaCount < 4) {
      console.warn('STAR form fields not found - form may not be ready');
      return { saved: false, title: null };
    }

    // Step 2: Fill Story Title and all STAR fields (required to enable Save button)
    const storyTitle = `E2E Story ${Date.now()}`;
    await page.getByLabel(/Story Title/i).fill(storyTitle);
    await page.getByLabel(/Situation/i).fill('System performance degradation affecting users.');
    await page.getByLabel(/Task/i).fill('Improve system reliability and reduce response time.');
    await page
      .getByLabel(/Action/i)
      .fill(
        content || 'Implemented monitoring, optimized database queries, scaled infrastructure.'
      );
    await page
      .getByLabel(/Result/i)
      .fill('Reduced response time by 60%, improved uptime to 99.9%, better user satisfaction.');

    // Wait for form validation
    await page.waitForTimeout(300);

    // Scroll to bottom to see Save button
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    // Step 3: Save the story
    const saveButton = page.getByRole('button', { name: /Save/i });
    await saveButton.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    return { saved: true, title: storyTitle };
  } catch (error) {
    console.error('Error creating manual story:', error);
    return { saved: false, title: null };
  }
}
