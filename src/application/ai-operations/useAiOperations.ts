import { ref } from 'vue';
import { AiOperationsService } from '@/domain/ai-operations/AiOperationsService';
import type { ParsedCV } from '@/domain/ai-operations/ParsedCV';
import type { ExperiencesResult } from '@/domain/ai-operations/Experience';
import type { STARStory } from '@/domain/ai-operations/STARStory';
import type { AchievementsAndKpis } from '@/domain/ai-operations/AchievementsAndKpis';

/**
 * Composable for AI operations
 * Provides reactive state management for CV parsing, experience extraction, STAR story generation, and achievements/KPIs
 *
 * Supports five workflows:
 * - parseCv: Parse CV text only
 * - extractExperiences: Extract experience blocks only
 * - generateStarStory: Generate STAR story from experience text
 * - generateAchievementsAndKpis: Generate achievements and KPIs from STAR story
 * - parseAndExtract: Complete workflow (parse + extract)
 */
export function useAiOperations() {
  const parsedCv = ref<ParsedCV | null>(null);
  const experiences = ref<ExperiencesResult | null>(null);
  const starStory = ref<STARStory | null>(null);
  const achievementsAndKpis = ref<AchievementsAndKpis | null>(null);
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
   * Generate STAR story from experience text
   */
  const generateStarStory = async (sourceText: string) => {
    loading.value = true;
    error.value = null;
    starStory.value = null;

    try {
      starStory.value = await service.generateStarStory(sourceText);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
    } finally {
      loading.value = false;
    }
  };

  /**
   * Generate achievements and KPIs from STAR story
   */
  const generateAchievementsAndKpis = async (story: STARStory) => {
    loading.value = true;
    error.value = null;
    achievementsAndKpis.value = null;

    try {
      achievementsAndKpis.value = await service.generateAchievementsAndKpis(story);
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
    starStory.value = null;
    achievementsAndKpis.value = null;
    error.value = null;
    loading.value = false;
  };

  return {
    parsedCv,
    experiences,
    starStory,
    achievementsAndKpis,
    loading,
    error,
    parseCv,
    extractExperiences,
    generateStarStory,
    generateAchievementsAndKpis,
    parseAndExtract,
    reset,
  };
}
