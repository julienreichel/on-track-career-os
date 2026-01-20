import { invokeBedrock } from './utils/bedrock';
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
- return a plain Markdown cover letter only (no JSON, no code fences, no extra commentary)`;

const PROMPT_INDENT_SPACES = 2;








export interface GenerateCoverLetterInput {
  language: 'en';
  profile: Profile;
  experiences: Experience[];
  stories?: SpeechStory[];
  personalCanvas?: PersonalCanvas;
  jobDescription?: JobDescription;
  matchingSummary?: MatchingSummaryContext;
  company?: CompanyProfile;
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

Return a plain Markdown cover letter only. Do not include JSON, code fences, or any extra preamble.`;
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
  value?: JobDescription | null
): value is JobDescription {
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
  arguments: GenerateCoverLetterInput;
};

const PREAMBLE_PATTERNS = [
  /^here('?s| is) (your|a) cover letter[:\s-]*/i,
  /^certainly[,!]\s*/i,
  /^sure[,!]\s*/i,
  /^below is (your|a) cover letter[:\s-]*/i,
  /^cover letter[:\s-]*/i,
  /^---$/,
];

const EPILOGUE_PATTERNS = [
  /let me know if/i,
  /hope this helps/i,
  /if you'd like/i,
  /feel free to/i,
  /would you like/i,
  /happy to revise/i,
  /^---$/,
];

function stripCodeFences(input: string): string {
  return input
    .replace(/```[\s\S]*?```/g, (match) => match.replace(/```[^\n]*\n?/g, ''))
    .replace(/```/g, '');
}

function stripPreamble(lines: string[]): string[] {
  let startIndex = 0;
  while (startIndex < lines.length) {
    const line = lines[startIndex]?.trim();
    if (!line) {
      startIndex += 1;
      continue;
    }
    if (PREAMBLE_PATTERNS.some((pattern) => pattern.test(line))) {
      startIndex += 1;
      continue;
    }
    break;
  }
  return lines.slice(startIndex);
}

function stripEpilogue(lines: string[]): string[] {
  let endIndex = lines.length;
  while (endIndex > 0) {
    const line = lines[endIndex - 1]?.trim();
    if (!line) {
      endIndex -= 1;
      continue;
    }
    if (EPILOGUE_PATTERNS.some((pattern) => pattern.test(line))) {
      endIndex -= 1;
      continue;
    }
    break;
  }
  return lines.slice(0, endIndex);
}

function cleanCoverLetterMarkdown(input: string): string {
  const normalized = stripCodeFences(input).trim();
  const lines = normalized.split(/\r?\n/);
  const withoutPreamble = stripPreamble(lines);
  const withoutEpilogue = stripEpilogue(withoutPreamble);
  return withoutEpilogue.join('\n').trim();
}

function parseCoverLetterResponse(responseText: string): { content: string } {
  const trimmed = responseText.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed) as { content?: unknown };
      if (typeof parsed.content === 'string') {
        return { content: parsed.content };
      }
    } catch {
      // Fall through to markdown parsing.
    }
  }

  return { content: trimmed };
}

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

      const parsed = parseCoverLetterResponse(responseText);
      return cleanCoverLetterMarkdown(parsed.content);
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
