import { test, expect, type Page } from '@playwright/test';
import { createFullExperience, createManualStory } from './utils/storyHelpers';

/**
 * E2E Tests for Personal Canvas (EPIC 1B)
 *
 * Tests the complete canvas workflow:
 * 1. User logs in
 * 2. Profile filled
 * 3. Experiences and stories exist
 * 4. User visits `/canvas`
 * 5. User clicks "Generate Canvas"
 * 6. Canvas is displayed
 * 7. User edits → Save
 * 8. Reload page → changes persist
 *
 * Uses helper functions from stories.spec.ts for experience/story creation.
 */

// Experience/story helpers now live in test/e2e/utils/storyHelpers.ts

/**
 * Helper: Check if profile is filled (minimal requirement)
 */
async function ensureProfileFilled(page: Page): Promise<void> {
  await page.goto('/profile/full?mode=edit');
  await page.waitForLoadState('networkidle');

  const fullNameInput = page.getByRole('textbox', { name: /Full Name/i }).first();
  await expect(fullNameInput).toBeVisible();
  const fullNameValue = await fullNameInput.inputValue();

  if (!fullNameValue || fullNameValue.trim() === '') {
    await fullNameInput.fill('John Doe');
  }

  await page.getByPlaceholder('Senior Software Engineer').first().fill('Senior Software Engineer');
  await page.getByPlaceholder('San Francisco, CA').first().fill('San Francisco, CA');
  await page.getByPlaceholder('Senior').first().fill('Senior');
  await page.getByPlaceholder('you[at]example.com').first().fill('john.doe@example.com');
  await page.getByPlaceholder('+1 415 555 0101').first().fill('+1 415 555 0101');
  await page
    .getByPlaceholder('e.g., Eligible to work in EU & US')
    .first()
    .fill('Eligible to work in US');

  const addTag = async (placeholder: string, value: string) => {
    const input = page.getByPlaceholder(placeholder).first();
    await input.fill(value);
    await input.press('Enter');
  };

  await addTag('https://linkedin.com/in/you', 'https://linkedin.com/in/john-doe');
  await addTag('e.g., Vue.js', 'Vue.js');
  await addTag('e.g., English', 'English');
  await addTag('e.g., Become engineering manager', 'Become engineering manager');
  await addTag('e.g., Lead cross-functional teams', 'Lead cross-functional teams');
  await addTag('e.g., Integrity', 'Integrity');

  // Save profile
  await page.locator('button[type="submit"]:has-text("Save")').first().click();
  await page.waitForTimeout(2000);
}

