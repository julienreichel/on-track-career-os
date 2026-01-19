<template>
  <UPage>
    <UPageHeader :title="$t('cvNew.title')" :description="$t('cvNew.subtitle')" />

    <UPageBody>
      <!-- Wizard Steps -->
      <div v-if="!isAutoFlow" class="mb-6">
        <div class="flex items-center justify-center gap-4">
          <div
            class="flex items-center gap-2"
            :class="{
              'text-primary-600 font-semibold': currentStep === 1,
              'text-gray-400': currentStep !== 1,
            }"
          >
            <div
              class="flex items-center justify-center w-8 h-8 rounded-full border-2"
              :class="{
                'border-primary-600 bg-primary-50': currentStep === 1,
                'border-gray-300': currentStep !== 1,
              }"
            >
              1
            </div>
            <span>{{ $t('cvNew.steps.selectExperiences') }}</span>
          </div>
          <UIcon name="i-heroicons-chevron-right" class="text-gray-400" />
          <div
            class="flex items-center gap-2"
            :class="{
              'text-primary-600 font-semibold': currentStep === 2,
              'text-gray-400': currentStep !== 2,
            }"
          >
            <div
              class="flex items-center justify-center w-8 h-8 rounded-full border-2"
              :class="{
                'border-primary-600 bg-primary-50': currentStep === 2,
                'border-gray-300': currentStep !== 2,
              }"
            >
              2
            </div>
            <span>{{ $t('cvNew.steps.generate') }}</span>
          </div>
        </div>
      </div>

      <!-- Step 1: Select Experiences -->
      <UCard v-if="currentStep === 1 && !isAutoFlow">
        <div class="space-y-6">
          <div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">
              {{ $t('cvNew.step1.title') }}
            </h2>
            <p class="text-gray-600">
              {{ $t('cvNew.step1.description') }}
            </p>
          </div>

          <CvExperiencePicker v-model="selectedExperienceIds" :user-id="userId" />

          <div class="flex justify-end gap-3 pt-4 border-t">
            <UButton color="neutral" variant="outline" @click="cancel">
              {{ $t('cvNew.actions.cancel') }}
            </UButton>
            <UButton :disabled="selectedExperienceIds.length === 0" @click="nextStep">
              {{ $t('cvNew.actions.next') }}
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Generating State -->
      <CvGeneratingStep v-if="isGenerating" />

      <!-- Step 2: Generate CV -->
      <UCard v-else-if="currentStep === 2 && !isAutoFlow">
        <div class="space-y-6">
          <div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">
              {{ $t('cvNew.step2.title') }}
            </h2>
            <p class="text-gray-600">
              {{ $t('cvNew.step2.description') }}
            </p>
          </div>

          <!-- CV Name -->
          <UFormField :label="$t('cvNew.step2.fields.name')" required>
            <UInput
              v-model="cvName"
              :placeholder="$t('cvNew.step2.placeholders.name')"
              class="w-full"
            />
          </UFormField>

          <!-- Optional Sections -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3">
              {{ $t('cvNew.step2.fields.optionalSections') }}
            </label>
            <div class="grid grid-cols-2 gap-2">
              <UCheckbox v-model="includeSkills" :label="$t('cvNew.step2.sections.skills')" />
              <UCheckbox v-model="includeLanguages" :label="$t('cvNew.step2.sections.languages')" />
              <UCheckbox
                v-model="includeCertifications"
                :label="$t('cvNew.step2.sections.certifications')"
              />
              <UCheckbox v-model="includeInterests" :label="$t('cvNew.step2.sections.interests')" />
            </div>
            <div class="mt-2">
              <UCheckbox
                v-model="includeProfilePhoto"
                :label="$t('cvNew.step2.sections.profilePhoto')"
              />
            </div>
          </div>

          <!-- Job Description (Optional) -->
          <UFormField
            :label="$t('cvNew.step2.fields.jobDescription')"
            :help="$t('cvNew.step2.help.jobDescription')"
          >
            <UTextarea
              v-model="jobDescription"
              :placeholder="$t('cvNew.step2.placeholders.jobDescription')"
              :rows="4"
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-end gap-3 pt-4 border-t">
            <UButton color="neutral" variant="outline" @click="previousStep">
              {{ $t('cvNew.actions.back') }}
            </UButton>
            <UButton :disabled="!cvName.trim()" @click="generateCV">
              {{ $t('cvNew.actions.generate') }}
            </UButton>
          </div>
        </div>
      </UCard>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import { useAuthUser } from '@/composables/useAuthUser';
