<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="document?.name || $t('cvDisplay.untitled')"
        :links="[
          {
            label: $t('cvDisplay.backToCvs'),
            to: '/cv',
            icon: 'i-heroicons-arrow-left',
          },
        ]"
      />

      <UPageBody>
        <!-- Error Alert -->
        <UAlert
          v-if="error"
          color="error"
          icon="i-heroicons-exclamation-triangle"
          :title="$t('common.error')"
          :description="error"
          class="mb-6"
        />

        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="text-center">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-primary mb-4" />
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ $t('cvDisplay.loading') }}
            </p>
          </div>
        </div>

        <!-- Saving State -->
        <div v-else-if="saving" class="flex items-center justify-center py-12">
          <div class="text-center">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-primary mb-4" />
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ $t('cvDisplay.saving') }}
            </p>
          </div>
        </div>

        <!-- Main Content -->
        <div v-else-if="document" class="space-y-6">
          <!-- Edit Mode: Markdown Editor -->
          <UCard v-if="isEditing">
            <div class="space-y-4">
              <div>
                <h3 class="text-lg font-semibold mb-2">
                  {{ $t('cvDisplay.editMode') }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ $t('cvDisplay.markdownHelp') }}
                </p>
              </div>

              <UFormField :label="$t('cvDisplay.contentLabel')" required>
                <UTextarea
                  v-model="editContent"
                  :rows="25"
                  :placeholder="$t('cvDisplay.markdownPlaceholder')"
                  class="font-mono text-sm w-full"
                />
              </UFormField>
            </div>
          </UCard>

          <!-- View Mode: Rendered HTML -->
          <UCard v-else>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div class="prose prose-gray max-w-none" v-html="renderedHtml" />
          </UCard>

          <!-- Action Buttons -->
          <div v-if="isEditing" class="flex justify-end gap-3">
            <UButton :label="$t('common.cancel')" variant="ghost" @click="handleCancel" />
            <UButton
              :label="$t('common.save')"
              icon="i-heroicons-check"
              :disabled="!hasChanges || saving"
              :loading="saving"
              @click="saveEdit"
            />
          </div>
          <div v-else class="flex justify-end gap-3">
            <UButton
              :label="$t('cvDisplay.actions.exportPdf')"
              icon="i-heroicons-arrow-down-tray"
              variant="outline"
              @click="handlePrint"
            />
            <UButton
              :label="$t('cvDisplay.actions.edit')"
              icon="i-heroicons-pencil"
              variant="outline"
              @click="toggleEdit"
            />
          </div>
        </div>

        <!-- Not Found -->
        <UAlert
          v-else-if="!loading"
          color="warning"
          icon="i-heroicons-exclamation-triangle"
          :title="$t('cvDisplay.notFound')"
          :description="$t('cvDisplay.notFoundDescription')"
        />
      </UPageBody>
    </UPage>

    <!-- Unsaved Changes Modal -->
    <UnsavedChangesModal v-model:open="showCancelConfirm" @discard="handleConfirmCancel" />
  </UContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { marked } from 'marked';
import { CVDocumentService } from '@/domain/cvdocument/CVDocumentService';
import type { CVDocument } from '@/domain/cvdocument/CVDocument';

const { t } = useI18n();
const route = useRoute();
const toast = useToast();

const cvId = computed(() => route.params.id as string);

const service = new CVDocumentService();
const document = ref<CVDocument | null>(null);
const loading = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);

const isEditing = ref(false);
const editContent = ref('');
const originalContent = ref('');
const showCancelConfirm = ref(false);

const renderedHtml = computed(() => {
  if (!document.value?.content) return '';
  return marked(document.value.content);
});

const hasChanges = computed(() => {
  return editContent.value !== originalContent.value;
});

