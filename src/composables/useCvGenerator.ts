import { ref } from 'vue';
import { AiOperationsService } from '@/domain/ai-operations/AiOperationsService';
import { UserProfileRepository } from '@/domain/user-profile/UserProfileRepository';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import { STARStoryService } from '@/domain/starstory/STARStoryService';
import type { CVBlock } from '@/domain/cvdocument/CVDocumentService';
import type {
  GenerateCvBlocksInput,
  CVBlocksResult,
  CVSection,
  SectionType,
} from '@/domain/ai-operations/CVBlocks';
import type { Experience } from '@/domain/experience/Experience';
import type { STARStory } from '@/domain/starstory/STARStory';

/**
 * CV Generator Composable
 *
 * Wraps AI operations for CV generation:
 * - Generate complete CV from user data
 * - Regenerate individual blocks
 * - Convert AI sections to CVBlock format
 *
 * This composable bridges the AI operations and the CV editor.
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
   * Convert AI CVSection to CVBlock format
   */
  const sectionToBlock = (section: CVSection, index: number): CVBlock => {
    return {
      id: `block-${Date.now()}-${index}`,
      type: section.type,
      content: {
        title: section.title,
        text: section.content,
        experienceId: section.experienceId,
      },
      order: index,
    };
  };

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
  const buildGenerationInput = async (
    userId: string,
    selectedExperienceIds: string[],
    options: {
      jobDescription?: string;
      sectionsToGenerate?: SectionType[];
      includeSkills?: boolean;
      includeLanguages?: boolean;
      includeCertifications?: boolean;
      includeInterests?: boolean;
    } = {}
  ): Promise<GenerateCvBlocksInput | null> => {
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
      const input: GenerateCvBlocksInput = {
        userProfile: {
          id: profile.id,
          fullName: profile.fullName || '',
          headline: profile.headline || undefined,
        },
        selectedExperiences: selectedExperiences.map((exp: Experience) => ({
          id: exp.id,
          title: exp.title || '',
          company: exp.companyName || '',
          startDate: exp.startDate || undefined,
          endDate: exp.endDate || undefined,
          responsibilities: exp.responsibilities?.filter((r): r is string => r !== null),
          tasks: exp.tasks?.filter((t): t is string => t !== null),
          experienceType: exp.experienceType || undefined,
        })),
        stories: allStories.map((story) => ({
          situation: story.situation,
          task: story.task,
          action: story.action,
          result: story.result,
          achievements: story.achievements?.filter((a): a is string => a !== null),
          kpiSuggestions: story.kpiSuggestions?.filter((k): k is string => k !== null),
          experienceId: story.experienceId,
        })),
      };

      // Add optional profile fields
      const profileFields = [
        { condition: options.includeSkills, key: 'skills', value: profile.skills },
        { condition: options.includeLanguages, key: 'languages', value: profile.languages },
        {
          condition: options.includeCertifications,
          key: 'certifications',
          value: profile.certifications,
        },
        { condition: options.includeInterests, key: 'interests', value: profile.interests },
      ];

      profileFields.forEach(({ condition, key, value }) => {
        if (condition && value) {
          const filtered = value.filter((v): v is string => v !== null);
          Object.assign(input, { [key]: filtered });
        }
      });

      // Add optional generation options
      if (options.sectionsToGenerate) input.sectionsToGenerate = options.sectionsToGenerate;
      if (options.jobDescription) input.jobDescription = options.jobDescription;

      return input;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'cvGenerator.errors.buildInputFailed';
      console.error('[useCvGenerator] Error building input:', err);
      return null;
    }
  };

  /**
   * Generate complete CV blocks from user data
   */
  const generateBlocks = async (
    userId: string,
    selectedExperienceIds: string[],
    // eslint-disable-next-line no-magic-numbers
    options: Parameters<typeof buildGenerationInput>[2] = {}
  ): Promise<CVBlock[] | null> => {
    generating.value = true;
    error.value = null;

    try {
      const input = await buildGenerationInput(userId, selectedExperienceIds, options);

      if (!input) {
        return null;
      }

      const result: CVBlocksResult = await aiService.generateCvBlocks(input);

      // Convert sections to blocks
      const cvBlocks = result.sections.map((section, index) => sectionToBlock(section, index));

      return cvBlocks;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'cvGenerator.errors.generationFailed';
      console.error('[useCvGenerator] Error generating blocks:', err);
      return null;
    } finally {
      generating.value = false;
    }
  };

  /**
   * Regenerate a single block
   */
  const regenerateBlock = async (
    userId: string,
    selectedExperienceIds: string[],
    blockToRegenerate: CVBlock,
    // eslint-disable-next-line no-magic-numbers
    _generationOptions: Parameters<typeof buildGenerationInput>[2] = {}
  ): Promise<CVBlock | null> => {
    generating.value = true;
    error.value = null;

    try {
      const input = await buildGenerationInput(userId, selectedExperienceIds, _generationOptions);

      if (!input) {
        return null;
      }

      // For single block regeneration, we request only that section type
      input.sectionsToGenerate = [blockToRegenerate.type as SectionType];

      const result: CVBlocksResult = await aiService.generateCvBlocks(input);

      // Find the regenerated section (should be first/only one)
      const regeneratedSection = result.sections.find((s) => s.type === blockToRegenerate.type);

      if (!regeneratedSection) {
        error.value = 'cvGenerator.errors.regenerationFailed';
        return null;
      }

      // Convert to block while preserving original order
      return sectionToBlock(regeneratedSection, blockToRegenerate.order);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'cvGenerator.errors.regenerationFailed';
      console.error('[useCvGenerator] Error regenerating block:', err);
      return null;
    } finally {
      generating.value = false;
    }
  };

  /**
   * Generate a single new block of specific type
   */
  const generateSingleBlock = async (
    userId: string,
    selectedExperienceIds: string[],
    blockType: string,
    // eslint-disable-next-line no-magic-numbers
    options: Parameters<typeof buildGenerationInput>[2] = {}
  ): Promise<CVBlock | null> => {
    generating.value = true;
    error.value = null;

    try {
      const input = await buildGenerationInput(userId, selectedExperienceIds, options);

      if (!input) {
        return null;
      }

      // Request only the specific section type
      input.sectionsToGenerate = [blockType as SectionType];

      const result: CVBlocksResult = await aiService.generateCvBlocks(input);

      if (result.sections.length === 0) {
        error.value = 'cvGenerator.errors.noSectionGenerated';
        return null;
      }

      // Convert first section to block
      return sectionToBlock(result.sections[0]!, 0);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'cvGenerator.errors.generationFailed';
      console.error('[useCvGenerator] Error generating single block:', err);
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
    generateBlocks,
    regenerateBlock,
    generateSingleBlock,
    buildGenerationInput,
  };
}
