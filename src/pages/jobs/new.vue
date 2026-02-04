<script setup lang="ts">
import { ref } from 'vue';
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
  handleTextSubmitted: processJobText,
  reset,
} = useJobUpload();
const textInput = ref('');

async function handleFileSelected(file: File | null | undefined) {
  const job = await processJobFile(file);
  if (job) {
    void router.push(`/jobs/${job.id}`);
  }
}

async function handleTextSubmitted(rawText: string) {
  const job = await processJobText(rawText);
  if (job) {
    void router.push(`/jobs/${job.id}`);
  }

  textInput.value = '';
}
</script>

<template>
  <UPage>
    <UPageHeader
      :title="t('jobs.form.createTitle')"
      :description="t('jobs.form.createDescription')"
    />

    <UPageBody>
      <div class="space-y-6">
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

        <USeparator :label="t('ingestion.job.upload.orManual')" />

        <UCard>
          <UFormField
            :label="t('ingestion.job.upload.text.label')"
            :description="t('ingestion.job.upload.text.description')"
            class="w-full"
          >
            <UTextarea
              v-model="textInput"
              class="w-full"
              :rows="6"
              :placeholder="t('ingestion.job.upload.text.placeholder')"
              :disabled="isProcessing"
            />
          </UFormField>

          <template #footer>
            <div class="flex justify-end">
              <UButton
                color="primary"
                :disabled="isProcessing || !textInput.trim()"
                @click="handleTextSubmitted(textInput)"
              >
                {{ t('ingestion.job.upload.text.submit') }}
              </UButton>
            </div>
          </template>
        </UCard>
      </div>
    </UPageBody>
  </UPage>
</template>
