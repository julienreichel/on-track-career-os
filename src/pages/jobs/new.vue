<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { PDFParse } from 'pdf-parse';
import { useJobAnalysis } from '@/composables/useJobAnalysis';

PDFParse.setWorker(
  'https://cdn.jsdelivr.net/npm/pdf-parse@latest/dist/pdf-parse/web/pdf.worker.mjs'
);

const MIN_TEXT_LENGTH = 400;

const router = useRouter();
const { t } = useI18n();
const jobAnalysis = useJobAnalysis();

const selectedFile = ref<File | null>(null);
const errorMessage = ref<string | null>(null);
const status = ref<'idle' | 'extracting' | 'analyzing'>('idle');

const isProcessing = computed(() => status.value !== 'idle');
const statusMessage = computed(() => {
  switch (status.value) {
    case 'extracting':
      return t('jobUpload.status.extracting');
    case 'analyzing':
      return t('jobUpload.status.analyzing');
    default:
      return null;
  }
});

async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const parser = new PDFParse({ data: arrayBuffer });
  const result = await parser.getText();
  await parser.destroy();
  return result.text;
}

async function extractTextFromFile(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve((event.target?.result as string) ?? '');
    reader.onerror = (event) => reject(event);
    reader.readAsText(file);
  });
}

async function processJobDescription(file: File) {
  status.value = 'extracting';
  const text =
    file.type === 'application/pdf' ? await extractPdfText(file) : await extractTextFromFile(file);

  const sanitized = text?.trim();
  if (!sanitized || sanitized.length < MIN_TEXT_LENGTH) {
    throw new Error(t('jobUpload.errors.tooShort'));
  }

  status.value = 'analyzing';
  const draft = await jobAnalysis.createJobFromRawText(sanitized);
  const analyzed = await jobAnalysis.reanalyseJob(draft.id);
  router.push(`/jobs/${analyzed.id}`);
}

async function handleFileSelected(file: File | null | undefined) {
  if (!file) return;

  selectedFile.value = file;
  errorMessage.value = null;

  try {
    await processJobDescription(file);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : t('jobUpload.errors.generic');
    selectedFile.value = null;
    status.value = 'idle';
  }
}
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader :title="t('jobUpload.title')" :description="t('jobUpload.description')" />

      <UPageBody>
        <UAlert
          v-if="errorMessage"
          color="error"
          icon="i-lucide-alert-triangle"
          :title="t('jobUpload.errors.generic')"
          :description="errorMessage"
          :close-button="{ icon: 'i-lucide-x', color: 'error', variant: 'link' }"
          class="mb-6"
          @close="errorMessage = null"
        />

        <UCard>
          <div class="space-y-4">
            <UFileUpload
              :model-value="selectedFile"
              :label="t('jobUpload.dropzone.label')"
              :description="t('jobUpload.dropzone.description')"
              accept=".pdf,.txt"
              :clearable="false"
              :disabled="isProcessing"
              @update:model-value="handleFileSelected"
            />

            <div v-if="isProcessing" class="space-y-2">
              <USkeleton class="h-20 rounded-lg animate-pulse" />
              <USkeleton class="h-12 rounded-lg animate-pulse" />
              <p class="text-sm text-gray-500">{{ statusMessage }}</p>
            </div>

            <UAlert
              v-else-if="selectedFile"
              :title="t('jobUpload.fileUploaded', { fileName: selectedFile.name })"
              color="primary"
            />
          </div>
        </UCard>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
