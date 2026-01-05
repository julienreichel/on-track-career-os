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

    // Create button should be visible (using first since there may be multiple)
    const createButton = page.getByRole('button', { name: /Create speech/i }).first();
    await expect(createButton).toBeVisible();
  });

  test('2. Create a new speech block', async ({ page }) => {
    await page.goto('/speech');
    await page.waitForLoadState('networkidle');

    const createButton = page.getByRole('button', { name: /Create speech/i }).first();
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

    // Verify all three sections are visible by their labels
    await expect(page.getByRole('heading', { name: 'Elevator pitch' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Career story' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Why me' })).toBeVisible();

    // Generate button should be visible
    const generateButton = page.getByRole('button', { name: /Generate speech|Regenerate speech/i });
    await expect(generateButton).toBeVisible();
    await expect(generateButton).toBeEnabled();
  });

  test('4. Generate speech content via AI and verify sections populated', async ({ page }) => {
    if (!speechUrl) {
      test.skip(true, 'No speech URL available');
      return;
    }

    await page.goto(speechUrl);
    await page.waitForLoadState('networkidle');

    // Trigger generation
    const generateButton = page.getByRole('button', { name: /Generate speech|Regenerate speech/i });
    await expect(generateButton).toBeVisible();
    await expect(generateButton).toBeEnabled();
    await generateButton.click();

    // Wait for generation to complete - check if button becomes disabled (may be fast)
    await page.waitForTimeout(500);

    // Wait for generation to finish - button should be enabled when done
    await expect(generateButton).toBeEnabled({ timeout: 90000 });

    // Wait for content to populate and UI to update
    await page.waitForTimeout(2000);

    // Get all three textareas by their test ids (no proper labels on textareas)
    const elevatorPitchTextarea = page.getByTestId('speech-textarea-elevator-pitch');
    const careerStoryTextarea = page.getByTestId('speech-textarea-career-story');
    const whyMeTextarea = page.getByTestId('speech-textarea-why-me');

    // Check that generated content exists
    await expect(elevatorPitchTextarea).not.toHaveValue('');
    await expect(careerStoryTextarea).not.toHaveValue('');
    await expect(whyMeTextarea).not.toHaveValue('');

    // Save the generated content
    const saveButton = page.getByRole('button', { name: 'Save' });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();
    await expect(saveButton).toBeDisabled({ timeout: 10000 });
    await expect(page.getByText('Speech saved', { exact: true })).toBeVisible({ timeout: 5000 });
  });

  test('5. Edit content and verify persistence after reload', async ({ page }) => {
    if (!speechUrl) {
      test.skip(true, 'No speech URL available');
      return;
    }

    await page.goto(speechUrl);
    await page.waitForLoadState('networkidle');

    const elevatorPitchTextarea = page.getByTestId('speech-textarea-elevator-pitch');

    // Get current value and edit it
    const originalValue = await elevatorPitchTextarea.inputValue();
    const editedText = `${originalValue}\n\nEdited at ${Date.now()}`;
    
    // Clear and fill to ensure complete replacement
    await elevatorPitchTextarea.clear();
    await elevatorPitchTextarea.fill(editedText);
    
    // Verify the edit took effect before saving
    await expect(elevatorPitchTextarea).toHaveValue(editedText);

    // Save button should be enabled after edit
    const saveButton = page.getByRole('button', { name: 'Save' });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // Wait for save to complete with longer timeout
    await expect(saveButton).toBeDisabled({ timeout: 15000 });

    // Wait for success toast and let it disappear to ensure save completed
    await expect(page.getByText('Speech saved', { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Speech saved', { exact: true })).not.toBeVisible({ timeout: 10000 });

    // Navigate away and back to verify persistence
    await page.goto('/speech');
    await page.waitForLoadState('networkidle');

    await page.goto(speechUrl);
    await page.waitForLoadState('networkidle');
    
    // Wait for form to fully load before checking content
    await expect(elevatorPitchTextarea).toBeVisible();
    
    // Use retry logic for flaky persistence check
    await expect(async () => {
      const persistedValue = await elevatorPitchTextarea.inputValue();
      expect(persistedValue).toContain('Edited at');
      expect(persistedValue).toBe(editedText);
    }).toPass({ timeout: 10000 });

    // Verify other sections still have content
    const careerStoryTextarea = page.getByTestId('speech-textarea-career-story');
    const whyMeTextarea = page.getByTestId('speech-textarea-why-me');

    await expect(careerStoryTextarea).not.toHaveValue('');
    await expect(whyMeTextarea).not.toHaveValue('');
  });
});
