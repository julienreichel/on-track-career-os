import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { PDFParse } from 'pdf-parse';
import { useAiOperations } from '@/application/ai-operations/useAiOperations';
import type { ExtractedExperience, ExperienceItemInput } from '@/domain/ai-operations/Experience';
import type { ParseCvTextOutput } from '@amplify/data/ai-operations/parseCvText';

// Configure PDF.js worker
PDFParse.setWorker(
  'https://cdn.jsdelivr.net/npm/pdf-parse@latest/dist/pdf-parse/web/pdf.worker.mjs'
);

/**
 * Composable for parsing CV files
 * Handles file reading, text extraction, and AI parsing
 */
// eslint-disable-next-line max-lines-per-function
export function useCvParsing() {
  const { t, locale } = useI18n();
  const aiOps = useAiOperations();

  const extractedText = ref<string>('');
  const extractedExperiences = ref<ExtractedExperience[]>([]);
  const extractedProfile = ref<ParseCvTextOutput['profile'] | null>(null);

  /**
   * Extract text from PDF file
   */
  async function extractPdfText(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const parser = new PDFParse({ data: arrayBuffer });
    const result = await parser.getText();
    await parser.destroy();
    return result.text;
  }

  /**
   * Extract text from plain text file
   */
  async function extractTextFileContent(file: File): Promise<string> {
    const reader = new FileReader();
    return new Promise<string>((resolve, reject) => {
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  /**
   * Extract experiences from a section (work or education)
   */
  async function extractExperiencesFromSection(
    language: string,
    experienceItems: ParseCvTextOutput['experienceItems']
  ): Promise<ExtractedExperience[]> {
    if (experienceItems.length === 0) {
      return [];
    }

    const validTypes = new Set<ExperienceItemInput['experienceType']>([
      'work',
      'education',
      'volunteer',
      'project',
    ]);
    const normalizedItems: ExperienceItemInput[] = experienceItems.map((item) => ({
      ...item,
      experienceType: validTypes.has(item.experienceType as ExperienceItemInput['experienceType'])
        ? (item.experienceType as ExperienceItemInput['experienceType'])
        : 'work',
    }));

    await aiOps.extractExperiences(language, normalizedItems);

    if (aiOps.error.value) {
      throw new Error(aiOps.error.value);
    }

    return aiOps.experiences.value?.experiences || [];
  }

  async function parseFile(file: File): Promise<void> {
    // Extract text based on file type
    const text =
      file.type === 'application/pdf'
        ? await extractPdfText(file)
        : await extractTextFileContent(file);

    if (!text || text.trim().length === 0) {
      throw new Error(t('ingestion.cv.upload.errors.noTextExtracted'));
    }

    extractedText.value = text;

    // Parse CV text to extract profile data and experience items
    const language = locale.value || 'en';
    await aiOps.parseCv(text, language);

    if (aiOps.error.value) {
      throw new Error(aiOps.error.value);
    }

    if (
      !aiOps.parsedCv.value?.experienceItems ||
      aiOps.parsedCv.value.experienceItems.length === 0
    ) {
      throw new Error(t('ingestion.cv.upload.errors.parsingFailed'));
    }

    // Extract profile information
    if (aiOps.parsedCv.value?.profile) {
      extractedProfile.value = aiOps.parsedCv.value.profile;
    }

    const experienceItems = aiOps.parsedCv.value.experienceItems;
    const allExperiences = await extractExperiencesFromSection(language, experienceItems);

    if (allExperiences.length === 0) {
      throw new Error(t('ingestion.cv.upload.errors.extractionFailed'));
    }

    extractedExperiences.value = allExperiences;
  }

  function removeExperience(index: number) {
    extractedExperiences.value.splice(index, 1);
  }

  function updateExperience(index: number, value: ExtractedExperience) {
    if (!extractedExperiences.value[index]) return;
    extractedExperiences.value.splice(index, 1, value);
  }

  function removeProfileField(field: keyof ParseCvTextOutput['profile']) {
    if (extractedProfile.value) {
      const currentValue = extractedProfile.value[field];
      extractedProfile.value[field] = (Array.isArray(currentValue) ? [] : '') as never;
    }
  }

  function removeProfileArrayItem(field: keyof ParseCvTextOutput['profile'], index: number) {
    if (extractedProfile.value && Array.isArray(extractedProfile.value[field])) {
      (extractedProfile.value[field] as string[]).splice(index, 1);
    }
  }

  function updateProfileField(
    field: keyof ParseCvTextOutput['profile'],
    value: string | undefined
  ) {
    if (extractedProfile.value) {
      extractedProfile.value[field] = (value || '') as never;
    }
  }

  function updateProfileArrayField(field: keyof ParseCvTextOutput['profile'], value: string[]) {
    if (extractedProfile.value) {
      extractedProfile.value[field] = value as never;
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
    updateExperience,
    removeProfileField,
    removeProfileArrayItem,
    updateProfileField,
    updateProfileArrayField,
    reset,
  };
}
