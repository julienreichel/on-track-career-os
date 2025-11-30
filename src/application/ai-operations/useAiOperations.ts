import { ref } from 'vue';
import { AiOperationsService } from '@/domain/ai-operations/AiOperationsService';
import type { ParsedCV } from '@/domain/ai-operations/ParsedCV';
import type { ExperiencesResult } from '@/domain/ai-operations/Experience';

/**
 * Composable for parsing CV text
 * Provides reactive state management for CV parsing operation
 */
export function useParseCvText() {
  const parsedCv = ref<ParsedCV | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const service = new AiOperationsService();

  const parse = async (cvText: string) => {
    loading.value = true;
    error.value = null;
    parsedCv.value = null;

    try {
      parsedCv.value = await service.parseCvText(cvText);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
    } finally {
      loading.value = false;
    }
  };

  const reset = () => {
    parsedCv.value = null;
    error.value = null;
    loading.value = false;
  };

  return {
    parsedCv,
    loading,
    error,
    parse,
    reset,
  };
}

/**
 * Composable for extracting experience blocks
 * Provides reactive state management for experience extraction operation
 */
export function useExtractExperienceBlocks() {
  const experiences = ref<ExperiencesResult | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const service = new AiOperationsService();

  const extract = async (experienceTextBlocks: string[]) => {
    loading.value = true;
    error.value = null;
    experiences.value = null;

    try {
      experiences.value = await service.extractExperienceBlocks(experienceTextBlocks);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
    } finally {
      loading.value = false;
    }
  };

  const reset = () => {
    experiences.value = null;
    error.value = null;
    loading.value = false;
  };

  return {
    experiences,
    loading,
    error,
    extract,
    reset,
  };
}

/**
 * Composable for complete CV parsing and experience extraction workflow
 * Combines both operations in a single composable
 */
export function useAiOperations() {
  const parsedCv = ref<ParsedCV | null>(null);
  const experiences = ref<ExperiencesResult | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const service = new AiOperationsService();

  /**
   * Parse CV text only
   */
  const parseCv = async (cvText: string) => {
    loading.value = true;
    error.value = null;
    parsedCv.value = null;

    try {
      parsedCv.value = await service.parseCvText(cvText);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
    } finally {
      loading.value = false;
    }
  };

  /**
   * Extract experience blocks only
   */
  const extractExperiences = async (experienceTextBlocks: string[]) => {
    loading.value = true;
    error.value = null;
    experiences.value = null;

    try {
      experiences.value = await service.extractExperienceBlocks(experienceTextBlocks);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
    } finally {
      loading.value = false;
    }
  };

  /**
   * Parse CV and extract experiences in one workflow
   */
  const parseAndExtract = async (cvText: string) => {
    loading.value = true;
    error.value = null;
    parsedCv.value = null;
    experiences.value = null;

    try {
      const result = await service.parseCvAndExtractExperiences(cvText);
      parsedCv.value = result.parsedCv;
      experiences.value = result.experiences;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
    } finally {
      loading.value = false;
    }
  };

  const reset = () => {
    parsedCv.value = null;
    experiences.value = null;
    error.value = null;
    loading.value = false;
  };

  return {
    parsedCv,
    experiences,
    loading,
    error,
    parseCv,
    extractExperiences,
    parseAndExtract,
    reset,
  };
}
