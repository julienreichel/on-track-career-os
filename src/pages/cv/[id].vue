<template>
  <UPage>
    <UPageHeader>
      <template #title>
        <div class="flex items-center gap-4">
          <UButton
            icon="i-heroicons-arrow-left"
            color="neutral"
            variant="ghost"
            @click="navigateTo({ name: 'cv' })"
          />
          <span>{{ document?.name || $t('cvDisplay.untitled') }}</span>
        </div>
      </template>
      <template #actions>
        <UButton
          v-if="!isEditing"
          icon="i-heroicons-pencil"
          color="neutral"
          variant="outline"
          @click="toggleEdit"
        >
          {{ $t('cvDisplay.actions.edit') }}
        </UButton>
        <template v-else>
          <UButton color="neutral" variant="outline" @click="cancelEdit">
            {{ $t('cvDisplay.actions.cancel') }}
          </UButton>
          <UButton icon="i-heroicons-check" color="primary" :loading="saving" @click="saveEdit">
            {{ $t('cvDisplay.actions.save') }}
          </UButton>
        </template>
      </template>
    </UPageHeader>

    <UPageBody>
      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin size-16" />
      </div>

      <div v-else-if="error" class="text-center py-12">
        <UIcon name="i-heroicons-exclamation-triangle" class="size-16 mx-auto mb-4 text-error" />
        <p class="mb-4">{{ error }}</p>
        <UButton color="primary" @click="load">
          {{ $t('cvDisplay.actions.retry') }}
        </UButton>
      </div>

      <div v-else class="max-w-4xl mx-auto">
        <!-- Edit Mode: Markdown Editor -->
        <UCard v-if="isEditing">
          <UTextarea
            v-model="editContent"
            :rows="20"
            :placeholder="$t('cvDisplay.markdownPlaceholder')"
            class="font-mono text-sm"
          />
          <template #footer>
            <p class="text-sm text-gray-600">
              {{ $t('cvDisplay.markdownHelp') }}
            </p>
          </template>
        </UCard>

        <!-- View Mode: Rendered HTML -->
        <UCard v-else>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="prose prose-gray max-w-none" v-html="renderedHtml" />
        </UCard>
      </div>
    </UPageBody>
  </UPage>
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

const renderedHtml = computed(() => {
  if (!document.value?.content) return '';
  return marked(document.value.content);
});

const load = async () => {
  loading.value = true;
  error.value = null;

  try {
    document.value = await service.getFullCVDocument(cvId.value);
    if (document.value) {
      editContent.value = document.value.content || '';
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
};

const cancelEdit = () => {
  isEditing.value = false;
  editContent.value = document.value?.content || '';
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

onMounted(() => {
  load();
});
</script>

<style scoped>
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
