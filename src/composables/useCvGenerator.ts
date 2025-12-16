import { ref } from 'vue';
import { AiOperationsService } from '@/domain/ai-operations/AiOperationsService';
import { UserProfileRepository } from '@/domain/user-profile/UserProfileRepository';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import { STARStoryService } from '@/domain/starstory/STARStoryService';
import type { GenerateCvInput, GenerateCvResult } from '@/domain/ai-operations/types/generateCv';
import type { Experience } from '@/domain/experience/Experience';
import type { STARStory } from '@/domain/starstory/STARStory';

/**
 * CV Generator Composable
 *
 * Wraps AI operations for CV generation:
 * - Generate complete CV in Markdown format from user data
 *
 * This composable bridges the AI operations and the CV pages.
 */
// eslint-disable-next-line max-lines-per-function
export function useCvGenerator() {
  const generating = ref(false);
  const error = ref<string | null>(null);

  const aiService = new AiOperationsService();
  const userProfileRepo = new UserProfileRepository();
  const experienceRepo = new ExperienceRepository();
  const storyService = new STARStoryService();

  /**
   * Load experiences and stories for selected experience IDs
   */
  const loadExperiencesAndStories = async (
    profile: Awaited<ReturnType<typeof userProfileRepo.get>>,
    selectedExperienceIds: string[]
  ) => {
    if (!profile) {
      return { selectedExperiences: [], allStories: [] };
    }

    const allExperiences = await experienceRepo.list(profile);
    const selectedExperiences = allExperiences.filter((exp) =>
      selectedExperienceIds.includes(exp.id)
    );

    const allStories: STARStory[] = [];
    for (const exp of selectedExperiences) {
      const stories = await storyService.getStoriesByExperience(exp);
      allStories.push(...stories);
    }

    return { selectedExperiences, allStories };
  };

  /**
   * Build AI input from user data
   */
  // eslint-disable-next-line complexity
  const buildGenerationInput = async (
    userId: string,
    selectedExperienceIds: string[],
    options: {
      jobDescription?: string;
      includeSkills?: boolean;
      includeLanguages?: boolean;
      includeCertifications?: boolean;
      includeInterests?: boolean;
    } = {}
  ): Promise<GenerateCvInput | null> => {
    try {
      // Load user profile
      const profile = await userProfileRepo.get(userId);

      if (!profile) {
        error.value = 'cvGenerator.errors.profileNotFound';
        return null;
      }

      // Load selected experiences and stories
      const { selectedExperiences, allStories } = await loadExperiencesAndStories(
        profile,
        selectedExperienceIds
      );

      // Build input
      const input: GenerateCvInput = {
        userProfile: {
          fullName: profile.fullName || '',
          headline: profile.headline || undefined,
          location: profile.location || undefined,
          goals: profile.goals?.filter((g): g is string => g !== null),
          strengths: profile.strengths?.filter((s): s is string => s !== null),
        },
        selectedExperiences: selectedExperiences.map((exp: Experience) => ({
          id: exp.id,
          title: exp.title || '',
          company: exp.companyName || '',
          startDate: exp.startDate || '',
          endDate: exp.endDate || undefined,
          responsibilities: exp.responsibilities?.filter((r): r is string => r !== null),
          tasks: exp.tasks?.filter((t): t is string => t !== null),
        })),
        stories: allStories.map((story) => ({
          situation: story.situation,
          task: story.task,
          action: story.action,
          result: story.result,
        })),
      };

      // Add optional profile fields
      if (options.includeSkills && profile.skills) {
        input.skills = profile.skills.filter((s): s is string => s !== null);
      }
      if (options.includeLanguages && profile.languages) {
        input.languages = profile.languages.filter((l): l is string => l !== null);
      }
      if (options.includeCertifications && profile.certifications) {
        input.certifications = profile.certifications.filter((c): c is string => c !== null);
      }
      if (options.includeInterests && profile.interests) {
        input.interests = profile.interests.filter((i): i is string => i !== null);
      }

      // Add optional generation options
      if (options.jobDescription) input.jobDescription = options.jobDescription;

      return input;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'cvGenerator.errors.buildInputFailed';
      console.error('[useCvGenerator] Error building input:', err);
      return null;
    }
  };

  /**
   * Generate complete CV in Markdown format from user data
   */
  const generateCv = async (
    userId: string,
    selectedExperienceIds: string[],
    // eslint-disable-next-line no-magic-numbers
    options: Parameters<typeof buildGenerationInput>[2] = {}
  ): Promise<string | null> => {
    generating.value = true;
    error.value = null;

    try {
      const input = await buildGenerationInput(userId, selectedExperienceIds, options);

      if (!input) {
        return null;
      }

      const result: GenerateCvResult = await aiService.generateCv(input);

      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'cvGenerator.errors.generationFailed';
      console.error('[useCvGenerator] Error generating CV:', err);
      return null;
    } finally {
      generating.value = false;
    }
  };

  return {
    // State
    generating,
    error,

    // Actions
    generateCv,
    buildGenerationInput,
  };
}
