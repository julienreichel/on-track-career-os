import { invokeAiWithRetry } from './utils/bedrock';
import { truncateForLog, withAiOperationHandlerObject } from './utils/common';
import type {
  JobDescription,
  MatchingSummaryContext,
  CompanyProfile,
  PersonalCanvas,
  Experience,
  Profile,
  SpeechStory,
} from './types/schema-types';

const SYSTEM_PROMPT = `You generate personal narrative speech based on user identity data.

Write natural-flow English with no headings, labels, or bullet lists. Follow this guidance
implicitly: hook/positioning -> fil rouge -> proof (STAR-style) -> credibility/training
-> projection -> human note -> opening question. The structure is guidance; do not
output section titles.

Tailoring rules:
- If jobDescription is provided, align to the role needs even if matchingSummary is missing.
- Use company context only when provided; keep it summary-level framing only.

Groundedness:
- Do not invent employers, skills, degrees, or achievements.
- Use experiences, responsibilities, tasks, achievements, profile skills/certs, and
  provided stories as the only sources of facts.
- If a detail is missing, omit it or stay generic (do not fabricate specifics).

Stories:
- Use the provided stories as proof examples.
- If none are provided, derive 1 proof from experiences without inventing.

Output must be:
- concise, professional, first-person voice
- motivational but realistic
- JSON only, no extra keys`;

const OUTPUT_SCHEMA = `{
  "elevatorPitch": "string",
  "careerStory": "string",
  "whyMe": "string"
}`;

const PROMPT_INDENT_SPACES = 2;

export interface GenerateSpeechInput {
  language: 'en';
  profile: Profile;
  experiences: Experience[];
  stories?: SpeechStory[];
  personalCanvas?: PersonalCanvas;
  jobDescription?: JobDescription;
  matchingSummary?: MatchingSummaryContext;
  company?: CompanyProfile;
}

export interface GenerateSpeechOutput {
  elevatorPitch: string;
  careerStory: string;
  whyMe: string;
}

type ModelResponse = Partial<GenerateSpeechOutput>;

function sanitizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizeSpeechOutput(raw: ModelResponse): GenerateSpeechOutput {
  return {
    elevatorPitch: sanitizeString(raw.elevatorPitch),
    careerStory: sanitizeString(raw.careerStory),
    whyMe: sanitizeString(raw.whyMe),
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
  const tailoring = resolveTailoringContext(args);
  const jobDescription = tailoring.jobDescription;
  const matchingSummary = tailoring.matchingSummary;
  const company = tailoring.company;
  const stories = args.stories ?? [];

  return `Use the following data to create personal speech material.

LANGUAGE:
${args.language}

PROFILE:
${JSON.stringify(args.profile ?? {}, null, PROMPT_INDENT_SPACES)}

EXPERIENCES:
${JSON.stringify(args.experiences ?? [], null, PROMPT_INDENT_SPACES)}

STORIES (use these for proof examples):
${JSON.stringify(stories, null, PROMPT_INDENT_SPACES)}

PERSONAL CANVAS:
${JSON.stringify(args.personalCanvas ?? {}, null, PROMPT_INDENT_SPACES)}

TARGET JOB DESCRIPTION (optional):
${JSON.stringify(jobDescription, null, PROMPT_INDENT_SPACES)}

MATCHING SUMMARY (optional):
${JSON.stringify(matchingSummary, null, PROMPT_INDENT_SPACES)}

COMPANY SUMMARY (optional):
${JSON.stringify(company, null, PROMPT_INDENT_SPACES)}

Output guidance (targets, not strict limits):
- elevatorPitch: ~45-60s, target ~120 words, 5-7 sentences, end with an opening question.
- careerStory: ~2-3 min, target ~360 words, 3-5 short paragraphs, include 1-2 STAR-style proofs.
- whyMe: ~1-2 min, target ~240 words, "their need/problem -> my proof -> fit -> opening question".

Make the fil rouge explicit: focus on 2-3 recurring patterns across experience, avoid
chronological date-by-date recital. Prefer "I've repeatedly..." over "In 2018...".

Do not use headings, labels, or bullet lists. End each output with an opening question.

Return ONLY valid JSON matching this exact schema:
${OUTPUT_SCHEMA}`;
}

type TailoringContext = {
  jobDescription: JobDescription | null;
  matchingSummary: MatchingSummaryContext | null;
  company: CompanyProfile | null;
};

function resolveTailoringContext(args: GenerateSpeechInput): TailoringContext {
  const hasJob = isValidJobDescription(args.jobDescription);
  const hasSummary = isValidMatchingSummary(args.matchingSummary);

  if (args.jobDescription && !hasJob) {
    console.warn('[generateSpeech] jobDescription provided without title.');
  }
  if (args.matchingSummary && !hasSummary) {
    console.warn('[generateSpeech] matchingSummary provided but missing required scores.');
  }

  return {
    jobDescription: hasJob ? (args.jobDescription ?? null) : null,
    matchingSummary: hasSummary ? (args.matchingSummary ?? null) : null,
    company: args.company ?? null,
  };
}

function isValidJobDescription(value?: JobDescription | null): value is JobDescription {
  return Boolean(value?.title);
}

function isValidMatchingSummary(
  value?: MatchingSummaryContext | null
): value is MatchingSummaryContext {
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
      hasMatchingSummary: Boolean(args.matchingSummary),
      profilePreview: truncateForLog(JSON.stringify(args.profile ?? {})),
    })
  );
};
