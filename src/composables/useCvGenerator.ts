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
    userId: string,
    selectedExperienceIds: string[]
  ): Promise<{ experiences: Experience[]; allStories: STARStory[] }> => {
    if (!userId) {
      return { experiences: [], allStories: [] };
    }

    const allExperiences = await experienceRepo.list(userId);
    const experiences = allExperiences.filter((exp) => selectedExperienceIds.includes(exp.id));

    const storyResponses = await Promise.all(
      experiences.map(async (exp) => {
        try {
          return await storyService.getStoriesByExperience(exp.id);
        } catch (err) {
          console.error('[useCvGenerator] Failed to load stories for experience:', exp.id, err);
          return [];
        }
      })
    );

    const allStories = storyResponses.flat();

    return { experiences, allStories };
  };

  /**
   * Build AI input from user data
   */
  const buildGenerationInput = async (
    userId: string,
    selectedExperienceIds: string[],
    options: {
      jobDescription?: GenerateCvInput['jobDescription'] | string;
      includeSkills?: boolean;
      includeLanguages?: boolean;
      includeCertifications?: boolean;
      includeInterests?: boolean;
    } = {}
    // eslint-disable-next-line complexity
  ): Promise<GenerateCvInput | null> => {
    try {
      // Load user profile
      const profile = await userProfileRepo.get(userId);

      if (!profile) {
        error.value = 'cvGenerator.errors.profileNotFound';
        return null;
      }

      // Load selected experiences and stories
      const { experiences, allStories } = await loadExperiencesAndStories(
        profile.id,
        selectedExperienceIds
      );

      // Build input
      const input: GenerateCvInput = {
        language: 'en',
        profile: {
          fullName: profile.fullName || '',
          headline: profile.headline || undefined,
          location: profile.location || undefined,
          seniorityLevel: profile.seniorityLevel || undefined,
          primaryEmail: profile.primaryEmail || undefined,
          primaryPhone: profile.primaryPhone || undefined,
          workPermitInfo: profile.workPermitInfo || undefined,
          socialLinks: profile.socialLinks
            ?.map((link) => (typeof link === 'string' ? link.trim() : ''))
            .filter((link): link is string => !!link),
          goals: profile.goals?.filter((g): g is string => g !== null),
          aspirations: profile.aspirations?.filter((a): a is string => a !== null),
          personalValues: profile.personalValues?.filter((p): p is string => p !== null),
          strengths: profile.strengths?.filter((s): s is string => s !== null),
        },
        experiences: experiences.map((exp: Experience) => ({
          id: exp.id,
          title: exp.title || '',
          companyName: exp.companyName ?? '',
          startDate: exp.startDate || '',
          endDate: exp.endDate || undefined,
          experienceType:
            (exp.experienceType as 'work' | 'education' | 'volunteer' | 'project' | undefined) ??
            'work',
          responsibilities: filterStringList(exp.responsibilities),
          tasks: filterStringList(exp.tasks),
        })),
        stories: allStories.map((story) => ({
          experienceId: story.experienceId,
          situation: story.situation,
          task: story.task,
          action: story.action,
          result: story.result,
          achievements: story.achievements?.filter((a): a is string => a !== null),
        })),
      };

      // Add optional profile fields
      if (options.includeSkills && profile.skills) {
        input.profile.skills = profile.skills.filter((s): s is string => s !== null);
      }
      if (options.includeLanguages && profile.languages) {
        input.profile.languages = profile.languages.filter((l): l is string => l !== null);
      }
      if (options.includeCertifications && profile.certifications) {
        input.profile.certifications = profile.certifications.filter(
          (c): c is string => c !== null
        );
      }
      if (options.includeInterests && profile.interests) {
        input.profile.interests = profile.interests.filter((i): i is string => i !== null);
      }

      // Add optional generation options
      if (options.jobDescription) {
        input.jobDescription = normalizeJobDescription(options.jobDescription);
      }

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

function normalizeJobDescription(
  input: GenerateCvInput['jobDescription'] | string
): GenerateCvInput['jobDescription'] | undefined {
  if (!input) return;
  if (typeof input !== 'string') {
    return {
      title: input.title,
      seniorityLevel: input.seniorityLevel ?? '',
      roleSummary: input.roleSummary ?? '',
      responsibilities: input.responsibilities ?? [],
      requiredSkills: input.requiredSkills ?? [],
      behaviours: input.behaviours ?? [],
      successCriteria: input.successCriteria ?? [],
      explicitPains: input.explicitPains ?? [],
    };
  }

  return {
    title: 'Target role',
    seniorityLevel: '',
    roleSummary: input.trim(),
    responsibilities: [],
    requiredSkills: [],
    behaviours: [],
    successCriteria: [],
    explicitPains: [],
  };
}

function filterStringList(values?: (string | null)[] | null): string[] {
  if (!values) {
    return [];
  }
  return values.filter((value): value is string => Boolean(value?.trim()));
}
