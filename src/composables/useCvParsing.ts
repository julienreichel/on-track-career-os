import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { PDFParse } from 'pdf-parse';
import { useAiOperations } from '@/application/ai-operations/useAiOperations';
import type { ExtractedExperience } from '@/domain/ai-operations/Experience';
import type { ParseCvTextOutput } from '@amplify/data/ai-operations/parseCvText';

// Configure PDF.js worker
PDFParse.setWorker(
  'https://cdn.jsdelivr.net/npm/pdf-parse@latest/dist/pdf-parse/web/pdf.worker.mjs'
);

/**
 * Composable for parsing CV files
 * Handles file reading, text extraction, and AI parsing
 */
export function useCvParsing() {
  const { t } = useI18n();
  const aiOps = useAiOperations();

  const extractedText = ref<string>('');
  const extractedExperiences = ref<ExtractedExperience[]>([]);
  const extractedProfile = ref<ParseCvTextOutput['profile'] | null>(null);

  async function parseFile(file: File): Promise<void> {
    let text: string;

    // Check file type and parse accordingly
    if (file.type === 'application/pdf') {
      // Parse PDF file using pdf-parse
      const arrayBuffer = await file.arrayBuffer();
      const parser = new PDFParse({ data: arrayBuffer });
      const result = await parser.getText();
      await parser.destroy();
      text = result.text;
    } else {
      // Read text file (txt, doc, docx - for now just txt)
      const reader = new FileReader();
      text = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
      });
    }

    if (!text || text.trim().length === 0) {
      throw new Error(t('cvUpload.errors.noTextExtracted'));
    }

    extractedText.value = text;

    // Step 1: Parse CV text to extract sections
    await aiOps.parseCv(text);

    if (aiOps.error.value) {
      throw new Error(aiOps.error.value);
    }

    if (!aiOps.parsedCv.value?.sections?.experiences) {
      throw new Error(t('cvUpload.errors.parsingFailed'));
    }

    // Extract profile information
    if (aiOps.parsedCv.value?.profile) {
      extractedProfile.value = aiOps.parsedCv.value.profile;
    }

    // Step 2: Extract experience blocks from parsed sections
    await aiOps.extractExperiences(aiOps.parsedCv.value.sections.experiences);

    if (aiOps.error.value) {
      throw new Error(aiOps.error.value);
    }

    if (!aiOps.experiences.value?.experiences) {
      throw new Error(t('cvUpload.errors.extractionFailed'));
    }

    extractedExperiences.value = aiOps.experiences.value.experiences;
  }

  function removeExperience(index: number) {
    extractedExperiences.value.splice(index, 1);
  }

  function removeProfileField(field: keyof ParseCvTextOutput['profile']) {
    if (extractedProfile.value) {
      extractedProfile.value[field] = undefined as never;
    }
  }

  function removeProfileArrayItem(field: keyof ParseCvTextOutput['profile'], index: number) {
    if (extractedProfile.value && Array.isArray(extractedProfile.value[field])) {
      (extractedProfile.value[field] as string[]).splice(index, 1);
    }
  }

  function reset() {
    extractedText.value = '';
    extractedExperiences.value = [];
    extractedProfile.value = null;
    aiOps.reset();
  }

  return {
    extractedText,
    extractedExperiences,
    extractedProfile,
    aiOps,
    parseFile,
    removeExperience,
    removeProfileField,
    removeProfileArrayItem,
    reset,
  };
}
