import { invokeAiWithRetry } from './utils/bedrock';
import { truncateForLog, withAiOperationHandlerObject } from './utils/common';

const SYSTEM_PROMPT = `You generate professional cover letters based on user identity data.

If jobDescription is provided, tailor the letter to demonstrate fit for that specific role.
If jobDescription is absent, create a generic cover letter showcasing the candidate's value proposition.

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
  companyName?: string;
  startDate?: string;
  endDate?: string;
  responsibilities?: string[];
  tasks?: string[];
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
  seniorityLevel?: string;
  roleSummary?: string;
  responsibilities?: string[];
  requiredSkills?: string[];
  behaviours?: string[];
  successCriteria?: string[];
  explicitPains?: string[];
}

export interface GenerateCoverLetterInput {
  profile: CoverLetterUserProfile;
  experiences: CoverLetterExperience[];
  stories?: CoverLetterStory[];
  personalCanvas?: CoverLetterPersonalCanvas;
  jobDescription?: CoverLetterJobDescription;
}

export interface GenerateCoverLetterOutput {
  content: string;
}

type ModelResponse = Partial<GenerateCoverLetterOutput>;

function sanitizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizeCoverLetterOutput(raw: ModelResponse): GenerateCoverLetterOutput {
  return {
    content: sanitizeString(raw.content),
  };
}

function buildFallbackOutput(): GenerateCoverLetterOutput {
  return {
    content: '',
  };
}

function buildUserPrompt(args: GenerateCoverLetterInput): string {
  const hasJob = Boolean(args.jobDescription);
  
  const instruction = hasJob
    ? 'Create a cover letter tailored to the target job description.'
    : 'Create a generic cover letter showcasing the candidate\'s professional value.';

  return `${instruction}

PROFILE:
${JSON.stringify(args.profile ?? {}, null, PROMPT_INDENT_SPACES)}

EXPERIENCES:
${JSON.stringify(args.experiences ?? [], null, PROMPT_INDENT_SPACES)}

STORIES:
${JSON.stringify(args.stories ?? [], null, PROMPT_INDENT_SPACES)}

PERSONAL CANVAS:
${JSON.stringify(args.personalCanvas ?? {}, null, PROMPT_INDENT_SPACES)}

TARGET JOB DESCRIPTION (optional):
${JSON.stringify(args.jobDescription ?? null, null, PROMPT_INDENT_SPACES)}

Structure the cover letter with:
1. Opening paragraph: Express interest and briefly introduce yourself
2. Body paragraphs (2-3): Highlight relevant experience, achievements, and fit
3. Closing paragraph: Express enthusiasm and call to action

${hasJob ? 'Demonstrate specific fit for the role and company needs.' : 'Focus on transferable value and professional identity.'}

Return ONLY valid JSON matching this exact schema:
${OUTPUT_SCHEMA}`;
}

type HandlerEvent = {
  arguments: GenerateCoverLetterInput;
};

export const handler = async (event: HandlerEvent) => {
  if (!event?.arguments) {
    throw new Error('arguments are required');
  }

  return withAiOperationHandlerObject(
    'generateCoverLetter',
    { arguments: event.arguments },
    async (args) => {
      const userPrompt = buildUserPrompt(args);

      try {
        const response = await invokeAiWithRetry<ModelResponse>({
          systemPrompt: SYSTEM_PROMPT,
          userPrompt,
          outputSchema: OUTPUT_SCHEMA,
          validate: (raw) => sanitizeCoverLetterOutput(raw ?? {}),
          operationName: 'generateCoverLetter',
        });

        return response;
      } catch (error) {
        console.error('generateCoverLetter fallback triggered', {
          reason: (error as Error).message,
        });
        return buildFallbackOutput();
      }
    },
    (args) => ({
      userName: args.profile?.fullName,
      experienceCount: args.experiences?.length ?? 0,
      storyCount: args.stories?.length ?? 0,
      hasJobDescription: Boolean(args.jobDescription),
      profilePreview: truncateForLog(JSON.stringify(args.profile ?? {})),
    })
  );
};
