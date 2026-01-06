<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import SpeechBlockEditorCard from '@/components/speech/SpeechBlockEditorCard.vue';
import UnsavedChangesModal from '@/components/UnsavedChangesModal.vue';
import { useSpeechBlock } from '@/application/speech-block/useSpeechBlock';
import { useSpeechEngine } from '@/composables/useSpeechEngine';
import { useAuthUser } from '@/composables/useAuthUser';
import { useTailoredMaterials } from '@/application/tailoring/useTailoredMaterials';
import { JobDescriptionService } from '@/domain/job-description/JobDescriptionService';
import { MatchingSummaryService } from '@/domain/matching-summary/MatchingSummaryService';
import TailoredJobBanner from '@/components/tailoring/TailoredJobBanner.vue';
import type { SpeechResult } from '@/domain/ai-operations/SpeechResult';
import type { PageHeaderLink } from '@/types/ui';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import type { MatchingSummary } from '@/domain/matching-summary/MatchingSummary';

const { t } = useI18n();
const route = useRoute();
const toast = useToast();

const speechId = computed(() => route.params.id as string);
const { item, loading, error, load, save } = useSpeechBlock(speechId.value);
const engine = useSpeechEngine();
const auth = useAuthUser();
const tailoredMaterials = useTailoredMaterials({ auth });
const jobService = new JobDescriptionService();
const matchingSummaryService = new MatchingSummaryService();
const targetJob = ref<JobDescription | null>(null);
const matchingSummary = ref<MatchingSummary | null>(null);
const contextLoading = ref(false);
const contextError = ref<string | null>(null);

const formState = ref({
  elevatorPitch: '',
  careerStory: '',
  whyMe: '',
});
const originalState = ref({ ...formState.value });
const saving = ref(false);
const cancelModalOpen = ref(false);
const isGenerating = computed(() => engine.isGenerating.value);
const hasJobContext = computed(() => Boolean(item.value?.jobId));
const targetJobTitle = computed(() => targetJob.value?.title?.trim() || 'Target job');
const jobLink = computed(() => (targetJob.value?.id ? `/jobs/${targetJob.value.id}` : null));
const matchLink = computed(() =>
  targetJob.value?.id ? `/jobs/${targetJob.value.id}/match` : null
);
const isRegenerating = computed(() => tailoredMaterials.isGenerating.value);
const canRegenerate = computed(
  () => Boolean(item.value?.id && targetJob.value && matchingSummary.value)
);
const regenerateDisabled = computed(
  () => !canRegenerate.value || contextLoading.value || isRegenerating.value
);
const regenerateError = computed(() => tailoredMaterials.error.value);
const missingSummary = computed(
  () => Boolean(item.value?.jobId && targetJob.value && !matchingSummary.value)
);

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
    'data-testid': 'generate-speech-button',
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

const loadTailoringContext = async (jobId?: string | null) => {
  if (!jobId) {
    targetJob.value = null;
    matchingSummary.value = null;
    contextError.value = null;
    return;
  }

  contextLoading.value = true;
  contextError.value = null;

  try {
    if (!auth.userId.value) {
      await auth.loadUserId();
    }

    if (!auth.userId.value) {
      throw new Error('User not authenticated');
    }

    const job = await jobService.getFullJobDescription(jobId);
    if (!job) {
      throw new Error('Job not found');
    }
    targetJob.value = job;

    const companyId = job.companyId ?? null;
    let summary = await matchingSummaryService.getByContext({
      userId: auth.userId.value,
      jobId,
      companyId,
    });

    if (!summary && companyId) {
      summary = await matchingSummaryService.getByContext({
        userId: auth.userId.value,
        jobId,
        companyId: null,
      });
    }

    matchingSummary.value = summary;
  } catch (err) {
    contextError.value = err instanceof Error ? err.message : 'Failed to load tailored context';
    console.error('[speechDetail] Error loading tailored context:', err);
    targetJob.value = null;
    matchingSummary.value = null;
  } finally {
    contextLoading.value = false;
  }
};

const handleRegenerateTailored = async () => {
  if (!item.value?.id || !targetJob.value || !matchingSummary.value) {
    return;
  }

  try {
    const updated = await tailoredMaterials.regenerateTailoredSpeechForJob({
      id: item.value.id,
      job: targetJob.value,
      matchingSummary: matchingSummary.value,
      options: {
        name: item.value.name ?? undefined,
      },
    });

    if (updated) {
      item.value = updated;
      formState.value = {
        elevatorPitch: updated.elevatorPitch ?? '',
        careerStory: updated.careerStory ?? '',
        whyMe: updated.whyMe ?? '',
      };
      originalState.value = { ...formState.value };
      toast.add({ title: 'Tailored speech regenerated.', color: 'primary' });
    }
  } catch (err) {
    console.error('[speechDetail] Failed to regenerate tailored speech', err);
    toast.add({ title: 'Failed to regenerate tailored speech.', color: 'error' });
  }
};

onMounted(async () => {
  route.meta.breadcrumbLabel = t('speech.detail.title');
  await load();
  resetForm();
});

watch(item, (newValue) => {
  if (newValue && !hasChanges.value) {
    resetForm();
    void loadTailoringContext(newValue.jobId);
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
          <TailoredJobBanner
            v-if="hasJobContext"
            class="mb-6"
            :job-title="targetJobTitle"
            :job-link="jobLink"
            :match-link="matchLink"
            regenerate-label="Regenerate tailored speech"
            :regenerate-loading="isRegenerating"
            :regenerate-disabled="regenerateDisabled"
            regenerate-error-title="Unable to regenerate speech"
            missing-summary-description="Generate a matching summary before regenerating this speech."
            :context-error="contextError"
            :regenerate-error="regenerateError"
            :missing-summary="missingSummary"
            @regenerate="handleRegenerateTailored"
          />

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
                data-testid="save-speech-button"
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
