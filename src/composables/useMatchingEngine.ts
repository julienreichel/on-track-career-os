import { computed, ref, type Ref } from 'vue';
import { useAuthUser } from '@/composables/useAuthUser';
import { AiOperationsService } from '@/domain/ai-operations/AiOperationsService';
import type { MatchingSummaryInput } from '@/domain/ai-operations/MatchingSummaryResult';
import type { MatchingSummary } from '@/domain/matching-summary/MatchingSummary';
import { MatchingSummaryService } from '@/domain/matching-summary/MatchingSummaryService';
import { JobDescriptionService } from '@/domain/job-description/JobDescriptionService';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import { UserProfileService } from '@/domain/user-profile/UserProfileService';
import type { UserProfile } from '@/domain/user-profile/UserProfile';
import { PersonalCanvasRepository } from '@/domain/personal-canvas/PersonalCanvasRepository';
import type { PersonalCanvas } from '@/domain/personal-canvas/PersonalCanvas';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import type { Experience } from '@/domain/experience/Experience';
import { STARStoryService } from '@/domain/starstory/STARStoryService';
import { CompanyService } from '@/domain/company/CompanyService';
import type { Company } from '@/domain/company/Company';
import { CompanyCanvasService } from '@/domain/company-canvas/CompanyCanvasService';
import type { CompanyCanvas } from '@/domain/company-canvas/CompanyCanvas';

const MAX_EXPERIENCE_SIGNALS = 8;

type MatchingEngineDependencies = {
  aiService: AiOperationsService;
  matchingSummaryService: MatchingSummaryService;
  jobService: JobDescriptionService;
  userProfileService: UserProfileService;
  personalCanvasRepo: PersonalCanvasRepository;
  experienceRepo: ExperienceRepository;
  storyService: STARStoryService;
  companyService: CompanyService;
  companyCanvasService: CompanyCanvasService;
};

type AuthComposable = {
  userId: Ref<string | null>;
  loadUserId: () => Promise<void>;
};

type MatchingEngineOptions = {
  userId?: string;
  auth?: AuthComposable;
  dependencies?: Partial<MatchingEngineDependencies>;
};

function createDependencies(
  overrides: Partial<MatchingEngineDependencies> = {}
): MatchingEngineDependencies {
  return {
    aiService: overrides.aiService ?? new AiOperationsService(),
    matchingSummaryService:
      overrides.matchingSummaryService ?? new MatchingSummaryService(),
    jobService: overrides.jobService ?? new JobDescriptionService(),
    userProfileService: overrides.userProfileService ?? new UserProfileService(),
    personalCanvasRepo: overrides.personalCanvasRepo ?? new PersonalCanvasRepository(),
    experienceRepo: overrides.experienceRepo ?? new ExperienceRepository(),
    storyService: overrides.storyService ?? new STARStoryService(),
    companyService: overrides.companyService ?? new CompanyService(),
    companyCanvasService: overrides.companyCanvasService ?? new CompanyCanvasService(),
  };
}

export function useMatchingEngine(jobId: string, options: MatchingEngineOptions = {}) {
  const deps = createDependencies(options.dependencies);
  const auth = options.auth ?? useAuthUser();
  return createMatchingEngineState({
    jobId,
    providedUserId: options.userId ?? null,
    deps,
    auth,
  });
}

type EngineStateArgs = {
  jobId: string;
  providedUserId: string | null;
  deps: MatchingEngineDependencies;
  auth: AuthComposable;
};

function createMatchingEngineState({
  jobId,
  providedUserId,
  deps,
  auth,
}: EngineStateArgs) {
  const matchingSummary = ref<MatchingSummary | null>(null);
  const job = ref<JobDescription | null>(null);
  const userProfile = ref<UserProfile | null>(null);
  const isLoading = ref(false);
  const isGenerating = ref(false);
  const error = ref<string | null>(null);
  const currentUserId = ref<string | null>(providedUserId);
  const hasSummary = computed(() => Boolean(matchingSummary.value));

  const resolveUserId = createUserResolver({ providedUserId, currentUserId, auth });
  const runWithState = createStateRunner(error);

  const load = () =>
    runWithState(isLoading, async () => {
      const userId = await resolveUserId();
      const loadedJob = await ensureJob(jobId, deps.jobService);
      job.value = loadedJob;

      const profile = await ensureProfile(userId, deps.userProfileService);
      userProfile.value = profile;

      const existing = await deps.matchingSummaryService.getByContext({
        userId,
        jobId,
        companyId: loadedJob.companyId ?? null,
      });
      matchingSummary.value = existing;
      return existing;
    });

  const regenerate = () =>
    runWithState(isGenerating, async () => {
      const userId = await resolveUserId();
      const jobRecord = job.value ?? (await ensureJob(jobId, deps.jobService));
      job.value = jobRecord;

      const profile = userProfile.value ?? (await ensureProfile(userId, deps.userProfileService));
      userProfile.value = profile;

      const [personalCanvas] = await deps.personalCanvasRepo.list({
        filter: { userId: { eq: userId } },
      });

      const experiences = await deps.experienceRepo.list(userId);
      const experienceSignals = await loadExperienceSignals(experiences, deps.storyService);
      const companyPayload = jobRecord.companyId
        ? await loadCompanyPayload(
            jobRecord.companyId,
            deps.companyService,
            deps.companyCanvasService
          )
        : undefined;

      const matchingInput = buildMatchingInput({
        profile,
        personalCanvas,
        experienceSignals,
        job: jobRecord,
        company: companyPayload,
      });

      const aiResult = await deps.aiService.generateMatchingSummary(matchingInput);
      const updated = await deps.matchingSummaryService.upsertSummary({
        userId,
        jobId,
        companyId: jobRecord.companyId ?? null,
        summary: aiResult,
      });
      matchingSummary.value = updated;
      return updated;
    });

  return {
    job,
    userProfile,
    matchingSummary,
    isLoading,
    isGenerating,
    error,
    hasSummary,
    load,
    regenerate,
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
      throw new Error('User information is required to generate a match');
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
        err instanceof Error ? err.message : 'Something went wrong while generating a match';
      throw err;
    } finally {
      stateRef.value = false;
    }
  };
}

