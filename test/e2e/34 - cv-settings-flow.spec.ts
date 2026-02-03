import { test, expect } from '@playwright/test';

test.describe('CV Settings & Templates (EPIC 3C)', () => {
  test.describe.configure({ mode: 'serial' });

  let templateId: string | null = null;

  test('updates settings and persists them', async ({ page }) => {
    await page.goto('/settings/cv');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /cv settings/i })).toBeVisible();

    const saveButton = page.getByRole('button', { name: /^save$/i });
    await expect(saveButton).toBeVisible({ timeout: 20000 });
    await expect(saveButton).toBeEnabled();

    const skillsCheckbox = page.getByRole('checkbox', { name: /skills/i });
    await expect(skillsCheckbox).toBeVisible();
    const wasChecked = await skillsCheckbox.isChecked();
    await skillsCheckbox.click();

    await saveButton.scrollIntoViewIfNeeded();
    await expect(saveButton).toBeEnabled();
    const saveResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/graphql') &&
        response.request().method() === 'POST' &&
        response.ok()
    );
    await saveButton.click();
    await saveResponse;

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(skillsCheckbox).toBeVisible();
    await expect(skillsCheckbox).toBeChecked({ checked: !wasChecked });
  });

  test('creates a template from a system base', async ({ page }) => {
    await page.goto('/settings/cv');
    await page.waitForLoadState('networkidle');

    const createTemplateButton = page.getByRole('button', { name: /create template/i }).first();
    await expect(createTemplateButton).toBeVisible();
    await createTemplateButton.click();

    const systemTemplateButton = page.getByRole('button', { name: /classic/i });
    await expect(systemTemplateButton).toBeVisible();
    await systemTemplateButton.click();

    await expect(page).toHaveURL(/\/settings\/cv\/[0-9a-f-]+$/i);
    const templateIdMatch = page.url().match(/\/settings\/cv\/([0-9a-f-]+)$/i);
    expect(templateIdMatch).toBeTruthy();
    templateId = templateIdMatch?.[1] ?? null;
    expect(templateId).toBeTruthy();
  });

  test('generates a preview for the template', async ({ page }) => {
    expect(templateId).toBeTruthy();
    if (!templateId) return;

    await page.goto(`/settings/cv/${templateId}`);
    await page.waitForLoadState('networkidle');

    const previewButton = page.getByRole('button', { name: /show preview/i });
    await expect(previewButton).toBeVisible();
    await previewButton.click();

    const previewContent = page.locator('.doc-markdown').first();
    await expect(previewContent).toBeVisible({ timeout: 30000 });
    await expect(previewContent).not.toBeEmpty();
  });

  test('sets the template as default and reflects it in settings', async ({ page }) => {
    expect(templateId).toBeTruthy();
    if (!templateId) return;

    await page.goto(`/settings/cv/${templateId}`);
    await page.waitForLoadState('networkidle');

    const setDefaultButton = page.getByRole('button', { name: /set as default/i });
    if (await setDefaultButton.isEnabled()) {
      await setDefaultButton.click();
    }

    const backButton = page.getByRole('link', { name: /back to templates/i });
    await expect(backButton).toBeVisible();
    await backButton.click();
    await expect(page).toHaveURL(/\/settings\/cv$/);

    const templateCard = page.getByTestId(`cv-template-${templateId}`);
    await expect(templateCard).toBeVisible();
    await expect(templateCard).toContainText(/default/i);
  });
});
