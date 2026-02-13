import { computed, ref } from 'vue';
import type { Ref } from 'vue';
import { PDFParse } from 'pdf-parse';

PDFParse.setWorker(
  'https://cdn.jsdelivr.net/npm/pdf-parse@latest/dist/pdf-parse/web/pdf.worker.mjs'
);

export type CvSourceMode = 'tailoredCv' | 'pastedText' | 'pdfUpload';
export type CoverLetterSourceMode = 'tailoredCoverLetter' | 'pastedText' | 'pdfUpload';
export type MaterialKind = 'cv' | 'coverLetter';

type UseApplicationStrengthInputsOptions = {
  tailoredCvText: Ref<string>;
  tailoredCoverLetterText: Ref<string>;
};

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

// eslint-disable-next-line max-lines-per-function
export function useApplicationStrengthInputs(options: UseApplicationStrengthInputsOptions) {
  const cvSourceMode = ref<CvSourceMode>('pastedText');
  const coverLetterSourceMode = ref<CoverLetterSourceMode>('pastedText');

  const pastedCvText = ref('');
  const pastedCoverLetterText = ref('');
  const extractedCvText = ref('');
  const extractedCoverLetterText = ref('');

  const isExtractingCv = ref(false);
  const isExtractingCoverLetter = ref(false);
  const extractionError = ref<string | null>(null);

  const hasTailoredCv = computed(() => Boolean(options.tailoredCvText.value.trim()));
  const hasTailoredCoverLetter = computed(() => Boolean(options.tailoredCoverLetterText.value.trim()));

  const cvText = computed(() => {
    if (cvSourceMode.value === 'tailoredCv') {
      return options.tailoredCvText.value.trim();
    }
    if (cvSourceMode.value === 'pdfUpload') {
      return extractedCvText.value.trim();
    }
    return pastedCvText.value.trim();
  });

  const coverLetterText = computed(() => {
    if (coverLetterSourceMode.value === 'tailoredCoverLetter') {
      return options.tailoredCoverLetterText.value.trim();
    }
    if (coverLetterSourceMode.value === 'pdfUpload') {
      return extractedCoverLetterText.value.trim();
    }
    return pastedCoverLetterText.value.trim();
  });

  const canEvaluate = computed(
    () => Boolean(cvText.value.trim()) && !isExtractingCv.value && !isExtractingCoverLetter.value
  );

  const validationErrors = computed(() => {
    const errors: string[] = [];
    if (!cvText.value.trim()) {
      errors.push('CV text is required. Paste text, upload a file, or use the tailored CV.');
    }
    return errors;
  });

  async function handleFileUpload(kind: MaterialKind, file: File | null | undefined) {
    if (!file) {
      return;
    }

    extractionError.value = null;
    if (kind === 'cv') {
      isExtractingCv.value = true;
    } else {
      isExtractingCoverLetter.value = true;
    }

    try {
      const extracted = (await extractTextFromFile(file)).trim();
      if (kind === 'cv') {
        extractedCvText.value = extracted;
      } else {
        extractedCoverLetterText.value = extracted;
      }
    } catch (error) {
      extractionError.value = error instanceof Error ? error.message : 'Unable to extract file text.';
    } finally {
      if (kind === 'cv') {
        isExtractingCv.value = false;
      } else {
        isExtractingCoverLetter.value = false;
      }
    }
  }

  function ensureSupportedModes() {
    if (
      hasTailoredCv.value &&
      cvSourceMode.value === 'pastedText' &&
      !pastedCvText.value.trim() &&
      !extractedCvText.value.trim()
    ) {
      cvSourceMode.value = 'tailoredCv';
    }
    if (
      hasTailoredCoverLetter.value &&
      coverLetterSourceMode.value === 'pastedText' &&
      !pastedCoverLetterText.value.trim() &&
      !extractedCoverLetterText.value.trim()
    ) {
      coverLetterSourceMode.value = 'tailoredCoverLetter';
    }

    if (cvSourceMode.value === 'tailoredCv' && !hasTailoredCv.value) {
      cvSourceMode.value = 'pastedText';
    }
    if (coverLetterSourceMode.value === 'tailoredCoverLetter' && !hasTailoredCoverLetter.value) {
      coverLetterSourceMode.value = 'pastedText';
    }
  }

  function reset() {
    cvSourceMode.value = hasTailoredCv.value ? 'tailoredCv' : 'pastedText';
    coverLetterSourceMode.value = hasTailoredCoverLetter.value ? 'tailoredCoverLetter' : 'pastedText';
    pastedCvText.value = '';
    pastedCoverLetterText.value = '';
    extractedCvText.value = '';
    extractedCoverLetterText.value = '';
    isExtractingCv.value = false;
    isExtractingCoverLetter.value = false;
    extractionError.value = null;
  }

  reset();

  return {
    cvSourceMode,
    coverLetterSourceMode,
    tailoredCvText: options.tailoredCvText,
    tailoredCoverLetterText: options.tailoredCoverLetterText,
    pastedCvText,
    pastedCoverLetterText,
    extractedCvText,
    extractedCoverLetterText,
    hasTailoredCv,
    hasTailoredCoverLetter,
    cvText,
    coverLetterText,
    canEvaluate,
    validationErrors,
    isExtractingCv,
    isExtractingCoverLetter,
    extractionError,
    handleFileUpload,
    ensureSupportedModes,
    reset,
  };
}
