<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useOnboardingWizard } from '@/composables/useOnboardingWizard';
import type { OnboardingStep } from '@/domain/onboarding';
import OnboardingStepCvUpload from '@/components/onboarding/steps/OnboardingStepCvUpload.vue';
import OnboardingStepExperienceReview from '@/components/onboarding/steps/OnboardingStepExperienceReview.vue';
import OnboardingStepProfileBasics from '@/components/onboarding/steps/OnboardingStepProfileBasics.vue';
import OnboardingCompletionCard from '@/components/onboarding/steps/OnboardingCompletionCard.vue';

const { t } = useI18n();
const wizard = useOnboardingWizard();

onMounted(() => {
  void wizard.load();
});

const stepItems = computed(() =>
  wizard.steps.value.map((step: OnboardingStep) => ({
    label: t(step.labelKey),
    description: t(step.descriptionKey),
  }))
);
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader :title="t('onboarding.title')" :description="t('onboarding.description')" />

      <UPageBody>
        <UAlert
          v-if="wizard.error.value"
          icon="i-heroicons-exclamation-triangle"
          color="error"
          variant="soft"
          :title="t('onboarding.errors.title')"
          :description="t(wizard.error.value)"
          class="mb-6"
        />

        <USteps :items="stepItems" :model-value="wizard.stepIndex.value" class="mb-6" />

        <OnboardingStepCvUpload
          v-if="wizard.currentStep.value === 'cv-upload'"
          :is-processing="wizard.isProcessing.value"
          @file-selected="wizard.handleCvFile"
        />

        <OnboardingStepExperienceReview
          v-else-if="wizard.currentStep.value === 'experience-review'"
          :experiences="wizard.parsing.extractedExperiences.value"
          :profile="wizard.parsing.extractedProfile.value"
          :is-processing="wizard.isProcessing.value"
          @import-experiences="wizard.importExperiences"
          @back="wizard.back"
        />

        <OnboardingStepProfileBasics
          v-else-if="wizard.currentStep.value === 'profile-basics'"
          @back="wizard.back"
          @complete="wizard.finish"
        />

        <OnboardingCompletionCard
          v-else
          :next-action="wizard.progress.nextAction.value"
        />
      </UPageBody>
    </UPage>
  </UContainer>
</template>
