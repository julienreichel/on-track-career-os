import { invokeAiWithRetry } from './utils/bedrock';
import { truncateForLog, withAiOperationHandlerObject } from './utils/common';

/**
 * AWS Lambda handler for ai.extractExperienceBlocks
 *
 * PURPOSE:
 * Transform raw CV experience text into structured Experience entities.
 * Extract: title, companyName, dates, responsibilities, tasks.
 *
 * CONTRACT:
 * - Never infer seniority or technologies not present in the text
 * - Return ONLY structured JSON
 * - Use fallback strategies for missing/malformed fields
 *
 * @see docs/AI_Interaction_Contract.md - Operation 2
 */

// System prompt - constant as per AIC
const SYSTEM_PROMPT = `You transform experience text into structured experience blocks.
Extract: title, companyName, dates, responsibilities, tasks & achievements, and experience type.
Never infer seniority or technologies not present.
Return JSON only.

RULES:
- Extract only information explicitly stated in the text
- Do not invent or infer missing details
- Dates should be in YYYY-MM-DD format or YYYY-MM if day is not specified
- If endDate is "Present" or missing, leave it null
- Responsibilities are high-level duties and roles
- Tasks include specific actions, deliverables, achievements, and measurable results
- Tasks should capture accomplishments, metrics, and outcomes (e.g., "Increased sales by 30%", "Led team of 5 developers")
- experienceType must be one of: "work", "education", "volunteer", "project"
  - "work": Professional employment experiences
  - "education": Schools, universities, degrees, certifications
  - "volunteer": Volunteering, community service, non-profit work
  - "project": Personal or side projects, freelance work
- Default to "work" if the type is ambiguous
- Return ONLY valid JSON with no markdown wrappers`;

// Output schema for retry
const OUTPUT_SCHEMA = `[
  {
    "title": "string",
    "companyName": "string",
    "startDate": "YYYY-MM-DD or YYYY-MM",
    "endDate": "YYYY-MM-DD or YYYY-MM or null",
    "responsibilities": ["string"],
    "tasks": ["string"],
    "experienceType": "work | education | volunteer | project"
  }
]`;

// Experience block interface (matches output schema)
export interface ExperienceBlock {
  title: string;
  companyName: string;
  startDate: string;
  endDate: string | null;
  responsibilities: string[];
  tasks: string[];
  experienceType: 'work' | 'education' | 'volunteer' | 'project';
}

export interface ExtractExperienceBlocksInput {
  experienceTextBlocks: string[];
}

/**
 * Build user prompt from experience text blocks
 */
function buildUserPrompt(blocks: string[]): string {
  const blocksText = blocks
    .map((block, index) => `[Experience ${index + 1}]\n${block}`)
    .join('\n\n');

  return `Convert the following CV experience sections into experience blocks:

${blocksText}

IMPORTANT:
- Responsibilities: High-level duties and roles
- Tasks: Specific actions, deliverables, achievements, and measurable results (e.g., "Increased sales by 30%", "Managed team of 5", "Delivered project ahead of schedule")

Return a JSON array with this exact structure:
${OUTPUT_SCHEMA}`;
}

/**
 * Normalize date to YYYY-MM-DD format
 * Handles YYYY-MM format by adding -01 for the day
 */
function normalizeDate(date: string | null): string | null {
  if (date === null || date === '') {
    return null;
  }

  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  // YYYY-MM format - add -01 for first day of month
  if (/^\d{4}-\d{2}$/.test(date)) {
    return `${date}-01`;
  }

  // Invalid format - return null
  return null;
}

/**
 * Validate output and apply fallback rules per AIC
 */
function validateOutput(output: unknown): ExperienceBlock[] {
  if (!Array.isArray(output)) {
    return [
      {
        title: 'Experience 1',
        companyName: 'Unknown Company',
        startDate: '2020-01-01',
        endDate: null,
        responsibilities: [],
        tasks: [],
        experienceType: 'work' as const,
      },
    ];
  }

  // Validate and clean each experience block
  const validatedExperiences: ExperienceBlock[] = output.map((exp: unknown, index: number) => {
      const expObj = exp as Record<string, unknown>;

      // Required fields with fallbacks
      const title = typeof expObj.title === 'string' ? expObj.title : `Experience ${index + 1}`;
      const companyName =
        typeof expObj.companyName === 'string'
          ? expObj.companyName
          : typeof expObj.company === 'string'
            ? expObj.company
            : 'Unknown Company';
      // Support both camelCase and snake_case from AI response
      const rawStartDate =
        typeof expObj.startDate === 'string'
          ? expObj.startDate
          : typeof expObj.start_date === 'string'
            ? expObj.start_date
            : '';
      const rawEndDate =
        expObj.endDate === null || typeof expObj.endDate === 'string'
          ? expObj.endDate
          : expObj.end_date === null || typeof expObj.end_date === 'string'
            ? expObj.end_date
            : null;

      // Normalize dates to YYYY-MM-DD format
      const startDate = normalizeDate(rawStartDate) || '';
      const endDate = normalizeDate(rawEndDate);

      // Array fields with fallbacks
      const responsibilities = Array.isArray(expObj.responsibilities)
        ? expObj.responsibilities
        : [];
      const tasks = Array.isArray(expObj.tasks) ? expObj.tasks : [];

      // experienceType field with validation and fallback
      const expType =
        typeof expObj.experienceType === 'string'
          ? expObj.experienceType
          : typeof expObj.experience_type === 'string'
            ? expObj.experience_type
            : 'work';
      const validTypes: Array<'work' | 'education' | 'volunteer' | 'project'> = [
        'work',
        'education',
        'volunteer',
        'project',
      ];
      const experienceType = validTypes.includes(
        expType as 'work' | 'education' | 'volunteer' | 'project'
      )
        ? (expType as 'work' | 'education' | 'volunteer' | 'project')
        : 'work';

      return {
        title,
        companyName,
        startDate,
        endDate,
        responsibilities: responsibilities.filter(
          (r: unknown) => typeof r === 'string'
        ) as string[],
        tasks: tasks.filter((t: unknown) => typeof t === 'string') as string[],
        experienceType,
      };
  });

  if (validatedExperiences.length === 0) {
    return [
      {
        title: 'Experience 1',
        companyName: 'Unknown Company',
        startDate: '2020-01-01',
        endDate: null,
        responsibilities: [],
        tasks: [],
        experienceType: 'work' as const,
      },
    ];
  }

  return validatedExperiences;
}

/**
 * Main Lambda handler
 */
export const handler = async (event: {
  arguments: ExtractExperienceBlocksInput;
}): Promise<ExperienceBlock[]> => {
  return withAiOperationHandlerObject(
    'extractExperienceBlocks',
    event,
    async (args: ExtractExperienceBlocksInput) => {
      const userPrompt = buildUserPrompt(args.experienceTextBlocks);
      return invokeAiWithRetry<ExperienceBlock[]>({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        outputSchema: OUTPUT_SCHEMA,
        validate: validateOutput,
        operationName: 'extractExperienceBlocks',
      });
    },
    (args: ExtractExperienceBlocksInput) => ({
      experienceTextBlocks:
        args.experienceTextBlocks.length > 1
          ? `${args.experienceTextBlocks.length} experience blocks`
          : truncateForLog(args.experienceTextBlocks[0] || ''),
    })
  );
};
