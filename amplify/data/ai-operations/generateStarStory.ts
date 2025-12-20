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
[Give the story a resume-friendly headline in 3-5 words. Use active verbs and summarize the impact (e.g., "Cut MTTR 60%", "Led Cloud Migration"). Never exceed 6 words.]

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

const CODE_FENCE_LENGTH = 3;
const MIN_TITLE_SENTENCE_LENGTH = 10;
const MAX_TITLE_LENGTH = 80;
const TITLE_TRUNCATION_LENGTH = 77;
const TITLE_ELLIPSIS = '…';
const INLINE_TITLE_REGEX =
  /^##\s+(?!title:)(?!situation:)(?!task:)(?!action:)(?!result:)([^\n#]+)$/gim;

export interface GenerateStarStoryInput {
  sourceText: string;
}

/**
 * Extract text between markers
 */
function cleanSectionText(value: string): string {
  if (!value) {
    return '';
  }

  let cleaned = value.trim();

  // Remove surrounding markdown fences/backticks/brackets/quotes if AI wrapped the content
  if (cleaned.startsWith('```') && cleaned.endsWith('```')) {
    cleaned = cleaned.slice(CODE_FENCE_LENGTH, -CODE_FENCE_LENGTH).trim();
  }

  if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  cleaned = cleaned.replace(/^`+/, '').replace(/`+$/, '');
  cleaned = cleaned.replace(/^"+/, '').replace(/"+$/, '');
  cleaned = cleaned.replace(/^'+/, '').replace(/'+$/, '');

  // Remove trailing markdown separators like --- or ***
  cleaned = cleaned.replace(/(\n|\s)*[-*_]{3,}\s*$/g, '').trim();

  // Normalize markdown emphasis markers (**bold**, *italic*, __bold__, _italic_)
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1');
  cleaned = cleaned.replace(/\*(.*?)\*/g, '$1');
  cleaned = cleaned.replace(/__(.*?)__/g, '$1');
  cleaned = cleaned.replace(/_(.*?)_/g, '$1');

  return cleaned;
}

function extractSection(text: string, startMarker: string, endMarker?: string): string {
  const regex = endMarker
    ? new RegExp(`${startMarker}\\s*(.*?)${endMarker}`, 'is')
    : new RegExp(`${startMarker}\\s*(.*?)(?:##|$)`, 'is');

  const match = text.match(regex);
  return cleanSectionText(match?.[1] ?? '');
}

function cleanTitleSection(value: string): string {
  const cleaned = cleanSectionText(value);
  if (!cleaned) return cleaned;

  const subtitleRegex = /(\n|\s)*\*\*/;
  const subtitleMatchIndex = cleaned.search(subtitleRegex);
  if (subtitleMatchIndex >= 0) {
    return cleaned.slice(0, subtitleMatchIndex).trim();
  }

  const newlineIndex = cleaned.indexOf('\n');
  if (newlineIndex >= 0) {
    return cleaned.slice(0, newlineIndex).trim();
  }

  return cleaned;
}

function normalizeInlineTitleHeadings(input: string): string {
  return input.replace(INLINE_TITLE_REGEX, (_, heading: string) => {
    const trimmedHeading = heading.trim();

    const lineBreakIndex = trimmedHeading.search(/\s*\*\*/);
    const cleanHeading =
      lineBreakIndex >= 0 ? trimmedHeading.slice(0, lineBreakIndex).trim() : trimmedHeading;

    return `## title: ${cleanHeading}`;
  });
}

/**
 * Parse AI text response into structured STAR stories
 */
function getFirstSentence(text: string): string {
  if (!text) return '';

  const sentenceMatch = text.match(/(.+?[.?!])(\s|$)/s);
  if (sentenceMatch && sentenceMatch[1]) {
    return sentenceMatch[1].trim();
  }

  return text.trim();
}

function inferTitleFromStory(story: GenerateStarStoryOutput): string {
  const candidates = [
    getFirstSentence(story.result),
    getFirstSentence(story.action),
    getFirstSentence(story.situation),
  ].filter((candidate) => candidate.length > 0);

  const preferred = candidates.find((candidate) => candidate.length >= MIN_TITLE_SENTENCE_LENGTH);
  const fallback = preferred || candidates[0] || 'Untitled STAR story';

  return fallback.length > MAX_TITLE_LENGTH
    ? `${fallback.slice(0, TITLE_TRUNCATION_LENGTH)}${TITLE_ELLIPSIS}`
    : fallback;
}

function parseStarStoriesFromText(aiText: string): GenerateStarStoryOutput[] {
  const normalizedText = normalizeInlineTitleHeadings(aiText);
  const stories: GenerateStarStoryOutput[] = [];
  const trimmedText = normalizedText.trim();
  const hasTitleMarkers = /##\s*title:/i.test(trimmedText);
  const blockPattern = hasTitleMarkers ? /(?=##\s*title:)/i : /(?=##\s*situation:)/i;

  const storyBlocks = trimmedText
    .split(blockPattern)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  for (const block of storyBlocks) {
    const story: GenerateStarStoryOutput = {
      title: cleanTitleSection(extractSection(block, '##\\s*title:', '##\\s*situation:')),
      situation: extractSection(block, '##\\s*situation:', '##\\s*task:'),
      task: extractSection(block, '##\\s*task:', '##\\s*action:'),
      action: extractSection(block, '##\\s*action:', '##\\s*result:'),
      result: extractSection(block, '##\\s*result:'),
    };

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
      if (!story.title) {
        story.title = inferTitleFromStory(story);
      }

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
