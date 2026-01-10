import { ref, type Ref } from 'vue';
import { useAuthUser } from '@/composables/useAuthUser';
import { buildSpeechInput } from '@/composables/useSpeechEngine';
import { buildTailoringContext } from './buildTailoringContext';
import { AiOperationsService } from '@/domain/ai-operations/AiOperationsService';
import { UserProfileService } from '@/domain/user-profile/UserProfileService';
import { PersonalCanvasRepository } from '@/domain/personal-canvas/PersonalCanvasRepository';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import { STARStoryService } from '@/domain/starstory/STARStoryService';
import { CompanyService } from '@/domain/company/CompanyService';
import { CVDocumentRepository } from '@/domain/cvdocument/CVDocumentRepository';
import { CoverLetterService } from '@/domain/cover-letter/CoverLetterService';
import { SpeechBlockService } from '@/domain/speech-block/SpeechBlockService';
import { JobDescriptionService } from '@/domain/job-description/JobDescriptionService';
import { MatchingSummaryService } from '@/domain/matching-summary/MatchingSummaryService';
import type { GenerateCvInput } from '@/domain/ai-operations/types/generateCv';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import type { MatchingSummary } from '@/domain/matching-summary/MatchingSummary';
import type { UserProfile } from '@/domain/user-profile/UserProfile';
import type { PersonalCanvas } from '@/domain/personal-canvas/PersonalCanvas';
import type { Experience } from '@/domain/experience/Experience';
import type { STARStory } from '@/domain/starstory/STARStory';
import type { CVDocument } from '@/domain/cvdocument/CVDocument';
import type { CoverLetter } from '@/domain/cover-letter/CoverLetter';
import type { SpeechBlock } from '@/domain/speech-block/SpeechBlock';

type AuthComposable = {
  userId: Ref<string | null>;
  loadUserId: () => Promise<void>;
};

type TailoredMaterialsDependencies = {
  aiService: AiOperationsService;
  userProfileService: UserProfileService;
  personalCanvasRepo: PersonalCanvasRepository;
  experienceRepo: ExperienceRepository;
  storyService: STARStoryService;
  companyService: CompanyService;
  cvRepository: CVDocumentRepository;
  coverLetterService: CoverLetterService;
  speechBlockService: SpeechBlockService;
  jobService: JobDescriptionService;
  matchingSummaryService: MatchingSummaryService;
};

type TailoredCvOptions = {
  name?: string;
  templateId?: string;
  showProfilePhoto?: boolean;
  includeSkills?: boolean;
  includeLanguages?: boolean;
  includeCertifications?: boolean;
  includeInterests?: boolean;
};

type TailoredCoverLetterOptions = {
  name?: string;
  tone?: string;
};

type TailoredSpeechOptions = {
  name?: string;
};

type TailoredJobParams<T> = {
  job: JobDescription;
  matchingSummary: MatchingSummary;
  options?: T;
};

type RegenerateJobParams<T> = TailoredJobParams<T> & {
  id: string;
};

type UseTailoredMaterialsOptions = {
  userId?: string;
  auth?: AuthComposable;
  dependencies?: Partial<TailoredMaterialsDependencies>;
};

type TailoringContextError = 'unauthenticated' | 'jobNotFound' | 'loadContextFailed';

type TailoringContextResult =
  | { ok: true; job: JobDescription; matchingSummary: MatchingSummary | null }
  | { ok: false; error: TailoringContextError | null };

type MaterialsError = 'unauthenticated' | 'loadMaterialsFailed';

type ExistingMaterials = {
  cv: CVDocument | null;
  coverLetter: CoverLetter | null;
  speechBlock: SpeechBlock | null;
};

type ExistingMaterialsResult =
  | { ok: true; data: ExistingMaterials }
  | { ok: false; error: MaterialsError | null };

