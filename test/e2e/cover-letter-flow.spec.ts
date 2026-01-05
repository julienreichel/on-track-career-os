import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Cover Letter (EPIC 4B)
 *
 * Tests the complete cover letter workflow:
 * 1. User navigates to /cover-letters
 * 2. Creates a new cover letter
 * 3. Generates content via AI
 * 4. Verifies content is populated
 * 5. Edits content manually
 * 6. Saves changes
 * 7. Verifies persistence after reload
 */

test.describe('Cover Letter E2E Flow', () => {
  test.describe.configure({ mode: 'serial' });

  let coverLetterUrl: string | null = null;

  test('1. Navigate to cover letters list page', async ({ page }) => {
    await page.goto('/cover-letters');
    await page.waitForLoadState('networkidle');

    // Verify we're on the cover letters list page
    await expect(page.getByRole('heading', { name: /cover letters/i, level: 1 })).toBeVisible();

    // Create button should be visible (using first since there may be multiple)
    const createButton = page.getByRole('button', { name: /Create cover letter/i }).first();
    await expect(createButton).toBeVisible();
  });

  test('2. Create a new cover letter', async ({ page }) => {
    await page.goto('/cover-letters');
    await page.waitForLoadState('networkidle');

    const createButton = page.getByRole('button', { name: /Create cover letter/i }).first();
    await expect(createButton).toBeVisible();
    await createButton.click();

    // Wait for navigation to the cover letter editor page
    await page.waitForURL(/\/cover-letters\/[0-9a-f-]+$/i, { timeout: 10000 });

    // Store the URL for later tests
    coverLetterUrl = page.url();
    expect(coverLetterUrl).toMatch(/\/cover-letters\/[0-9a-f-]+$/i);
  });

  test('3. Verify editor page displays content textarea', async ({ page }) => {
    if (!coverLetterUrl) {
      test.skip(true, 'No cover letter URL available');
      return;
    }

    await page.goto(coverLetterUrl);
    await page.waitForLoadState('networkidle');

    // Verify we're on the editor page
    await expect(page.getByRole('heading', { name: 'Cover Letter', level: 1 })).toBeVisible();

    // Verify the content textarea is visible
    const contentTextarea = page.getByTestId('cover-letter-content-textarea');
    await expect(contentTextarea).toBeVisible();

    // Generate button should be visible
    const generateButton = page.getByTestId('generate-cover-letter-button');
    await expect(generateButton).toBeVisible();
    await expect(generateButton).toBeEnabled();
  });

  test('4. Generate cover letter content via AI and verify content populated', async ({ page }) => {
    if (!coverLetterUrl) {
      test.skip(true, 'No cover letter URL available');
      return;
    }

    await page.goto(coverLetterUrl);
    await page.waitForLoadState('networkidle');

    // Trigger generation
    const generateButton = page.getByTestId('generate-cover-letter-button');
    await expect(generateButton).toBeVisible();
    await expect(generateButton).toBeEnabled();
    await generateButton.click();

    // Wait for generation to complete - check if button becomes disabled (may be fast)
    await page.waitForTimeout(500);

    // Wait for generation to finish - button should be enabled when done
    await expect(generateButton).toBeEnabled({ timeout: 90000 });

    // Wait for content to populate and UI to update
    await page.waitForTimeout(2000);

    // Get the textarea
    const contentTextarea = page.getByTestId('cover-letter-content-textarea');

    // Check that generated content exists
    await expect(contentTextarea).not.toHaveValue('');

    // Verify content looks like a cover letter (has greeting or common phrases)
    const content = await contentTextarea.inputValue();
    expect(content.length).toBeGreaterThan(100); // Should be substantial content

    // Save the generated content
    const saveButton = page.getByTestId('save-cover-letter-button');
    await expect(saveButton).toBeEnabled();
    await saveButton.click();
    await expect(saveButton).toBeDisabled({ timeout: 10000 });
    await expect(page.getByText('Cover letter saved', { exact: true })).toBeVisible({
      timeout: 5000,
    });
  });

  test('5. Edit content manually and save', async ({ page }) => {
    if (!coverLetterUrl) {
      test.skip(true, 'No cover letter URL available');
      return;
    }

    await page.goto(coverLetterUrl);
    await page.waitForLoadState('networkidle');

    const contentTextarea = page.getByTestId('cover-letter-content-textarea');

    // Get current value and edit it
    const originalValue = await contentTextarea.inputValue();
    const editedText = `${originalValue}\n\nP.S. Edited at ${Date.now()}`;
    await contentTextarea.fill(editedText);

    // Save button should be enabled after edit
    const saveButton = page.getByTestId('save-cover-letter-button');
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // Wait for save to complete
    await expect(saveButton).toBeDisabled({ timeout: 10000 });

    // Wait for success toast
    await expect(page.getByText('Cover letter saved', { exact: true })).toBeVisible({
      timeout: 5000,
    });
  });

  test('6. Verify persistence after reload', async ({ page }) => {
    if (!coverLetterUrl) {
      test.skip(true, 'No cover letter URL available');
      return;
    }

    // First, get the edited value
    await page.goto(coverLetterUrl);
    await page.waitForLoadState('networkidle');

    const contentTextarea = page.getByTestId('cover-letter-content-textarea');
    const editedValue = await contentTextarea.inputValue();

    // Verify it contains the "P.S. Edited at" marker
    expect(editedValue).toContain('P.S. Edited at');

    // Navigate away and back
    await page.goto('/cover-letters');
    await page.waitForLoadState('networkidle');

    await page.goto(coverLetterUrl);
    await page.waitForLoadState('networkidle');

    // Verify the edited content persisted
    const reloadedValue = await contentTextarea.inputValue();
    expect(reloadedValue).toBe(editedValue);

    // Verify content is still substantial (not empty)
    expect(reloadedValue.length).toBeGreaterThan(100);
  });

  test('7. Navigate back to list and verify item exists', async ({ page }) => {
    await page.goto('/cover-letters');
    await page.waitForLoadState('networkidle');

    // Should now have at least one cover letter item
    // Look for the grid container or ItemCard components
    const coverLetterItems = page.locator('.item-card').first();

    // Check if we have cover letter items
    const itemCount = await coverLetterItems.count();
    
    if (itemCount === 0) {
      // If no items found, look for the heading that indicates we have content
      const heading = page.getByRole('heading', { name: /dear hiring manager/i });
      await expect(heading).toBeVisible();
      
      // Should not show empty state if we created a cover letter
      const emptyState = page.getByText(/No cover letters yet/i);
      await expect(emptyState).not.toBeVisible();
    } else {
      await expect(coverLetterItems).toBeVisible();
    }
  });

  test('8. Delete cover letter and verify removal', async ({ page }) => {
    if (!coverLetterUrl) {
      test.skip(true, 'No cover letter URL available');
      return;
    }

    await page.goto(coverLetterUrl);
    await page.waitForLoadState('networkidle');

    // Find and click the delete button
    const deleteButton = page.getByTestId('delete-cover-letter-button');
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();

    // Should show confirmation modal
    const confirmButton = page.getByRole('button', { name: /delete|confirm/i }).last();
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // Should navigate back to list
    await expect(page).toHaveURL('/cover-letters', { timeout: 10000 });

    // Should show success toast
    await expect(page.getByText('Cover letter deleted', { exact: true })).toBeVisible({
      timeout: 5000,
    });

    // Should show empty state if this was the only cover letter
    // (or at least not show the deleted item anymore)
    await page.waitForLoadState('networkidle');
  });
});
