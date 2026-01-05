import { invokeAiWithRetry } from './utils/bedrock';
import { truncateForLog, withAiOperationHandlerObject } from './utils/common';

const SYSTEM_PROMPT = `You generate personal narrative speech based on user identity data.

If jobDescription is provided, tailor phrasing to the role and job needs without inventing facts.
If jobDescription is absent, keep the speech generic (no job targeting).

Output must be:
- concise
- professional
- first-person voice
- motivational but realistic
- grounded in data provided
- no invented work history or skills
- no extra keys
- JSON only`;

const OUTPUT_SCHEMA = `{
  "elevatorPitch": "string (<= 80 words)",
  "careerStory": "string (<= 160 words)",
  "whyMe": "string (<= 120 words)"
}`;

const PROMPT_INDENT_SPACES = 2;

export interface SpeechUserProfile {
  fullName: string;
  headline?: string;
  location?: string;
  seniorityLevel?: string;
  workPermitInfo?: string;
  goals?: string[];
  aspirations?: string[];
  personalValues?: string[];
  strengths?: string[];
  values?: string[];
  interests?: string[];
  skills?: string[];
  certifications?: string[];
  languages?: string[];
}

export interface SpeechExperience {
  title: string;
  companyName?: string;
  startDate?: string;
  endDate?: string;
  responsibilities?: string[];
  achievements?: string[];
}

export interface SpeechStory {
  title?: string;
  situation?: string;
  task?: string;
  action?: string;
  result?: string;
  achievements?: string[];
}

export interface SpeechPersonalCanvas {
  valueProposition?: string[];
  keyActivities?: string[];
  strengths?: string[];
  targetRoles?: string[];
}

export interface SpeechJobDescription {
  title?: string;
  seniorityLevel?: string;
  roleSummary?: string;
  responsibilities?: string[];
  requiredSkills?: string[];
  behaviours?: string[];
  successCriteria?: string[];
  explicitPains?: string[];
}

export interface GenerateSpeechInput {
  profile: SpeechUserProfile;
  experiences: SpeechExperience[];
  stories?: SpeechStory[];
  personalCanvas?: SpeechPersonalCanvas;
  jobDescription?: SpeechJobDescription;
}

export interface GenerateSpeechOutput {
  elevatorPitch: string;
  careerStory: string;
  whyMe: string;
}

type ModelResponse = Partial<GenerateSpeechOutput>;

const ELEVATOR_MAX_WORDS = 80;
const CAREER_MAX_WORDS = 160;
const WHY_ME_MAX_WORDS = 120;

function sanitizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function trimToWordCount(value: string, maxWords: number): string {
  const words = value.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return value;
  }
  return words.slice(0, maxWords).join(' ');
}

function sanitizeSpeechOutput(raw: ModelResponse): GenerateSpeechOutput {
  return {
    elevatorPitch: trimToWordCount(sanitizeString(raw.elevatorPitch), ELEVATOR_MAX_WORDS),
    careerStory: trimToWordCount(sanitizeString(raw.careerStory), CAREER_MAX_WORDS),
    whyMe: trimToWordCount(sanitizeString(raw.whyMe), WHY_ME_MAX_WORDS),
  };
}

function buildFallbackOutput(): GenerateSpeechOutput {
  return {
    elevatorPitch: '',
    careerStory: '',
    whyMe: '',
  };
}

function buildUserPrompt(args: GenerateSpeechInput): string {
  return `Use the following data to create personal speech material.

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

Return JSON with:
- elevatorPitch (80 words max)
- careerStory (160 words max)
- whyMe (120 words max)

Return ONLY valid JSON matching this exact schema:
${OUTPUT_SCHEMA}`;
}

type HandlerEvent = {
  arguments: GenerateSpeechInput;
};

export const handler = async (event: HandlerEvent) => {
  if (!event?.arguments) {
    throw new Error('arguments are required');
  }

  return withAiOperationHandlerObject(
    'generateSpeech',
    { arguments: event.arguments },
    async (args) => {
      const userPrompt = buildUserPrompt(args);

      try {
        const response = await invokeAiWithRetry<ModelResponse>({
          systemPrompt: SYSTEM_PROMPT,
          userPrompt,
          outputSchema: OUTPUT_SCHEMA,
          validate: (raw) => sanitizeSpeechOutput(raw ?? {}),
          operationName: 'generateSpeech',
        });

        return response;
      } catch (error) {
        console.error('generateSpeech fallback triggered', {
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
