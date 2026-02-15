<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useApplicationStrengthPage } from '@/composables/useApplicationStrengthPage';
import ApplicationStrengthInputCard from '@/components/application-strength/ApplicationStrengthInputCard.vue';
import ApplicationStrengthResultsCard from '@/components/application-strength/ApplicationStrengthResultsCard.vue';
import ApplicationStrengthImprovementsCard from '@/components/application-strength/ApplicationStrengthImprovementsCard.vue';
import type { PageHeaderLink } from '@/types/ui';

definePageMeta({
  breadcrumbLabel: 'Application Strength',
});
const { t } = useI18n();

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

const errorMessage = computed(() => page.pageError.value || page.evaluator.error.value);

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
      <UAlert
        v-if="errorMessage"
        color="error"
        variant="soft"
        icon="i-heroicons-exclamation-triangle"
        :title="t('applicationStrength.page.errorTitle')"
        :description="errorMessage"
        class="mb-6"
      />

      <UCard v-if="pageBusy" class="mb-6">
        <USkeleton class="h-10 w-full" />
        <USkeleton class="mt-4 h-40 w-full" />
      </UCard>

      <ApplicationStrengthInputCard
        v-if="page.showInput.value"
        :selected-file="page.inputs.selectedFile.value"
        :pasted-text="page.inputs.pastedText.value"
        :extracted-text="page.inputs.extractedText.value"
        :extracted-type="page.inputs.extractedType.value"
        :pasted-type="page.inputs.pastedType.value"
        :can-evaluate="page.canEvaluate.value"
        :loading="page.evaluator.loading.value"
        :is-extracting="page.inputs.isExtracting.value"
        :validation-errors="page.inputs.validationErrors.value"
        :extraction-error="page.inputs.extractionError.value"
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
