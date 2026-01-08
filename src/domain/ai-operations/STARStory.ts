/**
 * STAR Story entity - re-exports types from Lambda function
 * @see amplify/data/ai-operations/generateStarStory.ts
 */

import type {
  GenerateStarStoryInput,
  GenerateStarStoryOutput,
} from '@amplify/data/ai-operations/generateStarStory';

// Re-export Lambda types with frontend-friendly names
export type GenerateStoryInput = GenerateStarStoryInput;
export type STARStory = GenerateStarStoryOutput;

/**
 * Type guard to validate STARStory structure
 */
export function isSTARStory(data: unknown): data is STARStory {
  if (typeof data !== 'object' || data === null) return false;

  const story = data as Record<string, unknown>;

  return (
    typeof story.title === 'string' &&
    typeof story.situation === 'string' &&
    typeof story.task === 'string' &&
    typeof story.action === 'string' &&
    typeof story.result === 'string'
  );
}