export function useTailoredMaterials(options: UseTailoredMaterialsOptions = {}) {
  const deps = createDependencies(options.dependencies);
  const auth = options.auth ?? useAuthUser();
  const isGenerating = ref(false);
  const error = ref<string | null>(null);
  const contextLoading = ref(false);
  const contextError = ref<TailoringContextError | null>(null);
  const materialsLoading = ref(false);
  const materialsError = ref<MaterialsError | null>(null);

  const resolveUserId = createUserResolver({
    providedUserId: options.userId ?? null,
    currentUserId: ref(options.userId ?? null),
    auth,
  });

  const runWithState = createStateRunner(error, isGenerating);

  const loadTailoringContext = createTailoringContextLoader({
    deps,
    auth,
    contextLoading,
    contextError,
  });

  const loadExistingMaterialsForJob = createExistingMaterialsLoader({
    deps,
    resolveUserId,
    materialsLoading,
    materialsError,
  });

  const generators = createTailoredGenerators({
    deps,
    resolveUserId,
    runWithState,
  });

  return {
    isGenerating,
    error,
    contextLoading,
    contextError,
    loadTailoringContext,
    materialsLoading,
    materialsError,
    loadExistingMaterialsForJob,
    ...generators,
  };
}

type TailoredGenerators = {
  generateTailoredCvForJob: (
    params: TailoredJobParams<TailoredCvOptions>
  ) => Promise<CVDocument | null>;
  regenerateTailoredCvForJob: (
    params: RegenerateJobParams<TailoredCvOptions>
  ) => Promise<CVDocument | null>;
  generateTailoredCoverLetterForJob: (
    params: TailoredJobParams<TailoredCoverLetterOptions>
  ) => Promise<CoverLetter | null>;
  regenerateTailoredCoverLetterForJob: (
    params: RegenerateJobParams<TailoredCoverLetterOptions>
  ) => Promise<CoverLetter | null>;
  generateTailoredSpeechForJob: (
    params: TailoredJobParams<TailoredSpeechOptions>
  ) => Promise<SpeechBlock | null>;
  regenerateTailoredSpeechForJob: (
    params: RegenerateJobParams<TailoredSpeechOptions>
  ) => Promise<SpeechBlock | null>;
};

type TailoredGeneratorArgs = {
  deps: TailoredMaterialsDependencies;
  resolveUserId: () => Promise<string>;
  runWithState: <T>(operation: () => Promise<T | null>) => Promise<T | null>;
};

type TailoringContextLoaderArgs = {
  deps: TailoredMaterialsDependencies;
  auth: AuthComposable;
  contextLoading: Ref<boolean>;
  contextError: Ref<TailoringContextError | null>;
};

type ExistingMaterialsLoaderArgs = {
  deps: TailoredMaterialsDependencies;
  resolveUserId: () => Promise<string>;
  materialsLoading: Ref<boolean>;
  materialsError: Ref<MaterialsError | null>;
};

function createTailoringContextLoader({
  deps,
  auth,
  contextLoading,
  contextError,
}: TailoringContextLoaderArgs) {
  return async (jobId?: string | null): Promise<TailoringContextResult> => {
    if (!jobId) {
      contextError.value = null;
      return { ok: false, error: null };
    }

    contextLoading.value = true;
    contextError.value = null;

    try {
      if (!auth.userId.value) {
        await auth.loadUserId();
      }

      if (!auth.userId.value) {
        contextError.value = 'unauthenticated';
        return { ok: false, error: contextError.value };
      }

      const job = await deps.jobService.getFullJobDescription(jobId);
      if (!job) {
        contextError.value = 'jobNotFound';
        return { ok: false, error: contextError.value };
      }

      const companyId = job.companyId ?? null;
      let summary = await deps.matchingSummaryService.getByContext({
        userId: auth.userId.value,
        jobId,
        companyId,
      });

      if (!summary && companyId) {
        summary = await deps.matchingSummaryService.getByContext({
          userId: auth.userId.value,
          jobId,
          companyId: null,
        });
      }

      return { ok: true, job, matchingSummary: summary ?? null };
    } catch (err) {
      console.error('[useTailoredMaterials] Failed to load tailoring context', err);
      contextError.value = 'loadContextFailed';
      return { ok: false, error: contextError.value };
    } finally {
      contextLoading.value = false;
    }
  };
}

