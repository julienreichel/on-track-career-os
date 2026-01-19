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

type SpeechEngineDependencies = {
  aiService: AiOperationsService;
  userProfileService: UserProfileService;
  experienceRepo: ExperienceRepository;
  storyService: STARStoryService;
};

type AuthComposable = {
  userId: Ref<string | null>;
  loadUserId: () => Promise<void>;
};

type SpeechEngineOptions = {
  userId?: string;
  auth?: AuthComposable;
  dependencies?: Partial<SpeechEngineDependencies>;
};

function createDependencies(
  overrides: Partial<SpeechEngineDependencies> = {}
): SpeechEngineDependencies {
  return {
    aiService: overrides.aiService ?? new AiOperationsService(),
    userProfileService: overrides.userProfileService ?? new UserProfileService(),
    experienceRepo: overrides.experienceRepo ?? new ExperienceRepository(),
    storyService: overrides.storyService ?? new STARStoryService(),
  };
}

export function useSpeechEngine(options: SpeechEngineOptions = {}) {
  const deps = createDependencies(options.dependencies);
  const auth = options.auth ?? useAuthUser();

  return createSpeechEngineState({
    providedUserId: options.userId ?? null,
    deps,
    auth,
  });
}

type EngineStateArgs = {
  providedUserId: string | null;
  deps: SpeechEngineDependencies;
  auth: AuthComposable;
};

function createSpeechEngineState({ providedUserId, deps, auth }: EngineStateArgs) {
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

      const input = buildSpeechInput({
        profile: userProfile.value,
        personalCanvas: personalCanvas.value,
        experiences: experiences.value,
        stories: stories.value,
        tailoring: { jobDescription },
      });

      return deps.aiService.generateSpeech(input);
    });

  return {
    userProfile,
    personalCanvas,
    experiences,
    stories,
    isLoading,
    isGenerating,
    error,
    load,
    generate,
  };
}

function createUserResolver({
  providedUserId,
  currentUserId,
  auth,
}: {
  providedUserId: string | null;
  currentUserId: Ref<string | null>;
  auth: AuthComposable;
}) {
  return async () => {
    if (currentUserId.value) {
      return currentUserId.value;
    }

    if (providedUserId) {
      currentUserId.value = providedUserId;
      return providedUserId;
    }

    await auth.loadUserId();
    if (!auth.userId.value) {
      throw new Error('User information is required to generate speech');
    }
    currentUserId.value = auth.userId.value;
    return auth.userId.value;
  };
}

function createStateRunner(errorRef: Ref<string | null>) {
  return async <T>(stateRef: Ref<boolean>, cb: () => Promise<T>) => {
    stateRef.value = true;
    errorRef.value = null;
    try {
      return await cb();
    } catch (err) {
      errorRef.value =
        err instanceof Error ? err.message : 'Something went wrong while generating speech';
      throw err;
    } finally {
      stateRef.value = false;
    }
  };
}

async function ensureProfile(userId: string, service: UserProfileService) {
  const profile = await service.getFullUserProfile(userId);
  if (!profile) {
    throw new Error('User profile not found');
  }
  return profile;
}

async function loadCanvas(userId: string, service: UserProfileService) {
  return await service.getCanvasForUser(userId);
}

async function loadStories(experiences: Experience[], storyService: STARStoryService) {
  if (!experiences.length) {
    return [];
  }

  const storySets = await Promise.all(
    experiences.map(async (exp) => {
      try {
        return await storyService.getStoriesByExperience(exp.id);
      } catch (err) {
        console.error('[useSpeechEngine] Failed to load stories', exp.id, err);
        return [];
      }
    })
  );

  return storySets.flat();
}

type SpeechTailoringInput = Pick<SpeechInput, 'jobDescription' | 'matchingSummary' | 'company'>;

