import { invokeAiWithRetry } from './utils/bedrock';
import { truncateForLog, withAiOperationHandlerObject } from './utils/common';

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
- atsKeywords (string[])

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
- atsKeywords = important keywords and phrases that ATS (Applicant Tracking Systems) would look for (skills, tools, technologies, certifications, industry terms).
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
  "atsKeywords": ["string"]
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
  atsKeywords: string[];
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

function validateOutput(parsed: Partial<ParseJobDescriptionOutput>): ParseJobDescriptionOutput {
  const title = sanitizeString(parsed.title);
  const seniorityLevel = sanitizeString(parsed.seniorityLevel);
  const roleSummary = sanitizeString(parsed.roleSummary);
  const responsibilities = sanitizeStringArray(parsed.responsibilities);
  const requiredSkills = sanitizeStringArray(parsed.requiredSkills);
  const behaviours = sanitizeStringArray(parsed.behaviours);
  const successCriteria = sanitizeStringArray(parsed.successCriteria);
  const explicitPains = sanitizeStringArray(parsed.explicitPains);
  const atsKeywords = sanitizeStringArray(parsed.atsKeywords);

  return {
    title,
    seniorityLevel,
    roleSummary,
    responsibilities,
    requiredSkills,
    behaviours,
    successCriteria,
    explicitPains,
    atsKeywords,
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

export const handler = async (event: {
  arguments: ParseJobDescriptionInput;
}): Promise<ParseJobDescriptionOutput> => {
  return withAiOperationHandlerObject(
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