function createExistingMaterialsLoader({
  deps,
  resolveUserId,
  materialsLoading,
  materialsError,
}: ExistingMaterialsLoaderArgs) {
  return async (jobId?: string | null): Promise<ExistingMaterialsResult> => {
    if (!jobId) {
      materialsError.value = null;
      return {
        ok: false,
        error: null,
      };
    }

    materialsLoading.value = true;
    materialsError.value = null;

    try {
      const userId = await resolveUserId();
      const [cvDocs, coverLetters, speechBlocks] = await Promise.all([
        deps
          .cvRepository
          .listByUser(userId)
          .then((items) => items.filter((item) => item.jobId === jobId)),
        deps
          .coverLetterService
          .listCoverLettersByUser(userId)
          .then((items) => items.filter((item) => item.jobId === jobId)),
        deps
          .speechBlockService
          .listSpeechBlocksByUser(userId)
          .then((items) => items.filter((item) => item.jobId === jobId)),
      ]);

      return {
        ok: true,
        data: {
          cv: selectLatest(cvDocs),
          coverLetter: selectLatest(coverLetters),
          speechBlock: selectLatest(speechBlocks),
        },
      };
    } catch (err) {
      console.error('[useTailoredMaterials] Failed to load existing materials', err);
      materialsError.value =
        err instanceof Error && err.message === 'User not authenticated'
          ? 'unauthenticated'
          : 'loadMaterialsFailed';
      return { ok: false, error: materialsError.value };
    } finally {
      materialsLoading.value = false;
    }
  };
}

function createTailoredGenerators({
  deps,
  resolveUserId,
  runWithState,
}: TailoredGeneratorArgs): TailoredGenerators {
  return {
    generateTailoredCvForJob: createGenerateTailoredCvForJob(deps, resolveUserId, runWithState),
    regenerateTailoredCvForJob: createRegenerateTailoredCvForJob(deps, resolveUserId, runWithState),
    generateTailoredCoverLetterForJob: createGenerateTailoredCoverLetterForJob(
      deps,
      resolveUserId,
      runWithState
    ),
    regenerateTailoredCoverLetterForJob: createRegenerateTailoredCoverLetterForJob(
      deps,
      resolveUserId,
      runWithState
    ),
    generateTailoredSpeechForJob: createGenerateTailoredSpeechForJob(
      deps,
      resolveUserId,
      runWithState
    ),
    regenerateTailoredSpeechForJob: createRegenerateTailoredSpeechForJob(
      deps,
      resolveUserId,
      runWithState
    ),
  };
}

function createDependencies(
  overrides: Partial<TailoredMaterialsDependencies> = {}
): TailoredMaterialsDependencies {
  return {
    aiService: overrides.aiService ?? new AiOperationsService(),
    userProfileService: overrides.userProfileService ?? new UserProfileService(),
    personalCanvasRepo: overrides.personalCanvasRepo ?? new PersonalCanvasRepository(),
    experienceRepo: overrides.experienceRepo ?? new ExperienceRepository(),
    storyService: overrides.storyService ?? new STARStoryService(),
    companyService: overrides.companyService ?? new CompanyService(),
    cvRepository: overrides.cvRepository ?? new CVDocumentRepository(),
    coverLetterService: overrides.coverLetterService ?? new CoverLetterService(),
    speechBlockService: overrides.speechBlockService ?? new SpeechBlockService(),
    jobService: overrides.jobService ?? new JobDescriptionService(),
    matchingSummaryService: overrides.matchingSummaryService ?? new MatchingSummaryService(),
  };
}

type UserResolverArgs = {
  providedUserId: string | null;
  currentUserId: Ref<string | null>;
  auth: AuthComposable;
};

function createUserResolver({ providedUserId, currentUserId, auth }: UserResolverArgs) {
  return async (): Promise<string> => {
    if (providedUserId) return providedUserId;
    if (currentUserId.value) return currentUserId.value;
    await auth.loadUserId();
    if (!auth.userId.value) {
      throw new Error('User not authenticated');
    }
    currentUserId.value = auth.userId.value;
    return auth.userId.value;
  };
}

function createStateRunner(errorRef: Ref<string | null>, loadingRef: Ref<boolean>) {
  return async <T>(operation: () => Promise<T | null>): Promise<T | null> => {
    loadingRef.value = true;
    errorRef.value = null;
    try {
      return await operation();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useTailoredMaterials] Error:', message, err);
      errorRef.value = message;
      return null;
    } finally {
      loadingRef.value = false;
    }
  };
}

function selectLatest<T extends { updatedAt?: string | null; createdAt?: string | null }>(
  items?: T[] | null
): T | null {
  if (!items?.length) {
    return null;
  }

  return items.reduce((latest, item) => {
    if (!latest) return item;
    return getTimestamp(item) > getTimestamp(latest) ? item : latest;
  }, items[0] ?? null);
}

