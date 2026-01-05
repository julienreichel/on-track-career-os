<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import UnsavedChangesModal from '@/components/UnsavedChangesModal.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import { useCoverLetter } from '@/application/cover-letter/useCoverLetter';
import { useCoverLetterEngine } from '@/composables/useCoverLetterEngine';
import type { PageHeaderLink } from '@/types/ui';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();

const coverLetterId = computed(() => route.params.id as string);
const { item, loading, error, load, save, remove } = useCoverLetter(coverLetterId.value);
const engine = useCoverLetterEngine();

const formState = ref({
  content: '',
});
const originalState = ref({ ...formState.value });
const saving = ref(false);
const cancelModalOpen = ref(false);
const deleteModalOpen = ref(false);
const deleting = ref(false);
const isGenerating = computed(() => engine.isGenerating.value);

const hasChanges = computed(() => formState.value.content !== originalState.value.content);

const hasContent = computed(() => Boolean(formState.value.content.trim()));

const headerLinks = computed<PageHeaderLink[]>(() => [
  {
    label: t('common.backToList'),
    icon: 'i-heroicons-arrow-left',
    to: '/cover-letters',
  },
  {
    label: isGenerating.value
      ? t('coverLetter.editor.actions.generating')
      : hasContent.value
        ? t('coverLetter.editor.actions.regenerate')
        : t('coverLetter.editor.actions.generate'),
    icon: 'i-heroicons-sparkles',
    color: 'primary',
    disabled: loading.value || saving.value || isGenerating.value || !engine.hasProfile.value,
    onClick: handleGenerate,
    'data-testid': 'generate-cover-letter-button',
  },
  {
    label: t('common.delete'),
    icon: 'i-heroicons-trash',
    color: 'error',
    disabled: loading.value || saving.value || deleting.value,
    onClick: () => (deleteModalOpen.value = true),
    'data-testid': 'delete-cover-letter-button',
  },
]);

const applyGeneratedContent = (content: string) => {
  formState.value.content = content;
};

const resetForm = () => {
  formState.value = {
    content: item.value?.content ?? '',
  };
  originalState.value = { ...formState.value };
};

const handleSave = async () => {
  if (!item.value?.id || saving.value || !hasChanges.value) return;
  saving.value = true;
  try {
    const updated = await save({
      id: item.value.id,
      content: formState.value.content,
    });
    if (updated) {
      toast.add({ title: t('coverLetter.editor.toast.saved'), color: 'primary' });
      originalState.value = { ...formState.value };
    } else {
      toast.add({ title: t('coverLetter.editor.toast.saveFailed'), color: 'error' });
    }
  } finally {
    saving.value = false;
  }
};

const handleGenerate = async () => {
  try {
    await engine.load();
    const result = await engine.generate();
    console.log('[coverLetterEditor] Generate result:', result);
    applyGeneratedContent(result);
    toast.add({ title: t('coverLetter.editor.toast.generated'), color: 'primary' });
  } catch (err) {
    console.error('[coverLetterEditor] Failed to generate cover letter', err);
    toast.add({
      title: t('coverLetter.editor.toast.generateFailed'),
      color: 'error',
      description: err instanceof Error ? err.message : 'Unknown error',
    });
  }
};

const handleCancel = () => {
  if (hasChanges.value) {
    cancelModalOpen.value = true;
  }
};

const handleDiscard = () => {
  resetForm();
  cancelModalOpen.value = false;
};

const handleDelete = async () => {
  if (!item.value?.id || deleting.value) return;
  deleting.value = true;
  try {
    const success = await remove();
    if (success) {
      toast.add({ title: t('coverLetter.editor.toast.deleted'), color: 'primary' });
      await router.push('/cover-letters');
    } else {
      toast.add({ title: t('coverLetter.editor.toast.deleteFailed'), color: 'error' });
    }
  } catch (err) {
    console.error('[coverLetterEditor] Delete failed', err);
    toast.add({ title: t('coverLetter.editor.toast.deleteFailed'), color: 'error' });
  } finally {
    deleting.value = false;
    deleteModalOpen.value = false;
  }
};

onMounted(async () => {
  route.meta.breadcrumbLabel = t('coverLetter.editor.title');
  await engine.load();
  await load();
  resetForm();
});

watch(item, (newValue) => {
  if (newValue && !hasChanges.value) {
    resetForm();
  }
});
</script>

<template>
  <div>
    <UContainer>
      <UPage>
        <UPageHeader
          :title="t('coverLetter.editor.title')"
          :description="t('coverLetter.editor.description')"
          :links="headerLinks"
        />

        <UPageBody>
          <UAlert
            v-if="error"
            icon="i-heroicons-exclamation-triangle"
            color="error"
            variant="soft"
            :title="t('coverLetter.editor.states.errorTitle')"
            :description="error"
            class="mb-6"
            :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'error', variant: 'link' }"
            @close="error = null"
          />

          <UAlert
            v-if="engine.error.value"
            icon="i-heroicons-exclamation-triangle"
            color="warning"
            variant="soft"
            :title="t('coverLetter.editor.states.generateErrorTitle')"
            :description="engine.error.value"
            class="mb-6"
            :close-button="{
              icon: 'i-heroicons-x-mark-20-solid',
              color: 'warning',
              variant: 'link',
            }"
            @close="engine.error.value = null"
          />

          <UAlert
            v-if="!engine.hasProfile.value && !engine.isLoading.value"
            icon="i-heroicons-information-circle"
            color="info"
            variant="soft"
            title="Profile required"
            description="Complete your profile before generating a cover letter."
            class="mb-6"
          />

          <UCard v-if="loading">
            <USkeleton class="h-6 w-1/3" />
            <USkeleton class="mt-4 h-96 w-full" />
          </UCard>

          <template v-else-if="item">
            <UCard>
              <UFormField
                :label="t('coverLetter.editor.content.label')"
                name="content"
                class="mb-4"
              >
                <UTextarea
                  v-model="formState.content"
                  :placeholder="t('coverLetter.editor.content.placeholder')"
                  :disabled="loading || saving"
                  :rows="20"
                  autoresize
                  data-testid="cover-letter-content-textarea"
                />
              </UFormField>
            </UCard>

            <div class="mt-6 flex flex-wrap justify-end gap-3">
              <UButton
                color="neutral"
                variant="ghost"
                :label="t('common.cancel')"
                :disabled="!hasChanges || loading || saving"
                @click="handleCancel"
              />
              <UButton
                color="primary"
                :label="t('common.save')"
                :disabled="!hasChanges || loading || saving"
                :loading="saving"
                data-testid="save-cover-letter-button"
                @click="handleSave"
              />
            </div>
          </template>

          <UCard v-else-if="!loading && !item">
            <UAlert
              icon="i-heroicons-exclamation-circle"
              color="warning"
              variant="soft"
              :title="t('coverLetter.editor.states.notFound')"
              :description="t('coverLetter.editor.states.notFoundDescription')"
            />
          </UCard>
        </UPageBody>
      </UPage>
    </UContainer>

    <UnsavedChangesModal
      v-model:open="cancelModalOpen"
      @discard="handleDiscard"
      @cancel="cancelModalOpen = false"
    />

    <ConfirmModal
      v-model:open="deleteModalOpen"
      :title="t('coverLetter.editor.delete.title')"
      :description="t('coverLetter.editor.delete.description')"
      :loading="deleting"
      @confirm="handleDelete"
      @cancel="deleteModalOpen = false"
    />
  </div>
</template>
