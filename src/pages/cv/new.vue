<template>
  <UPage>
    <UPageHeader :title="$t('cvNew.title')" :description="$t('cvNew.subtitle')" />

    <UPageBody>
      <!-- Wizard Steps -->
      <div class="mb-6">
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
      <UCard v-if="currentStep === 1">
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

      <!-- Step 2: Generate CV -->
      <UCard v-if="currentStep === 2">
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
            <UInput v-model="cvName" :placeholder="$t('cvNew.step2.placeholders.name')" />
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
            />
          </UFormField>

          <div class="flex justify-end gap-3 pt-4 border-t">
            <UButton color="neutral" variant="outline" @click="previousStep">
              {{ $t('cvNew.actions.back') }}
            </UButton>
            <UButton :loading="generating" :disabled="!cvName.trim()" @click="generateCV">
              {{ $t('cvNew.actions.generate') }}
            </UButton>
          </div>
        </div>
      </UCard>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import { useAuthUser } from '@/composables/useAuthUser';
import { useCvDocuments } from '@/composables/useCvDocuments';
import { useCvGenerator } from '@/composables/useCvGenerator';

const { t } = useI18n();
const router = useRouter();
const toast = useToast();

// Get current user ID from auth
const { userId } = useAuthUser();

const { createDocument } = useCvDocuments();
const { generateCv, generating, error: generationError } = useCvGenerator();

// Wizard state
const currentStep = ref(1);
const selectedExperienceIds = ref<string[]>([]);

// Step 2 state
const cvName = ref('');
const includeSkills = ref(true);
const includeLanguages = ref(false);
const includeCertifications = ref(false);
const includeInterests = ref(false);
const jobDescription = ref('');

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
  router.push({ name: 'cv' });
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
    });

    if (cvDocument) {
      toast.add({
        title: t('cvNew.toast.created'),
        color: 'primary',
      });

      // Navigate to editor
      await router.push({
        name: 'cv-id',
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
</script>