function getTimestamp(item: { updatedAt?: string | null; createdAt?: string | null }) {
  const updated = item.updatedAt ? Date.parse(item.updatedAt) : Number.NaN;
  if (!Number.isNaN(updated)) {
    return updated;
  }

  const created = item.createdAt ? Date.parse(item.createdAt) : Number.NaN;
  if (!Number.isNaN(created)) {
    return created;
  }

  return 0;
}

function createGenerateTailoredCvForJob(
  deps: TailoredMaterialsDependencies,
  resolveUserId: () => Promise<string>,
  runWithState: <T>(operation: () => Promise<T | null>) => Promise<T | null>
) {
  return (params: TailoredJobParams<TailoredCvOptions>) =>
    runWithState(async () => {
      const userId = await resolveUserId();
      const context = await loadUserContext(userId, deps);
      const company = await loadCompanySummary(params.job.companyId, deps.companyService);
      const tailoring = buildTailoringContext({
        userProfile: context.profile,
        job: params.job,
        matchingSummary: params.matchingSummary,
        company,
      });

      if (!tailoring.ok) {
        throw new Error(tailoring.error);
      }

      const cvInput = buildCvInput({
        profile: context.profile,
        experiences: context.experiences,
        stories: context.stories,
        options: params.options,
      });

      const aiInput: GenerateCvInput = {
        ...cvInput,
        jobDescription: tailoring.value.jobDescription,
        matchingSummary: tailoring.value.matchingSummary,
        company: tailoring.value.company,
      };

      const content = await deps.aiService.generateCv(aiInput);
      return deps.cvRepository.create({
        name: params.options?.name ?? `Tailored CV — ${params.job.title}`,
        templateId: params.options?.templateId,
        isTailored: true,
        content,
        showProfilePhoto: params.options?.showProfilePhoto ?? true,
        userId,
        jobId: params.job.id,
      });
    });
}

function createRegenerateTailoredCvForJob(
  deps: TailoredMaterialsDependencies,
  resolveUserId: () => Promise<string>,
  runWithState: <T>(operation: () => Promise<T | null>) => Promise<T | null>
) {
  return (params: RegenerateJobParams<TailoredCvOptions>) =>
    runWithState(async () => {
      const userId = await resolveUserId();
      const context = await loadUserContext(userId, deps);
      const company = await loadCompanySummary(params.job.companyId, deps.companyService);
      const tailoring = buildTailoringContext({
        userProfile: context.profile,
        job: params.job,
        matchingSummary: params.matchingSummary,
        company,
      });

      if (!tailoring.ok) {
        throw new Error(tailoring.error);
      }

      const cvInput = buildCvInput({
        profile: context.profile,
        experiences: context.experiences,
        stories: context.stories,
        options: params.options,
      });

      const aiInput: GenerateCvInput = {
        ...cvInput,
        jobDescription: tailoring.value.jobDescription,
        matchingSummary: tailoring.value.matchingSummary,
        company: tailoring.value.company,
      };

      const content = await deps.aiService.generateCv(aiInput);
      return deps.cvRepository.update({
        id: params.id,
        name: params.options?.name,
        templateId: params.options?.templateId,
        isTailored: true,
        content,
        showProfilePhoto: params.options?.showProfilePhoto,
        jobId: params.job.id,
      });
    });
}

function createGenerateTailoredCoverLetterForJob(
  deps: TailoredMaterialsDependencies,
  resolveUserId: () => Promise<string>,
  runWithState: <T>(operation: () => Promise<T | null>) => Promise<T | null>
) {
  return (params: TailoredJobParams<TailoredCoverLetterOptions>) =>
    runWithState(async () => {
      const userId = await resolveUserId();
      const context = await loadUserContext(userId, deps);
      const company = await loadCompanySummary(params.job.companyId, deps.companyService);
      const tailoring = buildTailoringContext({
        userProfile: context.profile,
        job: params.job,
        matchingSummary: params.matchingSummary,
        company,
      });

      if (!tailoring.ok) {
        throw new Error(tailoring.error);
      }

      const speechInput = buildSpeechInput({
        profile: context.profile,
        personalCanvas: context.personalCanvas,
        experiences: context.experiences,
        stories: context.stories,
        tailoring: {
          jobDescription: tailoring.value.jobDescription,
          matchingSummary: tailoring.value.matchingSummary,
          company: tailoring.value.company,
        },
      });

      const content = await deps.aiService.generateCoverLetter(speechInput);
      return deps.coverLetterService.createCoverLetter({
        name: params.options?.name ?? `Cover Letter — ${params.job.title}`,
        tone: params.options?.tone ?? 'Professional',
        content,
        userId,
        jobId: params.job.id,
      });
    });
}

