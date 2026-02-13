<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useApplicationStrengthPage } from '@/composables/useApplicationStrengthPage';
import ApplicationStrengthInputCard from '@/components/application-strength/ApplicationStrengthInputCard.vue';
import ApplicationStrengthResultsCard from '@/components/application-strength/ApplicationStrengthResultsCard.vue';
import ApplicationStrengthImprovementsCard from '@/components/application-strength/ApplicationStrengthImprovementsCard.vue';
import type { PageHeaderLink } from '@/types/ui';

definePageMeta({
  breadcrumbLabel: 'Application Strength',
});

const route = useRoute();
const jobId = computed(() => route.params.jobId as string);

if (!jobId.value) {
  throw new Error('Job ID is required');
}

const page = useApplicationStrengthPage(jobId.value);

const headerLinks = computed<PageHeaderLink[]>(() => [
  {
    label: 'Back to jobs',
    icon: 'i-heroicons-arrow-left',
    to: '/jobs',
  },
  {
    label: 'Back to job',
    icon: 'i-heroicons-briefcase',
    to: `/jobs/${jobId.value}`,
  },
]);

const hasEvaluation = computed(() => Boolean(page.evaluator.evaluation.value));
const pageBusy = computed(
  () => page.loading.value || page.inputs.isExtractingCv.value || page.inputs.isExtractingCoverLetter.value
);

const errorMessage = computed(() => page.pageError.value || page.evaluator.error.value);

onMounted(async () => {
  await page.load();
});
</script>

<template>
  <UPage>
    <UPageHeader
      :title="page.job.value?.title || 'Application Strength'"
      description="Evaluate your CV and optional cover letter against this role."
      :links="headerLinks"
    />

    <UPageBody>
      <UAlert
        v-if="errorMessage"
        color="error"
        variant="soft"
        icon="i-heroicons-exclamation-triangle"
        title="Unable to evaluate application strength"
        :description="errorMessage"
        class="mb-6"
      />

      <UCard v-if="pageBusy" class="mb-6">
        <USkeleton class="h-10 w-full" />
        <USkeleton class="mt-4 h-40 w-full" />
      </UCard>

      <ApplicationStrengthInputCard
        v-if="page.showInput.value"
        :cv-source-mode="page.inputs.cvSourceMode.value"
        :cover-letter-source-mode="page.inputs.coverLetterSourceMode.value"
        :has-tailored-cv="page.inputs.hasTailoredCv.value"
        :has-tailored-cover-letter="page.inputs.hasTailoredCoverLetter.value"
        :tailored-cv-text="page.inputs.tailoredCvText.value"
        :tailored-cover-letter-text="page.inputs.tailoredCoverLetterText.value"
        :pasted-cv-text="page.inputs.pastedCvText.value"
        :pasted-cover-letter-text="page.inputs.pastedCoverLetterText.value"
        :extracted-cv-text="page.inputs.extractedCvText.value"
        :extracted-cover-letter-text="page.inputs.extractedCoverLetterText.value"
        :can-evaluate="page.canEvaluate.value"
        :loading="page.evaluator.loading.value"
        :is-extracting-cv="page.inputs.isExtractingCv.value"
        :is-extracting-cover-letter="page.inputs.isExtractingCoverLetter.value"
        :validation-errors="page.inputs.validationErrors.value"
        :extraction-error="page.inputs.extractionError.value"
        class="mb-6"
        @update:cv-source-mode="page.inputs.cvSourceMode.value = $event"
        @update:cover-letter-source-mode="page.inputs.coverLetterSourceMode.value = $event"
        @update:pasted-cv-text="page.inputs.pastedCvText.value = $event"
        @update:pasted-cover-letter-text="page.inputs.pastedCoverLetterText.value = $event"
        @upload-cv-file="page.inputs.handleFileUpload('cv', $event)"
        @upload-cover-letter-file="page.inputs.handleFileUpload('coverLetter', $event)"
        @evaluate="page.evaluate()"
      />

      <UCard v-if="!hasEvaluation && !page.showInput.value">
        <UEmpty title="No evaluation yet" icon="i-heroicons-chart-bar" />
      </UCard>

      <div v-if="hasEvaluation" class="space-y-6" data-testid="application-strength-results">
        <div class="flex justify-end">
          <UButton
            label="Clear"
            color="neutral"
            variant="outline"
            icon="i-heroicons-arrow-path"
            data-testid="application-strength-clear"
            @click="page.clear()"
          />
        </div>
        <ApplicationStrengthResultsCard :evaluation="page.evaluator.evaluation.value!" />
        <ApplicationStrengthImprovementsCard :improvements="page.evaluator.evaluation.value!.topImprovements" />
      </div>
    </UPageBody>
  </UPage>
</template>
