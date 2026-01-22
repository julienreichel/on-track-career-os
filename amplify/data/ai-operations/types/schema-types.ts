/**
 * Shared type definitions extracted from Amplify Data Schema
 *
 * PURPOSE:
 * - Provide DRY type definitions for Lambda functions
 * - Ensure Lambda input types stay in sync with GraphQL schema
 * - Eliminate duplicate type definitions across AI operations
 *
 * USAGE:
 * Import these types in Lambda handlers instead of redefining them:
 * ```typescript
 * import type { JobDescription, MatchingSummaryContext } from './types/schema-types';
 * ```
 *
 * MAINTENANCE:
 * These types must be manually kept in sync with amplify/data/schema/types.ts
 * When schema changes, update these types accordingly and TypeScript will catch
 * any mismatches in Lambda code that uses them.
 */

// Job Description (used by generateCv, generateSpeech, generateCoverLetter, generateMatchingSummary)
export type JobDescription = {
  title: string;
  seniorityLevel: string;
  roleSummary: string;
  responsibilities: string[];
  requiredSkills: string[];
  behaviours: string[];
  successCriteria: string[];
  explicitPains: string[];
  atsKeywords: string[];
};

// Matching Summary Context (used by generateCv, generateSpeech, generateCoverLetter)
export type MatchingSummaryContext = {
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

// Company Profile (used by generateCv, generateSpeech, generateCoverLetter, generateMatchingSummary)
export type CompanyProfile = {
  companyName: string;
  industry: string;
  sizeRange: string;
  website: string;
  description: string;
  productsServices: string[];
  targetMarkets: string[];
  customerSegments: string[];
  rawNotes: string;
};

// Personal Canvas (used by generateCv, generateSpeech, generateCoverLetter)
export type PersonalCanvas = {
  customerSegments?: string[];
  valueProposition?: string[];
  channels?: string[];
  customerRelationships?: string[];
  keyActivities?: string[];
  keyResources?: string[];
  keyPartners?: string[];
  costStructure?: string[];
  revenueStreams?: string[];
};

// Experience (used by generateCv, generateSpeech, generateCoverLetter, generateMatchingSummary)
export type Experience = {
  id?: string;
  title: string;
  companyName: string;
  startDate?: string;
  endDate?: string;
  experienceType: string;
  responsibilities: string[];
  tasks: string[];
  achievements?: string[];
  kpiSuggestions?: string[];
};

// Profile (used by generateCv, generateSpeech, generateCoverLetter, generateMatchingSummary, generatePersonalCanvas)
export type Profile = {
  fullName: string;
  headline?: string;
  location?: string;
  seniorityLevel?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  workPermitInfo?: string;
  socialLinks?: string[];
  aspirations?: string[];
  personalValues?: string[];
  strengths?: string[];
  interests?: string[];
  skills?: string[];
  certifications?: string[];
  languages?: string[];
};

// STAR Story (used by generateCv, generateSpeech, generateCoverLetter, generateMatchingSummary)
export type SpeechStory = {
  experienceId?: string;
  title?: string;
  situation?: string;
  task?: string;
  action?: string;
  result?: string;
  achievements?: string[];
};
