import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  type InvokeModelCommandInput,
} from '@aws-sdk/client-bedrock-runtime';

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

// Configuration
const BEDROCK_MODEL_ID = process.env.MODEL_ID || 'amazon.nova-lite-v1:0';
const BEDROCK_REGION = process.env.AWS_REGION || 'us-east-1';
const MAX_TOKENS = 4000;
const INITIAL_TEMPERATURE = 0.3; // Deterministic parsing
const RETRY_TEMPERATURE = 0.1; // Even more deterministic on retry

// Logging constants
const MAX_LOG_LENGTH = 100;
const LOG_PREFIX = 'AI Operation: extractExperienceBlocks';
const LOG_ERROR_PREFIX = 'AI Operation Error: extractExperienceBlocks';

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
 * Main Lambda handler
 */
export const handler = async (event: { arguments: InputSchema }) => {
  const { experience_text_blocks } = event.arguments;

  // Log input (truncated)
  const truncatedInput =
    experience_text_blocks.length > 1
      ? `${experience_text_blocks.length} experience blocks`
      : experience_text_blocks[0]?.substring(0, MAX_LOG_LENGTH) + '...';

  console.log(LOG_PREFIX, {
    timestamp: new Date().toISOString(),
    input: { experience_text_blocks: truncatedInput },
  });

  try {
    // Build user prompt from input
    const userPrompt = buildUserPrompt(experience_text_blocks);

    // First attempt
    let responseText = await invokeBedrock(userPrompt, MAX_TOKENS, INITIAL_TEMPERATURE);

    // Extract JSON from potential markdown wrappers
    responseText = extractJson(responseText);

    // Try to parse
    let parsedOutput: OutputSchema;
    try {
      parsedOutput = JSON.parse(responseText);
    } catch (parseError) {
      // Retry with explicit schema
      console.error(LOG_ERROR_PREFIX, {
        timestamp: new Date().toISOString(),
        error: (parseError as Error).message,
        input: { experience_text_blocks: truncatedInput },
      });

      parsedOutput = await retryWithSchema(userPrompt);
    }

    // Validate and apply fallbacks
    const validatedOutput = validateOutput(parsedOutput);

    console.log(LOG_PREFIX, {
      timestamp: new Date().toISOString(),
      input: { experience_text_blocks: truncatedInput },
      output: {
        experienceCount: validatedOutput.experiences.length,
      },
      fallbacksUsed: parsedOutput !== validatedOutput ? ['validation_fallbacks'] : [],
    });

    return validatedOutput;
  } catch (error) {
    console.error(LOG_ERROR_PREFIX, {
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
      input: { experience_text_blocks: truncatedInput },
    });
    throw error;
  }
};

/**
 * Build user prompt from experience text blocks
 */
function buildUserPrompt(blocks: string[]): string {
  const blocksText = blocks.map((block, index) => `[Experience ${index + 1}]\n${block}`).join('\n\n');

  return `Convert the following CV experience sections into experience blocks:

${blocksText}

Return a JSON object with this exact structure:
{
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
}

/**
 * Invoke Bedrock model with given prompt
 */
async function invokeBedrock(
  userPrompt: string,
  maxTokens: number,
  temperature: number
): Promise<string> {
  const input: InvokeModelCommandInput = {
    modelId: BEDROCK_MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: userPrompt }],
        },
      ],
      max_tokens: maxTokens,
      temperature,
    }),
  };

  const client = new BedrockRuntimeClient({ region: BEDROCK_REGION });
  const command = new InvokeModelCommand(input);
  const response = await client.send(command);

  if (!response.body) {
    throw new Error('Empty response from Bedrock');
  }

  const responseBody = JSON.parse(new TextDecoder().decode(response.body));

  if (!responseBody.content || !responseBody.content[0]?.text) {
    throw new Error('Invalid response structure from Bedrock');
  }

  return responseBody.content[0].text;
}

/**
 * Extract JSON from markdown code blocks if present
 */
function extractJson(text: string): string {
  // Remove markdown JSON wrapper if present
  const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  if (jsonMatch) {
    return jsonMatch[1];
  }
  return text.trim();
}

/**
 * Retry with explicit schema when initial parse fails
 */
async function retryWithSchema(userPrompt: string): Promise<OutputSchema> {
  const retryPrompt = `${userPrompt}

CRITICAL: Return ONLY valid JSON matching this exact schema:
{
  "experiences": [
    {
      "title": "string",
      "company": "string", 
      "start_date": "string",
      "end_date": "string or null",
      "responsibilities": ["string"],
      "tasks": ["string"]
    }
  ]
}

No explanations. No markdown. Just pure JSON.`;

  const responseText = await invokeBedrock(retryPrompt, MAX_TOKENS, RETRY_TEMPERATURE);
  const cleanedText = extractJson(responseText);

  try {
    const parsed = JSON.parse(cleanedText);
    console.log(LOG_PREFIX, '(retry successful)', {
      timestamp: new Date().toISOString(),
      fallbacksUsed: ['retry_with_schema'],
    });
    return parsed;
  } catch (error) {
    throw new Error(`Failed to parse JSON after retry: ${(error as Error).message}`);
  }
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
