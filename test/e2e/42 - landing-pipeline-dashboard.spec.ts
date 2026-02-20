import { test, expect } from '@playwright/test';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const JOB_FIXTURE = join(__dirname, 'fixtures', 'job-description.txt');

test.describe('Landing pipeline dashboard', () => {
  test('shows renamed stage labels and navigates to pipeline', async ({ page }) => {
    const uniqueTitle = `E2E Landing Job ${Date.now()}`;

    // Ensure Kanban stage rename (applied -> Sent) is persisted.
    await page.goto('/settings/kanban');
    await page.waitForLoadState('networkidle');

    const appliedStageInput = page
      .getByTestId('kanban-stage-row-applied')
      .getByRole('textbox')
      .first();
    const saveSettingsButton = page.getByTestId('kanban-settings-save');
    await expect(appliedStageInput).toBeEditable({ timeout: 10000 });
    await expect(saveSettingsButton).toBeEnabled({ timeout: 10000 });

    await expect(async () => {
      await page.reload();

      const currentValue = await appliedStageInput.inputValue();
      if (currentValue !== 'Sent') {
        await appliedStageInput.fill('Sent');
        await Promise.all([
          page.waitForResponse(
            (response) =>
              response.url().includes('/graphql') &&
              response.request().method() === 'POST' &&
              response.status() === 200
          ),
          saveSettingsButton.click(),
        ]);
      }

      await page.reload();
      await expect(appliedStageInput).toHaveValue('Sent');
    }).toPass({ timeout: 30000 });

    // Create/import job and set deterministic title.
    await page.goto('/jobs/new');
    await page.waitForLoadState('networkidle');
    await page.locator('input[type="file"]').first().setInputFiles(JOB_FIXTURE);

    await page.waitForURL(/\/jobs\/[0-9a-f-]+$/i, { timeout: 30000 });
    await expect(async () => {
      const editButton = page.getByRole('button', { name: /^Edit$/i });
      await expect(editButton).toBeVisible({ timeout: 5000 });
      await editButton.click();
      await expect(page.getByTestId('job-title-input')).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 20000 });

    await page.getByTestId('job-title-input').fill(uniqueTitle);
    await page.getByRole('button', { name: /^Save$/i }).last().click();
    await expect(page.getByRole('button', { name: /^Edit$/i })).toBeVisible({ timeout: 10000 });

    // Move job to the renamed active stage.
    await page.goto('/pipeline');
    await page.waitForLoadState('networkidle');

    const todoColumn = page.getByTestId('kanban-column-todo');
    const sentColumn = page.getByTestId('kanban-column-applied');
    const sentDropzone = page.getByTestId('kanban-dropzone-applied');

    await expect(async () => {
      await page.reload();
      await expect(sentColumn.getByRole('heading', { name: 'Sent' })).toBeVisible({
        timeout: 5000,
      });
    }).toPass({ timeout: 20000 });

    await expect(async () => {
      await page.reload();

      const todoCard = todoColumn
        .locator('[data-testid^="kanban-job-card-"]')
        .filter({ hasText: uniqueTitle })
        .first();

      await expect(todoCard).toBeVisible();
      await todoCard.dragTo(sentDropzone);

      await expect(sentColumn.getByRole('link', { name: uniqueTitle })).toBeVisible();
      await expect(todoColumn.getByRole('link', { name: uniqueTitle })).toHaveCount(0);
    }).toPass({ timeout: 30000 });

    // Validate landing dashboard content.
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('focus-jobs-card')).toContainText(uniqueTitle);
    await expect(page.getByTestId('focus-jobs-card')).toContainText('Sent');
    await expect(page.getByTestId('focus-add-job-link')).toBeVisible({ timeout: 10000 });

    // Navigate to pipeline from landing CTA and back, keeping consistency.
    await page.getByTestId('focus-open-pipeline-link').click();
    await page.waitForURL('**/pipeline', { timeout: 10000 });

    await page.goto('/home');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('focus-jobs-card')).toContainText('Sent');
  });
});
