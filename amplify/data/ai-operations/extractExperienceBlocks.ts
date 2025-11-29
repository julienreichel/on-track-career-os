import { invokeBedrock, retryWithSchema } from './utils/bedrock';
import { extractJson, truncateForLog } from './utils/common';

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
Extract: title, company, dates, responsibilities, tasks.
Never infer seniority or technologies not present.
Return JSON only.

RULES:
- Extract only information explicitly stated in the text
- Do not invent or infer missing details
- Dates should be in YYYY-MM-DD format or YYYY-MM if day is not specified
- If end_date is "Present" or missing, leave it null
- Responsibilities are high-level duties
- Tasks are specific actions or deliverables
- Return ONLY valid JSON with no markdown wrappers`;

// Output schema for retry
const OUTPUT_SCHEMA = `{
  "experiences": [
    {
      "title": "string",
      "company": "string",
      "start_date": "YYYY-MM-DD or YYYY-MM",
      "end_date": "YYYY-MM-DD or YYYY-MM or null",
      "responsibilities": ["string"],
      "tasks": ["string"]
    }
  ]
}`;

// Experience block interface (matches output schema)
interface ExperienceBlock {
  title: string;
  company: string;
  start_date: string;
  end_date: string | null;
  responsibilities: string[];
  tasks: string[];
}

interface OutputSchema {
  experiences: ExperienceBlock[];
}

interface InputSchema {
  experience_text_blocks: string[];
}

/**
 * Build user prompt from experience text blocks
 */
function buildUserPrompt(blocks: string[]): string {
  const blocksText = blocks.map((block, index) => `[Experience ${index + 1}]\n${block}`).join('\n\n');

  return `Convert the following CV experience sections into experience blocks:

${blocksText}

Return a JSON object with this exact structure:
${OUTPUT_SCHEMA}`;
}

/**
 * Validate output and apply fallback rules per AIC
 */
function validateOutput(output: unknown): OutputSchema {
  if (!output || typeof output !== 'object') {
    throw new Error('Output must be an object');
  }

  const outputObj = output as Record<string, unknown>;

  if (!outputObj.experiences) {
    throw new Error('Missing required field: experiences');
  }

  if (!Array.isArray(outputObj.experiences)) {
    throw new Error('Field "experiences" must be an array');
  }

  // Validate and clean each experience block
  const validatedExperiences: ExperienceBlock[] = outputObj.experiences.map(
    (exp: unknown, index: number) => {
      const expObj = exp as Record<string, unknown>;

      // Required fields with fallbacks
      const title = typeof expObj.title === 'string' ? expObj.title : `Experience ${index + 1}`;
      const company = typeof expObj.company === 'string' ? expObj.company : 'Unknown Company';
      const start_date = typeof expObj.start_date === 'string' ? expObj.start_date : '';
      const end_date =
        expObj.end_date === null || typeof expObj.end_date === 'string' ? expObj.end_date : null;

      // Array fields with fallbacks
      const responsibilities = Array.isArray(expObj.responsibilities) ? expObj.responsibilities : [];
      const tasks = Array.isArray(expObj.tasks) ? expObj.tasks : [];

      return {
        title,
        company,
        start_date,
        end_date,
        responsibilities: responsibilities.filter((r: unknown) => typeof r === 'string') as string[],
        tasks: tasks.filter((t: unknown) => typeof t === 'string') as string[],
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
export const handler = async (event: { arguments: InputSchema }): Promise<OutputSchema> => {
  const { experience_text_blocks } = event.arguments;

  // Log input (truncated)
  const truncatedInput =
    experience_text_blocks.length > 1
      ? `${experience_text_blocks.length} experience blocks`
      : truncateForLog(experience_text_blocks[0] || '');

  console.log('AI Operation: extractExperienceBlocks', {
    timestamp: new Date().toISOString(),
    input: { experience_text_blocks: truncatedInput },
  });

  try {
    // Build user prompt from input
    const userPrompt = buildUserPrompt(experience_text_blocks);

    // First attempt
    let responseText = await invokeBedrock(SYSTEM_PROMPT, userPrompt);

    // Extract JSON from potential markdown wrappers
    responseText = extractJson(responseText);

    // Try to parse
    let parsedOutput: OutputSchema;
    try {
      parsedOutput = JSON.parse(responseText);
    } catch (parseError) {
      // Retry with explicit schema
      console.error('AI Operation Error: extractExperienceBlocks', {
        timestamp: new Date().toISOString(),
        error: (parseError as Error).message,
        input: { experience_text_blocks: truncatedInput },
      });

      parsedOutput = await retryWithSchema<OutputSchema>(
        SYSTEM_PROMPT,
        userPrompt,
        OUTPUT_SCHEMA
      );

      console.log('AI Operation: extractExperienceBlocks (retry successful)', {
        timestamp: new Date().toISOString(),
        fallbacksUsed: ['retry_with_schema'],
      });
    }

    // Validate and apply fallbacks
    const validatedOutput = validateOutput(parsedOutput);

    console.log('AI Operation: extractExperienceBlocks', {
      timestamp: new Date().toISOString(),
      input: { experience_text_blocks: truncatedInput },
      output: {
        experienceCount: validatedOutput.experiences.length,
      },
      fallbacksUsed: parsedOutput !== validatedOutput ? ['validation_fallbacks'] : [],
    });

    return validatedOutput;
  } catch (error) {
    console.error('AI Operation Error: extractExperienceBlocks', {
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
      input: { experience_text_blocks: truncatedInput },
    });
    throw error;
  }
};
