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
import type { GenerateCvInput } from '@/domain/ai-operations/types/generateCv';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import type { MatchingSummary } from '@/domain/matching-summary/MatchingSummary';
import type { UserProfile } from '@/domain/user-profile/UserProfile';
import type { PersonalCanvas } from '@/domain/personal-canvas/PersonalCanvas';
import type { Experience } from '@/domain/experience/Experience';
import type { STARStory } from '@/domain/starstory/STARStory';
import type { Company } from '@/domain/company/Company';
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

export function useTailoredMaterials(options: UseTailoredMaterialsOptions = {}) {
  const deps = createDependencies(options.dependencies);
  const auth = options.auth ?? useAuthUser();
  const isGenerating = ref(false);
  const error = ref<string | null>(null);

  const resolveUserId = createUserResolver({
    providedUserId: options.userId ?? null,
    currentUserId: ref(options.userId ?? null),
    auth,
  });

  const runWithState = createStateRunner(error, isGenerating);

  const generateTailoredCvForJob = (params: TailoredJobParams<TailoredCvOptions>) =>
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
      const created = await deps.cvRepository.create({
        name: params.options?.name ?? `Tailored CV — ${params.job.title}`,
        templateId: params.options?.templateId,
        isTailored: true,
        content,
        showProfilePhoto: params.options?.showProfilePhoto ?? true,
        userId,
        jobId: params.job.id,
      });

      return created;
    });

  const regenerateTailoredCvForJob = (params: RegenerateJobParams<TailoredCvOptions>) =>
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
      const updated = await deps.cvRepository.update({
        id: params.id,
        name: params.options?.name,
        templateId: params.options?.templateId,
        isTailored: true,
        content,
        showProfilePhoto: params.options?.showProfilePhoto,
        jobId: params.job.id,
      });

      return updated;
    });

  const generateTailoredCoverLetterForJob = (params: TailoredJobParams<TailoredCoverLetterOptions>) =>
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

  const regenerateTailoredCoverLetterForJob = (
    params: RegenerateJobParams<TailoredCoverLetterOptions>
  ) =>
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

  const generateTailoredSpeechForJob = (params: TailoredJobParams<TailoredSpeechOptions>) =>
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

  const regenerateTailoredSpeechForJob = (params: RegenerateJobParams<TailoredSpeechOptions>) =>
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

  return {
    isGenerating,
    error,
    generateTailoredCvForJob,
    regenerateTailoredCvForJob,
    generateTailoredCoverLetterForJob,
    regenerateTailoredCoverLetterForJob,
    generateTailoredSpeechForJob,
    regenerateTailoredSpeechForJob,
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
  const includeSkills = args.options?.includeSkills ?? true;
  const includeLanguages = args.options?.includeLanguages ?? true;
  const includeCertifications = args.options?.includeCertifications ?? true;
  const includeInterests = args.options?.includeInterests ?? true;

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
      companyName: exp.companyName || undefined,
      startDate: exp.startDate || '',
      endDate: exp.endDate || undefined,
      experienceType: exp.experienceType as
        | 'work'
        | 'education'
        | 'volunteer'
        | 'project'
        | undefined,
      responsibilities: filterStrings(exp.responsibilities),
      tasks: filterStrings(exp.tasks),
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

  if (includeSkills) {
    input.skills = filterStrings(args.profile.skills);
  }
  if (includeLanguages) {
    input.languages = filterStrings(args.profile.languages);
  }
  if (includeCertifications) {
    input.certifications = filterStrings(args.profile.certifications);
  }
  if (includeInterests) {
    input.interests = filterStrings(args.profile.interests);
  }

  return input;
}

function filterStrings(values?: (string | null)[] | null): string[] | undefined {
  if (!values) return undefined;
  const filtered = values.filter((value): value is string => Boolean(value && value.trim()));
  return filtered.length ? filtered : undefined;
}
