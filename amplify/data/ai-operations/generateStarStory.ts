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
const SYSTEM_PROMPT = `You extract STAR stories (Title, Situation, Task, Action, Result) from experience descriptions.
You may generate ONE OR MORE stories if the experience contains multiple achievements.
You may complete missing information with reasonable inferences based on context.

IMPORTANT: Write all stories in FIRST PERSON perspective using "I" pronouns.
- Use "I did", "I developed", "I led" - NOT "The individual did" or "The lead developer did"
- Write as if the user is telling their own story directly
- Keep the personal narrative voice throughout

Format your response as plain text using this structure for EACH story:

## title:
[Give the story a short resume-friendly headline]

## situation:
[Description of the context/challenge - use "I was", "I faced", etc.]

## task:
[What needed to be done - use "I needed to", "I had to", etc.]

## action:
[Specific actions taken - use "I implemented", "I created", etc.]

## result:
[Outcome/impact achieved - use "I achieved", "I delivered", etc.]

If there are multiple distinct achievements or situations, repeat this structure for each one.
Be concise but specific. Use the user's words when available.`;

// Type definitions matching AI Interaction Contract
export interface GenerateStarStoryOutput {
  title: string;
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
function inferTitleFromSituation(situation: string): string {
  if (!situation) {
    return 'Untitled STAR story';
  }

  const firstSentence = situation.split(/[\n.]/).find((segment) => segment.trim().length > 0);
  if (firstSentence) {
    const trimmed = firstSentence.trim();
    return trimmed.length > 80 ? `${trimmed.slice(0, 77)}…` : trimmed;
  }

  return 'Untitled STAR story';
}

function parseStarStoriesFromText(aiText: string): GenerateStarStoryOutput[] {
  const stories: GenerateStarStoryOutput[] = [];
  const trimmedText = aiText.trim();
  const hasTitleMarkers = /##\s*title:/i.test(trimmedText);
  const blockPattern = hasTitleMarkers ? /(?=##\s*title:)/i : /(?=##\s*situation:)/i;

  const storyBlocks = trimmedText
    .split(blockPattern)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  for (const block of storyBlocks) {
    const story: GenerateStarStoryOutput = {
      title: extractSection(block, '##\\s*title:', '##\\s*situation:'),
      situation: extractSection(block, '##\\s*situation:', '##\\s*task:'),
      task: extractSection(block, '##\\s*task:', '##\\s*action:'),
      action: extractSection(block, '##\\s*action:', '##\\s*result:'),
      result: extractSection(block, '##\\s*result:'),
    };

    if (!story.title) {
      story.title = inferTitleFromSituation(story.situation);
    }

    if (!story.situation) {
      story.situation = 'No situation provided';
    }
    if (!story.task) {
      story.task = 'No task provided';
    }
    if (!story.action) {
      story.action = 'No action provided';
    }
    if (!story.result) {
      story.result = 'No result provided';
    }

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
      title: 'Untitled STAR story',
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

Remember to use the format with ## headers for each section, include a concise ## title:, and create separate stories if there are multiple distinct achievements.`;
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
