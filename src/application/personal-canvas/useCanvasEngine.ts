import { ref } from 'vue';
import { PersonalCanvasService } from '@/domain/personal-canvas/PersonalCanvasService';
import { PersonalCanvasRepository } from '@/domain/personal-canvas/PersonalCanvasRepository';
import { UserProfileRepository } from '@/domain/user-profile/UserProfileRepository';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import { STARStoryService } from '@/domain/starstory/STARStoryService';
import { useAnalytics } from '@/composables/useAnalytics';
import type {
  PersonalCanvas,
  PersonalCanvasCreateInput,
  PersonalCanvasUpdateInput,
} from '@/domain/personal-canvas/PersonalCanvas';
import type { PersonalCanvasInput } from '@/domain/ai-operations/PersonalCanvas';
import type { STARStory } from '@/domain/starstory/STARStory';
import type { Experience } from '@/domain/experience/Experience';

/**
 * Build PersonalCanvasInput from profile, experiences, and stories
 */
function buildCanvasInput(
  profile: {
    fullName?: string | null;
    headline?: string | null;
    location?: string | null;
    seniorityLevel?: string | null;
    primaryEmail?: string | null;
    primaryPhone?: string | null;
    workPermitInfo?: string | null;
    socialLinks?: (string | null)[] | null;
    aspirations?: (string | null)[] | null;
    personalValues?: (string | null)[] | null;
    strengths?: (string | null)[] | null;
    interests?: (string | null)[] | null;
    skills?: (string | null)[] | null;
    certifications?: (string | null)[] | null;
    languages?: (string | null)[] | null;
  } | null,
  experiences: Experience[],
  stories: STARStory[]
): PersonalCanvasInput {
  const filterStrings = (values?: (string | null)[] | null) =>
    values?.filter((value): value is string => Boolean(value && value.trim().length > 0)) || [];

  const requiredString = (value?: string | null) => value?.trim() || '';
  const optionalString = (value?: string | null) => (value?.trim() ? value.trim() : undefined);

  const buildProfile = () => ({
    fullName: requiredString(profile?.fullName),
    headline: optionalString(profile?.headline),
    location: optionalString(profile?.location),
    seniorityLevel: optionalString(profile?.seniorityLevel),
    primaryEmail: optionalString(profile?.primaryEmail),
    primaryPhone: optionalString(profile?.primaryPhone),
    workPermitInfo: optionalString(profile?.workPermitInfo),
    socialLinks: filterStrings(profile?.socialLinks),
    aspirations: filterStrings(profile?.aspirations),
    personalValues: filterStrings(profile?.personalValues),
    strengths: filterStrings(profile?.strengths),
    interests: filterStrings(profile?.interests),
    skills: filterStrings(profile?.skills),
    certifications: filterStrings(profile?.certifications),
    languages: filterStrings(profile?.languages),
  });

  const buildExperience = (exp: Experience) => ({
    id: exp.id,
    title: exp.title || '',
    companyName: exp.companyName || '',
    startDate: exp.startDate || undefined,
    endDate: exp.endDate || undefined,
    experienceType: exp.experienceType || 'work',
    responsibilities: filterStrings(exp.responsibilities),
    tasks: filterStrings(exp.tasks),
    status: exp.status || undefined,
    rawText: exp.rawText || undefined,
  });

  const buildStory = (story: STARStory) => ({
    experienceId: story.experienceId || undefined,
    title: story.title || undefined,
    situation: story.situation || undefined,
    task: story.task || undefined,
    action: story.action || undefined,
    result: story.result || undefined,
    achievements: filterStrings(story.achievements),
  });

  return {
    profile: buildProfile(),
    experiences: experiences.map(buildExperience),
    stories: stories.map(buildStory),
  };
}

/**
 * Canvas Engine Composable
 *
 * Provides complete functionality for managing Personal Canvas lifecycle:
 * - User initialization (profile & canvas loading)
 * - Data fetching (experiences & stories)
 * - AI generation/regeneration with auto-save
 * - Manual editing and saving
 *
 * This composable encapsulates all business logic, allowing pages to focus on UI.
 */
