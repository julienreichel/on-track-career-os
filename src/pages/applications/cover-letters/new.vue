<template>
  <UPage>
    <UPageHeader
      :title="$t('coverLetter.new.title')"
      :description="$t('coverLetter.new.subtitle')"
    />

    <UPageBody>
      <UCard>
        <div class="space-y-6">
          <div>
            <h3 class="text-lg font-semibold mb-2">
              {{ $t('coverLetter.new.setup.title') }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ $t('coverLetter.new.setup.description') }}
            </p>
          </div>

          <UFormField :label="$t('coverLetter.new.setup.nameLabel')" required>
            <UInput
              v-model="coverLetterName"
              :placeholder="$t('coverLetter.new.setup.namePlaceholder')"
              data-testid="cover-letter-name-input"
              class="w-full"
            />
          </UFormField>

          <UFormField
            :label="$t('coverLetter.new.setup.jobLabel')"
            :description="$t('coverLetter.new.setup.jobDescription')"
          >
            <UTextarea
              v-model="jobDescription"
              :placeholder="$t('coverLetter.new.setup.jobPlaceholder')"
              :rows="6"
              data-testid="job-description-textarea"
              class="w-full"
            />
          </UFormField>

          <!-- Error Display -->
          <UAlert
            v-if="generationError"
            color="error"
            icon="i-heroicons-exclamation-triangle"
            :title="$t('coverLetter.new.generate.error')"
            :description="generationError"
            class="mb-4"
          />

          <div class="flex justify-end gap-3">
            <UButton :label="$t('common.cancel')" variant="ghost" @click="cancel" />
            <UButton
              :label="$t('coverLetter.new.generate.action')"
              icon="i-heroicons-sparkles"
              :disabled="!coverLetterName.trim() || generating"
              :loading="generating"
              data-testid="generate-cover-letter-button"
              @click="generateCoverLetter"
            />
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
import { useCoverLetters } from '@/application/cover-letter/useCoverLetters';
import { useCoverLetterEngine } from '@/composables/useCoverLetterEngine';
import { useTailoredMaterials } from '@/application/tailoring/useTailoredMaterials';
import type { SpeechInput } from '@/domain/ai-operations/SpeechResult';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();

// Get current user ID from auth
const { userId } = useAuthUser();

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

const cancel = () => {
  void router.push({ name: 'cover-letters' });
};

const generateCoverLetter = async () => {
  if (!coverLetterName.value.trim() || !userId.value) {
    return;
  }

  generating.value = true;
  generationError.value = null;

  try {
    // Load engine data
    await engine.load();

    // Generate content using the engine
    const content = await engine.generate(jobDescriptionObj.value);

    if (!content) {
      toast.add({
        title: t('coverLetter.new.toast.generationFailed'),
        description: engine.error.value || undefined,
        color: 'error',
      });
      return;
    }

    // Create cover letter document
    const coverLetter = await createCoverLetter({
      name: coverLetterName.value,
      content,
      userId: userId.value,
      jobId: undefined, // For now, we don't associate with a specific job
    });

    if (coverLetter) {
      toast.add({
        title: t('coverLetter.new.toast.created'),
        color: 'primary',
      });

      // Navigate to the cover letter
      await router.push({
        name: 'applications-cover-letters-id',
        params: { id: coverLetter.id },
      });
    } else {
      console.error(
        '[coverLetterNew] Failed to create cover letter - createCoverLetter returned null'
      );
      toast.add({
        title: t('coverLetter.new.toast.createFailed'),
        color: 'error',
      });
    }
  } catch (err) {
    console.error('[coverLetterNew] Error generating cover letter:', err);
    generationError.value = err instanceof Error ? err.message : 'Unknown error';
    toast.add({
      title: t('coverLetter.new.toast.error'),
      color: 'error',
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
  generationError.value = null;

  try {
    const context = await tailoredMaterials.loadTailoringContext(jobId);
    if (!context.ok) {
      toast.add({
        title: t('coverLetter.new.toast.error'),
        color: 'error',
      });
      await router.push('/jobs');
      return;
    }
    if (!context.matchingSummary) {
      toast.add({
        title: t('coverLetter.new.toast.generationFailed'),
        color: 'error',
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

    toast.add({
      title: t('coverLetter.new.toast.createFailed'),
      color: 'error',
    });
  } catch (err) {
    console.error('[coverLetterNew] Error generating tailored cover letter:', err);
    generationError.value = err instanceof Error ? err.message : 'Unknown error';
    toast.add({
      title: t('coverLetter.new.toast.error'),
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
      void generateTailoredCoverLetter(jobId);
    }
  },
  { immediate: true }
);
</script>
