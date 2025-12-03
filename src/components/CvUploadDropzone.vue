<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const emit = defineEmits<{
  upload: [text: string];
  error: [error: string];
}>();

const loading = ref(false);
const fileName = ref<string | null>(null);

// Constants for file validation
const MAX_FILE_SIZE_MB = 5;
const BYTES_PER_KB = 1024;
const BYTES_PER_MB = BYTES_PER_KB * BYTES_PER_KB;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * BYTES_PER_MB;

/**
 * Extract text from PDF file using browser's built-in capabilities
 * For MVP, we'll use a simple approach - the browser will handle PDF text extraction
 * In production, you might want to use a library like pdf.js
 */
async function extractTextFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const text = reader.result as string;
      // Simple validation - check if text was extracted
      if (!text || text.trim().length === 0) {
        reject(new Error(t('cvUpload.errors.noTextExtracted')));
        return;
      }
      resolve(text);
    };

    reader.onerror = () => {
      reject(new Error(t('cvUpload.errors.fileReadError')));
    };

    // For text files, we can read directly
    // For PDF, we'll read as text (browser will do basic extraction)
    // Note: For better PDF extraction, consider using pdf.js in production
    reader.readAsText(file);
  });
}

async function handleFileSelect(files: File[]) {
  if (!files || files.length === 0) return;

  const file = files[0];
  if (!file) return;

  fileName.value = file.name;
  loading.value = true;

  try {
    // Validate file type
    if (!file.type.includes('pdf') && !file.type.includes('text')) {
      throw new Error(t('cvUpload.errors.invalidFileType'));
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(t('cvUpload.errors.fileTooLarge'));
    }

    // Extract text from file
    const extractedText = await extractTextFromFile(file);

    // Emit success
    emit('upload', extractedText);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : t('cvUpload.errors.unknown');
    emit('error', errorMessage);
    fileName.value = null;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <h3 class="text-lg font-semibold">
        {{ t('cvUpload.title') }}
      </h3>
    </template>

    <div class="space-y-4">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        {{ t('cvUpload.description') }}
      </p>

      <UDropzone
        accept=".pdf,.txt"
        :max-files="1"
        :loading="loading"
        @change="handleFileSelect"
      >
        <template #default>
          <div class="flex flex-col items-center gap-2 text-center">
            <UIcon name="i-heroicons-document-text" class="h-8 w-8 text-gray-400" />
            <p class="text-sm">
              {{ t('cvUpload.dropzoneText') }}
            </p>
            <p class="text-xs text-gray-500">
              {{ t('cvUpload.dropzoneHint') }}
            </p>
          </div>
        </template>

        <template #file="{ file }">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-document" class="h-5 w-5" />
            <span class="text-sm truncate">{{ file.name }}</span>
          </div>
        </template>
      </UDropzone>

      <div v-if="fileName && !loading" class="flex items-center gap-2 text-sm text-green-600">
        <UIcon name="i-heroicons-check-circle" />
        <span>{{ t('cvUpload.fileUploaded', { fileName }) }}</span>
      </div>
    </div>
  </UCard>
</template>
