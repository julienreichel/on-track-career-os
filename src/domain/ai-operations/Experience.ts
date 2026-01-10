/**
 * Experience entity - re-exports types from Lambda function
 * @see amplify/data/ai-operations/extractExperienceBlocks.ts
 */

import type {
  ExperienceBlock,
  ExtractExperienceBlocksInput,
} from '@amplify/data/ai-operations/extractExperienceBlocks';

// Re-export Lambda types with frontend-friendly names
export type ExtractExperienceInput = ExtractExperienceBlocksInput;
export type ExtractedExperience = ExperienceBlock;
export type ExperiencesResult = ExperienceBlock[];

/**
 * Type guard to validate ExperiencesResult structure
 */
export function isExperiencesResult(data: unknown): data is ExperiencesResult {
  if (!Array.isArray(data)) return false;

  return data.every((exp) => {
    const e = exp as Record<string, unknown>;
    return (
      typeof e.title === 'string' &&
      typeof e.companyName === 'string' &&
      typeof e.startDate === 'string' &&
      Array.isArray(e.responsibilities) &&
      Array.isArray(e.tasks)
    );
  });
}