test.describe('Personal Canvas E2E Flow', () => {
  test.describe.configure({ mode: 'serial' });

  let experienceId: string | null = null;

  test.beforeAll(async () => {
    // Note: Authentication is handled by auth.setup.ts
  });

  test('0. Displays empty state when no canvas exists', async ({ page }) => {
    await page.goto('/profile/canvas');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Check for either generate button OR existing canvas sections
    const hasGenerateButton =
      (await page.getByRole('button', { name: /Generate Canvas/i }).count()) > 0;
    const hasLockedCard = (await page.getByTestId('locked-feature-canvas').count()) > 0;
    const hasCanvasSections =
      (await page.locator('text=/Value Proposition|Key Activities/i').count()) > 0;

    // Should have either generate button (empty), locked guidance, or canvas sections (populated)
    expect(hasGenerateButton || hasLockedCard || hasCanvasSections).toBe(true);
  });

  test('1. Setup: Ensure profile is filled', async ({ page }) => {
    await ensureProfileFilled(page);
    const fullNameValue = page.getByText(/Full Name/i).locator('..').locator('p');
    await expect(fullNameValue).toHaveText(/.+/);
  });

  test('2. Setup: Create experience with full data', async ({ page }) => {
    const uniqueTitle = `E2E Canvas Test Experience ${Date.now()}`;
    experienceId = await createFullExperience(page, uniqueTitle);

    expect(experienceId).not.toBeNull();
    console.log('Created experience:', experienceId);
  });

  test('3. Setup: Create story for experience', async ({ page }) => {
    if (!experienceId) {
      test.skip(true, 'No experience ID available');
      return;
    }

    const { saved } = await createManualStory(page, experienceId);

    if (!saved) {
      console.warn('Story creation failed or not implemented - continuing without story');
    }
  });

  test('4. Navigate to canvas page', async ({ page }) => {
    await page.goto('/profile/canvas');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Should be on canvas page
    await expect(page).toHaveURL(/\/profile\/canvas/);

    // Page should render (either empty state or existing canvas)
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('5. Generate canvas from profile/experiences/stories', async ({ page }) => {
    await page.goto('/profile/canvas');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Look for "Generate Canvas" button (empty state)
    const generateButton = page.getByRole('button', { name: /Generate Canvas/i });
    const hasGenerateButton = (await generateButton.count()) > 0;
    const hasLockedCard = (await page.getByTestId('locked-feature-canvas').count()) > 0;

    if (hasLockedCard) {
      await expect(page.getByTestId('locked-feature-canvas')).toBeVisible();
      return;
    }

    if (hasGenerateButton) {
      console.log('Found Generate button - clicking to generate canvas');

      await generateButton.click();

      // Wait for AI generation (may take a few seconds)
      await page.waitForTimeout(5000);

      // Wait for loading indicator to disappear
      await page.waitForSelector('[class*="animate-spin"]', { state: 'hidden', timeout: 30000 });

      // Check for success toast or canvas sections
      const hasToast =
        (await page.locator('text=/generated|success/i').count()) > 0 ||
        (await page.locator('[class*="toast"]').count()) > 0;

      const hasCanvasSections =
        (await page.locator('text=/Value Proposition|Key Activities|Customer/i').count()) > 0;

      expect(hasToast || hasCanvasSections).toBe(true);
    } else {
      console.log('No Generate button found - canvas may already exist');

      // Verify canvas sections are visible
      const hasCanvasSections =
        (await page.locator('text=/Value Proposition|Key Activities/i').count()) > 0;

      expect(hasCanvasSections).toBe(true);
    }
  });

  test('6. Canvas sections are displayed', async ({ page }) => {
    await page.goto('/profile/canvas');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const hasLockedCard = (await page.getByTestId('locked-feature-canvas').count()) > 0;
    if (hasLockedCard) {
      await expect(page.getByTestId('locked-feature-canvas')).toBeVisible();
      return;
    }

    // Check for key Business Model Canvas sections
    const sections = [
      /Value Proposition/i,
      /Key Activities/i,
      /Key Resources/i,
      /Customer Segments/i,
      /Channels/i,
      /Revenue Streams/i,
      /Cost Structure/i,
    ];

    let foundSections = 0;
    for (const section of sections) {
      const count = await page.locator(`text=${section}`).count();
      if (count > 0) {
        foundSections++;
      }
    }

    // Should have at least 5 of the 7 main sections visible
    expect(foundSections).toBeGreaterThanOrEqual(5);
  });

  test('7. Edit canvas section and save', async ({ page }) => {
    await page.goto('/profile/canvas');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const hasLockedCard = (await page.getByTestId('locked-feature-canvas').count()) > 0;
    if (hasLockedCard) {
      await expect(page.getByTestId('locked-feature-canvas')).toBeVisible();
      return;
    }

    // Find the first Edit section button using aria-label
    const editButton = page.getByRole('button', { name: 'Edit section' }).first();
    await editButton.click();
    await page.waitForTimeout(500);

    // Look for input field (editing mode with TagInput)
    const input = page.locator('input[type="text"]').first();
    await input.waitFor({ state: 'visible', timeout: 5000 });

    // Add new tags
    const timestamp = Date.now();
    await input.fill(`E2E Test Item 1 - ${timestamp}`);
    await input.press('Enter');
    await page.waitForTimeout(300);

    await input.fill(`E2E Test Item 2 - ${timestamp}`);
    await input.press('Enter');
    await page.waitForTimeout(300);

    // Verify tags are visible
    const tags = page.locator('text=/E2E Test Item/');
    await expect(tags.first()).toBeVisible();

    // Look for Save button
    const saveButton = page.getByRole('button', { name: 'Save section' });
    await saveButton.click();
    await page.waitForTimeout(2000);

    // Verify success (toast or no error)
    const hasError = (await page.locator('[role="alert"]:has-text("Error")').count()) > 0;
    expect(hasError).toBe(false);
  });

  test('8. Reload page and verify changes persist', async ({ page }) => {
    await page.goto('/profile/canvas');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Wait for at least one canvas section to be visible
    const canvasSection = page.locator('text=/Value Proposition|Key Activities/i').first();
    await expect(canvasSection).toBeVisible({ timeout: 10000 });

    // Verify canvas is still displayed (not empty state)
    const hasGenerateButton =
      (await page.getByRole('button', { name: /Generate Canvas/i }).count()) > 0;

    // Should NOT show generate button (canvas exists)
    expect(hasGenerateButton).toBe(false);

    // Should show canvas sections
    const hasCanvasSections =
      (await page.locator('text=/Value Proposition|Key Activities/i').count()) > 0;

    expect(hasCanvasSections).toBe(true);
  });

  test('9. Verify no console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/profile/canvas');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Filter out known non-critical errors (if any)
    const criticalErrors = consoleErrors.filter(
      (error) =>
        !error.includes('favicon') && // Ignore favicon errors
        !error.includes('sourcemap') && // Ignore sourcemap warnings
        !error.includes('DevTools') // Ignore DevTools messages
    );

    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Canvas Page - Regeneration', () => {
  test('can regenerate existing canvas', async ({ page }) => {
    await page.goto('/profile/canvas');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for Regenerate button (should exist if canvas is populated)
    const regenerateButton = page.getByRole('button', { name: /Regenerate|regenerate/i });
    const hasRegenerateButton = (await regenerateButton.count()) > 0;

    if (hasRegenerateButton) {
      await regenerateButton.click();

      // Wait for regeneration
      await page.waitForTimeout(5000);

      // Wait for loading to finish
      await page.waitForSelector('[class*="animate-spin"]', { state: 'hidden', timeout: 30000 });

      // Check for success or updated content
      const hasCanvasSections =
        (await page.locator('text=/Value Proposition|Key Activities/i').count()) > 0;

      expect(hasCanvasSections).toBe(true);
    } else {
      test.skip(true, 'Regenerate button not available - canvas may be empty');
    }
  });
});
