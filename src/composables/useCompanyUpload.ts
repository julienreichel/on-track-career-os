import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PDFParse } from 'pdf-parse';
import type { Company } from '@/domain/company/Company';
import { CompanyService } from '@/domain/company/CompanyService';

PDFParse.setWorker(
  'https://cdn.jsdelivr.net/npm/pdf-parse@latest/dist/pdf-parse/web/pdf.worker.mjs'
);

const MIN_TEXT_LENGTH = 400;
const MAX_NAME_LENGTH = 80;
const SUPPORTED_MIME_TYPES = new Set(['application/pdf', 'text/plain']);
const SUPPORTED_EXTENSIONS = new Set(['pdf', 'txt']);

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

async function extractTextFromCompanyFile(file: File): Promise<string> {
  if (isPdfFile(file)) {
    return await extractPdfText(file);
  }
  return await extractTextFromFile(file);
}

function deriveCompanyName(file: File, rawText: string, fallback: string) {
  const filename = file.name.replace(/\.[^.]+$/, '');
  const firstLine = rawText
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  return firstLine?.slice(0, MAX_NAME_LENGTH) || filename || fallback;
}

type UploadStatus = 'idle' | 'extracting' | 'analyzing';

export function useCompanyUpload() {
  const { t } = useI18n();
  const service = new CompanyService();

  const selectedFile = ref<File | null>(null);
  const errorMessage = ref<string | null>(null);
  const status = ref<UploadStatus>('idle');

  const isProcessing = computed(() => status.value !== 'idle');
  const statusMessage = computed(() => {
    switch (status.value) {
      case 'extracting':
        return t('companies.upload.status.extracting');
      case 'analyzing':
        return t('companies.upload.status.analyzing');
      default:
        return null;
    }
  });

  async function processFile(file: File): Promise<Company> {
    if (!isSupportedFileType(file)) {
      selectedFile.value = null;
      throw new Error(t('companies.upload.errors.unsupportedFileType'));
    }

    selectedFile.value = file;
    errorMessage.value = null;
    status.value = 'extracting';

    const rawText = await extractTextFromCompanyFile(file);
    const sanitized = rawText?.trim();

    if (!sanitized || sanitized.length < MIN_TEXT_LENGTH) {
      status.value = 'idle';
      errorMessage.value = t('companies.upload.errors.tooShort');
      selectedFile.value = null;
      throw new Error(t('companies.upload.errors.tooShort'));
    }

    status.value = 'analyzing';
    try {
      const companyName = deriveCompanyName(file, sanitized, t('companies.upload.defaultName'));
      const created = await service.createCompany(
        {
          companyName,
          rawNotes: sanitized,
        },
        {
          analyze: true,
          rawText: sanitized,
        }
      );
      if (!created) {
        throw new Error('Creation failed');
      }
      return created;
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : t('companies.upload.errors.generic');
      selectedFile.value = null;
      throw error;
    } finally {
      status.value = 'idle';
    }
  }

  async function handleFileSelected(file: File | null | undefined): Promise<Company | null> {
    if (!file) {
      return null;
    }
    try {
      const company = await processFile(file);
      return company;
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : t('companies.upload.errors.generic');
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
