import { test, expect } from '@playwright/test';
import { createFullExperience } from './utils/storyHelpers';

/**
 * E2E Tests: CV Management (Happy Path)
 *
 * Focus on the main user flow:
 * 1. Ensure an experience exists
 * 2. Complete CV generation wizard
 * 3. Land on CV detail page and verify content
 */

test.describe('CV Generation Workflow', () => {
  test.describe.configure({ mode: 'serial' });

  let cvId: string | null = null;
  let cvName: string | null = null;

  test('should complete CV generation flow', async ({ page }) => {
    const experienceTitle = `E2E CV Wizard Experience ${Date.now()}`;
    const experienceId = await createFullExperience(page, experienceTitle);
    expect(experienceId).not.toBeNull();

    await page.goto('/applications/cv', { waitUntil: 'networkidle' });

    const createCvLink = page.getByRole('link', { name: /Generate cv/i }).first();
    await expect(createCvLink).toBeVisible();
    await createCvLink.click();

    await expect(page).toHaveURL(/\/applications\/cv\/new/);

    const generateButtons = page.getByRole('button', { name: /generate cv/i });
    await expect(generateButtons.first()).toBeVisible();
    await generateButtons.first().click();

    await expect(page).toHaveURL(/\/applications\/cv\/[\w-]+/, { timeout: 30000 });
    await expect(page.getByText(/review and refine your cv details/i)).toBeVisible({
      timeout: 15000,
    });

    const url = page.url();
    const match = url.match(/\/applications\/cv\/([\w-]+)/);
    cvId = match ? match[1] : null;
    expect(cvId).not.toBeNull();

    const heading = page.getByRole('heading', { level: 1 }).first();
    await expect(heading).toBeVisible();
    cvName = (await heading.textContent())?.trim() ?? null;
    expect(cvName).toBeTruthy();
  });

  test('should display generated CV in view mode', async ({ page }) => {
    expect(cvId).toBeTruthy();
    if (!cvId) return;

    await page.goto(`/applications/cv/${cvId}`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.doc-markdown').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /export to pdf|print/i })).toBeVisible();
  });

  test('should edit CV content', async ({ page }) => {
    expect(cvId).toBeTruthy();
    if (!cvId) return;

    await page.goto(`/applications/cv/${cvId}`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Edit', exact: true }).click();
    await expect(page.locator('textarea').first()).toBeVisible();

    const updatedContent = `# Updated CV ${Date.now()}\n\n## Test Section\n\nTest content`;
    await page.locator('textarea').first().fill(updatedContent);
    await page.getByRole('button', { name: /^Save$/i }).click();

    await expect(page.locator('textarea').first()).not.toBeVisible();
    await expect(page.locator('text=Updated CV')).toBeVisible();
  });

  test('should export CV to PDF', async ({ page }) => {
    expect(cvId).toBeTruthy();
    if (!cvId) return;

    await page.goto(`/applications/cv/${cvId}`);
    await page.waitForLoadState('networkidle');

    const popupPromise = page.waitForEvent('popup');
    await page.getByRole('button', { name: /export to pdf|print/i }).click();
    const popup = await popupPromise;
    await expect(popup).toHaveURL(new RegExp(`/applications/cv/${cvId}/print`));
  });

  test('should delete the generated CV', async ({ page }) => {
    expect(cvId).toBeTruthy();
    if (!cvId) return;

    // First verify the CV exists by navigating to it
    await page.goto(`/applications/cv/${cvId}`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: 'Edit', exact: true })).toBeVisible();

    // Get the current CV title from the detail page
    const heading = page.getByRole('heading', { level: 1 }).first();
    await expect(heading).toBeVisible();
    const currentCvName = (await heading.textContent())?.trim() ?? '';

    // Navigate to CV list page
    await page.goto('/applications/cv');
    await page.waitForLoadState('networkidle');

    // Find CV cards by looking for any card that has the CV name and a delete button
    // Use .first() to handle potential duplicates gracefully
    const cardTitle = page.locator('h3').filter({ hasText: currentCvName }).first();
    await expect(cardTitle).toBeVisible({ timeout: 10000 });

    // Find the card container by locating parent that contains both title and delete button
    const cardContainer = page
      .locator('div')
      .filter({ has: cardTitle })
      .filter({ has: page.getByRole('button', { name: /delete/i }) })
      .first();

    // Click delete button in the card
    await cardContainer.getByRole('button', { name: /delete/i }).click();

    // Confirm deletion in modal
    await page.getByRole('button', { name: /^Delete$/i }).click();

    // Wait for deletion to complete - check that we're still on the list page
    await page.waitForLoadState('networkidle');

    // Verify the CV no longer appears or count decreased
    // Using first() to avoid strict mode issues if there were duplicates
    const remainingCards = page.locator('h3').filter({ hasText: currentCvName });
    await expect(remainingCards).toHaveCount(0, { timeout: 5000 });
  });
});
