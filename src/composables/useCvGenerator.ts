import { ref } from 'vue';
import { AiOperationsService } from '@/domain/ai-operations/AiOperationsService';
import { UserProfileService } from '@/domain/user-profile/UserProfileService';
import type { GenerateCvInput, GenerateCvResult } from '@/domain/ai-operations/types/generateCv';
import type { CvSectionKey } from '@/domain/cvsettings/CvSectionKey';
import type { Experience } from '@/domain/experience/Experience';
import type { UserProfile } from '@/domain/user-profile/UserProfile';
import type { STARStory } from '@/domain/starstory/STARStory';

/**
 * CV Generator Composable
 *
 * Wraps AI operations for CV generation:
 * - Generate complete CV in Markdown format from user data
 *
 * This composable bridges the AI operations and the CV pages.
 */
export function useCvGenerator() {
  const generating = ref(false);
  const error = ref<string | null>(null);

  const aiService = new AiOperationsService();
  const userProfileService = new UserProfileService();

  /**
   * Build AI input from user data
   */
  const buildGenerationInput = async (
    userId: string,
    selectedExperienceIds: string[],
    options: {
      jobDescription?: GenerateCvInput['jobDescription'] | string;
      enabledSections?: CvSectionKey[];
      includeLinks?: boolean;
      includeSkills?: boolean;
      includeLanguages?: boolean;
      includeCertifications?: boolean;
      includeInterests?: boolean;
      templateMarkdown?: string;
    } = {}
  ): Promise<GenerateCvInput | null> => {
    try {
      return await buildGenerationInputInternal(userId, selectedExperienceIds, options, {
        userProfileService,
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'cvGenerator.errors.profileNotFound') {
        error.value = err.message;
        return null;
      }
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
      responsibilities: filterStringList(input.responsibilities),
      requiredSkills: filterStringList(input.requiredSkills),
      behaviours: filterStringList(input.behaviours),
      successCriteria: filterStringList(input.successCriteria),
      explicitPains: filterStringList(input.explicitPains),
      atsKeywords: filterStringList(input.atsKeywords),
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
    atsKeywords: [],
  };
}

function filterStringList(values?: (string | null)[] | null): string[] {
  if (!values) {
    return [];
  }
  return values.filter((value): value is string => Boolean(value?.trim()));
}

function filterNullableStrings(values?: (string | null)[] | null): string[] | undefined {
  if (!values) {
    return undefined;
  }
  return values.filter((value): value is string => value !== null);
}

async function buildGenerationInputInternal(
  userId: string,
  selectedExperienceIds: string[],
  options: {
    jobDescription?: GenerateCvInput['jobDescription'] | string;
    enabledSections?: CvSectionKey[];
    includeLinks?: boolean;
    includeSkills?: boolean;
    includeLanguages?: boolean;
    includeCertifications?: boolean;
    includeInterests?: boolean;
    templateMarkdown?: string;
  },
  deps: {
    userProfileService: UserProfileService;
  }
): Promise<GenerateCvInput | null> {
  const profile = await deps.userProfileService.getProfileForTailoring(userId);
  if (!profile) {
    throw new Error('cvGenerator.errors.profileNotFound');
  }

  const { experiences: allExperiences, stories: allStories } = extractTailoringData(profile);

  const { sections: enabledSections, hasExplicit: hasExplicitSections } = resolveEnabledSections(
    options.enabledSections
  );
  const sectionFlags = resolveSectionFlags(options, enabledSections, hasExplicitSections);
  const experiences = filterExperiencesBySections(
    filterExperiencesBySelection(allExperiences, selectedExperienceIds),
    enabledSections,
    hasExplicitSections
  );
  const filteredStories = filterStoriesByExperiences(allStories, experiences);

  const input: GenerateCvInput = {
    language: 'en',
    profile: buildProfileBase(profile, sectionFlags.includeLinks),
    experiences: buildExperienceInputs(experiences),
    stories: buildStoryInputs(filteredStories),
  };

  applyOptionalProfileSections(input.profile, profile, sectionFlags);
  applyOptionalJobContext(input, options);

  return input;
}

function resolveEnabledSections(enabledSections?: CvSectionKey[]) {
  return {
    sections: enabledSections ?? [],
    hasExplicit: enabledSections !== undefined,
  };
}

function resolveSectionFlag(
  options: {
    includeSkills?: boolean;
    includeLanguages?: boolean;
    includeCertifications?: boolean;
    includeInterests?: boolean;
    includeLinks?: boolean;
  },
  enabledSections: CvSectionKey[],
  hasExplicitSections: boolean,
  section: CvSectionKey
) {
  if (hasExplicitSections) {
    return enabledSections.includes(section);
  }
  switch (section) {
    case 'skills':
      return options.includeSkills ?? true;
    case 'languages':
      return options.includeLanguages ?? false;
    case 'certifications':
      return options.includeCertifications ?? false;
    case 'interests':
      return options.includeInterests ?? false;
    case 'links':
      return options.includeLinks ?? true;
    default:
      return true;
  }
}

function resolveSectionFlags(
  options: {
    includeSkills?: boolean;
    includeLanguages?: boolean;
    includeCertifications?: boolean;
    includeInterests?: boolean;
    includeLinks?: boolean;
  },
  enabledSections: CvSectionKey[],
  hasExplicitSections: boolean
) {
  return {
    includeSkills: resolveSectionFlag(options, enabledSections, hasExplicitSections, 'skills'),
    includeLanguages: resolveSectionFlag(
      options,
      enabledSections,
      hasExplicitSections,
      'languages'
    ),
    includeCertifications: resolveSectionFlag(
      options,
      enabledSections,
      hasExplicitSections,
      'certifications'
    ),
    includeInterests: resolveSectionFlag(
      options,
      enabledSections,
      hasExplicitSections,
      'interests'
    ),
    includeLinks: resolveSectionFlag(options, enabledSections, hasExplicitSections, 'links'),
  };
}

function buildProfileBase(profile: UserProfile, includeLinks: boolean) {
  return {
    fullName: profile.fullName || '',
    headline: profile.headline || undefined,
    location: profile.location || undefined,
    seniorityLevel: profile.seniorityLevel || undefined,
    primaryEmail: profile.primaryEmail || undefined,
    primaryPhone: profile.primaryPhone || undefined,
    workPermitInfo: profile.workPermitInfo || undefined,
    socialLinks: includeLinks ? filterSocialLinks(profile.socialLinks) : undefined,
    aspirations: filterNullableStrings(profile.aspirations),
    personalValues: filterNullableStrings(profile.personalValues),
    strengths: filterNullableStrings(profile.strengths),
  };
}

function filterSocialLinks(links?: (string | null)[] | null) {
  return links
    ?.map((link) => (typeof link === 'string' ? link.trim() : ''))
    .filter((link): link is string => !!link);
}

function buildExperienceInputs(experiences: Experience[]) {
  return experiences.map((exp) => ({
    id: exp.id,
    title: exp.title || '',
    companyName: exp.companyName ?? '',
    startDate: exp.startDate || '',
    endDate: exp.endDate || undefined,
    experienceType:
      (exp.experienceType as 'work' | 'education' | 'volunteer' | 'project' | undefined) ?? 'work',
    responsibilities: filterStringList(exp.responsibilities),
    tasks: filterStringList(exp.tasks),
  }));
}

function buildStoryInputs(stories: STARStory[]) {
  return stories.map((story) => ({
    experienceId: story.experienceId,
    situation: story.situation,
    task: story.task,
    action: story.action,
    result: story.result,
    achievements: story.achievements?.filter((a): a is string => a !== null),
  }));
}

function filterStoriesByExperiences(stories: STARStory[], experiences: Experience[]) {
  const allowedExperienceIds = new Set(experiences.map((exp) => exp.id));
  return stories.filter(
    (story) => !story.experienceId || allowedExperienceIds.has(story.experienceId)
  );
}

function filterExperiencesBySelection(experiences: Experience[], selectedExperienceIds: string[]) {
  if (selectedExperienceIds.length === 0) {
    return experiences;
  }
  const allowed = new Set(selectedExperienceIds);
  return experiences.filter((exp) => allowed.has(exp.id));
}

function extractTailoringData(profile: UserProfile): {
  experiences: Experience[];
  stories: STARStory[];
} {
  const data = profile as UserProfile & {
    experiences?: (Experience & { stories?: (STARStory | null)[] | null })[] | null;
  };

  const experiences = (data.experiences ?? []).filter(
    (exp): exp is Experience & { stories?: (STARStory | null)[] | null } => Boolean(exp)
  );
  const stories = experiences
    .flatMap((experience) => experience.stories ?? [])
    .filter((story): story is STARStory => Boolean(story));

  return {
    experiences,
    stories,
  };
}

function applyOptionalProfileSections(
  profileInput: GenerateCvInput['profile'],
  profile: UserProfile,
  flags: {
    includeSkills: boolean;
    includeLanguages: boolean;
    includeCertifications: boolean;
    includeInterests: boolean;
  }
) {
  if (flags.includeSkills && profile.skills) {
    profileInput.skills = filterNullableStrings(profile.skills);
  }
  if (flags.includeLanguages && profile.languages) {
    profileInput.languages = filterNullableStrings(profile.languages);
  }
  if (flags.includeCertifications && profile.certifications) {
    profileInput.certifications = filterNullableStrings(profile.certifications);
  }
  if (flags.includeInterests && profile.interests) {
    profileInput.interests = filterNullableStrings(profile.interests);
  }
}

function applyOptionalJobContext(
  input: GenerateCvInput,
  options: {
    jobDescription?: GenerateCvInput['jobDescription'] | string;
    templateMarkdown?: string;
  }
) {
  if (options.jobDescription) {
    input.jobDescription = normalizeJobDescription(options.jobDescription);
  }
  if (options.templateMarkdown?.trim()) {
    input.templateMarkdown = options.templateMarkdown.trim();
  }
}

function filterExperiencesBySections(
  experiences: Experience[],
  enabledSections: CvSectionKey[],
  hasExplicitSections: boolean
) {
  if (!hasExplicitSections) {
    return experiences;
  }
  if (enabledSections.length === 0) {
    return [];
  }
  const allowExperience = enabledSections.includes('experience');
  const allowEducation = enabledSections.includes('education');
  const allowProjects = enabledSections.includes('projects');

  return experiences.filter((exp) => {
    const type = exp.experienceType ?? 'work';
    if (type === 'education') return allowEducation;
    if (type === 'project') return allowProjects;
    return allowExperience;
  });
}
