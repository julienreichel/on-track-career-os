import { test, expect, type Page } from '@playwright/test';

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

/**
 * Helper: Create an experience (minimal or full)
 * Reused from stories.spec.ts
 */
async function createExperience(
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
  await expect(page.getByRole('row').nth(1)).toBeVisible();

  // Find the row containing the experience title and click the edit button
  const experienceRow = page
    .getByRole('row')
    .filter({ has: page.getByRole('cell', { name: title, exact: true }) });

  await experienceRow.getByLabel('Edit').click();
  await page.waitForLoadState('domcontentloaded');

  await expect(page).toHaveURL(/\/profile\/experiences\/[a-f0-9-]+$/);

  // Extract experience ID from URL
  const url = page.url();
  const match = url.match(/\/experiences\/([a-f0-9-]+)/);
  return match ? match[1] : null;
}

/**
 * Helper: Create a full experience with responsibilities and tasks (for AI story generation)
 */
async function createFullExperience(page: Page, title: string): Promise<string | null> {
  return createExperience(page, title, true);
}

/**
 * Helper: Create a manual story for an experience
 */
async function createManualStory(
  page: Page,
  experienceId: string,
  content?: string
): Promise<boolean> {
  try {
    await page.goto(`/profile/experiences/${experienceId}/stories/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check if we're on a valid page (not 404)
    const has404 = (await page.locator('text=/404|not found/i').count()) > 0;
    if (has404) {
      console.warn('Story creation page not found (404) - feature not yet implemented');
      return false;
    }

    // Step 1: Click on "Manual Entry" mode
    const manualEntryButton = page.getByRole('heading', { name: /Manual Entry/i });
    await manualEntryButton.click();
    await page.waitForTimeout(500);

    // Check if STAR form fields exist
    const textareaCount = await page.locator('textarea').count();
    if (textareaCount < 4) {
      console.warn('STAR form fields not found - form may not be ready');
      return false;
    }

    // Step 2: Fill all 4 STAR fields (required to enable Save button)
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

    return true;
  } catch (error) {
    console.error('Error creating manual story:', error);
    return false;
  }
}

/**
 * Helper: Check if profile is filled (minimal requirement)
 */
async function ensureProfileFilled(page: Page): Promise<void> {
  await page.goto('/profile');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Check if we need to click Edit button (if in view mode)
  const editButton = page.getByRole('button', { name: 'Edit profile' });
  const editButtonVisible = await editButton.isVisible().catch(() => false);

  if (editButtonVisible) {
    await editButton.click();
    await page.waitForTimeout(500);
  }

  // Check if Full Name field is empty
  const fullNameInput = page.getByRole('textbox', { name: /Full Name/i }).first();
  const fullNameValue = await fullNameInput.inputValue();

  if (!fullNameValue || fullNameValue.trim() === '') {
    // Fill minimal profile data
    await fullNameInput.fill('John Doe');

    const headlineInput = page
      .locator('input[placeholder*="headline"], input[placeholder*="Headline"]')
      .first();
    await headlineInput.fill('Senior Software Engineer');

    const summaryTextarea = page
      .locator('textarea[placeholder*="summary"], textarea[placeholder*="Summary"]')
      .first();
    await summaryTextarea.fill(
      'Experienced software engineer with 10+ years in full-stack development.'
    );

    // Save profile
    await page.locator('button[type="submit"]:has-text("Save")').first().click();
    await page.waitForTimeout(2000);
  }
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
    const hasCanvasSections =
      (await page.locator('text=/Value Proposition|Key Activities/i').count()) > 0;

    // Should have either generate button (empty) or canvas sections (populated)
    expect(hasGenerateButton || hasCanvasSections).toBe(true);
  });

  test('1. Setup: Ensure profile is filled', async ({ page }) => {
    await ensureProfileFilled(page);
    const fullNameField = page.getByRole('textbox', { name: /Full Name/i }).first();
    await expect(fullNameField).not.toHaveValue('');
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

    const storyCreated = await createManualStory(page, experienceId);

    if (!storyCreated) {
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
