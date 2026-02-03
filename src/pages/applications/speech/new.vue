<template>
  <UPage>
    <UPageHeader
      :title="t('applications.speeches.form.createTitle')"
      :description="t('applications.speeches.form.createDescription')"
    />

    <UPageBody>
      <UCard v-if="!isAutoFlow">
        <div class="space-y-6">
          <div>
            <h3 class="text-lg font-semibold mb-2">
              {{ t('applications.speeches.form.setupTitle') }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ t('applications.speeches.form.setupDescription') }}
            </p>
          </div>

          <UFormField :label="t('applications.speeches.form.fields.title.label')" required>
            <UInput
              v-model="speechName"
              :placeholder="t('applications.speeches.form.fields.title.placeholder')"
              data-testid="speech-name-input"
              class="w-full"
            />
          </UFormField>

          <UFormField
            :label="t('applications.speeches.form.fields.context.label')"
            :description="t('applications.speeches.form.fields.context.description')"
          >
            <UTextarea
              v-model="speechContext"
              :placeholder="t('applications.speeches.form.fields.context.placeholder')"
              :rows="6"
              data-testid="speech-context-textarea"
              class="w-full"
            />
          </UFormField>

          <UAlert
            v-if="generationError"
            color="error"
            icon="i-heroicons-exclamation-triangle"
            :title="t('applications.speeches.form.errors.generation')"
            :description="generationError"
            class="mb-4"
          />

          <div class="flex justify-end gap-3">
            <UButton :label="t('common.cancel')" variant="ghost" @click="cancel" />
            <UButton
              :label="t('common.actions.generate')"
              icon="i-heroicons-sparkles"
              :disabled="!speechName.trim() || generating"
              :loading="generating"
              data-testid="generate-speech-button"
              @click="generateSpeech"
            />
          </div>
        </div>
      </UCard>

      <UCard v-else>
        <div class="space-y-6">
          <div>
            <h3 class="text-lg font-semibold mb-2">
              {{ t('common.actions.generate') }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ t('common.loading') }}
            </p>
          </div>
          <div class="space-y-3">
            <USkeleton class="h-8 w-2/3" />
            <USkeleton class="h-24 w-full" />
            <USkeleton class="h-10 w-32" />
          </div>
        </div>
      </UCard>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useAuthUser } from '@/composables/useAuthUser';
import { useSpeechBlocks } from '@/application/speech-block/useSpeechBlocks';
import { useSpeechEngine } from '@/composables/useSpeechEngine';
import { useTailoredMaterials } from '@/application/tailoring/useTailoredMaterials';
import { SpeechBlockService } from '@/domain/speech-block/SpeechBlockService';
import { useAnalytics } from '@/composables/useAnalytics';
import type { SpeechInput } from '@/domain/ai-operations/SpeechResult';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();

const { userId, loadUserId } = useAuthUser();
const { createSpeechBlock } = useSpeechBlocks();
const engine = useSpeechEngine();
const tailoredMaterials = useTailoredMaterials();
const service = new SpeechBlockService();

const speechName = ref('');
const speechContext = ref('');
const jobDescriptionObj = computed<SpeechInput['jobDescription'] | undefined>(() => {
  if (!speechContext.value.trim()) return undefined;
  return {
    title: speechName.value.trim() || t('applications.speeches.detail.untitled'),
    seniorityLevel: '',
    roleSummary: speechContext.value.trim(),
    responsibilities: [],
    requiredSkills: [],
    behaviours: [],
    successCriteria: [],
    explicitPains: [],
    atsKeywords: [],
  };
});

const generating = ref(false);
const generationError = ref<string | null>(null);
const autoTriggered = ref(false);
const autoJobId = computed(() => {
  const value = route.query.jobId;
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return null;
});
const isAutoFlow = computed(() => Boolean(autoJobId.value));

const cancel = () => {
  void router.push({ name: 'applications-speech' });
};

const generateSpeech = async () => {
  if (!speechName.value.trim()) {
    return;
  }

  generating.value = true;
  generationError.value = null;

  try {
    if (!userId.value) {
      await loadUserId();
    }
    if (!userId.value) {
      toast.add({
        title: t('applications.speeches.toast.createFailed'),
        color: 'error',
      });
      return;
    }

    await engine.load();
    const result = await engine.generate(jobDescriptionObj.value);
    if (!result) {
      toast.add({
        title: t('applications.speeches.new.toast.generationFailed'),
        description: engine.error.value || undefined,
        color: 'error',
      });
      return;
    }

    const draft = service.createDraftSpeechBlock(userId.value);
    const created = await createSpeechBlock({
      ...draft,
      name: speechName.value.trim(),
      elevatorPitch: result.elevatorPitch ?? '',
      careerStory: result.careerStory ?? '',
      whyMe: result.whyMe ?? '',
    });

    if (created) {
      const { captureEvent } = useAnalytics();
      captureEvent('speech_created');
    }

    if (created?.id) {
      toast.add({
        title: t('applications.speeches.toast.created'),
        color: 'primary',
      });
      await router.push({
        name: 'applications-speech-id',
        params: { id: created.id },
      });
    } else {
      toast.add({ title: t('applications.speeches.toast.createFailed'), color: 'error' });
    }
  } catch (err) {
    console.error('[speechNew] Error generating speech:', err);
    generationError.value = err instanceof Error ? err.message : 'Unknown error';
    toast.add({
      title: t('applications.speeches.toast.error'),
      color: 'error',
    });
  } finally {
    generating.value = false;
  }
};

const generateTailoredSpeech = async (jobId: string) => {
  if (autoTriggered.value) {
    return;
  }
  autoTriggered.value = true;
  generating.value = true;
  generationError.value = null;

  try {
    const context = await tailoredMaterials.loadTailoringContext(jobId);
    if (!context.ok) {
      toast.add({
        title: t('applications.speeches.toast.error'),
        color: 'error',
      });
      await router.push('/jobs');
      return;
    }
    if (!context.matchingSummary) {
      toast.add({
        title: t('applications.speeches.toast.generationFailed'),
        color: 'error',
      });
      await router.push(`/jobs/${jobId}/match`);
      return;
    }

    const created = await tailoredMaterials.generateTailoredSpeechForJob({
      job: context.job,
      matchingSummary: context.matchingSummary,
    });
    if (created?.id) {
      await router.push({
        name: 'applications-speech-id',
        params: { id: created.id },
      });
      return;
    }

    toast.add({
      title: t('applications.speeches.toast.createFailed'),
      color: 'error',
    });
  } catch (err) {
    console.error('[speechNew] Error generating tailored speech:', err);
    generationError.value = err instanceof Error ? err.message : 'Unknown error';
    toast.add({
      title: t('applications.speeches.toast.error'),
      color: 'error',
    });
  } finally {
    generating.value = false;
  }
};

watch(
  () => autoJobId.value,
  (jobId) => {
    if (jobId) {
      void generateTailoredSpeech(jobId);
    }
  },
  { immediate: true }
);
</script>
