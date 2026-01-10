import { invokeBedrock } from './utils/bedrock';
import { truncateForLog, withAiOperationHandlerObject } from './utils/common';

const SYSTEM_PROMPT = `You generate professional cover letters based on user identity data.

If tailoring context is provided (jobDescription + matchingSummary), tailor the letter to demonstrate fit for that specific role.
If tailoring context is absent, create a generic cover letter showcasing the candidate's value proposition.
Use company context only when provided and only as summary-level framing.

Output must be:
- professional and authentic
- first-person voice
- concise yet compelling (300-500 words)
- structured with clear paragraphs
- grounded in data provided
- no invented work history, skills, or achievements
- no extra keys
- JSON only`;

const OUTPUT_SCHEMA = `{
  "content": "string (complete cover letter in plain text or markdown)"
}`;

const PROMPT_INDENT_SPACES = 2;

export interface CoverLetterUserProfile {
  fullName: string;
  headline?: string;
  location?: string;
  seniorityLevel?: string;
  goals?: string[];
  aspirations?: string[];
  personalValues?: string[];
  strengths?: string[];
  interests?: string[];
  skills?: string[];
  certifications?: string[];
  languages?: string[];
}

export interface CoverLetterExperience {
  title: string;
  companyName: string;
  startDate?: string;
  endDate?: string;
  experienceType: string;
  responsibilities: string[];
  tasks: string[];
  achievements?: string[];
  kpiSuggestions?: string[];
}

export interface CoverLetterStory {
  title?: string;
  situation?: string;
  task?: string;
  action?: string;
  result?: string;
  achievements?: string[];
}

export interface CoverLetterPersonalCanvas {
  customerSegments?: string[];
  valueProposition?: string[];
  channels?: string[];
  customerRelationships?: string[];
  keyActivities?: string[];
  keyResources?: string[];
  keyPartners?: string[];
  costStructure?: string[];
  revenueStreams?: string[];
}

export interface CoverLetterJobDescription {
  title: string;
  seniorityLevel: string;
  roleSummary: string;
  responsibilities: string[];
  requiredSkills: string[];
  behaviours: string[];
  successCriteria: string[];
  explicitPains: string[];
}

export interface CoverLetterMatchingSummary {
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
}

export interface CoverLetterCompanySummary {
  companyName: string;
  industry: string;
  sizeRange: string;
  website: string;
  description: string;
  productsServices: string[];
  targetMarkets: string[];
  customerSegments: string[];
  rawNotes: string;
}

export interface GenerateCoverLetterInput {
  language: 'en';
  profile: CoverLetterUserProfile;
  experiences: CoverLetterExperience[];
  stories?: CoverLetterStory[];
  personalCanvas?: CoverLetterPersonalCanvas;
  jobDescription?: CoverLetterJobDescription;
  matchingSummary?: CoverLetterMatchingSummary;
  company?: CoverLetterCompanySummary;
}

function buildUserPrompt(args: GenerateCoverLetterInput): string {
  const tailoring = resolveTailoringContext(args);
  const hasJob = Boolean(tailoring?.jobDescription);
  const jobDescription = tailoring?.jobDescription ?? null;
  const matchingSummary = tailoring?.matchingSummary ?? null;
  const company = tailoring?.company ?? null;

  const instruction = hasJob
    ? 'Create a cover letter tailored to the target job description.'
    : "Create a generic cover letter showcasing the candidate's professional value.";

  return `${instruction}

LANGUAGE:
${args.language}

PROFILE:
${JSON.stringify(args.profile ?? {}, null, PROMPT_INDENT_SPACES)}

EXPERIENCES:
${JSON.stringify(args.experiences ?? [], null, PROMPT_INDENT_SPACES)}

STORIES:
${JSON.stringify(args.stories ?? [], null, PROMPT_INDENT_SPACES)}

PERSONAL CANVAS:
${JSON.stringify(args.personalCanvas ?? {}, null, PROMPT_INDENT_SPACES)}

TARGET JOB DESCRIPTION (optional):
${JSON.stringify(jobDescription, null, PROMPT_INDENT_SPACES)}

MATCHING SUMMARY (optional):
${JSON.stringify(matchingSummary, null, PROMPT_INDENT_SPACES)}

COMPANY SUMMARY (optional):
${JSON.stringify(company, null, PROMPT_INDENT_SPACES)}

Structure the cover letter with:
1. Opening paragraph: Express interest and briefly introduce yourself
2. Body paragraphs (2-3): Highlight relevant experience, achievements, and fit
3. Closing paragraph: Express enthusiasm and call to action

${hasJob ? 'Demonstrate specific fit for the role and company needs.' : 'Focus on transferable value and professional identity.'}

Return ONLY valid JSON matching this exact schema:
${OUTPUT_SCHEMA}`;
}

function resolveTailoringContext(args: GenerateCoverLetterInput) {
  const hasJob = isValidJobDescription(args.jobDescription);
  const hasSummary = isValidMatchingSummary(args.matchingSummary);

  if (hasJob && hasSummary) {
    return {
      jobDescription: args.jobDescription ?? null,
      matchingSummary: args.matchingSummary ?? null,
      company: args.company ?? null,
    };
  }

  if (args.jobDescription || args.matchingSummary) {
    console.warn(
      '[generateCoverLetter] Invalid tailoring context detected. Falling back to generic.'
    );
  }

  return null;
}

function isValidJobDescription(
  value?: CoverLetterJobDescription | null
): value is CoverLetterJobDescription {
  return Boolean(value?.title);
}

function isValidMatchingSummary(
  value?: CoverLetterMatchingSummary | null
): value is CoverLetterMatchingSummary {
  if (!value) return false;
  return (
    typeof value.overallScore === 'number' &&
    typeof value.scoreBreakdown?.skillFit === 'number' &&
    typeof value.scoreBreakdown?.experienceFit === 'number' &&
    typeof value.scoreBreakdown?.interestFit === 'number' &&
    typeof value.scoreBreakdown?.edge === 'number'
  );
}

type HandlerEvent = {
  arguments: GenerateCoverLetterInput;
};

export const handler = async (event: HandlerEvent): Promise<string> => {
  if (!event?.arguments) {
    throw new Error('arguments are required');
  }

  return withAiOperationHandlerObject(
    'generateCoverLetter',
    { arguments: event.arguments },
    async (args) => {
      const userPrompt = buildUserPrompt(args);
      const responseText = await invokeBedrock(SYSTEM_PROMPT, userPrompt);

      console.log('[generateCoverLetter] Generated cover letter length:', responseText.length);

      // Parse JSON response and extract content
      try {
        const parsed = JSON.parse(responseText);
        const content = typeof parsed.content === 'string' ? parsed.content.trim() : '';
        return content;
      } catch (parseError) {
        console.error('[generateCoverLetter] Failed to parse JSON response, returning raw text', {
          error: (parseError as Error).message,
        });
        // If JSON parsing fails, return the raw text as fallback
        return responseText.trim();
      }
    },
    (args) => ({
      userName: args.profile?.fullName,
      experienceCount: args.experiences?.length ?? 0,
      storyCount: args.stories?.length ?? 0,
      hasJobDescription: Boolean(args.jobDescription),
      hasMatchingSummary: Boolean(args.matchingSummary),
      profilePreview: truncateForLog(JSON.stringify(args.profile ?? {})),
    })
  );
};
