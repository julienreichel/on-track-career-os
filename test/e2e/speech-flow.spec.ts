import { test, expect } from '@playwright/test';

test.describe('Speech block workflow', () => {
  test('user can create, generate, edit, save, and reopen a speech block', async ({ page }) => {
    // Navigate to speech list
    await page.goto('/speech');
    await page.waitForLoadState('networkidle');

    // Verify we're on the speech list page
    await expect(page.getByRole('heading', { name: /speech/i, level: 1 })).toBeVisible();

    // Create a new speech block - use first() since there may be two create buttons
    const createButton = page.getByTestId('create-speech-button').first();
    await expect(createButton).toBeVisible();
    await createButton.click();

    // Wait for navigation to the speech editor page
    await page.waitForURL(/\/speech\/[0-9a-f-]+$/i, { timeout: 10000 });

    // Verify we're on the editor page - title is "Speech"
    await expect(page.getByRole('heading', { name: 'Speech', level: 1 })).toBeVisible();

    // Verify all three sections are visible
    await expect(page.getByTestId('elevator-pitch-section')).toBeVisible();
    await expect(page.getByTestId('career-story-section')).toBeVisible();
    await expect(page.getByTestId('why-me-section')).toBeVisible();

    // Trigger generation
    const generateButton = page.getByTestId('generate-speech-button');
    await expect(generateButton).toBeVisible();
    await expect(generateButton).not.toBeDisabled();
    await generateButton.click();

    // Wait for generation to complete - button should be disabled during generation
    await expect(generateButton).toBeDisabled({ timeout: 5000 });
    await expect(generateButton).toBeEnabled({ timeout: 90000 });

    // Verify that all three fields are populated after generation
    const elevatorPitchTextarea = page
      .getByTestId('elevator-pitch-section')
      .locator('textarea')
      .first();
    const careerStoryTextarea = page.getByTestId('career-story-section').locator('textarea').first();
    const whyMeTextarea = page.getByTestId('why-me-section').locator('textarea').first();

    // Check that generated content exists
    await expect(elevatorPitchTextarea).not.toHaveValue('');
    await expect(careerStoryTextarea).not.toHaveValue('');
    await expect(whyMeTextarea).not.toHaveValue('');

    // Store the generated elevator pitch for later verification
    const originalElevatorPitch = await elevatorPitchTextarea.inputValue();

    // Edit the elevator pitch section manually
    const editedText = `${originalElevatorPitch}\n\nEdited at ${Date.now()}`;
    await elevatorPitchTextarea.fill(editedText);

    // Save button should be enabled after edit
    const saveButton = page.getByTestId('save-speech-button');
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // Wait for save to complete
    await expect(saveButton).toBeDisabled({ timeout: 10000 });

    // Wait for success toast - use exact text to avoid multiple matches
    await expect(page.getByText('Speech saved', { exact: true })).toBeVisible({ timeout: 5000 });

    // Store the current URL
    const speechUrl = page.url();

    // Navigate away and back to verify persistence
    await page.goto('/speech');
    await page.waitForLoadState('networkidle');

    // Navigate back to the speech block
    await page.goto(speechUrl);
    await page.waitForLoadState('networkidle');

    // Verify the edited content persisted
    await expect(elevatorPitchTextarea).toHaveValue(editedText);
    await expect(careerStoryTextarea).not.toHaveValue('');
    await expect(whyMeTextarea).not.toHaveValue('');
  });
});
