import { computed, ref } from 'vue';
import type { Ref } from 'vue';
import { PDFParse } from 'pdf-parse';
import { logError } from '@/utils/logError';

PDFParse.setWorker(
  'https://cdn.jsdelivr.net/npm/pdf-parse@latest/dist/pdf-parse/web/pdf.worker.mjs'
);

type UseApplicationStrengthInputsOptions = {
  candidateFullName: Ref<string>;
};

type DetectedType = 'cv' | 'coverLetter';

const BEGIN_LINE_LIMIT = 2;
const END_LINE_LIMIT = 2;
const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_REGEX = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}/;

async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const parser = new PDFParse({ data: arrayBuffer });
  const result = await parser.getText();
  await parser.destroy();
  return result.text ?? '';
}

async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === 'application/pdf') {
    return extractPdfText(file);
  }
  return file.text();
}

function getNameLineIndexes(text: string, fullName: string): { first: number; last: number; total: number } {
  if (!fullName) {
    return { first: -1, last: -1, total: 0 };
  }

  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const loweredName = fullName.toLowerCase();
  const indexes = lines
    .map((line, index) => (line.toLowerCase().includes(loweredName) ? index : -1))
    .filter((index) => index >= 0);

  if (!indexes.length) {
    return { first: -1, last: -1, total: lines.length };
  }

  return {
    first: indexes[0] ?? -1,
    last: indexes[indexes.length - 1] ?? -1,
    total: lines.length,
  };
}

function looksLikeCvByContactInfo(text: string): boolean {
  return EMAIL_REGEX.test(text) || PHONE_REGEX.test(text);
}

function detectMaterialType(text: string, fullName: string): DetectedType {
  const normalized = text.trim();
  if (!normalized) {
    return 'coverLetter';
  }

  const namePosition = getNameLineIndexes(normalized, fullName);
  if (namePosition.last >= 0 && namePosition.last >= Math.max(0, namePosition.total - END_LINE_LIMIT)) {
    return 'coverLetter';
  }
  if (namePosition.first >= 0 && namePosition.first < BEGIN_LINE_LIMIT) {
    return 'cv';
  }
  if (looksLikeCvByContactInfo(normalized)) {
    return 'cv';
  }

  return 'coverLetter';
}

export function useApplicationStrengthInputs(options: UseApplicationStrengthInputsOptions) {
  const pastedText = ref('');
  const extractedText = ref('');
  const selectedFile = ref<File | null>(null);
  const isExtracting = ref(false);
  const extractionErrorMessageKey = ref<string | null>(null);
  const rawExtractionError = ref<unknown>(null);

  const uploadedType = computed<DetectedType | null>(() => {
    if (!extractedText.value.trim()) {
      return null;
    }
    return detectMaterialType(extractedText.value, options.candidateFullName.value);
  });

  const pastedType = computed<DetectedType | null>(() => {
    if (!pastedText.value.trim()) {
      return null;
    }
    return detectMaterialType(pastedText.value, options.candidateFullName.value);
  });

  const cvText = computed(() => {
    const blocks: string[] = [];
    if (uploadedType.value === 'cv') {
      blocks.push(extractedText.value.trim());
    }
    if (pastedType.value === 'cv') {
      blocks.push(pastedText.value.trim());
    }
    return blocks.filter(Boolean).join('\n\n');
  });

  const coverLetterText = computed(() => {
    const blocks: string[] = [];
    if (uploadedType.value === 'coverLetter') {
      blocks.push(extractedText.value.trim());
    }
    if (pastedType.value === 'coverLetter') {
      blocks.push(pastedText.value.trim());
    }
    return blocks.filter(Boolean).join('\n\n');
  });

  const hasAnyMaterial = computed(
    () => Boolean(cvText.value.trim()) || Boolean(coverLetterText.value.trim())
  );

  const canEvaluate = computed(() => hasAnyMaterial.value && !isExtracting.value);

  const validationErrors = computed(() => {
    if (hasAnyMaterial.value) {
      return [];
    }
    return ['applicationStrength.errors.missingMaterial'];
  });

  async function handleFileUpload(file: File | null | undefined) {
    if (!file) {
      return;
    }

    selectedFile.value = file;
    extractionErrorMessageKey.value = null;
    rawExtractionError.value = null;
    isExtracting.value = true;

    try {
      extractedText.value = (await extractTextFromFile(file)).trim();
    } catch (error) {
      rawExtractionError.value = error;
      extractionErrorMessageKey.value = 'applicationStrength.errors.pdfExtractionFailed';
      logError('Failed to extract application-strength upload text', error, {
        fileName: file.name,
        mimeType: file.type,
      });
      selectedFile.value = null;
    } finally {
      isExtracting.value = false;
    }
  }

  function reset() {
    pastedText.value = '';
    extractedText.value = '';
    selectedFile.value = null;
    extractionErrorMessageKey.value = null;
    rawExtractionError.value = null;
    isExtracting.value = false;
  }

  return {
    pastedText,
    extractedText,
    selectedFile,
    extractedType: uploadedType,
    pastedType,
    cvText,
    coverLetterText,
    canEvaluate,
    validationErrors,
    isExtracting,
    extractionErrorMessageKey,
    rawExtractionError,
    handleFileUpload,
    reset,
  };
}
