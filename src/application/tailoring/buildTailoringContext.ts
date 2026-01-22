import type { UserProfile } from '@/domain/user-profile/UserProfile';
import type { JobDescription as DomainJobDescription } from '@/domain/job-description/JobDescription';
import type { MatchingSummary } from '@/domain/matching-summary/MatchingSummary';
import type { Company } from '@/domain/company/Company';
import type {
  Profile,
  JobDescription,
  MatchingSummaryContext,
  CompanyProfile,
} from '@amplify/data/ai-operations/types/schema-types';

export type TailoringContext = {
  language: 'en';
  userProfile: Profile;
  jobDescription: JobDescription;
  matchingSummary: MatchingSummaryContext;
  company?: CompanyProfile;
};

export type TailoringContextResult =
  | { ok: true; value: TailoringContext }
  | { ok: false; error: string };

type BuildTailoringContextInput = {
  userProfile?: UserProfile | null;
  job?: DomainJobDescription | null;
  matchingSummary?: MatchingSummary | null;
  company?: Company | null;
};

export function buildTailoringContext(input: BuildTailoringContextInput): TailoringContextResult {
  if (!input.userProfile) {
    return { ok: false, error: 'User profile is required for tailoring.' };
  }
  if (!input.job) {
    return { ok: false, error: 'Job description is required for tailoring.' };
  }
  if (!input.matchingSummary) {
    return { ok: false, error: 'Matching summary is required for tailoring.' };
  }

  const fullName = normalizeString(input.userProfile.fullName);
  if (!fullName) {
    return { ok: false, error: 'User profile fullName is required for tailoring.' };
  }

  const title = normalizeString(input.job.title);
  if (!title) {
    return { ok: false, error: 'Job title is required for tailoring.' };
  }

  const context: TailoringContext = {
    language: 'en',
    userProfile: mapUserProfile(input.userProfile, fullName),
    jobDescription: mapJobDescription(input.job, title),
    matchingSummary: mapMatchingSummary(input.matchingSummary),
  };

  if (input.company) {
    context.company = mapCompanySummary(input.company);
  }

  return { ok: true, value: context };
}

function mapUserProfile(profile: UserProfile, fullName: string): Profile {
  const headline = normalizeString(profile.headline);
  const location = normalizeString(profile.location);
  const seniorityLevel = normalizeString(profile.seniorityLevel);
  const workPermitInfo = normalizeString(profile.workPermitInfo);

  return {
    fullName,
    ...(headline && { headline }),
    ...(location && { location }),
    ...(seniorityLevel && { seniorityLevel }),
    ...(workPermitInfo && { workPermitInfo }),
    ...(optionalStringArray(profile.aspirations) && {
      aspirations: optionalStringArray(profile.aspirations),
    }),
    ...(optionalStringArray(profile.personalValues) && {
      personalValues: optionalStringArray(profile.personalValues),
    }),
    ...(optionalStringArray(profile.strengths) && {
      strengths: optionalStringArray(profile.strengths),
    }),
    ...(optionalStringArray(profile.interests) && {
      interests: optionalStringArray(profile.interests),
    }),
    ...(optionalStringArray(profile.skills) && { skills: optionalStringArray(profile.skills) }),
    ...(optionalStringArray(profile.certifications) && {
      certifications: optionalStringArray(profile.certifications),
    }),
    ...(optionalStringArray(profile.languages) && {
      languages: optionalStringArray(profile.languages),
    }),
  };
}

function mapJobDescription(job: DomainJobDescription, title: string): JobDescription {
  return {
    title,
    seniorityLevel: normalizeRequiredString(job.seniorityLevel),
    roleSummary: normalizeRequiredString(job.roleSummary),
    responsibilities: requiredStringArray(job.responsibilities),
    requiredSkills: requiredStringArray(job.requiredSkills),
    behaviours: requiredStringArray(job.behaviours),
    successCriteria: requiredStringArray(job.successCriteria),
    explicitPains: requiredStringArray(job.explicitPains),
    atsKeywords: requiredStringArray(job.atsKeywords),
  };
}

function mapMatchingSummary(summary: MatchingSummary): MatchingSummaryContext {
  return {
    overallScore: normalizeNumber(summary.overallScore),
    scoreBreakdown: normalizeScoreBreakdown(summary.scoreBreakdown),
    recommendation: normalizeRecommendation(summary.recommendation),
    reasoningHighlights: requiredStringArray(summary.reasoningHighlights),
    strengthsForThisRole: requiredStringArray(summary.strengthsForThisRole),
    skillMatch: requiredStringArray(summary.skillMatch),
    riskyPoints: requiredStringArray(summary.riskyPoints),
    impactOpportunities: requiredStringArray(summary.impactOpportunities),
    tailoringTips: requiredStringArray(summary.tailoringTips),
  };
}

function mapCompanySummary(company: Company): CompanyProfile {
  return {
    companyName: company.companyName,
    industry: normalizeRequiredString(company.industry),
    sizeRange: normalizeRequiredString(company.sizeRange),
    website: normalizeRequiredString(company.website),
    description: normalizeRequiredString(company.description),
    productsServices: requiredStringArray(company.productsServices),
    targetMarkets: requiredStringArray(company.targetMarkets),
    customerSegments: requiredStringArray(company.customerSegments),
    rawNotes: normalizeRequiredString(company.rawNotes),
  };
}

function normalizeString(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeRequiredString(value?: string | null): string {
  return normalizeString(value) ?? '';
}

function optionalStringArray(values?: (string | null)[] | null): string[] | undefined {
  if (!values) return undefined;
  const filtered = values.filter((value): value is string => Boolean(value?.trim()));
  return filtered.length ? filtered : undefined;
}

function requiredStringArray(values?: (string | null)[] | null): string[] {
  if (!values) return [];
  return values.filter((value): value is string => Boolean(value?.trim()));
}

function normalizeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

type ScoreBreakdown = {
  skillFit: number;
  experienceFit: number;
  interestFit: number;
  edge: number;
};

function normalizeScoreBreakdown(value: unknown): ScoreBreakdown {
  const candidate = value as Partial<ScoreBreakdown> | null | undefined;
  return {
    skillFit: normalizeNumber(candidate?.skillFit),
    experienceFit: normalizeNumber(candidate?.experienceFit),
    interestFit: normalizeNumber(candidate?.interestFit),
    edge: normalizeNumber(candidate?.edge),
  };
}

function normalizeRecommendation(value: unknown): 'apply' | 'maybe' | 'skip' {
  if (value === 'apply' || value === 'maybe' || value === 'skip') {
    return value;
  }
  return 'maybe';
}