// eslint-disable-next-line max-lines-per-function
export function useCanvasEngine() {
  const canvas = ref<PersonalCanvas | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const profile = ref<{
    id: string;
    fullName?: string | null;
    headline?: string | null;
    location?: string | null;
    seniorityLevel?: string | null;
    primaryEmail?: string | null;
    primaryPhone?: string | null;
    workPermitInfo?: string | null;
    socialLinks?: (string | null)[] | null;
    aspirations?: (string | null)[] | null;
    personalValues?: (string | null)[] | null;
    strengths?: (string | null)[] | null;
    interests?: (string | null)[] | null;
    skills?: (string | null)[] | null;
    certifications?: (string | null)[] | null;
    languages?: (string | null)[] | null;
  } | null>(null);

  const service = new PersonalCanvasService();
  const repository = new PersonalCanvasRepository();
  const userProfileRepo = new UserProfileRepository();
  const experienceRepo = new ExperienceRepository();
  const storyService = new STARStoryService();

  /**
   * Load PersonalCanvas by ID
   * @param id - Canvas ID to load
   */
  const loadCanvas = async (id: string): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      canvas.value = await service.getFullPersonalCanvas(id);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('[useCanvasEngine] Error loading canvas:', err);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Save PersonalCanvas (create or update based on existence)
   * @param canvasData - Canvas data to save (without generated fields)
   */
  const saveCanvas = async (canvasData: Omit<PersonalCanvasCreateInput, 'id'>): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      if (canvas.value?.id) {
        // Update existing canvas
        const updateInput: PersonalCanvasUpdateInput = {
          id: canvas.value.id,
          ...canvasData,
        };
        const updated = await repository.update(updateInput);
        if (updated) {
          canvas.value = updated;
        }
      } else {
        // Create new canvas
        const createInput: PersonalCanvasCreateInput = {
          ...canvasData,
        };
        const created = await repository.create(createInput);
        if (created) {
          canvas.value = created;
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('[useCanvasEngine] Error saving canvas:', err);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Initialize canvas engine for a specific user
   * Loads user profile and existing canvas (if any)
   * @param userId - User ID to initialize for
   */
  const initializeForUser = async (userId: string): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      // Load user profile
      profile.value = await userProfileRepo.get(userId);

      if (!profile.value) {
        error.value = 'User profile not found';
        return;
      }

      // Load existing canvas for this user via profile selection set
      const existingCanvas = await userProfileRepo.getCanvasSnapshot(userId);
      canvas.value = existingCanvas ?? null;
    } catch (err) {
      console.error('[useCanvasEngine] Error initializing:', err);
      // Don't set error for missing canvas - that's expected for new users
      if (err instanceof Error && !err.message.includes('not found')) {
        error.value = err.message;
      }
    } finally {
      loading.value = false;
    }
  };

  /**
   * Load experiences and stories for the current user profile
   * @returns Experiences and stories for AI canvas generation
   */
  const loadExperiencesAndStories = async (): Promise<{
    experiences: Experience[];
    stories: STARStory[];
  }> => {
    if (!profile.value) {
      return { experiences: [], stories: [] };
    }

    const experiences = await experienceRepo.list(profile.value.id);

    const storyResponses = await Promise.all(
      experiences.map(async (exp) => {
        try {
          return await storyService.getStoriesByExperience(exp.id);
        } catch (err) {
          console.error('[useCanvasEngine] Error loading stories for experience:', exp.id, err);
          return [];
        }
      })
    );

    const allStories = storyResponses.flat();

    return { experiences, stories: allStories };
  };

  /**
   * Regenerate PersonalCanvas using AI operation
   * @param input - User profile, experiences, and stories for canvas generation
   * @returns Generated PersonalCanvas from AI
   */
  const regenerateCanvas = async (input: PersonalCanvasInput): Promise<PersonalCanvas | null> => {
    // Note: loading state is managed by the caller (page component)
    // to ensure loading shows before data fetching starts
    error.value = null;

    try {
      const generated = await service.regenerateCanvas(input);
      canvas.value = generated;
      return generated;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('[useCanvasEngine] Error regenerating canvas:', err);
      return null;
    }
  };

  /**
   * Generate canvas using AI and save it automatically
   * Complete flow: load data → build input → generate → save
   * @returns Success status
   */
  const generateAndSave = async (): Promise<boolean> => {
    if (!profile.value) {
      error.value = 'No user profile available';
      return false;
    }

    loading.value = true;
    error.value = null;

    try {
      // Preserve existing canvas ID if it exists (for update instead of create)
      const existingCanvasId = canvas.value?.id;

      // Load data for canvas generation
      const { experiences, stories } = await loadExperiencesAndStories();

      // Build AI input
      const input = buildCanvasInput(profile.value, experiences, stories);

      // Generate canvas
      const result = await regenerateCanvas(input);

      if (!result) {
        return false;
      }

      // Restore canvas ID if it existed (ensures update instead of create)
      if (existingCanvasId) {
        canvas.value = { ...result, id: existingCanvasId };
      }

      // Save the generated canvas
      await saveCanvas({
        userId: profile.value.id,
        customerSegments: result.customerSegments,
        valueProposition: result.valueProposition,
        channels: result.channels,
        customerRelationships: result.customerRelationships,
        keyActivities: result.keyActivities,
        keyResources: result.keyResources,
        keyPartners: result.keyPartners,
        costStructure: result.costStructure,
        revenueStreams: result.revenueStreams,
        lastGeneratedAt: new Date().toISOString().split('T')[0],
        needsUpdate: false,
      });

      // Track canvas creation
      const { captureEvent } = useAnalytics();
      captureEvent('canvas_created');

      return true;
    } catch (err) {
      console.error('[useCanvasEngine] Error in generateAndSave:', err);
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Regenerate canvas using AI and save it automatically
   * Alias for generateAndSave (same flow)
   * @returns Success status
   */
  const regenerateAndSave = async (): Promise<boolean> => {
    return generateAndSave();
  };

  /**
   * Save manual edits to canvas sections
   * @param updates - Partial canvas updates from UI
   * @returns Success status
   */
  const saveEdits = async (updates: Partial<PersonalCanvas>): Promise<boolean> => {
    if (!canvas.value) {
      error.value = 'No canvas to save';
      return false;
    }

    if (!profile.value) {
      error.value = 'No user profile available';
      return false;
    }

    try {
      await saveCanvas({
        userId: canvas.value.userId || profile.value.id,
        customerSegments: updates.customerSegments ?? canvas.value.customerSegments,
        valueProposition: updates.valueProposition ?? canvas.value.valueProposition,
        channels: updates.channels ?? canvas.value.channels,
        customerRelationships: updates.customerRelationships ?? canvas.value.customerRelationships,
        keyActivities: updates.keyActivities ?? canvas.value.keyActivities,
        keyResources: updates.keyResources ?? canvas.value.keyResources,
        keyPartners: updates.keyPartners ?? canvas.value.keyPartners,
        costStructure: updates.costStructure ?? canvas.value.costStructure,
        revenueStreams: updates.revenueStreams ?? canvas.value.revenueStreams,
        lastGeneratedAt: canvas.value.lastGeneratedAt,
        needsUpdate: false,
      });

      return true;
    } catch (err) {
      console.error('[useCanvasEngine] Error saving edits:', err);
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      return false;
    }
  };

  return {
    // State
    canvas,
    loading,
    error,
    profile,

    // Initialization
    initializeForUser,

    // Low-level operations (for advanced use cases)
    loadCanvas,
    saveCanvas,
    regenerateCanvas,

    // High-level operations (recommended for UI)
    generateAndSave,
    regenerateAndSave,
    saveEdits,
  };
}
