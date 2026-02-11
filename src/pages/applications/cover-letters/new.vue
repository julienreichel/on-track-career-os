<template>
  <UPage>
    <UPageHeader
      :title="$t('applications.coverLetters.form.createTitle')"
      :description="$t('applications.coverLetters.form.createDescription')"
    />

    <UPageBody>
      <UCard v-if="!isAutoFlow">
        <div class="space-y-6">
          <div>
            <h3 class="text-lg font-semibold mb-2">
              {{ $t('applications.coverLetters.form.setupTitle') }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ $t('applications.coverLetters.form.setupDescription') }}
            </p>
          </div>

          <UFormField :label="$t('applications.coverLetters.form.fields.title.label')" required>
            <UInput
              v-model="coverLetterName"
              :placeholder="$t('applications.coverLetters.form.fields.title.placeholder')"
              data-testid="cover-letter-name-input"
              class="w-full"
            />
          </UFormField>

          <UFormField
            :label="$t('applications.coverLetters.form.fields.jobDescription.label')"
            :description="$t('applications.coverLetters.form.fields.jobDescription.description')"
          >
            <UTextarea
              v-model="jobDescription"
              :placeholder="$t('applications.coverLetters.form.fields.jobDescription.placeholder')"
              :rows="6"
              data-testid="job-description-textarea"
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-end gap-3">
            <UButton :label="$t('common.actions.cancel')" variant="ghost" @click="cancel" />
            <UButton
              :label="$t('common.actions.generate')"
              icon="i-heroicons-sparkles"
              :disabled="!coverLetterName.trim() || generating"
              :loading="generating"
              data-testid="generate-cover-letter-button"
              @click="generateCoverLetter"
            />
          </div>
        </div>
      </UCard>

      <UCard v-else>
        <div class="space-y-6">
          <div>
            <h3 class="text-lg font-semibold mb-2">
              {{ $t('common.actions.generate') }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ $t('common.states.loading') }}
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
import { logError } from '@/utils/logError';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useAuthUser } from '@/composables/useAuthUser';
import { useErrorDisplay } from '@/composables/useErrorDisplay';
import { useCoverLetters } from '@/application/cover-letter/useCoverLetters';
import { useCoverLetterEngine } from '@/composables/useCoverLetterEngine';
import { useTailoredMaterials } from '@/application/tailoring/useTailoredMaterials';
import { useAnalytics } from '@/composables/useAnalytics';
import type { SpeechInput } from '@/domain/ai-operations/SpeechResult';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const { notifyActionError } = useErrorDisplay();

// Get current user ID from auth
const { userId, loadUserId } = useAuthUser();

const { createCoverLetter } = useCoverLetters();
const engine = useCoverLetterEngine();
const tailoredMaterials = useTailoredMaterials();

// Form state
const coverLetterName = ref('');
const jobDescription = ref('');
const jobDescriptionObj = computed<SpeechInput['jobDescription'] | undefined>(() => {
  if (!jobDescription.value) return undefined;
  return {
    title: coverLetterName.value.trim(),
    seniorityLevel: '',
    roleSummary: jobDescription.value.trim(),
    responsibilities: [],
    requiredSkills: [],
    behaviours: [],
    successCriteria: [],
    explicitPains: [],
    atsKeywords: [],
  };
});

// Generation state
const generating = ref(false);
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
  void router.push({ name: 'applications-cover-letters' });
};

const generateCoverLetter = async () => {
  if (!coverLetterName.value.trim()) {
    return;
  }

  generating.value = true;

  try {
    if (!userId.value) {
      await loadUserId();
    }
    if (!userId.value) {
      notifyActionError({
        title: t('applications.coverLetters.toast.createFailed'),
      });
      return;
    }

    // Load engine data
    await engine.load();

    // Generate content using the engine
    const content = await engine.generate(jobDescriptionObj.value);

    if (!content) {
      notifyActionError({
        title: t('applications.coverLetters.toast.generationFailed'),
        description: engine.error.value || undefined,
      });
      return;
    }

    // Generate cover letter document
    const coverLetter = await createCoverLetter({
      name: coverLetterName.value,
      content,
      userId: userId.value,
      jobId: undefined, // For now, we don't associate with a specific job
    });

    if (coverLetter) {
      const { captureEvent } = useAnalytics();
      captureEvent('cover_letter_created');

      toast.add({
        title: t('applications.coverLetters.toast.created'),
        color: 'primary',
      });

      // Navigate to the cover letter
      await router.push({
        name: 'applications-cover-letters-id',
        params: { id: coverLetter.id },
      });
    } else {
      logError('[coverLetterNew] Failed to create cover letter - createCoverLetter returned null');
      notifyActionError({
        title: t('applications.coverLetters.toast.createFailed'),
      });
    }
  } catch (err) {
    logError('[coverLetterNew] Error generating cover letter:', err);
    notifyActionError({
      title: t('applications.coverLetters.toast.error'),
      description: err instanceof Error ? err.message : undefined,
    });
  } finally {
    generating.value = false;
  }
};

const generateTailoredCoverLetter = async (jobId: string) => {
  if (autoTriggered.value) {
    return;
  }
  autoTriggered.value = true;
  generating.value = true;

  try {
    const context = await tailoredMaterials.loadTailoringContext(jobId);
    if (!context.ok) {
      notifyActionError({
        title: t('applications.coverLetters.toast.error'),
      });
      await router.push('/jobs');
      return;
    }
    if (!context.matchingSummary) {
      notifyActionError({
        title: t('applications.coverLetters.toast.generationFailed'),
      });
      await router.push(`/jobs/${jobId}/match`);
      return;
    }

    const created = await tailoredMaterials.generateTailoredCoverLetterForJob({
      job: context.job,
      matchingSummary: context.matchingSummary,
    });
    if (created?.id) {
      await router.push({
        name: 'applications-cover-letters-id',
        params: { id: created.id },
      });
      return;
    }

    notifyActionError({
      title: t('applications.coverLetters.toast.createFailed'),
    });
  } catch (err) {
    logError('[coverLetterNew] Error generating tailored cover letter:', err);
    notifyActionError({
      title: t('applications.coverLetters.toast.error'),
      description: err instanceof Error ? err.message : undefined,
    });
  } finally {
    generating.value = false;
  }
};

watch(
  () => autoJobId.value,
  (jobId) => {
    if (jobId) {
      void generateTailoredCoverLetter(jobId);
    }
  },
  { immediate: true }
);
</script>
