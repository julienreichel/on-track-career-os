import { invokeBedrock } from './utils/bedrock';
import { truncateForLog, withAiOperationHandlerObject } from './utils/common';
import { formatAiInputContext } from './utils/promptFormat';
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

Return a single Markdown document with exactly three H2 sections:

## Elevator Pitch
... Target ~120 words, 5-7 sentences ...

## Career Story
... Target ~360 words, 3-5 paragraphs ...

## Why Me
...  target ~240 words, 2-3 paragraphs ...

Do not add other H2 sections. Do not use code fences.

Write natural-flow. 

IMPORTANT: The structure is guidance only (no headings for it):
Decor -> Parcours -> Expertise (STAR-style) -> Training -> Project -> Me -> Question.
Keep the narrative coherent and natural.

Formatting is allowed when helpful (paragraphs, bold/italics, bullets). Career Story
should usually contain multiple paragraphs.

Tailoring rules:
- If jobDescription is provided, align to the role needs even if matchingSummary is missing.
- If only matchingSummary is provided, stay generic but emphasize relevant strengths.
- Use company context only when jobDescription exists or company is provided; keep it summary-level framing.

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
- natural narrative flow

Word counts are targets, not strict limits. End each section with an opening question.`;

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

type TailoringContext = {
  jobDescription: JobDescription | null;
  matchingSummary: MatchingSummaryContext | null;
  company: CompanyProfile | null;
};

type HandlerEvent = {
  arguments: GenerateSpeechInput;
};

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

${formatAiInputContext({
  language: args.language,
  profile: args.profile,
  experiences: args.experiences,
  stories,
  personalCanvas: args.personalCanvas,
  jobDescription,
  matchingSummary,
  company,
})}

Output guidance (targets, not strict limits):
- elevatorPitch: ~45-60s, target ~120 words, 5-7 sentences, end with an opening question.
- careerStory: ~2-3 min, target ~360 words, 3-5 paragraphs, include 1-2 STAR-style proofs.
- whyMe: ~1-2 min, target ~240 words, "their problem -> my proof -> fit -> opening question".

Make the fil rouge explicit: focus on 2-3 recurring patterns across experience, avoid
chronological date-by-date recital. Prefer "I've repeatedly..." over "In 2018...".

Markdown formatting is allowed (paragraphs, bold/italics, bullets). 

Career Story should use 3-5 paragraphs (blank lines) or bullets where helpful.

Return a single Markdown document with exactly three H2 sections:

## Elevator Pitch
... Target ~120 words, 5-7 sentences ...

## Career Story
... Target ~360 words, 3-5 paragraphs ...

## Why Me
... Target ~240 words, 2-3 paragraphs ...

Do not add other H2 sections. Do not use code fences. End each section with an opening question.`;
}

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

function parseSpeechMarkdown(raw: string): GenerateSpeechOutput | null {
  const normalized = normalizeMarkdown(raw);
  const elevatorPitch = extractMarkdownSection(normalized, 'Elevator Pitch');
  const careerStory = extractMarkdownSection(normalized, 'Career Story');
  const whyMe = extractMarkdownSection(normalized, 'Why Me');

  if (!elevatorPitch || !careerStory || !whyMe) {
    return null;
  }

  return sanitizeSpeechOutput({
    elevatorPitch,
    careerStory,
    whyMe,
  });
}

function extractMarkdownSection(markdown: string, heading: string): string | null {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^##\\s+${escapedHeading}\\s*\\n([\\s\\S]*?)(?=^##\\s+|$)`, 'm');
  const match = markdown.match(pattern);
  if (!match?.[1]) {
    return null;
  }
  return stripTrailingNoise(match[1]);
}

function normalizeMarkdown(markdown: string): string {
  return markdown
    .split('\n')
    .filter((line) => !line.trim().startsWith('```'))
    .join('\n')
    .trim();
}

function stripTrailingNoise(section: string): string {
  const lines = section.split('\n');
  const dividerIndex = lines.findIndex((line) => line.trim() === '---');
  const trimmedLines = dividerIndex === -1 ? lines : lines.slice(0, dividerIndex);
  return trimmedLines.join('\n').trim();
}

function buildRepairPrompt(previousOutput: string): string {
  return `You returned invalid format. Please return Markdown with exactly the three required headings
and provide content for each. Fix formatting only, do not add new content.

Previous output:
${previousOutput}`;
}

function buildFallbackOutputFromText(): GenerateSpeechOutput {
  return sanitizeSpeechOutput({
    elevatorPitch: '',
    careerStory: '',
    whyMe: '',
  });
}

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
        const responseText = await invokeBedrock({
          systemPrompt: SYSTEM_PROMPT,
          userPrompt,
          operationName: 'generateSpeech',
        });
        const parsed = parseSpeechMarkdown(responseText);

        if (parsed) {
          return parsed;
        }

        const repairPrompt = buildRepairPrompt(responseText);
        const repairedText = await invokeBedrock({
          systemPrompt: SYSTEM_PROMPT,
          userPrompt: repairPrompt,
          operationName: 'generateSpeech_repair',
        });
        const repairedParsed = parseSpeechMarkdown(repairedText);

        if (repairedParsed) {
          return repairedParsed;
        }

        console.error('generateSpeech markdown parse failed after repair', {
          reason: 'missing required sections',
        });
        return buildFallbackOutputFromText();
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
