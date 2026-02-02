/**
 * Experience entity - re-exports types from Lambda function
 * @see amplify/data/ai-operations/extractExperienceBlocks.ts
 */

import type {
  ExtractExperienceBlocksInput,
  ExtractExperienceBlocksOutput,
  ExtractedExperience as ExtractedExperienceOutput,
  ExperienceItemInput as ExperienceItemInputOutput,
} from '@amplify/data/ai-operations/extractExperienceBlocks';

// Re-export Lambda types with frontend-friendly names
export type ExtractExperienceInput = ExtractExperienceBlocksInput;
export type ExperiencesResult = ExtractExperienceBlocksOutput;
export type ExtractedExperience = ExtractedExperienceOutput;
export type ExperienceItemInput = ExperienceItemInputOutput;

/**
 * Type guard to validate ExperiencesResult structure
 */
export function isExperiencesResult(data: unknown): data is ExperiencesResult {
  if (typeof data !== 'object' || data === null) return false;
  const result = data as Record<string, unknown>;
  if (!Array.isArray(result.experiences)) return false;

  const validStatuses = new Set(['draft', 'complete']);
  const validTypes = new Set(['work', 'education', 'volunteer', 'project']);

  return result.experiences.every((exp) => {
    const e = exp as Record<string, unknown>;
    return (
      typeof e.title === 'string' &&
      typeof e.companyName === 'string' &&
      typeof e.startDate === 'string' &&
      typeof e.endDate === 'string' &&
      Array.isArray(e.responsibilities) &&
      Array.isArray(e.tasks) &&
      typeof e.status === 'string' &&
      validStatuses.has(e.status) &&
      typeof e.experienceType === 'string' &&
      validTypes.has(e.experienceType)
    );
  });
}
