import { invokeAiWithRetry } from './utils/bedrock';
import { truncateForLog, withAiOperationHandler } from './utils/common';

/**
 * AWS Lambda handler for ai.parseJobDescription
 *
 * PURPOSE:
 * Extract a structured JobDescription entity from raw job text while keeping a strict 1:1 mapping
 * with our domain model.
 *
 * CONTRACT:
 * - Never invent information — only use content explicitly present in the job text
 * - Return ONLY structured JSON (no markdown or prose)
 * - Provide sane fallbacks for missing data (empty strings / arrays)
 *
 * @see docs/AI_Interaction_Contract.md - Operation 6
 */

const DEFAULT_CONFIDENCE = 0.6;
const LOW_CONFIDENCE_THRESHOLD = 0.25;

const SYSTEM_PROMPT = `You are a hiring analyst that extracts structured job description data.
Return ONLY JSON matching the contract for the JobDescription model.

MANDATORY FIELDS:
- title (string)
- seniorityLevel (string)
- roleSummary (string)
- responsibilities (string[])
- requiredSkills (string[])
- behaviours (string[])
- successCriteria (string[])
- explicitPains (string[])
- aiConfidenceScore (number between 0 and 1)

RULES:
- Extract ONLY information explicitly present in the job description.
- If a value is missing, return "" for strings or [] for arrays.
- Seniority level MUST be taken from explicit wording (e.g., "Senior", "Lead", "Director").
- roleSummary is a short 1-2 sentence synthesis of what the job focuses on (using only present info).
- responsibilities = day-to-day tasks or ownership areas.
- requiredSkills = hard or soft skills explicitly mentioned.
- behaviours = attitudes/mindsets explicitly requested (e.g., ownership, collaboration, curiosity).
- successCriteria = measurable outcomes or expectations.
- explicitPains = problems or challenges the company is trying to solve.
- No markdown, explanations, or additional commentary.`;

const OUTPUT_SCHEMA = `{
  "title": "string",
  "seniorityLevel": "string",
  "roleSummary": "string",
  "responsibilities": ["string"],
  "requiredSkills": ["string"],
  "behaviours": ["string"],
  "successCriteria": ["string"],
  "explicitPains": ["string"],
  "aiConfidenceScore": 0.85
}`;

export interface ParseJobDescriptionInput {
  jobText: string;
}

export interface ParseJobDescriptionOutput {
  title: string;
  seniorityLevel: string;
  roleSummary: string;
  responsibilities: string[];
  requiredSkills: string[];
  behaviours: string[];
  successCriteria: string[];
  explicitPains: string[];
  aiConfidenceScore: number;
}

function sanitizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0);
}

function clampConfidence(value: unknown): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return DEFAULT_CONFIDENCE;
  }

  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function applyConfidenceFallback(
  parsed: Partial<ParseJobDescriptionOutput>,
  hasContent: boolean
): number {
  const confidence = clampConfidence(parsed.aiConfidenceScore);
  return hasContent ? confidence : Math.min(confidence, LOW_CONFIDENCE_THRESHOLD);
}

function validateOutput(parsed: Partial<ParseJobDescriptionOutput>): ParseJobDescriptionOutput {
  const title = sanitizeString(parsed.title);
  const seniorityLevel = sanitizeString(parsed.seniorityLevel);
  const roleSummary = sanitizeString(parsed.roleSummary);
  const responsibilities = sanitizeStringArray(parsed.responsibilities);
  const requiredSkills = sanitizeStringArray(parsed.requiredSkills);
  const behaviours = sanitizeStringArray(parsed.behaviours);
  const successCriteria = sanitizeStringArray(parsed.successCriteria);
  const explicitPains = sanitizeStringArray(parsed.explicitPains);

  const hasContent =
    Boolean(title || seniorityLevel || roleSummary) ||
    responsibilities.length > 0 ||
    requiredSkills.length > 0 ||
    behaviours.length > 0 ||
    successCriteria.length > 0 ||
    explicitPains.length > 0;

  const aiConfidenceScore = applyConfidenceFallback(parsed, hasContent);

  return {
    title,
    seniorityLevel,
    roleSummary,
    responsibilities,
    requiredSkills,
    behaviours,
    successCriteria,
    explicitPains,
    aiConfidenceScore,
  };
}

function buildUserPrompt(jobText: string): string {
  return `Extract a structured JobDescription object from the following job post.

Job Description:
${jobText}

Return ONLY JSON with this exact schema:
${OUTPUT_SCHEMA}

Remember: do not invent data and leave strings empty or arrays empty if not mentioned.`;
}

export const handler = async (event: { arguments: ParseJobDescriptionInput }): Promise<string> => {
  return withAiOperationHandler(
    'parseJobDescription',
    event,
    async (args) => {
      const userPrompt = buildUserPrompt(args.jobText);

      return invokeAiWithRetry<ParseJobDescriptionOutput>({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        outputSchema: OUTPUT_SCHEMA,
        validate: validateOutput,
        operationName: 'parseJobDescription',
      });
    },
    (args) => ({
      jobText: truncateForLog(args.jobText),
    })
  );
};
