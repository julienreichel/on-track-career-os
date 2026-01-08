import type { UserProfile } from '@/domain/user-profile/UserProfile';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import type { MatchingSummary } from '@/domain/matching-summary/MatchingSummary';
import type { Company } from '@/domain/company/Company';

export type TailoringUserProfile = {
  fullName: string;
  headline?: string;
  location?: string;
  seniorityLevel?: string;
  workPermitInfo?: string;
  goals?: string[];
  aspirations?: string[];
  personalValues?: string[];
  strengths?: string[];
  interests?: string[];
  skills?: string[];
  certifications?: string[];
  languages?: string[];
};

export type TailoringJobDescription = {
  title: string;
  seniorityLevel?: string;
  roleSummary?: string;
  responsibilities?: string[];
  requiredSkills?: string[];
  behaviours?: string[];
  successCriteria?: string[];
  explicitPains?: string[];
};

export type TailoringMatchingSummary = {
  overallScore: number;
  scoreBreakdown: {
    skillFit: number;
    experienceFit: number;
    interestFit: number;
    edge: number;
  };
  recommendation: 'apply' | 'maybe' | 'skip';
  reasoningHighlights: string[];
  strengthsForThisRole: string[];
  skillMatch: string[];
  riskyPoints: string[];
  impactOpportunities: string[];
  tailoringTips: string[];
};

export type TailoringCompanySummary = {
  companyName: string;
  industry?: string;
  sizeRange?: string;
  website?: string;
  description?: string;
};

export type TailoringContext = {
  language: 'en';
  userProfile: TailoringUserProfile;
  jobDescription: TailoringJobDescription;
  matchingSummary: TailoringMatchingSummary;
  company?: TailoringCompanySummary;
};

export type TailoringContextResult =
  | { ok: true; value: TailoringContext }
  | { ok: false; error: string };

type BuildTailoringContextInput = {
  userProfile?: UserProfile | null;
  job?: JobDescription | null;
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

function mapUserProfile(profile: UserProfile, fullName: string): TailoringUserProfile {
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
    ...(optionalStringArray(profile.goals) && { goals: optionalStringArray(profile.goals) }),
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

function mapJobDescription(job: JobDescription, title: string): TailoringJobDescription {
  const seniorityLevel = normalizeString(job.seniorityLevel);
  const roleSummary = normalizeString(job.roleSummary);

  return {
    title,
    ...(seniorityLevel && { seniorityLevel }),
    ...(roleSummary && { roleSummary }),
    ...(optionalStringArray(job.responsibilities) && {
      responsibilities: optionalStringArray(job.responsibilities),
    }),
    ...(optionalStringArray(job.requiredSkills) && {
      requiredSkills: optionalStringArray(job.requiredSkills),
    }),
    ...(optionalStringArray(job.behaviours) && {
      behaviours: optionalStringArray(job.behaviours),
    }),
    ...(optionalStringArray(job.successCriteria) && {
      successCriteria: optionalStringArray(job.successCriteria),
    }),
    ...(optionalStringArray(job.explicitPains) && {
      explicitPains: optionalStringArray(job.explicitPains),
    }),
  };
}

function mapMatchingSummary(summary: MatchingSummary): TailoringMatchingSummary {
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

function mapCompanySummary(company: Company): TailoringCompanySummary {
  const industry = normalizeString(company.industry);
  const sizeRange = normalizeString(company.sizeRange);
  const website = normalizeString(company.website);
  const description = normalizeString(company.description);

  return {
    companyName: company.companyName,
    ...(industry && { industry }),
    ...(sizeRange && { sizeRange }),
    ...(website && { website }),
    ...(description && { description }),
  };
}

function normalizeString(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function optionalStringArray(values?: (string | null)[] | null): string[] | undefined {
  if (!values) return undefined;
  const filtered = values.filter((value): value is string => Boolean(value && value.trim()));
  return filtered.length ? filtered : undefined;
}

function requiredStringArray(values?: (string | null)[] | null): string[] {
  if (!values) return [];
  return values.filter((value): value is string => Boolean(value && value.trim()));
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

function normalizeRecommendation(value: unknown): TailoringMatchingSummary['recommendation'] {
  if (value === 'apply' || value === 'maybe' || value === 'skip') {
    return value;
  }
  return 'maybe';
}
