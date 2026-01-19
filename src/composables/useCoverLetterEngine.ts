import { computed, ref, type Ref } from 'vue';
import { useAuthUser } from '@/composables/useAuthUser';
import { AiOperationsService } from '@/domain/ai-operations/AiOperationsService';
import type { SpeechInput } from '@/domain/ai-operations/SpeechResult';
import { UserProfileService } from '@/domain/user-profile/UserProfileService';
import type { UserProfile } from '@/domain/user-profile/UserProfile';
import type { PersonalCanvas } from '@/domain/personal-canvas/PersonalCanvas';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import type { Experience } from '@/domain/experience/Experience';
import { STARStoryService } from '@/domain/starstory/STARStoryService';
import type { STARStory } from '@/domain/starstory/STARStory';

type CoverLetterEngineDependencies = {
  aiService: AiOperationsService;
  userProfileService: UserProfileService;
  experienceRepo: ExperienceRepository;
  storyService: STARStoryService;
};

type AuthComposable = {
  userId: Ref<string | null>;
  loadUserId: () => Promise<void>;
};

type CoverLetterEngineOptions = {
  userId?: string;
  auth?: AuthComposable;
  dependencies?: Partial<CoverLetterEngineDependencies>;
};

function createDependencies(
  overrides: Partial<CoverLetterEngineDependencies> = {}
): CoverLetterEngineDependencies {
  return {
    aiService: overrides.aiService ?? new AiOperationsService(),
    userProfileService: overrides.userProfileService ?? new UserProfileService(),
    experienceRepo: overrides.experienceRepo ?? new ExperienceRepository(),
    storyService: overrides.storyService ?? new STARStoryService(),
  };
}

export function useCoverLetterEngine(options: CoverLetterEngineOptions = {}) {
  const deps = createDependencies(options.dependencies);
  const auth = options.auth ?? useAuthUser();

  return createCoverLetterEngineState({
    providedUserId: options.userId ?? null,
    deps,
    auth,
  });
}

type EngineStateArgs = {
  providedUserId: string | null;
  deps: CoverLetterEngineDependencies;
  auth: AuthComposable;
};

function createCoverLetterEngineState({ providedUserId, deps, auth }: EngineStateArgs) {
  const userProfile = ref<UserProfile | null>(null);
  const personalCanvas = ref<PersonalCanvas | null>(null);
  const experiences = ref<Experience[]>([]);
  const stories = ref<STARStory[]>([]);
  const isLoading = ref(false);
  const isGenerating = ref(false);
  const error = ref<string | null>(null);
  const currentUserId = ref<string | null>(providedUserId);

  const hasProfile = computed(() => Boolean(userProfile.value?.fullName));
  const resolveUserId = createUserResolver({ providedUserId, currentUserId, auth });
  const runWithState = createStateRunner(error);

  const load = () =>
    runWithState(isLoading, async () => {
      const userId = await resolveUserId();
      userProfile.value = await ensureProfile(userId, deps.userProfileService);
      personalCanvas.value = await loadCanvas(userId, deps.userProfileService);
      experiences.value = await deps.experienceRepo.list(userId);
      stories.value = await loadStories(experiences.value, deps.storyService);
      return {
        userProfile: userProfile.value,
        personalCanvas: personalCanvas.value,
        experiences: experiences.value,
        stories: stories.value,
      };
    });

  const generate = (jobDescription?: SpeechInput['jobDescription']) =>
    runWithState(isGenerating, async () => {
      if (!hasProfile.value) {
        await load();
      }

      if (!userProfile.value?.fullName) {
        throw new Error('User profile with fullName is required');
      }

      const input: SpeechInput = {
        language: 'en',
        profile: mapProfileToSpeechProfile(userProfile.value),
        experiences: experiences.value.map(mapExperienceToSpeechExperience),
        stories: stories.value.map(mapStoryToSpeechStory),
        personalCanvas: personalCanvas.value
          ? mapCanvasToSpeechCanvas(personalCanvas.value)
          : undefined,
        jobDescription: jobDescription ? mapJobDescription(jobDescription) : undefined,
      };

      return await deps.aiService.generateCoverLetter(input);
    });

  return {
    userProfile,
    personalCanvas,
    experiences,
    stories,
    isLoading,
    isGenerating,
    error,
    hasProfile,
    load,
    generate,
  };
}

// Helper functions (shared logic with Speech engine)

type UserResolverArgs = {
  providedUserId: string | null;
  currentUserId: Ref<string | null>;
  auth: AuthComposable;
};