function createRegenerateTailoredCoverLetterForJob(
  deps: TailoredMaterialsDependencies,
  resolveUserId: () => Promise<string>,
  runWithState: <T>(operation: () => Promise<T | null>) => Promise<T | null>
) {
  return (params: RegenerateJobParams<TailoredCoverLetterOptions>) =>
    runWithState(async () => {
      const userId = await resolveUserId();
      const context = await loadUserContext(userId, deps);
      const company = await loadCompanySummary(params.job.companyId, deps.companyService);
      const tailoring = buildTailoringContext({
        userProfile: context.profile,
        job: params.job,
        matchingSummary: params.matchingSummary,
        company,
      });

      if (!tailoring.ok) {
        throw new Error(tailoring.error);
      }

      const speechInput = buildSpeechInput({
        profile: context.profile,
        personalCanvas: context.personalCanvas,
        experiences: context.experiences,
        stories: context.stories,
        tailoring: {
          jobDescription: tailoring.value.jobDescription,
          matchingSummary: tailoring.value.matchingSummary,
          company: tailoring.value.company,
        },
      });

      const content = await deps.aiService.generateCoverLetter(speechInput);
      return deps.coverLetterService.updateCoverLetter({
        id: params.id,
        name: params.options?.name,
        tone: params.options?.tone,
        content,
        jobId: params.job.id,
      });
    });
}

function createGenerateTailoredSpeechForJob(
  deps: TailoredMaterialsDependencies,
  resolveUserId: () => Promise<string>,
  runWithState: <T>(operation: () => Promise<T | null>) => Promise<T | null>
) {
  return (params: TailoredJobParams<TailoredSpeechOptions>) =>
    runWithState(async () => {
      const userId = await resolveUserId();
      const context = await loadUserContext(userId, deps);
      const company = await loadCompanySummary(params.job.companyId, deps.companyService);
      const tailoring = buildTailoringContext({
        userProfile: context.profile,
        job: params.job,
        matchingSummary: params.matchingSummary,
        company,
      });

      if (!tailoring.ok) {
        throw new Error(tailoring.error);
      }

      const speechInput = buildSpeechInput({
        profile: context.profile,
        personalCanvas: context.personalCanvas,
        experiences: context.experiences,
        stories: context.stories,
        tailoring: {
          jobDescription: tailoring.value.jobDescription,
          matchingSummary: tailoring.value.matchingSummary,
          company: tailoring.value.company,
        },
      });

      const speech = await deps.aiService.generateSpeech(speechInput);
      return deps.speechBlockService.createSpeechBlock({
        name: params.options?.name ?? `Speech — ${params.job.title}`,
        elevatorPitch: speech.elevatorPitch,
        careerStory: speech.careerStory,
        whyMe: speech.whyMe,
        userId,
        jobId: params.job.id,
      });
    });
}

function createRegenerateTailoredSpeechForJob(
  deps: TailoredMaterialsDependencies,
  resolveUserId: () => Promise<string>,
  runWithState: <T>(operation: () => Promise<T | null>) => Promise<T | null>
) {
  return (params: RegenerateJobParams<TailoredSpeechOptions>) =>
    runWithState(async () => {
      const userId = await resolveUserId();
      const context = await loadUserContext(userId, deps);
      const company = await loadCompanySummary(params.job.companyId, deps.companyService);
      const tailoring = buildTailoringContext({
        userProfile: context.profile,
        job: params.job,
        matchingSummary: params.matchingSummary,
        company,
      });

      if (!tailoring.ok) {
        throw new Error(tailoring.error);
      }

      const speechInput = buildSpeechInput({
        profile: context.profile,
        personalCanvas: context.personalCanvas,
        experiences: context.experiences,
        stories: context.stories,
        tailoring: {
          jobDescription: tailoring.value.jobDescription,
          matchingSummary: tailoring.value.matchingSummary,
          company: tailoring.value.company,
        },
      });

      const speech = await deps.aiService.generateSpeech(speechInput);
      return deps.speechBlockService.updateSpeechBlock({
        id: params.id,
        name: params.options?.name,
        elevatorPitch: speech.elevatorPitch,
        careerStory: speech.careerStory,
        whyMe: speech.whyMe,
        jobId: params.job.id,
      });
    });
}

