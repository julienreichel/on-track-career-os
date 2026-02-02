import { computed, ref, type Ref } from 'vue';
import { useAuthUser } from '@/composables/useAuthUser';
import { useAnalytics } from '@/composables/useAnalytics';
import { AiOperationsService } from '@/domain/ai-operations/AiOperationsService';
import type { MatchingSummaryInput } from '@/domain/ai-operations/MatchingSummaryResult';
import type { MatchingSummary } from '@/domain/matching-summary/MatchingSummary';
import { MatchingSummaryService } from '@/domain/matching-summary/MatchingSummaryService';
import { JobDescriptionService } from '@/domain/job-description/JobDescriptionService';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import { UserProfileService } from '@/domain/user-profile/UserProfileService';
import type { UserProfile } from '@/domain/user-profile/UserProfile';
import type { PersonalCanvas } from '@/domain/personal-canvas/PersonalCanvas';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import type { Experience } from '@/domain/experience/Experience';
import type { STARStory } from '@/domain/starstory/STARStory';
import { CompanyService } from '@/domain/company/CompanyService';
import type { Company } from '@/domain/company/Company';
import { CompanyCanvasService } from '@/domain/company-canvas/CompanyCanvasService';
import type { CVDocument } from '@/domain/cvdocument/CVDocument';
import type { CoverLetter } from '@/domain/cover-letter/CoverLetter';
import type { SpeechBlock } from '@/domain/speech-block/SpeechBlock';

const MAX_EXPERIENCE_SIGNALS = 8;

type MatchingEngineDependencies = {
  aiService: AiOperationsService;
  matchingSummaryService: MatchingSummaryService;
  jobService: JobDescriptionService;
  userProfileService: UserProfileService;
  experienceRepo: ExperienceRepository;
  companyService: CompanyService;
  companyCanvasService: CompanyCanvasService;
};

