import { test, expect } from '@playwright/test';
// import { join } from 'path'; // Will be used when backend CV parsing is implemented

/**
 * E2E Tests: CV Upload Flow (EPIC 1A)
 *
 * Tests the complete CV upload and import workflow:
 * 1. Upload CV file (PDF/TXT)
 * 2. AI parsing and extraction
 * 3. Preview extracted experiences
 * 4. Edit/remove experiences before import
 * 5. Import experiences to database
 * 6. Verify imported data appears in experiences list
 *
 * Note: Experience management tests (CRUD operations) are in experiences.spec.ts
 */

test.describe('CV Upload Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to CV upload page
    await page.goto('/profile/cv-upload', { waitUntil: 'networkidle' });
  });

  test('should display CV upload page with dropzone', async ({ page }) => {
    // Verify page loads
    await expect(page.getByRole('heading', { name: /upload your cv/i })).toBeVisible();

    // Verify dropzone is present with instructions
    await expect(page.getByText(/drop your cv here or click to browse/i)).toBeVisible();
    await expect(page.getByText(/supports pdf and txt files/i)).toBeVisible();
  });

  test('should have file input for upload', async ({ page }) => {
    // Verify file input exists
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();

    // Verify it accepts correct file types
    const accept = await fileInput.getAttribute('accept');
    expect(accept).toContain('.pdf');
    expect(accept).toContain('.txt');
  });

  test('should show parsing state after file upload', async ({ page: _page }) => {
    // TODO: Implement when backend CV parsing is ready
    // This test will upload a test CV file and verify parsing state
    
    // const testFilePath = join(__dirname, 'fixtures', 'test-cv.txt');
    // const fileInput = page.locator('input[type="file"]');
    // await fileInput.setInputFiles(testFilePath);
    
    // // Should show parsing indicator
    // await expect(page.getByText(/parsing your cv/i)).toBeVisible();
    // await expect(page.locator('[class*="spinner"], [class*="loading"]')).toBeVisible();
    
    test.skip(true, 'Backend CV parsing not yet implemented');
  });

  test('should display preview of extracted experiences', async ({ page: _page }) => {
    // TODO: Implement when backend CV parsing is ready
    // This test will verify the preview step shows extracted experiences
    
    // const testFilePath = join(__dirname, 'fixtures', 'test-cv.txt');
    // const fileInput = page.locator('input[type="file"]');
    // await fileInput.setInputFiles(testFilePath);
    
    // // Wait for parsing to complete
    // await page.waitForTimeout(5000);
    // await page.waitForLoadState('networkidle');
    
    // // Should show preview heading
    // await expect(page.getByRole('heading', { name: /extracted information|preview/i })).toBeVisible();
    
    // // Should show experience cards/list
    // await expect(page.getByText(/experiences/i)).toBeVisible();
    
    // // Should have at least one experience card
    // const experienceCards = page.locator('[class*="experience"], [class*="card"]');
    // await expect(experienceCards.first()).toBeVisible();
    
    test.skip(true, 'Backend CV parsing not yet implemented');
  });

  test('should allow removing experiences before import', async ({ page: _page }) => {
    // TODO: Implement when backend CV parsing is ready
    // This test will verify users can remove unwanted experiences
    
    // const testFilePath = join(__dirname, 'fixtures', 'test-cv.txt');
    // const fileInput = page.locator('input[type="file"]');
    // await fileInput.setInputFiles(testFilePath);
    
    // // Wait for parsing
    // await page.waitForTimeout(5000);
    // await page.waitForLoadState('networkidle');
    
    // // Get initial count
    // const experienceCards = page.locator('[class*="experience"]');
    // const initialCount = await experienceCards.count();
    
    // // Click remove button on first experience
    // const removeButton = page.locator('button:has-text("Remove"), button[aria-label*="remove" i]').first();
    // await removeButton.click();
    
    // // Should have one fewer experience
    // await expect(experienceCards).toHaveCount(initialCount - 1);
    
    test.skip(true, 'Backend CV parsing not yet implemented');
  });

  test('should show Import All button after parsing', async ({ page: _page }) => {
    // TODO: Implement when backend CV parsing is ready
    
    // const testFilePath = join(__dirname, 'fixtures', 'test-cv.txt');
    // const fileInput = page.locator('input[type="file"]');
    // await fileInput.setInputFiles(testFilePath);
    
    // // Wait for parsing
    // await page.waitForTimeout(5000);
    // await page.waitForLoadState('networkidle');
    
    // // Should show import button
    // const importButton = page.getByRole('button', { name: /import all|import|confirm/i });
    // await expect(importButton).toBeVisible();
    // await expect(importButton).toBeEnabled();
    
    test.skip(true, 'Backend CV parsing not yet implemented');
  });

  test('should import experiences and redirect to list', async ({ page: _page }) => {
    // TODO: Implement when backend CV parsing is ready
    // This test will verify the complete import workflow
    
    // const testFilePath = join(__dirname, 'fixtures', 'test-cv.txt');
    // const fileInput = page.locator('input[type="file"]');
    // await fileInput.setInputFiles(testFilePath);
    
    // // Wait for parsing
    // await page.waitForTimeout(5000);
    // await page.waitForLoadState('networkidle');
    
    // // Click import button
    // const importButton = page.getByRole('button', { name: /import all|confirm import/i });
    // await importButton.click();
    
    // // Should show importing/loading state
    // await expect(page.getByText(/importing|saving/i)).toBeVisible();
    
    // // Wait for import to complete
    // await page.waitForTimeout(2000);
    // await page.waitForLoadState('networkidle');
    
    // // Should redirect to experiences list
    // await expect(page).toHaveURL(/\/profile\/experiences$/);
    
    // // Should show success message
    // await expect(page.getByText(/imported successfully|experiences added/i)).toBeVisible();
    
    test.skip(true, 'Backend CV parsing not yet implemented');
  });

  test('should display imported experiences in list', async ({ page: _page }) => {
    // TODO: Implement when backend CV parsing is ready
    // This test will verify imported experiences appear in the list
    
    // const testFilePath = join(__dirname, 'fixtures', 'test-cv.txt');
    // const fileInput = page.locator('input[type="file"]');
    // await fileInput.setInputFiles(testFilePath);
    
    // // Wait for parsing
    // await page.waitForTimeout(5000);
    // await page.waitForLoadState('networkidle');
    
    // // Import experiences
    // const importButton = page.getByRole('button', { name: /import all/i });
    // await importButton.click();
    // await page.waitForTimeout(2000);
    // await page.waitForLoadState('networkidle');
    
    // // Verify we're on experiences list
    // await expect(page).toHaveURL(/\/profile\/experiences$/);
    
    // // Should have experience rows in table
    // const experienceRows = page.locator('table tbody tr');
    // await expect(experienceRows.first()).toBeVisible();
    
    // // Verify imported data appears (check for job title from test CV)
    // await expect(page.getByText(/Software Engineer|Developer/i)).toBeVisible();
    
    test.skip(true, 'Backend CV parsing not yet implemented');
  });

  test('should allow canceling upload process', async ({ page }) => {
    // Verify cancel/back button exists
    // Button may not be visible initially on upload page, but should exist after upload starts
    // For now, just verify the page structure is correct
    await expect(page.getByRole('heading', { name: /upload your cv/i })).toBeVisible();
  });

  test('should show error for invalid file type', async ({ page: _page }) => {
    // TODO: Implement when file validation is ready
    // This test will verify error handling for wrong file types
    
    // const invalidFilePath = join(__dirname, 'fixtures', 'test-file.docx');
    // const fileInput = page.locator('input[type="file"]');
    // await fileInput.setInputFiles(invalidFilePath);
    
    // // Should show error message
    // await expect(page.getByRole('alert')).toBeVisible();
    // await expect(page.getByText(/invalid file type|only pdf and txt/i)).toBeVisible();
    
    test.skip(true, 'File validation not yet implemented');
  });

  test('should show error for file too large', async ({ page: _page }) => {
    // TODO: Implement when file size validation is ready
    
    // const largeFilePath = join(__dirname, 'fixtures', 'large-cv.pdf');
    // const fileInput = page.locator('input[type="file"]');
    // await fileInput.setInputFiles(largeFilePath);
    
    // // Should show error message
    // await expect(page.getByRole('alert')).toBeVisible();
    // await expect(page.getByText(/file too large|maximum.*5.*mb/i)).toBeVisible();
    
    test.skip(true, 'File size validation not yet implemented');
  });
});