import { useCvDocuments } from '@/composables/useCvDocuments';
import { useCvGenerator } from '@/composables/useCvGenerator';
import { useTailoredMaterials } from '@/application/tailoring/useTailoredMaterials';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();

// Get current user ID from auth
const { userId } = useAuthUser();

const { createDocument } = useCvDocuments();
const { generateCv, generating, error: generationError } = useCvGenerator();
const tailoredMaterials = useTailoredMaterials();

// Wizard state
const currentStep = ref(1);
const selectedExperienceIds = ref<string[]>([]);
const autoGenerating = ref(false);
const autoTriggered = ref(false);

// Step 2 state
const cvName = ref('');
const includeSkills = ref(true);
const includeLanguages = ref(false);
const includeCertifications = ref(false);
const includeInterests = ref(false);
const includeProfilePhoto = ref(true);
const jobDescription = ref('');
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
const isGenerating = computed(
  () => generating.value || autoGenerating.value || tailoredMaterials.isGenerating.value
);

const LAST_STEP = 2;
const FIRST_STEP = 1;

const nextStep = () => {
  if (currentStep.value < LAST_STEP) {
    currentStep.value++;
  }
};

const previousStep = () => {
  if (currentStep.value > FIRST_STEP) {
    currentStep.value--;
  }
};

const cancel = () => {
  void router.push({ name: 'cv' });
};

const generateTailoredCv = async (jobId: string) => {
  if (autoTriggered.value) {
    return;
  }
  autoTriggered.value = true;
  autoGenerating.value = true;
  try {
    const context = await tailoredMaterials.loadTailoringContext(jobId);
    if (!context.ok) {
      toast.add({
        title: t('cvNew.toast.error'),
        color: 'error',
      });
      await router.push('/jobs');
      return;
    }
    if (!context.matchingSummary) {
      toast.add({
        title: t('cvNew.toast.generationFailed'),
        color: 'error',
      });
      await router.push(`/jobs/${jobId}/match`);
      return;
    }

    const created = await tailoredMaterials.generateTailoredCvForJob({
      job: context.job,
      matchingSummary: context.matchingSummary,
    });
    if (created?.id) {
      await router.push({
        name: 'applications-cv-id',
        params: { id: created.id },
      });
      return;
    }

    toast.add({
      title: t('cvNew.toast.createFailed'),
      color: 'error',
    });
  } catch (err) {
    console.error('[cvNew] Error generating tailored CV:', err);
    toast.add({
      title: t('cvNew.toast.error'),
      color: 'error',
    });
  } finally {
    autoGenerating.value = false;
  }
};

const generateCV = async () => {
  if (!cvName.value.trim() || !userId.value) {
    return;
  }

  try {
    // Generate CV markdown using composable
    const cvMarkdown = await generateCv(userId.value, selectedExperienceIds.value, {
      jobDescription: jobDescription.value || undefined,
      includeSkills: includeSkills.value,
      includeLanguages: includeLanguages.value,
      includeCertifications: includeCertifications.value,
      includeInterests: includeInterests.value,
    });

    if (!cvMarkdown) {
      toast.add({
        title: t('cvNew.toast.generationFailed'),
        description: generationError.value || undefined,
        color: 'error',
      });
      return;
    }

    // Create CV document with markdown content
    const cvDocument = await createDocument({
      name: cvName.value,
      userId: userId.value,
      isTailored: !!jobDescription.value,
      content: cvMarkdown,
      showProfilePhoto: includeProfilePhoto.value,
    });

    if (cvDocument) {
      toast.add({
        title: t('cvNew.toast.created'),
        color: 'primary',
      });

      // Navigate to editor
      await router.push({
        name: 'applications-cv-id',
        params: { id: cvDocument.id },
      });
    } else {
      console.error('[cvNew] Failed to create CV document - createDocument returned null');
      toast.add({
        title: t('cvNew.toast.createFailed'),
        color: 'error',
      });
    }
  } catch (err) {
    console.error('[cvNew] Error generating CV:', err);
    generationError.value = err instanceof Error ? err.message : 'Unknown error';
    toast.add({
      title: t('cvNew.toast.error'),
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
      void generateTailoredCv(jobId);
    }
  },
  { immediate: true }
);
</script>
