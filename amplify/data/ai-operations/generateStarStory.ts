import { invokeAiWithRetry } from './utils/bedrock';
import { truncateForLog, withAiOperationHandler } from './utils/common';

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
function validateOutput(parsedOutput: Partial<GenerateStarStoryOutput>): GenerateStarStoryOutput {
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
  return withAiOperationHandler(
    'generateStarStory',
    event,
    async (args) => {
      const userPrompt = buildUserPrompt(args.sourceText);
      return invokeAiWithRetry<GenerateStarStoryOutput>({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        outputSchema: OUTPUT_SCHEMA,
        validate: validateOutput,
        operationName: 'generateStarStory',
      });
    },
    (args) => ({
      source_text: truncateForLog(args.sourceText),
    })
  );
};