async function ensureJob(jobId: string, service: JobDescriptionService) {
  const job = await service.getFullJobDescription(jobId);
  if (!job) {
    throw new Error('Job description not found');
  }
  return job;
}

async function ensureProfile(userId: string, service: UserProfileService) {
  const profile = await service.getFullUserProfile(userId);
  if (!profile) {
    throw new Error('User profile not found');
  }
  return profile;
}

async function loadExperienceSignals(
  experiences: Experience[],
  storyService: STARStoryService
) {
  if (!experiences.length) {
    return undefined;
  }

  const limited = experiences.slice(0, MAX_EXPERIENCE_SIGNALS);
  const storySets = await Promise.all(
    limited.map(async (exp) => {
      try {
        return await storyService.getStoriesByExperience(exp.id);
      } catch (err) {
        console.error('[useMatchingEngine] Failed to load stories', exp.id, err);
        return [];
      }
    })
  );

  const signals = limited.map((exp, index) => {
    const stories = storySets[index] ?? [];
    const achievements = flattenStrings(
      stories.flatMap((story) => story.achievements ?? [])
    );
    const kpiSuggestions = flattenStrings(
      stories.flatMap((story) => story.kpiSuggestions ?? [])
    );

    return {
      title: exp.title || '',
      companyName: exp.companyName || undefined,
      startDate: exp.startDate || undefined,
      endDate: exp.endDate || undefined,
      responsibilities: normalizeStringArray(exp.responsibilities),
      tasks: normalizeStringArray(exp.tasks),
      achievements,
      kpiSuggestions,
    };
  });

  return {
    experiences: signals,
  };
}

async function loadCompanyPayload(
  companyId: string,
  companyService: CompanyService,
  canvasService: CompanyCanvasService
) {
  try {
    const company = await companyService.getCompany(companyId);

    if (!company) {
      return undefined;
    }

    // Return flat structure matching GraphQL schema CompanyType
    return mapCompanyProfile(company);
  } catch (err) {
    console.warn('[useMatchingEngine] Unable to load company context', err);
    return undefined;
  }
}

function buildMatchingInput(args: {
  profile: UserProfile;
  personalCanvas?: PersonalCanvas | null;
  experienceSignals?: Awaited<ReturnType<typeof loadExperienceSignals>>;
  job: JobDescription;
  company?: NonNullable<MatchingSummaryInput['company']>;
}): MatchingSummaryInput {
  const input: MatchingSummaryInput = {
    user: {
      profile: mapUserProfile(args.profile),
    },
    job: mapJob(args.job),
  };

  if (args.personalCanvas) {
    input.user.personalCanvas = mapPersonalCanvas(args.personalCanvas);
  }

  if (args.experienceSignals && args.experienceSignals.experiences.length > 0) {
    input.user.experienceSignals = args.experienceSignals;
  }

  if (args.company) {
    input.company = args.company;
  }

  return input;
}

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

function mapJob(job: JobDescription) {
  return {
    title: job.title,
    seniorityLevel: job.seniorityLevel || undefined,
    roleSummary: job.roleSummary || undefined,
    responsibilities: normalizeStringArray(job.responsibilities),
    requiredSkills: normalizeStringArray(job.requiredSkills),
    behaviours: normalizeStringArray(job.behaviours),
    successCriteria: normalizeStringArray(job.successCriteria),
    explicitPains: normalizeStringArray(job.explicitPains),
  };
}

function mapCompanyProfile(company: Company) {
  return {
    companyName: company.companyName,
    industry: company.industry || undefined,
    sizeRange: company.sizeRange || undefined,
    website: company.website || undefined,
    description: company.description || undefined,
  };
}

function mapCompanyCanvas(canvas: CompanyCanvas) {
  const payload: Record<string, unknown> = {
    customerSegments: normalizeStringArray(canvas.customerSegments),
    valuePropositions: normalizeStringArray(canvas.valuePropositions),
    channels: normalizeStringArray(canvas.channels),
    customerRelationships: normalizeStringArray(canvas.customerRelationships),
    revenueStreams: normalizeStringArray(canvas.revenueStreams),
    keyResources: normalizeStringArray(canvas.keyResources),
    keyActivities: normalizeStringArray(canvas.keyActivities),
    keyPartners: normalizeStringArray(canvas.keyPartners),
    costStructure: normalizeStringArray(canvas.costStructure),
  };
  if (canvas.companyName) {
    payload.companyName = canvas.companyName;
  }
  if (canvas.lastGeneratedAt) {
    payload.lastGeneratedAt = canvas.lastGeneratedAt;
  }
  payload.needsUpdate = Boolean(canvas.needsUpdate);
  return payload;
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

function flattenStrings(values: (string | null | undefined)[]) {
  return normalizeStringArray(values as (string | null)[]);
}