async function loadUserContext(
  userId: string,
  deps: TailoredMaterialsDependencies
): Promise<{
  profile: UserProfile;
  personalCanvas: PersonalCanvas | null;
  experiences: Experience[];
  stories: STARStory[];
}> {
  const profile = await deps.userProfileService.getFullUserProfile(userId);
  if (!profile) {
    throw new Error('User profile not found');
  }

  const personalCanvas = await deps.personalCanvasRepo.getByUserId(userId).catch(() => null);
  const experiences = await deps.experienceRepo.list(userId);
  const stories = await loadStories(experiences, deps.storyService);

  return { profile, personalCanvas, experiences, stories };
}

async function loadStories(
  experiences: Experience[],
  service: STARStoryService
): Promise<STARStory[]> {
  const storyPromises = experiences.map((exp) => service.getStoriesByExperience(exp.id));
  const storyArrays = await Promise.all(storyPromises);
  return storyArrays.flat();
}

async function loadCompanySummary(companyId: string | null | undefined, service: CompanyService) {
  if (!companyId) return null;
  try {
    return await service.getCompany(companyId);
  } catch (err) {
    console.warn('[useTailoredMaterials] Unable to load company context', err);
    return null;
  }
}

function buildCvInput(args: {
  profile: UserProfile;
  experiences: Experience[];
  stories: STARStory[];
  options?: TailoredCvOptions;
}): GenerateCvInput {
  const input: GenerateCvInput = {
    language: 'en',
    userProfile: {
      fullName: args.profile.fullName || '',
      headline: args.profile.headline || undefined,
      location: args.profile.location || undefined,
      primaryEmail: args.profile.primaryEmail || undefined,
      primaryPhone: args.profile.primaryPhone || undefined,
      workPermitInfo: args.profile.workPermitInfo || undefined,
      socialLinks: filterStrings(args.profile.socialLinks),
      goals: filterStrings(args.profile.goals),
      strengths: filterStrings(args.profile.strengths),
    },
    selectedExperiences: args.experiences.map((exp) => ({
      id: exp.id,
      title: exp.title || '',
      companyName: exp.companyName ?? '',
      startDate: exp.startDate || '',
      endDate: exp.endDate || undefined,
      experienceType:
        (exp.experienceType as 'work' | 'education' | 'volunteer' | 'project' | undefined) ??
        'work',
      responsibilities: filterStrings(exp.responsibilities) ?? [],
      tasks: filterStrings(exp.tasks) ?? [],
    })),
    stories: args.stories.map((story) => ({
      experienceId: story.experienceId,
      situation: story.situation,
      task: story.task,
      action: story.action,
      result: story.result,
      achievements: filterStrings(story.achievements),
    })),
  };

  applyOptionalList(input, 'skills', args.profile.skills, args.options?.includeSkills ?? true);
  applyOptionalList(
    input,
    'languages',
    args.profile.languages,
    args.options?.includeLanguages ?? true
  );
  applyOptionalList(
    input,
    'certifications',
    args.profile.certifications,
    args.options?.includeCertifications ?? true
  );
  applyOptionalList(
    input,
    'interests',
    args.profile.interests,
    args.options?.includeInterests ?? true
  );

  return input;
}

function applyOptionalList(
  input: GenerateCvInput,
  key: 'skills' | 'languages' | 'certifications' | 'interests',
  values: (string | null)[] | null | undefined,
  include: boolean
) {
  if (!include) return;
  const filtered = filterStrings(values);
  if (filtered?.length) {
    input[key] = filtered;
  }
}

function filterStrings(values?: (string | null)[] | null): string[] | undefined {
  if (!values) return undefined;
  const filtered = values.filter((value): value is string => Boolean(value && value.trim()));
  return filtered.length ? filtered : undefined;
}
