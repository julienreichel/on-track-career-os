import { ref } from 'vue';
import type { Ref } from 'vue';
import { AiOperationsService } from '@/domain/ai-operations/AiOperationsService';
import type { ParsedCV } from '@/domain/ai-operations/ParsedCV';
import type { ExperiencesResult } from '@/domain/ai-operations/Experience';
import type { STARStory } from '@/domain/ai-operations/STARStory';
import type { AchievementsAndKpis } from '@/domain/ai-operations/AchievementsAndKpis';
import type { PersonalCanvas, PersonalCanvasInput } from '@/domain/ai-operations/PersonalCanvas';
import type { ParsedJobDescription } from '@/domain/ai-operations/ParsedJobDescription';

/**
 * Helper function to handle async operations with loading and error states
 */
async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  loading: Ref<boolean>,
  error: Ref<string | null>,
  target: Ref<T | null>
): Promise<void> {
  loading.value = true;
  error.value = null;
  target.value = null;

  try {
    target.value = await operation();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error occurred';
  } finally {
    loading.value = false;
  }
}

/**
 * Composable for AI operations
 * Provides reactive state management for CV parsing, job parsing, experience extraction, STAR story generation, achievements/KPIs, and Personal Canvas
 *
 * Supports six workflows:
 * - parseCv: Parse CV text only
 * - extractExperiences: Extract experience blocks only
 * - generateStarStory: Generate STAR story from experience text
 * - generateAchievementsAndKpis: Generate achievements and KPIs from STAR story
 * - generatePersonalCanvas: Generate Personal Business Model Canvas
 */
export function useAiOperations() {
  const parsedCv = ref<ParsedCV | null>(null);
  const parsedJobDescription = ref<ParsedJobDescription | null>(null);
  const experiences = ref<ExperiencesResult | null>(null);
  const starStories = ref<STARStory[] | null>(null); // Changed to array
  const achievementsAndKpis = ref<AchievementsAndKpis | null>(null);
  const personalCanvas = ref<PersonalCanvas | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const service = new AiOperationsService();

  const parseCv = (cvText: string) =>
    handleAsyncOperation(() => service.parseCvText(cvText), loading, error, parsedCv);

  const parseJobDescription = (jobText: string) =>
    handleAsyncOperation(
      () => service.parseJobDescription(jobText),
      loading,
      error,
      parsedJobDescription
    );

  const extractExperiences = (
    language: string,
    experienceItems: Parameters<AiOperationsService['extractExperienceBlocks']>[1]
  ) =>
    handleAsyncOperation(
      () => service.extractExperienceBlocks(language, experienceItems),
      loading,
      error,
      experiences
    );

  const generateStarStory = (sourceText: string) =>
    handleAsyncOperation(() => service.generateStarStory(sourceText), loading, error, starStories);

  const generateAchievementsAndKpis = (story: STARStory) =>
    handleAsyncOperation(
      () => service.generateAchievementsAndKpis(story),
      loading,
      error,
      achievementsAndKpis
    );

  const generatePersonalCanvas = (input: PersonalCanvasInput) =>
    handleAsyncOperation(
      () => service.generatePersonalCanvas(input),
      loading,
      error,
      personalCanvas
    );

  const reset = () => {
    parsedCv.value = null;
    parsedJobDescription.value = null;
    experiences.value = null;
    starStories.value = null;
    achievementsAndKpis.value = null;
    personalCanvas.value = null;
    error.value = null;
    loading.value = false;
  };

  return {
    parsedCv,
    parsedJobDescription,
    experiences,
    starStories,
    achievementsAndKpis,
    personalCanvas,
    loading,
    error,
    parseCv,
    parseJobDescription,
    extractExperiences,
    generateStarStory,
    generateAchievementsAndKpis,
    generatePersonalCanvas,
    reset,
  };
}