export function buildSpeechInput(args: {
  profile: UserProfile;
  personalCanvas?: PersonalCanvas | null;
  experiences: Experience[];
  stories: STARStory[];
  tailoring?: SpeechTailoringInput;
}): SpeechInput {
  const input: SpeechInput = {
    language: 'en',
    profile: mapUserProfile(args.profile),
    experiences: mapExperiences(args.experiences),
  };

  const storyPayload = mapStories(args.stories);
  if (storyPayload.length > 0) {
    input.stories = storyPayload;
  }

  if (args.personalCanvas) {
    input.personalCanvas = mapPersonalCanvas(args.personalCanvas);
  }

  if (args.tailoring?.jobDescription) {
    input.jobDescription = mapJobDescription(args.tailoring.jobDescription);
  }

  if (args.tailoring?.matchingSummary) {
    input.matchingSummary = args.tailoring.matchingSummary;
  }

  if (args.tailoring?.company) {
    input.company = args.tailoring.company;
  }

  return input;
}

type SpeechExperienceInput = SpeechInput['experiences'][number];

function mapUserProfile(profile: UserProfile) {
  return {
    fullName: profile.fullName,
    headline: profile.headline || undefined,
    location: profile.location || undefined,
    seniorityLevel: profile.seniorityLevel || undefined,
    workPermitInfo: profile.workPermitInfo || undefined,
    goals: normalizeStringArray(profile.goals),
    aspirations: normalizeStringArray(profile.aspirations),
    personalValues: normalizeStringArray(profile.personalValues),
    strengths: normalizeStringArray(profile.strengths),
    interests: normalizeStringArray(profile.interests),
    skills: normalizeStringArray(profile.skills),
    certifications: normalizeStringArray(profile.certifications),
    languages: normalizeStringArray(profile.languages),
  };
}

function mapExperiences(experiences: Experience[]) {
  return experiences
    .map((exp) => {
      const title = exp.title?.trim();
      if (!title) {
        return null;
      }

      const mapped: SpeechExperienceInput = {
        title,
        companyName: exp.companyName ?? '',
        startDate: exp.startDate || undefined,
        endDate: exp.endDate || undefined,
        experienceType: exp.experienceType ?? 'work',
        responsibilities: normalizeStringArray(exp.responsibilities),
        tasks: normalizeStringArray(exp.tasks),
      };
      return mapped;
    })
    .filter((entry): entry is SpeechExperienceInput => Boolean(entry));
}

function mapStories(stories: STARStory[]) {
  return stories.map((story) => ({
    title: story.title || undefined,
    situation: story.situation || undefined,
    task: story.task || undefined,
    action: story.action || undefined,
    result: story.result || undefined,
    achievements: normalizeStringArray(story.achievements),
  }));
}

function mapPersonalCanvas(canvas: PersonalCanvas) {
  return {
    customerSegments: normalizeStringArray(canvas.customerSegments),
    valueProposition: normalizeStringArray(canvas.valueProposition),
    channels: normalizeStringArray(canvas.channels),
    customerRelationships: normalizeStringArray(canvas.customerRelationships),
    keyActivities: normalizeStringArray(canvas.keyActivities),
    keyResources: normalizeStringArray(canvas.keyResources),
    keyPartners: normalizeStringArray(canvas.keyPartners),
    costStructure: normalizeStringArray(canvas.costStructure),
    revenueStreams: normalizeStringArray(canvas.revenueStreams),
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
    responsibilities: normalizeStringArray(job.responsibilities),
    requiredSkills: normalizeStringArray(job.requiredSkills),
    behaviours: normalizeStringArray(job.behaviours),
    successCriteria: normalizeStringArray(job.successCriteria),
    explicitPains: normalizeStringArray(job.explicitPains),
    atsKeywords: normalizeStringArray(job.atsKeywords),
  };
}

function normalizeStringArray(values?: (string | null)[] | null) {
  if (!Array.isArray(values)) {
    return [];
  }
  const seen = new Set<string>();
  const output: string[] = [];
  values.forEach((entry) => {
    if (typeof entry !== 'string') {
      return;
    }
    const trimmed = entry.trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      output.push(trimmed);
    }
  });
  return output;
}
