import { invokeBedrock, retryWithSchema } from './utils/bedrock';
import { extractJson, truncateForLog } from './utils/common';

/**
 * AWS Lambda handler for ai.generateStarStory
 *
 * PURPOSE:
 * Convert user experience content into a structured STAR story
 * (Situation, Task, Action, Result).
 *
 * CONTRACT:
 * - Follow user's words closely
 * - Never invent missing details
 * - Return ONLY structured JSON
 *
 * @see docs/AI_Interaction_Contract.md - Operation 3
 */

// System prompt - constant as per AIC
const SYSTEM_PROMPT = `You create STAR stories (Situation, Task, Action, Result).
Follow the user's words closely. Do not invent missing details.
Return JSON only.`;

// Output schema for retry
const OUTPUT_SCHEMA = `{
  "situation": "string",
  "task": "string",
  "action": "string",
  "result": "string"
}`;

// Type definitions matching AI Interaction Contract
export interface GenerateStarStoryOutput {
  situation: string;
  task: string;
  action: string;
  result: string;
}

export interface GenerateStarStoryInput {
  sourceText: string;
}

/**
 * Validate and apply fallback rules from AIC
 */
function validateOutput(
  parsedOutput: Partial<GenerateStarStoryOutput>
): GenerateStarStoryOutput {
  return {
    situation:
      typeof parsedOutput.situation === 'string' && parsedOutput.situation.trim()
        ? parsedOutput.situation
        : 'No situation provided',
    task:
      typeof parsedOutput.task === 'string' && parsedOutput.task.trim()
        ? parsedOutput.task
        : 'No task provided',
    action:
      typeof parsedOutput.action === 'string' && parsedOutput.action.trim()
        ? parsedOutput.action
        : 'No action provided',
    result:
      typeof parsedOutput.result === 'string' && parsedOutput.result.trim()
        ? parsedOutput.result
        : 'No result provided',
  };
}

/**
 * Build user prompt from source text
 */
function buildUserPrompt(sourceText: string): string {
  return `Generate a STAR story based on this input:
${sourceText}`;
}

/**
 * Main Lambda handler
 */
export const handler = async (event: { arguments: GenerateStarStoryInput }): Promise<string> => {
  const { sourceText } = event.arguments;
  const truncatedInput = truncateForLog(sourceText);

  console.log('AI Operation: generateStarStory', {
    timestamp: new Date().toISOString(),
    input: { source_text: truncatedInput },
  });

  try {
    // Build user prompt
    const userPrompt = buildUserPrompt(sourceText);

    // Initial attempt
    let responseText = await invokeBedrock(SYSTEM_PROMPT, userPrompt);

    // Extract JSON from potential markdown wrappers
    responseText = extractJson(responseText);

    // Try to parse
    let parsedOutput: GenerateStarStoryOutput;
    try {
      parsedOutput = JSON.parse(responseText);
    } catch (parseError) {
      // Retry with explicit schema
      console.error('AI Operation Error: generateStarStory', {
        timestamp: new Date().toISOString(),
        error: (parseError as Error).message,
        input: { source_text: truncatedInput },
      });

      parsedOutput = await retryWithSchema<GenerateStarStoryOutput>(
        SYSTEM_PROMPT,
        userPrompt,
        OUTPUT_SCHEMA
      );

      console.log('AI Operation: generateStarStory (retry successful)', {
        timestamp: new Date().toISOString(),
        fallbacksUsed: ['retry_with_schema'],
      });
    }

    // Validate and apply fallbacks
    const validatedOutput = validateOutput(parsedOutput);

    console.log('AI Operation: generateStarStory', {
      timestamp: new Date().toISOString(),
      input: { source_text: truncatedInput },
      output: validatedOutput,
      fallbacksUsed: [],
    });

    return JSON.stringify(validatedOutput);
  } catch (error) {
    console.error('AI Operation Error: generateStarStory', {
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
      input: { source_text: truncatedInput },
    });
    throw error;
  }
};
