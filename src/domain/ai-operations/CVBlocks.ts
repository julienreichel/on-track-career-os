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
