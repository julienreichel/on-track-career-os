import { test, expect } from '@playwright/test';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const JOB_FIXTURE = join(__dirname, 'fixtures', 'job-description.txt');

test.describe('Pipeline kanban happy path', () => {
  test('ensures defaults, persists stage moves, and captures notes in kanban flow', async ({ page }) => {
    const uniqueTitle = `E2E Pipeline Job ${Date.now()}`;
    const appliedNote = `Applied note ${Date.now()}`;
    const doneNote = `Done note ${Date.now()}`;

    // 1) Ensure default Kanban settings are present for the current user.
    await page.goto('/settings/kanban');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('kanban-stage-row-todo')).toBeVisible();
    await expect(page.getByTestId('kanban-stage-row-applied')).toBeVisible();
    await expect(page.getByTestId('kanban-stage-row-interview')).toBeVisible();
    await expect(page.getByTestId('kanban-stage-row-done')).toBeVisible();

    // 2) Import/create a job and assign a deterministic title for assertions.
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

    // 3) Move card ToDo -> Applied and verify persistence after refresh.
    await page.goto('/pipeline');
    await page.waitForLoadState('networkidle');

    const todoColumn = page.getByTestId('kanban-column-todo');
    const appliedColumn = page.getByTestId('kanban-column-applied');

    const todoCard = todoColumn
      .locator('[data-testid^="kanban-job-card-"]')
      .filter({ hasText: uniqueTitle })
      .first();
    await expect(todoCard).toBeVisible({ timeout: 20000 });

    const appliedDropzone = page.getByTestId('kanban-dropzone-applied');
    await todoCard.dragTo(appliedDropzone);

    await expect(appliedColumn.getByRole('link', { name: uniqueTitle })).toBeVisible({
      timeout: 10000,
    });
    const notifications = page.getByRole('region', { name: /Notifications/i });
    const appliedToast = notifications.getByRole('alert').filter({
      hasText: 'Moved to Applied. Add a note?',
    });
    await expect(appliedToast).toBeVisible({ timeout: 10000 });
    await appliedToast.getByRole('button', { name: /^Add note$/i }).click();

    await expect(page.getByTestId('kanban-note-textarea')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('kanban-note-textarea').fill(appliedNote);
    await page.getByTestId('kanban-note-save').click();
    await expect(page.getByTestId('kanban-note-textarea')).toHaveCount(0);
    await expect(appliedColumn.getByText(appliedNote)).toBeVisible({ timeout: 10000 });

    await expect(todoColumn.getByRole('link', { name: uniqueTitle })).toHaveCount(0);

    const appliedCard = appliedColumn
      .locator('[data-testid^="kanban-job-card-"]')
      .filter({ hasText: uniqueTitle })
      .first();
    const doneDropzone = page.getByTestId('kanban-dropzone-done');
    await appliedCard.dragTo(doneDropzone);

    const doneToast = notifications.getByRole('alert').filter({
      hasText: 'Moved to Done. Capture the outcome?',
    });
    await expect(doneToast).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('kanban-note-textarea')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('kanban-note-textarea').fill(doneNote);
    await page.getByTestId('kanban-note-save').click();
    await expect(page.getByTestId('kanban-note-textarea')).toHaveCount(0);

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('kanban-column-done').getByRole('link', { name: uniqueTitle }))
      .toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('kanban-column-done').getByText(doneNote)).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByTestId('kanban-column-applied').getByRole('link', { name: uniqueTitle }))
      .toHaveCount(0);
    await expect(page.getByTestId('kanban-column-todo').getByRole('link', { name: uniqueTitle }))
      .toHaveCount(0);
  });
});
