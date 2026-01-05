<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import SpeechBlockEditorCard from '@/components/speech/SpeechBlockEditorCard.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import UnsavedChangesModal from '@/components/UnsavedChangesModal.vue';
import { useSpeechBlock } from '@/application/speech-block/useSpeechBlock';
import { useSpeechEngine } from '@/composables/useSpeechEngine';
import type { SpeechResult } from '@/domain/ai-operations/SpeechResult';
import type { PageHeaderLink } from '@/types/ui';

const { t } = useI18n();
const route = useRoute();
const toast = useToast();

const speechId = computed(() => route.params.id as string);
const { item, loading, error, load, save, remove } = useSpeechBlock(speechId.value);
const engine = useSpeechEngine();

const formState = ref({
  elevatorPitch: '',
  careerStory: '',
  whyMe: '',
});
const originalState = ref({ ...formState.value });
const saving = ref(false);
const deleteModalOpen = ref(false);
const cancelModalOpen = ref(false);
const isGenerating = computed(() => engine.isGenerating.value);

const hasChanges = computed(
  () =>
    formState.value.elevatorPitch !== originalState.value.elevatorPitch ||
    formState.value.careerStory !== originalState.value.careerStory ||
    formState.value.whyMe !== originalState.value.whyMe
);

const hasContent = computed(
  () =>
    Boolean(formState.value.elevatorPitch.trim()) ||
    Boolean(formState.value.careerStory.trim()) ||
    Boolean(formState.value.whyMe.trim())
);

const headerLinks = computed<PageHeaderLink[]>(() => [
  {
    label: t('common.backToList'),
    icon: 'i-heroicons-arrow-left',
    to: '/speech',
  },
  {
    label: isGenerating.value
      ? t('speech.editor.actions.generating')
      : hasContent.value
        ? t('speech.editor.actions.regenerate')
        : t('speech.editor.actions.generate'),
    icon: 'i-heroicons-sparkles',
    color: 'primary',
    disabled: loading.value || saving.value || isGenerating.value,
    onClick: handleGenerate,
  },
]);

const applySpeechResult = (result: SpeechResult) => {
  formState.value = {
    elevatorPitch: result.elevatorPitch ?? '',
    careerStory: result.careerStory ?? '',
    whyMe: result.whyMe ?? '',
  };
};

const resetForm = () => {
  formState.value = {
    elevatorPitch: item.value?.elevatorPitch ?? '',
    careerStory: item.value?.careerStory ?? '',
    whyMe: item.value?.whyMe ?? '',
  };
  originalState.value = { ...formState.value };
};

const handleSave = async () => {
  if (!item.value?.id || saving.value || !hasChanges.value) return;
  saving.value = true;
  try {
    const updated = await save({
      id: item.value.id,
      elevatorPitch: formState.value.elevatorPitch,
      careerStory: formState.value.careerStory,
      whyMe: formState.value.whyMe,
    });
    if (updated) {
      toast.add({ title: t('speech.detail.toast.saved'), color: 'primary' });
      originalState.value = { ...formState.value };
    } else {
      toast.add({ title: t('speech.detail.toast.saveFailed'), color: 'error' });
    }
  } finally {
    saving.value = false;
  }
};

const handleGenerate = async () => {
  try {
    const result = await engine.generate();
    applySpeechResult(result);
    toast.add({ title: t('speech.detail.toast.generated'), color: 'primary' });
  } catch (err) {
    console.error('[speechDetail] Failed to generate speech', err);
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

onMounted(async () => {
  route.meta.breadcrumbLabel = t('speech.detail.title');
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
          :title="t('speech.detail.title')"
          :description="t('speech.detail.description')"
          :links="headerLinks"
        />

        <UPageBody>
          <UAlert
            v-if="error"
            icon="i-heroicons-exclamation-triangle"
            color="error"
            variant="soft"
            :title="t('speech.detail.states.errorTitle')"
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
            :title="t('speech.detail.states.generateErrorTitle')"
            :description="engine.error.value"
            class="mb-6"
            :close-button="{
              icon: 'i-heroicons-x-mark-20-solid',
              color: 'warning',
              variant: 'link',
            }"
            @close="engine.error.value = null"
          />

          <UCard v-if="loading">
            <USkeleton class="h-6 w-1/3" />
            <USkeleton class="mt-4 h-20 w-full" />
            <USkeleton class="mt-4 h-32 w-full" />
          </UCard>

          <template v-else-if="item">
            <SpeechBlockEditorCard v-model="formState" :disabled="loading || saving" />
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
                @click="handleSave"
              />
            </div>
          </template>

          <UAlert
            v-else
            color="warning"
            icon="i-heroicons-exclamation-triangle"
            :title="t('speech.detail.states.notFound')"
            :description="t('speech.detail.states.notFoundDescription')"
          />
        </UPageBody>
      </UPage>
    </UContainer>

    <UnsavedChangesModal v-model:open="cancelModalOpen" @discard="handleDiscard" />
  </div>
</template>
