<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAnalytics } from '@/composables/useAnalytics';
import { useApplicationStrengthPage } from '@/composables/useApplicationStrengthPage';
import ApplicationStrengthInputCard from '@/components/application-strength/ApplicationStrengthInputCard.vue';
import ApplicationStrengthResultsCard from '@/components/application-strength/ApplicationStrengthResultsCard.vue';
import ApplicationStrengthImprovementsCard from '@/components/application-strength/ApplicationStrengthImprovementsCard.vue';
import ErrorStateCard from '@/components/common/ErrorStateCard.vue';
import type { PageHeaderLink } from '@/types/ui';

definePageMeta({
  breadcrumbLabel: 'Application Strength',
});
const { t } = useI18n();
const { captureEvent } = useAnalytics();

const route = useRoute();
const jobId = computed(() => route.params.jobId as string);

if (!jobId.value) {
  throw new Error('Job ID is required');
}

const page = useApplicationStrengthPage(jobId.value);

const headerLinks = computed<PageHeaderLink[]>(() => [
  {
    label: t('common.backToList'),
    icon: 'i-heroicons-arrow-left',
    to: '/jobs',
  },
  {
    label: t('applicationStrength.page.backToJob'),
    icon: 'i-heroicons-briefcase',
    to: `/jobs/${jobId.value}`,
  },
]);

const hasEvaluation = computed(() => Boolean(page.evaluator.evaluation.value));
const pageBusy = computed(() => page.loading.value || page.inputs.isExtracting.value);
const showJobError = computed(() => Boolean(page.pageErrorMessageKey.value));
const showEvaluationError = computed(
  () => page.evaluator.status.value === 'error' && Boolean(page.evaluator.errorMessageKey.value)
);

function isPdfFile(file: File | null | undefined): boolean {
  if (!file) {
    return false;
  }
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

async function handleUploadFile(file: File | null | undefined) {
  await page.inputs.handleFileUpload(file);
  if (!isPdfFile(file)) {
    return;
  }
  if (!page.canEvaluate.value) {
    return;
  }
  await page.evaluate();
}

async function retryPageLoad() {
  captureEvent('application_strength_retry_clicked', { source: 'page_error' });
  await page.load();
}

async function retryEvaluation() {
  captureEvent('application_strength_retry_clicked', { source: 'evaluation_error' });
  await page.evaluate();
}

onMounted(async () => {
  await page.load();
});
</script>

<template>
  <UPage>
    <UPageHeader
      :title="page.job.value?.title || t('applicationStrength.page.titleFallback')"
      :description="t('applicationStrength.page.description')"
      :links="headerLinks"
    />

    <UPageBody>
      <ErrorStateCard
        v-if="showJobError"
        :title="t('applicationStrength.page.errorTitle')"
        :description="t(page.pageErrorMessageKey.value!)"
        :retry-label="t('common.retry')"
        test-id="application-strength-page-error"
        class="mb-6"
        @retry="retryPageLoad"
      />

      <ErrorStateCard
        v-else-if="showEvaluationError"
        :title="t('applicationStrength.page.errorTitle')"
        :description="t(page.evaluator.errorMessageKey.value!)"
        :retry-label="t('common.retry')"
        test-id="application-strength-evaluation-error"
        class="mb-6"
        @retry="retryEvaluation"
      />

      <UCard v-if="pageBusy" class="mb-6">
        <USkeleton class="h-10 w-full" />
        <USkeleton class="mt-4 h-40 w-full" />
      </UCard>

      <ApplicationStrengthInputCard
        v-if="page.showInput.value && !showJobError"
        :selected-file="page.inputs.selectedFile.value"
        :pasted-text="page.inputs.pastedText.value"
        :extracted-text="page.inputs.extractedText.value"
        :extracted-type="page.inputs.extractedType.value"
        :pasted-type="page.inputs.pastedType.value"
        :can-evaluate="page.canEvaluate.value"
        :loading="page.evaluator.status.value === 'loading'"
        :is-extracting="page.inputs.isExtracting.value"
        :validation-error-keys="page.inputs.validationErrors.value"
        :extraction-error-message-key="page.inputs.extractionErrorMessageKey.value"
        class="mb-6"
        @update:pasted-text="page.inputs.pastedText.value = $event"
        @upload-file="handleUploadFile($event)"
        @evaluate="page.evaluate()"
      />

      <UCard v-if="!hasEvaluation && !page.showInput.value">
        <UEmpty
          :title="t('applicationStrength.page.noEvaluationYet')"
          icon="i-heroicons-chart-bar"
        />
      </UCard>

      <div v-if="hasEvaluation" class="space-y-6" data-testid="application-strength-results">
        <div class="flex justify-end">
          <UButton
            :label="t('applicationStrength.page.clear')"
            color="neutral"
            variant="outline"
            icon="i-heroicons-arrow-path"
            data-testid="application-strength-clear"
            @click="page.clear()"
          />
        </div>
        <ApplicationStrengthResultsCard :evaluation="page.evaluator.evaluation.value!" />
        <ApplicationStrengthImprovementsCard
          :improvements="page.evaluator.evaluation.value!.topImprovements"
        />
      </div>
    </UPageBody>
  </UPage>
</template>