type JobWithRelations = JobDescription & {
  matchingSummaries?: (MatchingSummary | null)[] | null;
  cvs?: (CVDocument | null)[] | null;
  coverLetters?: (CoverLetter | null)[] | null;
  speechBlocks?: (SpeechBlock | null)[] | null;
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
    matchingSummaryService: overrides.matchingSummaryService ?? new MatchingSummaryService(),
    jobService: overrides.jobService ?? new JobDescriptionService(),
    userProfileService: overrides.userProfileService ?? new UserProfileService(),
    experienceRepo: overrides.experienceRepo ?? new ExperienceRepository(),
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

function createMatchingEngineState({ jobId, providedUserId, deps, auth }: EngineStateArgs) {
  const matchingSummary = ref<MatchingSummary | null>(null);
  const job = ref<JobDescription | null>(null);
  const isLoading = ref(false);
  const isGenerating = ref(false);
  const error = ref<string | null>(null);
  const currentUserId = ref<string | null>(providedUserId);
  const hasSummary = computed(() => Boolean(matchingSummary.value));
  let cachedProfile: UserProfile | null = null;
  const existingMaterials = computed(() => {
    const jobRecord = job.value as JobWithRelations | null;
    return {
      cv: pickMostRecent(jobRecord?.cvs ?? null),
      coverLetter: pickMostRecent(jobRecord?.coverLetters ?? null),
      speechBlock: pickMostRecent(jobRecord?.speechBlocks ?? null),
    };
  });

  const resolveUserId = createUserResolver({ providedUserId, currentUserId, auth });
  const runWithState = createStateRunner(error);

  const load = () =>
    runWithState(isLoading, async () => {
      const userId = await resolveUserId();
      const loadedJob = await ensureJob(jobId, deps.jobService);
      job.value = loadedJob;

      const profile = await ensureProfile(userId, deps.userProfileService);
      cachedProfile = profile;

      const existing = selectMatchingSummaryFromJob(loadedJob, userId);
      matchingSummary.value = existing;
      return existing;
    });

  const regenerate = () =>
    runWithState(isGenerating, async () => {
      const userId = await resolveUserId();
      const jobRecord = job.value ?? (await ensureJob(jobId, deps.jobService));
      job.value = jobRecord;

      const profile = cachedProfile ?? (await ensureProfile(userId, deps.userProfileService));
      cachedProfile = profile;

      const { experiences, personalCanvas } =
        await deps.experienceRepo.getExperienceContext(userId);
      const experienceSignals = loadExperienceSignals(experiences);
      const companyPayload = jobRecord.companyId
        ? await loadCompanyPayload(jobRecord.companyId, deps.companyService)
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
      const { captureEvent } = useAnalytics();
      captureEvent('job_match_computed');
      return updated;
    });

  return {
    job,
    matchingSummary,
    isLoading,
    isGenerating,
    error,
    hasSummary,
    existingMaterials,
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

type DatedItem = {
  id: string;
  updatedAt?: string | null;
  createdAt?: string | null;
  generatedAt?: string | null;
};

function pickMostRecent<T extends DatedItem>(items: Array<T | null> | null | undefined): T | null {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const validItems = items.filter((item): item is T => Boolean(item));
  if (!validItems.length) {
    return null;
  }

  return (
    [...validItems].sort((a, b) => {
      const dateA = new Date(a.updatedAt ?? a.generatedAt ?? a.createdAt ?? 0).getTime();
      const dateB = new Date(b.updatedAt ?? b.generatedAt ?? b.createdAt ?? 0).getTime();
      return dateB - dateA;
    })[0] ?? null
  );
}

function selectMatchingSummaryFromJob(
  jobRecord: JobWithRelations,
  userId: string
): MatchingSummary | null {
  const summaries = (jobRecord.matchingSummaries ?? []).filter(
    (summary): summary is MatchingSummary => Boolean(summary)
  );
  if (!summaries.length) {
    return null;
  }

  const userSummaries = summaries.filter((summary) => summary.userId === userId);
  if (!userSummaries.length) {
    return null;
  }

  const companyId = jobRecord.companyId ?? null;
  const companyMatches = companyId
    ? userSummaries.filter((summary) => summary.companyId === companyId)
    : [];
  const jobMatches = userSummaries.filter((summary) => !summary.companyId);
  let candidates = userSummaries;
  if (companyMatches.length) {
    candidates = companyMatches;
  } else if (jobMatches.length) {
    candidates = jobMatches;
  }

  return pickMostRecent(candidates);
}

async function ensureJob(jobId: string, service: JobDescriptionService) {
  const job = (await service.getJobWithRelations(jobId)) as JobWithRelations | null;
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

type ExperienceWithStories = Experience & {
  stories?: (STARStory | null)[] | null;
};

function loadExperienceSignals(experiences: ExperienceWithStories[]) {
  if (!experiences.length) {
    return undefined;
  }

  const limited = experiences.slice(0, MAX_EXPERIENCE_SIGNALS);

  const signals = limited.map((exp) => {
    return {
      title: exp.title || '',
      companyName: exp.companyName || '',
      startDate: exp.startDate || undefined,
      endDate: exp.endDate || undefined,
      experienceType: exp.experienceType || 'work',
      responsibilities: normalizeStringArray(exp.responsibilities),
      tasks: normalizeStringArray(exp.tasks),
    };
  });

  const allStories = limited.flatMap((exp) =>
    (exp.stories ?? []).filter((story): story is STARStory => Boolean(story))
  );

  const storySignals = allStories.map((story) => ({
    situation: story.situation || '',
    task: story.task || '',
    action: story.action || '',
    result: story.result || '',
    experienceId: story.experienceId || undefined,
  }));

  return {
    experiences: signals,
    stories: storySignals,
  };
}

async function loadCompanyPayload(companyId: string, companyService: CompanyService) {
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
    profile: mapUserProfile(args.profile),
    jobDescription: mapJob(args.job),
    experiences: args.experienceSignals?.experiences ?? [],
  };

  if (args.personalCanvas) {
    input.personalCanvas = mapPersonalCanvas(args.personalCanvas);
  }

  if (args.experienceSignals?.stories && args.experienceSignals.stories.length > 0) {
    input.stories = args.experienceSignals.stories;
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

function mapCompanyProfile(company: Company) {
  return {
    companyName: company.companyName,
    industry: company.industry ?? '',
    sizeRange: company.sizeRange ?? '',
    website: company.website ?? '',
    description: company.description ?? '',
    productsServices: normalizeStringArray(company.productsServices),
    targetMarkets: normalizeStringArray(company.targetMarkets),
    customerSegments: normalizeStringArray(company.customerSegments),
    rawNotes: company.rawNotes ?? '',
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