const load = async () => {
  loading.value = true;
  error.value = null;

  try {
    document.value = await service.getFullCVDocument(cvId.value);
    if (document.value) {
      editContent.value = document.value.content || '';
      originalContent.value = document.value.content || '';
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load CV';
    console.error('[cvDisplay] Error loading CV:', err);
  } finally {
    loading.value = false;
  }
};

const toggleEdit = () => {
  isEditing.value = true;
  editContent.value = document.value?.content || '';
  originalContent.value = document.value?.content || '';
};

const handleCancel = () => {
  if (hasChanges.value) {
    showCancelConfirm.value = true;
    return;
  }
  isEditing.value = false;
  editContent.value = originalContent.value;
};

const handleConfirmCancel = () => {
  showCancelConfirm.value = false;
  isEditing.value = false;
  editContent.value = originalContent.value;
};

const saveEdit = async () => {
  if (!document.value) return;

  saving.value = true;
  try {
    const updated = await service.updateCVDocument({
      id: document.value.id,
      content: editContent.value,
    });

    if (updated) {
      document.value = updated;
      originalContent.value = editContent.value;
      isEditing.value = false;
      toast.add({
        title: t('cvDisplay.toast.saved'),
        color: 'primary',
      });
    }
  } catch (err) {
    console.error('[cvDisplay] Error saving CV:', err);
    toast.add({
      title: t('cvDisplay.toast.saveFailed'),
      color: 'error',
    });
  } finally {
    saving.value = false;
  }
};

const handlePrint = () => {
  window.print();
};

onMounted(() => {
  load();
});
</script>

<style>
/* Print styles for PDF export */
@media print {
  /* Hide all non-content elements */
  header,
  nav,
  aside,
  footer,
  button,
  [role="navigation"],
  .u-page-header,
  .flex.justify-end,
  .space-y-6 > *:not(.u-card) {
    display: none !important;
  }

  /* Reset all containers and wrappers */
  html,
  body {
    width: 100%;
    height: 100%;
    margin: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
  }

  body * {
    visibility: hidden;
  }

  /* Show only the CV content */
  .u-card,
  .u-card * {
    visibility: visible;
  }

  .u-card {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    border: none !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    background: white !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .prose {
    max-width: 100% !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  /* A4 page settings */
  @page {
    size: A4;
    margin: 1.5cm 2cm;
  }

  /* Ensure proper page breaks */
  :deep(.prose) {
    page-break-inside: avoid;
  }

  :deep(.prose h1),
  :deep(.prose h2),
  :deep(.prose h3) {
    page-break-after: avoid;
    page-break-inside: avoid;
  }

  :deep(.prose ul),
  :deep(.prose ol),
  :deep(.prose p) {
    page-break-inside: avoid;
  }

  /* Adjust colors for print */
  :deep(.prose h1) {
    border-bottom-color: #333 !important;
    color: #000 !important;
  }

  :deep(.prose h2) {
    border-bottom-color: #666 !important;
    color: #000 !important;
  }

  :deep(.prose h3),
  :deep(.prose p),
  :deep(.prose li) {
    color: #000 !important;
  }

  :deep(.prose a) {
    color: #000 !important;
    text-decoration: underline !important;
  }

  :deep(.prose code) {
    background-color: #f0f0f0 !important;
    color: #000 !important;
  }
}

:deep(.prose) {
  /* Heading 1 - Main title */
  h1 {
    font-size: 2.25rem; /* 36px */
    line-height: 2.5rem; /* 40px */
    font-weight: 700;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid rgb(var(--color-primary-500));
  }

  /* Heading 2 - Section titles */
  h2 {
    font-size: 1.5rem; /* 24px */
    line-height: 2rem; /* 32px */
    font-weight: 600;
    margin-top: 2rem;
    margin-bottom: 0.75rem;
    padding-bottom: 0.25rem;
    border-bottom: 1px solid;
  }

  /* Heading 3 - Subsection titles */
  h3 {
    font-size: 1.25rem; /* 20px */
    line-height: 1.75rem; /* 28px */
    font-weight: 500;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
  }

  /* Additional spacing and styling for better readability */
  p {
    margin-bottom: 0.75rem;
  }

  ul,
  ol {
    margin-top: 0.75rem;
    margin-bottom: 0.75rem;
  }

  ul > li + li,
  ol > li + li {
    margin-top: 0.25rem;
  }

  strong {
    font-weight: 600;
  }

  em {
    font-style: italic;
    opacity: 0.8;
  }

  code {
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    opacity: 0.9;
  }

  a {
    color: rgb(var(--color-primary-500));
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
}
</style>
