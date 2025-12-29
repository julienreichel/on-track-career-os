import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PDFParse } from 'pdf-parse';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import { useJobAnalysis } from '@/composables/useJobAnalysis';

PDFParse.setWorker(
  'https://cdn.jsdelivr.net/npm/pdf-parse@latest/dist/pdf-parse/web/pdf.worker.mjs'
);

const MIN_TEXT_LENGTH = 400;

type UploadStatus = 'idle' | 'extracting' | 'analyzing';

export function useJobUpload() {
  const { t } = useI18n();
  const jobAnalysis = useJobAnalysis();

  const selectedFile = ref<File | null>(null);
  const errorMessage = ref<string | null>(null);
  const status = ref<UploadStatus>('idle');

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
    return file.text();
  }

  async function processFile(file: File): Promise<JobDescription> {
    selectedFile.value = file;
    errorMessage.value = null;
    status.value = 'extracting';

    const rawText =
      file.type === 'application/pdf' ? await extractPdfText(file) : await extractTextFromFile(file);

  const sanitized = rawText?.trim();
  if (!sanitized || sanitized.length < MIN_TEXT_LENGTH) {
    status.value = 'idle';
    errorMessage.value = t('jobUpload.errors.tooShort');
    selectedFile.value = null;
    throw new Error(t('jobUpload.errors.tooShort'));
  }

    status.value = 'analyzing';
    try {
      const draft = await jobAnalysis.createJobFromRawText(sanitized);
      const analyzed = await jobAnalysis.reanalyseJob(draft.id);
      return analyzed;
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : t('jobUpload.errors.generic');
      selectedFile.value = null;
      throw error;
    } finally {
      status.value = 'idle';
    }
  }

  async function handleFileSelected(file: File | null | undefined): Promise<JobDescription | null> {
    if (!file) {
      return null;
    }

    try {
      const job = await processFile(file);
      return job;
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : t('jobUpload.errors.generic');
    return null;
  }
  }

  function reset() {
    selectedFile.value = null;
    errorMessage.value = null;
    status.value = 'idle';
  }

  return {
    selectedFile,
    errorMessage,
    status,
    isProcessing,
    statusMessage,
    handleFileSelected,
    reset,
  };
}
