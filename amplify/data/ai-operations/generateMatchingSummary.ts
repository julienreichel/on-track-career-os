import { invokeAiWithRetry } from './utils/bedrock';
import { truncateForLog, withAiOperationHandlerObject } from './utils/common';

const SYSTEM_PROMPT = `You are an impartial talent-matching analyst.
Compare the structured user profile, personal canvas, experiences, and job description.
Ground every statement in the provided JSON. Never invent companies, metrics, or skills.
Respond ONLY with JSON matching the schema. Arrays must contain concise bullet strings (<=20 words).
Return empty strings/arrays when data is missing.`;

const OUTPUT_SCHEMA = `{
  "userFitScore": 82,
  "summaryParagraph": "string",
  "impactAreas": ["string"],
  "contributionMap": ["string"],
  "riskMitigationPoints": ["string"]
}`;

const MAX_LIST_ITEMS = 8;
const SCORE_MIN = 0;
const SCORE_MAX = 100;
const PROMPT_INDENT_SPACES = 2;

export interface MatchingExperienceSignal {
  title: string;
  companyName?: string;
  startDate?: string;
  endDate?: string;
  responsibilities?: string[];
  tasks?: string[];
  achievements?: string[];
  kpiSuggestions?: string[];
}

export interface MatchingUserProfile {
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
}

export interface MatchingPersonalCanvas {
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

export interface MatchingExperienceSignals {
  experiences: MatchingExperienceSignal[];
}

export interface MatchingJobDescription {
  title: string;
  seniorityLevel?: string;
  roleSummary?: string;
  responsibilities?: string[];
  requiredSkills?: string[];
  behaviours?: string[];
  successCriteria?: string[];
  explicitPains?: string[];
}

export interface MatchingCompanyProfile {
  companyName: string;
  industry?: string;
  sizeRange?: string;
  website?: string;
  description?: string;
}

export interface MatchingCompanyPayload {
  companyProfile?: MatchingCompanyProfile;
  companyCanvas?: Record<string, unknown>;
}

export interface GenerateMatchingSummaryInput {
  user: {
    profile: MatchingUserProfile;
    personalCanvas?: MatchingPersonalCanvas;
    experienceSignals?: MatchingExperienceSignals;
  };
  job: MatchingJobDescription;
  company?: MatchingCompanyPayload;
}

export interface GenerateMatchingSummaryOutput {
  userFitScore?: number;
  impactAreas: string[];
  contributionMap: string[];
  riskMitigationPoints: string[];
  summaryParagraph: string;
  generatedAt: string;
  needsUpdate: boolean;
}

type ModelResponse = Partial<GenerateMatchingSummaryOutput>;

function sanitizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizeArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  const seen = new Set<string>();
  const list: string[] = [];
  for (const entry of value) {
    const text = sanitizeString(entry);
    if (text && !seen.has(text)) {
      seen.add(text);
      list.push(text);
    }
    if (list.length === MAX_LIST_ITEMS) {
      break;
    }
  }
  return list;
}

function sanitizeScore(value: unknown) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return undefined;
  }
  return Math.max(SCORE_MIN, Math.min(SCORE_MAX, value));
}

function finalizeOutput(raw: ModelResponse, { fallback }: { fallback: boolean }): GenerateMatchingSummaryOutput {
  const now = new Date().toISOString();
  const summaryParagraph = sanitizeString(raw.summaryParagraph);
  const base: GenerateMatchingSummaryOutput = {
    summaryParagraph,
    impactAreas: sanitizeArray(raw.impactAreas),
    contributionMap: sanitizeArray(raw.contributionMap),
    riskMitigationPoints: sanitizeArray(raw.riskMitigationPoints),
    generatedAt: now,
    needsUpdate: fallback,
  };

  const score = sanitizeScore(raw.userFitScore);
  if (typeof score === 'number') {
    base.userFitScore = score;
  }

  if (!fallback) {
    base.needsUpdate = false;
  }

  return base;
}

function buildFallbackOutput(): GenerateMatchingSummaryOutput {
  return finalizeOutput(
    {
      summaryParagraph: '',
      impactAreas: [],
      contributionMap: [],
      riskMitigationPoints: [],
    },
    { fallback: true }
  );
}

function buildUserPrompt(args: GenerateMatchingSummaryInput) {
  return `You must analyze the structured JSON below and produce a deterministic matching summary.
Use only the provided values. Highlight fit, contributions, and risks.
Each list item should be a short bullet (<=20 words). Never invent context.

INPUT:
${JSON.stringify(args, null, PROMPT_INDENT_SPACES)}

Return ONLY JSON matching this schema:
${OUTPUT_SCHEMA}`;
}

type HandlerEvent = {
  arguments: {
    user: unknown;
    job: unknown;
    company?: unknown;
  };
};

function parseInput(args: HandlerEvent['arguments']): GenerateMatchingSummaryInput {
  return {
    user: args.user as GenerateMatchingSummaryInput['user'],
    job: args.job as GenerateMatchingSummaryInput['job'],
    company: args.company as GenerateMatchingSummaryInput['company'],
  };
}

export const handler = async (event: HandlerEvent) => {
  if (!event?.arguments) {
    throw new Error('arguments are required');
  }

  const normalizedArgs = parseInput(event.arguments);

  return withAiOperationHandlerObject(
    'generateMatchingSummary',
    { arguments: normalizedArgs },
    async (args) => {
      const userPrompt = buildUserPrompt(args);

      try {
        const response = await invokeAiWithRetry<ModelResponse>({
          systemPrompt: SYSTEM_PROMPT,
          userPrompt,
          outputSchema: OUTPUT_SCHEMA,
          validate: (raw) => finalizeOutput(raw ?? {}, { fallback: false }),
          operationName: 'generateMatchingSummary',
        });

        return response;
      } catch (error) {
        console.error('generateMatchingSummary fallback triggered', {
          reason: (error as Error).message,
        });
        return buildFallbackOutput();
      }
    },
    (args) => ({
      userName: args.user?.profile?.fullName,
      jobTitle: args.job?.title,
      hasCompany: Boolean(args.company),
      experienceCount: args.user?.experienceSignals?.experiences?.length ?? 0,
      jobSignalsPreview: truncateForLog(JSON.stringify(args.job)),
    })
  );
};