function createUserResolver({ providedUserId, currentUserId, auth }: UserResolverArgs) {
  return async (): Promise<string> => {
    if (providedUserId) {
      return providedUserId;
    }
    if (currentUserId.value) {
      return currentUserId.value;
    }
    await auth.loadUserId();
    if (!auth.userId.value) {
      throw new Error('User not authenticated');
    }
    currentUserId.value = auth.userId.value;
    return auth.userId.value;
  };
}

function createStateRunner(errorRef: Ref<string | null>) {
  return async <T>(
    loadingRef: Ref<boolean>,
    operation: () => Promise<T>
  ): Promise<T | undefined> => {
    loadingRef.value = true;
    errorRef.value = null;
    try {
      return await operation();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[CoverLetterEngine]', message, err);
      errorRef.value = message;
      return undefined;
    } finally {
      loadingRef.value = false;
    }
  };
}

async function ensureProfile(userId: string, service: UserProfileService): Promise<UserProfile> {
  const profile = await service.getFullUserProfile(userId);
  if (!profile) {
    throw new Error('User profile not found');
  }
  if (!profile.fullName) {
    throw new Error('Profile fullName is required to generate cover letter');
  }
  return profile;
}

async function loadCanvas(
  userId: string,
  service: UserProfileService
): Promise<PersonalCanvas | null> {
  try {
    return await service.getCanvasForUser(userId);
  } catch {
    return null;
  }
}

async function loadStories(
  experiences: Experience[],
  service: STARStoryService
): Promise<STARStory[]> {
  const storyPromises = experiences.map((exp) => service.getStoriesByExperience(exp.id));
  const storyArrays = await Promise.all(storyPromises);
  return storyArrays.flat();
}

// Mapping functions (reuse from Speech)

function filterNulls<T>(arr: T[] | null | undefined): Exclude<T, null>[] | undefined {
  if (!arr) return undefined;
  return arr.filter((item): item is Exclude<T, null> => item !== null);
}

function mapProfileToSpeechProfile(profile: UserProfile) {
  return {
    fullName: profile.fullName,
    headline: profile.headline ?? undefined,
    location: profile.location ?? undefined,
    seniorityLevel: profile.seniorityLevel ?? undefined,
    workPermitInfo: profile.workPermitInfo ?? undefined,
    goals: filterNulls(profile.goals),
    aspirations: filterNulls(profile.aspirations),
    personalValues: filterNulls(profile.personalValues),
    strengths: filterNulls(profile.strengths),
    interests: filterNulls(profile.interests),
    skills: filterNulls(profile.skills),
    certifications: filterNulls(profile.certifications),
    languages: filterNulls(profile.languages),
  };
}

function mapExperienceToSpeechExperience(exp: Experience) {
  return {
    title: exp.title,
    companyName: exp.companyName ?? '',
    startDate: exp.startDate ?? undefined,
    endDate: exp.endDate ?? undefined,
    experienceType: exp.experienceType ?? 'work',
    responsibilities: filterNulls(exp.responsibilities) ?? [],
    tasks: filterNulls(exp.tasks) ?? [],
    achievements: [],
    kpiSuggestions: [],
  };
}

function mapStoryToSpeechStory(story: STARStory) {
  return {
    title: story.title ?? undefined,
    situation: story.situation ?? undefined,
    task: story.task ?? undefined,
    action: story.action ?? undefined,
    result: story.result ?? undefined,
    achievements: filterNulls(story.achievements),
  };
}

function mapCanvasToSpeechCanvas(canvas: PersonalCanvas) {
  return {
    customerSegments: filterNulls(canvas.customerSegments),
    valueProposition: filterNulls(canvas.valueProposition),
    channels: filterNulls(canvas.channels),
    customerRelationships: filterNulls(canvas.customerRelationships),
    keyActivities: filterNulls(canvas.keyActivities),
    keyResources: filterNulls(canvas.keyResources),
    keyPartners: filterNulls(canvas.keyPartners),
    costStructure: filterNulls(canvas.costStructure),
    revenueStreams: filterNulls(canvas.revenueStreams),
  };
}

function mapJobDescription(job: SpeechInput['jobDescription']): SpeechInput['jobDescription'] {
  if (!job || typeof job === 'string') {
    return job;
  }
  return {
    title: job.title,
    seniorityLevel: job.seniorityLevel ?? '',
    roleSummary: job.roleSummary ?? '',
    responsibilities: filterNulls(job.responsibilities) ?? [],
    requiredSkills: filterNulls(job.requiredSkills) ?? [],
    behaviours: filterNulls(job.behaviours) ?? [],
    successCriteria: filterNulls(job.successCriteria) ?? [],
    explicitPains: filterNulls(job.explicitPains) ?? [],
    atsKeywords: filterNulls(job.atsKeywords) ?? [],
  };
}
