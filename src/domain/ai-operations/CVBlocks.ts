/**
 * CV Block Types
 *
 * Re-exports Amplify-generated types from the Lambda function.
 * These types are auto-generated from the Lambda's TypeScript interfaces.
 *
 * @see amplify/data/ai-operations/generateCvBlocks.ts
 * @see docs/AI_Interaction_Contract.md - Operation 11 (generateCvBlocks)
 */

export type {
  SectionType,
  CVSection,
  GenerateCvBlocksOutput,
  UserProfileInput,
  ExperienceInput,
  StoryInput,
  GenerateCvBlocksInput,
} from '@amplify/data/ai-operations/generateCvBlocks';

// Alias for consistency with other AI operations
export type { GenerateCvBlocksOutput as CVBlocksResult } from '@amplify/data/ai-operations/generateCvBlocks';

/**
 * Type guard to validate CVBlocksResult structure
 */
export function isCVBlocksResult(data: unknown): data is CVBlocksResult {
  if (typeof data !== 'object' || data === null) return false;

  const result = data as Record<string, unknown>;

  if (!Array.isArray(result.sections)) return false;

  // Validate each section has required fields
  return result.sections.every((section: unknown) => {
    if (typeof section !== 'object' || section === null) return false;
    const s = section as Record<string, unknown>;
    return typeof s.type === 'string' && typeof s.content === 'string';
  });
}
