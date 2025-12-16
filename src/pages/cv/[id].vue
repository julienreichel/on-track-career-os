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
