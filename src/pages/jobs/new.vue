<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useJobUpload } from '@/composables/useJobUpload';
import JobUploadStep from '@/components/job/JobUploadStep.vue';
import { useErrorDisplay } from '@/composables/useErrorDisplay';

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
const { notifyActionError } = useErrorDisplay();
const textInput = ref('');
const isTextProcessing = computed(() => isProcessing.value && !selectedFile.value);

watch(
  () => errorMessage.value,
  (message) => {
    if (!message) return;
    notifyActionError({
      title: t('jobs.form.errors.generic'),
      description: message,
    });
    reset();
  }
);

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
        <JobUploadStep
          v-if="!isTextProcessing"
          :selected-file="selectedFile"
          :is-processing="isProcessing"
          :status-message="statusMessage"
          @file-selected="handleFileSelected"
        />

        <UCard v-else>
          <div class="space-y-3">
            <USkeleton class="h-16 rounded-lg animate-pulse" />
            <USkeleton class="h-10 rounded-lg animate-pulse" />
            <p v-if="statusMessage" class="text-sm text-gray-500">{{ statusMessage }}</p>
          </div>
        </UCard>

        <USeparator v-if="!isProcessing" :label="t('ingestion.job.upload.orManual')" />

        <UCard v-if="!isProcessing">
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
