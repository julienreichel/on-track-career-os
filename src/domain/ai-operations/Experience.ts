/**
 * Experience entity - re-exports types from Lambda function
 * @see amplify/data/ai-operations/extractExperienceBlocks.ts
 */

import type {
  ExperienceBlock,
  ExtractExperienceBlocksOutput,
} from '@amplify/data/ai-operations/extractExperienceBlocks';

// Re-export Lambda types with frontend-friendly names
export type ExtractedExperience = ExperienceBlock;
export type ExperiencesResult = ExtractExperienceBlocksOutput;

/**
 * Type guard to validate ExperiencesResult structure
 */
export function isExperiencesResult(data: unknown): data is ExperiencesResult {
  if (typeof data !== 'object' || data === null) return false;

  const result = data as Record<string, unknown>;

  return (
    Array.isArray(result.experiences) &&
    result.experiences.every((exp) => {
      const e = exp as Record<string, unknown>;
      return (
        typeof e.title === 'string' &&
        typeof e.company === 'string' &&
        typeof e.startDate === 'string' &&
        Array.isArray(e.responsibilities) &&
        Array.isArray(e.tasks)
      );
    })
  );
}
