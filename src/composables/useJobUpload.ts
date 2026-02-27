import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PDFParse } from 'pdf-parse';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import { useJobAnalysis } from '@/composables/useJobAnalysis';
import { useAnalytics } from '@/composables/useAnalytics';

PDFParse.setWorker(
  'https://cdn.jsdelivr.net/npm/pdf-parse@latest/dist/pdf-parse/web/pdf.worker.mjs'
);

const MIN_TEXT_LENGTH = 400;
const SUPPORTED_MIME_TYPES = new Set(['application/pdf', 'text/plain']);
const SUPPORTED_EXTENSIONS = new Set(['pdf', 'txt']);

type UploadStatus = 'idle' | 'extracting' | 'analyzing';

// eslint-disable-next-line max-lines-per-function -- Composable API requires comprehensive interface
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
        return t('ingestion.job.upload.status.extracting');
      case 'analyzing':
        return t('ingestion.job.upload.status.analyzing');
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

  function getFileExtension(file: File): string {
    return file.name.split('.').pop()?.toLowerCase() ?? '';
  }

  function isPdfFile(file: File): boolean {
    return file.type === 'application/pdf' || getFileExtension(file) === 'pdf';
  }

  function isSupportedFileType(file: File): boolean {
    if (SUPPORTED_MIME_TYPES.has(file.type)) {
      return true;
    }
    return SUPPORTED_EXTENSIONS.has(getFileExtension(file));
  }

  async function extractTextFromJobFile(file: File): Promise<string> {
    if (isPdfFile(file)) {
      return await extractPdfText(file);
    }
    return await extractTextFromFile(file);
  }

  async function analyzeRawText(rawText: string): Promise<JobDescription> {
    const sanitized = rawText?.trim();
    if (!sanitized || sanitized.length < MIN_TEXT_LENGTH) {
      status.value = 'idle';
      errorMessage.value = t('ingestion.job.upload.errors.tooShort');
      selectedFile.value = null;
      throw new Error(t('ingestion.job.upload.errors.tooShort'));
    }

    status.value = 'analyzing';
    try {
      const analyzed = await jobAnalysis.createAnalyzedJobFromRawText(sanitized);
      const { captureEvent } = useAnalytics();
      captureEvent('job_uploaded');
      return analyzed;
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      errorMessage.value = message || t('ingestion.job.upload.errors.generic');
      selectedFile.value = null;
      throw error;
    } finally {
      status.value = 'idle';
    }
  }

  async function processFile(file: File): Promise<JobDescription> {
    if (!isSupportedFileType(file)) {
      selectedFile.value = null;
      throw new Error(t('ingestion.job.upload.errors.unsupportedFileType'));
    }

    selectedFile.value = file;
    errorMessage.value = null;
    status.value = 'extracting';

    const rawText = await extractTextFromJobFile(file);

    return analyzeRawText(rawText);
  }

  async function handleFileSelected(file: File | null | undefined): Promise<JobDescription | null> {
    if (!file) {
      return null;
    }

    try {
      const job = await processFile(file);
      return job;
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      errorMessage.value = message || t('ingestion.job.upload.errors.generic');
      return null;
    }
  }

  async function handleTextSubmitted(rawText: string): Promise<JobDescription | null> {
    const sanitized = rawText?.trim();
    if (!sanitized) {
      return null;
    }

    selectedFile.value = null;
    errorMessage.value = null;

    try {
      return await analyzeRawText(sanitized);
    } catch {
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
    handleTextSubmitted,
    reset,
  };
}
