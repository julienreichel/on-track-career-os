import { invokeAiWithRetry } from './utils/bedrock';
import { truncateForLog, withAiOperationHandler } from './utils/common';

/**
 * AWS Lambda handler for ai.extractExperienceBlocks
 *
 * PURPOSE:
 * Transform raw CV experience text into structured Experience entities.
 * Extract: title, company, dates, responsibilities, tasks.
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
Extract: title, company, dates, responsibilities, tasks & achievements, and experience type.
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
const OUTPUT_SCHEMA = `{
  "experiences": [
    {
      "title": "string",
      "company": "string",
      "startDate": "YYYY-MM-DD or YYYY-MM",
      "endDate": "YYYY-MM-DD or YYYY-MM or null",
      "responsibilities": ["string"],
      "tasks": ["string"],
      "experienceType": "work | education | volunteer | project"
    }
  ]
}`;

// Experience block interface (matches output schema)
export interface ExperienceBlock {
  title: string;
  company: string;
  startDate: string;
  endDate: string | null;
  responsibilities: string[];
  tasks: string[];
  experienceType: 'work' | 'education' | 'volunteer' | 'project';
}

export interface ExtractExperienceBlocksOutput {
  experiences: ExperienceBlock[];
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

Return a JSON object with this exact structure:
${OUTPUT_SCHEMA}`;
}

/**
 * Validate output and apply fallback rules per AIC
 */
function validateOutput(output: unknown): ExtractExperienceBlocksOutput {
  if (!output || typeof output !== 'object') {
    throw new Error('Output must be an object');
  }

  const outputObj = output as Record<string, unknown>;

  // Apply fallback if experiences field is missing or invalid
  if (!outputObj.experiences || !Array.isArray(outputObj.experiences)) {
    return {
      experiences: [
        {
          title: 'Experience 1',
          company: 'Unknown Company',
          startDate: '',
          endDate: null,
          responsibilities: [],
          tasks: [],
          experienceType: 'work' as const,
        },
      ],
    };
  }

  // Validate and clean each experience block
  const validatedExperiences: ExperienceBlock[] = outputObj.experiences.map(
    (exp: unknown, index: number) => {
      const expObj = exp as Record<string, unknown>;

      // Required fields with fallbacks
      const title = typeof expObj.title === 'string' ? expObj.title : `Experience ${index + 1}`;
      const company = typeof expObj.company === 'string' ? expObj.company : 'Unknown Company';
      // Support both camelCase and snake_case from AI response
      const startDate =
        typeof expObj.startDate === 'string'
          ? expObj.startDate
          : typeof expObj.start_date === 'string'
            ? expObj.start_date
            : '';
      const endDate =
        expObj.endDate === null || typeof expObj.endDate === 'string'
          ? expObj.endDate
          : expObj.end_date === null || typeof expObj.end_date === 'string'
            ? expObj.end_date
            : null;

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
        company,
        startDate,
        endDate,
        responsibilities: responsibilities.filter(
          (r: unknown) => typeof r === 'string'
        ) as string[],
        tasks: tasks.filter((t: unknown) => typeof t === 'string') as string[],
        experienceType,
      };
    }
  );

  return {
    experiences: validatedExperiences,
  };
}

/**
 * Main Lambda handler
 */
export const handler = async (event: {
  arguments: ExtractExperienceBlocksInput;
}): Promise<string> => {
  return withAiOperationHandler(
    'extractExperienceBlocks',
    event,
    async (args: ExtractExperienceBlocksInput) => {
      const userPrompt = buildUserPrompt(args.experienceTextBlocks);
      return invokeAiWithRetry<ExtractExperienceBlocksOutput>({
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
