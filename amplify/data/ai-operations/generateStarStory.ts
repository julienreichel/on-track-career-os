import { invokeBedrock } from './utils/bedrock';
import { truncateForLog, withAiOperationHandler } from './utils/common';

/**
 * AWS Lambda handler for ai.generateStarStory
 *
 * PURPOSE:
 * Convert user experience content into one or more structured STAR stories
 * (Situation, Task, Action, Result).
 *
 * CONTRACT:
 * - AI generates text with markdown-style headers (## situation:, ## task:, etc.)
 * - Lambda parses text and extracts structured JSON
 * - Can complete missing information if needed
 * - Returns array of STAR stories
 *
 * @see docs/AI_Interaction_Contract.md - Operation 3
 */

// System prompt - updated to generate multiple stories in text format
const SYSTEM_PROMPT = `You extract STAR stories (Situation, Task, Action, Result) from experience descriptions.
You may generate ONE OR MORE stories if the experience contains multiple achievements.
You may complete missing information with reasonable inferences based on context.

Format your response as plain text using this structure for EACH story:

## situation:
[Description of the context/challenge]

## task:
[What needed to be done]

## action:
[Specific actions taken]

## result:
[Outcome/impact achieved]

If there are multiple distinct achievements or situations, repeat this structure for each one.
Be concise but specific. Use the user's words when available.`;

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
 * Extract text between markers
 */
function extractSection(text: string, startMarker: string, endMarker?: string): string {
  const regex = endMarker
    ? new RegExp(`${startMarker}\\s*(.*?)${endMarker}`, 'is')
    : new RegExp(`${startMarker}\\s*(.*?)(?:##|$)`, 'is');

  const match = text.match(regex);
  return match?.[1]?.trim() || '';
}

/**
 * Parse AI text response into structured STAR stories
 */
function parseStarStoriesFromText(aiText: string): GenerateStarStoryOutput[] {
  const stories: GenerateStarStoryOutput[] = [];

  // Split by ## situation: to find individual stories
  const storyBlocks = aiText.split(/##\s*situation:/i).filter((block) => block.trim());

  for (const block of storyBlocks) {
    const story: GenerateStarStoryOutput = {
      situation: extractSection(block, '^', '##\\s*task:') || 'No situation provided',
      task: extractSection(block, '##\\s*task:', '##\\s*action:') || 'No task provided',
      action: extractSection(block, '##\\s*action:', '##\\s*result:') || 'No action provided',
      result: extractSection(block, '##\\s*result:') || 'No result provided',
    };

    // Only add stories that have at least some content (not all fallbacks)
    const hasContent =
      story.situation !== 'No situation provided' ||
      story.task !== 'No task provided' ||
      story.action !== 'No action provided' ||
      story.result !== 'No result provided';

    if (hasContent) {
      stories.push(story);
    }
  }

  // Fallback: if no stories found, return single placeholder story
  if (stories.length === 0) {
    stories.push({
      situation: 'Unable to extract situation from text',
      task: 'Unable to extract task from text',
      action: 'Unable to extract action from text',
      result: 'Unable to extract result from text',
    });
  }

  return stories;
}

/**
 * Build user prompt from source text
 */
function buildUserPrompt(sourceText: string): string {
  return `Extract STAR stories from this experience:

${sourceText}

Remember to use the format with ## headers for each section, and create separate stories if there are multiple distinct achievements.`;
}

/**
 * Custom invoke function that returns text instead of JSON
 * Uses direct invokeBedrock instead of invokeAiWithRetry since we expect text, not JSON
 */
async function invokeAiForText(systemPrompt: string, userPrompt: string): Promise<string> {
  return invokeBedrock(systemPrompt, userPrompt);
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

      // Get text response from AI
      const aiText = await invokeAiForText(SYSTEM_PROMPT, userPrompt);

      // Parse text into structured stories
      const stories = parseStarStoriesFromText(aiText);

      // Return array directly (withAiOperationHandler will stringify it)
      return stories;
    },
    (args) => ({
      sourceText: truncateForLog(args.sourceText),
    })
  );
};
