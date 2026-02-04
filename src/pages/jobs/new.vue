<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useJobUpload } from '@/composables/useJobUpload';
import JobUploadStep from '@/components/job/JobUploadStep.vue';

const router = useRouter();
const { t } = useI18n();
const {
  selectedFile,
  errorMessage,
  isProcessing,
  statusMessage,
  handleFileSelected: processJobFile,
  reset,
} = useJobUpload();

async function handleFileSelected(file: File | null | undefined) {
  const job = await processJobFile(file);
  if (job) {
    void router.push(`/jobs/${job.id}`);
  }
}
</script>

<template>
  <UPage>
    <UPageHeader
      :title="t('jobs.form.createTitle')"
      :description="t('jobs.form.createDescription')"
    />

    <UPageBody>
      <UAlert
        v-if="errorMessage"
        color="error"
        icon="i-lucide-alert-triangle"
        :title="t('jobs.form.errors.generic')"
        :description="errorMessage"
        :close-button="{ icon: 'i-lucide-x', color: 'error', variant: 'link' }"
        class="mb-6"
        @close="reset()"
      />

      <JobUploadStep
        :selected-file="selectedFile"
        :is-processing="isProcessing"
        :status-message="statusMessage"
        @file-selected="handleFileSelected"
      />
    </UPageBody>
  </UPage>
</template>
