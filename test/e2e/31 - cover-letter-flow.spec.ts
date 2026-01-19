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
    await page.goto('/applications/cover-letters');
    await page.waitForLoadState('networkidle');

    // Verify we're on the cover letters list page
    await expect(page.getByRole('heading', { name: /cover letters/i, level: 1 })).toBeVisible();

    // Create link should be visible (using first since there may be multiple)
    const createButton = page.getByRole('link', { name: /Create cover letter/i }).first();
    await expect(createButton).toBeVisible();
  });

  test('2. Create a new cover letter through single form', async ({ page }) => {
    await page.goto('/applications/cover-letters');
    await page.waitForLoadState('networkidle');

    const createButton = page.getByRole('link', { name: /Create cover letter/i }).first();
    await expect(createButton).toBeVisible();
    await createButton.click();

    // Wait for navigation to the new cover letter form
    await page.waitForURL('/applications/cover-letters/new', { timeout: 10000 });

    // Fill in the name
    const nameInput = page.getByRole('textbox', { name: /Cover Letter Name/i });
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Test Cover Letter for Software Engineer');

    // Optionally add a job description
    const jobTextarea = page.getByRole('textbox', { name: /Job Description/i });
    await jobTextarea.fill(
      'We are looking for a Senior Software Engineer with experience in Node.js and React.'
    );

    // Generate the cover letter directly
    const generateButton = page.getByRole('button', { name: /Generate Cover Letter/i });
    await expect(generateButton).toBeVisible();
    await expect(generateButton).toBeEnabled();

    // Wait a moment for Vue reactivity and form validation to complete
    await page.waitForTimeout(500);

    // Ensure button is focused and ready
    await generateButton.hover();
    await generateButton.click();

    // Wait for generation to complete and navigation to the cover letter
    await page.waitForURL(/\/applications\/cover-letters\/[0-9a-f-]+$/i, { timeout: 30000 });

    // Store the URL for later tests
    coverLetterUrl = page.url();
    expect(coverLetterUrl).toMatch(/\/applications\/cover-letters\/[0-9a-f-]+$/i);
  });

  test('3. Verify cover letter has generated content', async ({ page }) => {
    if (!coverLetterUrl) {
      test.skip(true, 'No cover letter URL available');
      return;
    }

    await page.goto(coverLetterUrl);
    await page.waitForLoadState('networkidle');

    // Verify the cover letter name is displayed in the header
    await expect(
      page.getByRole('heading', { name: /Test Cover Letter for Software Engineer/i, level: 1 })
    ).toBeVisible();

    // Check that content has been generated (should be in view mode by default)
    const content = page.locator('.doc-markdown');
    await expect(content).toBeVisible();
    await expect(content).not.toBeEmpty();

    // Verify actions are available at the bottom (matching CV pattern)
    await expect(page.getByRole('button', { name: 'Print', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit', exact: true })).toBeVisible();
  });

  test('4. Switch to edit mode and verify textarea appears', async ({ page }) => {
    if (!coverLetterUrl) {
      test.skip(true, 'No cover letter URL available');
      return;
    }

    await page.goto(coverLetterUrl);
    await page.waitForLoadState('networkidle');

    // Click edit button to switch to edit mode
    const editButton = page.getByRole('button', { name: 'Edit', exact: true });
    await expect(editButton).toBeVisible();
    await editButton.click();

    // Wait for edit mode to activate
    await expect(page.getByRole('heading', { name: /Edit Mode/i })).toBeVisible();

    // Verify textarea is visible in edit mode
    const contentTextarea = page.getByRole('textbox', { name: /Cover Letter Content/i });
    await expect(contentTextarea).toBeVisible();

    // Verify content is populated in textarea
    const content = await contentTextarea.inputValue();
    expect(content.length).toBeGreaterThan(50); // Should have generated content

    // Verify save/cancel buttons are available
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeVisible();
  });

  test('5. Edit content and save changes', async ({ page }) => {
    if (!coverLetterUrl) {
      test.skip(true, 'No cover letter URL available');
      return;
    }

    await page.goto(coverLetterUrl);
    await page.waitForLoadState('networkidle');

    // Switch to edit mode
    const editButton = page.getByRole('button', { name: 'Edit', exact: true });
    await editButton.click();

    await expect(page.getByRole('heading', { name: /Edit Mode/i })).toBeVisible();

    const contentTextarea = page.getByRole('textbox', { name: /Cover Letter Content/i });

    // Get current content and add some text
    const originalContent = await contentTextarea.inputValue();
    const editedContent = originalContent + '\n\nEdited at ' + Date.now();

    // Clear and fill with edited content
    await contentTextarea.clear();
    await contentTextarea.fill(editedContent);

    // Save the changes
    const saveButton = page.getByRole('button', { name: 'Save', exact: true });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // Wait for save to complete - success toast appears and returns to view mode
    await expect(page.getByText('Cover letter saved', { exact: true })).toBeVisible({
      timeout: 10000,
    });

    // Should return to view mode
    await expect(page.locator('.doc-markdown')).toBeVisible();
  });

  test('6. Verify persistence and navigate back to list', async ({ page }) => {
    if (!coverLetterUrl) {
      test.skip(true, 'No cover letter URL available');
      return;
    }

    // Navigate away and back to verify persistence
    await page.goto('/applications/cover-letters');
    await page.waitForLoadState('networkidle');

    await page.goto(coverLetterUrl);
    await page.waitForLoadState('networkidle');

    // Switch to edit mode to check content persisted
    const editButton = page.getByRole('button', { name: 'Edit', exact: true });
    await editButton.click();

    const contentTextarea = page.getByRole('textbox', { name: /Cover Letter Content/i });
    const persistedValue = await contentTextarea.inputValue();

    // Verify the edited content persisted
    expect(persistedValue).toContain('Edited at');

    // Go back to view mode
    const cancelButton = page.getByRole('button', { name: 'Cancel', exact: true });
    await cancelButton.click();

    // Navigate back to the list
    await page.getByRole('link', { name: /Back to list/i }).click();
    await page.waitForURL('/applications/cover-letters');

    // Verify our cover letter appears in the list with correct name
    await expect(
      page.getByRole('heading', { name: /Test Cover Letter for Software Engineer/i })
    ).toBeVisible();
  });

  test('7. Delete cover letter', async ({ page }) => {
    if (!coverLetterUrl) {
      test.skip(true, 'No cover letter URL available');
      return;
    }

    // Go to the list page where delete functionality exists
    await page.goto('/applications/cover-letters');
    await page.waitForLoadState('networkidle');

    // Verify our cover letter is visible
    await expect(
      page.getByRole('heading', { name: /Test Cover Letter for Software Engineer/i })
    ).toBeVisible();

    // Find the delete button directly (it's visible in the page snapshot)
    const deleteButton = page.getByRole('button', { name: 'Delete', exact: true }).first();
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();

    // Confirm deletion in modal
    const modal = page.getByRole('dialog', { name: 'Delete cover letter' });
    const confirmDeleteButton = modal.getByRole('button', { name: 'Delete', exact: true });
    await expect(confirmDeleteButton).toBeVisible();
    await confirmDeleteButton.click();

    await expect(page.getByText('Cover letter deleted', { exact: true })).toBeVisible();

    // Cover letter should no longer appear in list
    await expect(
      page.getByRole('heading', { name: /Test Cover Letter for Software Engineer/i })
    ).not.toBeVisible();
  });
});
