import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Speech Block (EPIC 4)
 *
 * Tests the complete speech block workflow:
 * 1. User navigates to /speech
 * 2. Creates a new speech block
 * 3. Generates content via AI
 * 4. Verifies all 3 sections populated
 * 5. Edits a section manually
 * 6. Saves changes
 * 7. Verifies persistence after reload
 */

test.describe('Speech Block E2E Flow', () => {
  test.describe.configure({ mode: 'serial' });

  let speechUrl: string | null = null;

  test('1. Navigate to speech list page', async ({ page }) => {
    await page.goto('/speech');
    await page.waitForLoadState('networkidle');

    // Verify we're on the speech list page
    await expect(page.getByRole('heading', { name: /speech/i, level: 1 })).toBeVisible();

    // Create button should be visible
    const createButton = page.getByTestId('create-speech-button').first();
    await expect(createButton).toBeVisible();
  });

  test('2. Create a new speech block', async ({ page }) => {
    await page.goto('/speech');
    await page.waitForLoadState('networkidle');

    const createButton = page.getByTestId('create-speech-button').first();
    await expect(createButton).toBeVisible();
    await createButton.click();

    // Wait for navigation to the speech editor page
    await page.waitForURL(/\/speech\/[0-9a-f-]+$/i, { timeout: 10000 });

    // Store the URL for later tests
    speechUrl = page.url();
    expect(speechUrl).toMatch(/\/speech\/[0-9a-f-]+$/i);
  });

  test('3. Verify editor page displays all sections', async ({ page }) => {
    if (!speechUrl) {
      test.skip(true, 'No speech URL available');
      return;
    }

    await page.goto(speechUrl);
    await page.waitForLoadState('networkidle');

    // Verify we're on the editor page
    await expect(page.getByRole('heading', { name: 'Speech', level: 1 })).toBeVisible();

    // Verify all three sections are visible
    await expect(page.getByTestId('elevator-pitch-section')).toBeVisible();
    await expect(page.getByTestId('career-story-section')).toBeVisible();
    await expect(page.getByTestId('why-me-section')).toBeVisible();

    // Generate button should be visible
    const generateButton = page.getByTestId('generate-speech-button');
    await expect(generateButton).toBeVisible();
    await expect(generateButton).not.toBeDisabled();
  });

  test('4. Generate speech content via AI and verify sections populated', async ({ page }) => {
    if (!speechUrl) {
      test.skip(true, 'No speech URL available');
      return;
    }

    await page.goto(speechUrl);
    await page.waitForLoadState('networkidle');

    // Trigger generation
    const generateButton = page.getByTestId('generate-speech-button');
    await expect(generateButton).toBeVisible();
    await expect(generateButton).not.toBeDisabled();
    await generateButton.click();

    // Wait for generation to complete - button should be disabled during generation
    await expect(generateButton).toBeDisabled({ timeout: 5000 });
    await expect(generateButton).toBeEnabled({ timeout: 90000 });

    // Wait for content to populate and UI to update
    await page.waitForTimeout(2000);

    // Get all three textareas
    const elevatorPitchTextarea = page
      .getByTestId('elevator-pitch-section')
      .locator('textarea')
      .first();
    const careerStoryTextarea = page
      .getByTestId('career-story-section')
      .locator('textarea')
      .first();
    const whyMeTextarea = page.getByTestId('why-me-section').locator('textarea').first();

    // Check that generated content exists
    await expect(elevatorPitchTextarea).not.toHaveValue('');
    await expect(careerStoryTextarea).not.toHaveValue('');
    await expect(whyMeTextarea).not.toHaveValue('');

    // Save the generated content
    const saveButton = page.getByTestId('save-speech-button');
    await expect(saveButton).toBeEnabled();
    await saveButton.click();
    await expect(saveButton).toBeDisabled({ timeout: 10000 });
    await expect(page.getByText('Speech saved', { exact: true })).toBeVisible({ timeout: 5000 });
  });

  test('5. Edit a section manually and save', async ({ page }) => {
    if (!speechUrl) {
      test.skip(true, 'No speech URL available');
      return;
    }

    await page.goto(speechUrl);
    await page.waitForLoadState('networkidle');

    const elevatorPitchTextarea = page
      .getByTestId('elevator-pitch-section')
      .locator('textarea')
      .first();

    // Get current value and edit it
    const originalValue = await elevatorPitchTextarea.inputValue();
    const editedText = `${originalValue}\n\nEdited at ${Date.now()}`;
    await elevatorPitchTextarea.fill(editedText);

    // Save button should be enabled after edit
    const saveButton = page.getByTestId('save-speech-button');
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // Wait for save to complete
    await expect(saveButton).toBeDisabled({ timeout: 10000 });

    // Wait for success toast
    await expect(page.getByText('Speech saved', { exact: true })).toBeVisible({ timeout: 5000 });
  });

  test('6. Verify persistence after reload', async ({ page }) => {
    if (!speechUrl) {
      test.skip(true, 'No speech URL available');
      return;
    }

    // First, get the edited value
    await page.goto(speechUrl);
    await page.waitForLoadState('networkidle');

    const elevatorPitchTextarea = page
      .getByTestId('elevator-pitch-section')
      .locator('textarea')
      .first();
    const editedValue = await elevatorPitchTextarea.inputValue();

    // Verify it contains the "Edited at" marker
    expect(editedValue).toContain('Edited at');

    // Navigate away and back
    await page.goto('/speech');
    await page.waitForLoadState('networkidle');

    await page.goto(speechUrl);
    await page.waitForLoadState('networkidle');

    // Verify the edited content persisted
    const reloadedValue = await elevatorPitchTextarea.inputValue();
    expect(reloadedValue).toBe(editedValue);

    // Verify other sections still have content
    const careerStoryTextarea = page
      .getByTestId('career-story-section')
      .locator('textarea')
      .first();
    const whyMeTextarea = page.getByTestId('why-me-section').locator('textarea').first();

    await expect(careerStoryTextarea).not.toHaveValue('');
    await expect(whyMeTextarea).not.toHaveValue('');
  });
});
