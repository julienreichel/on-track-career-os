/**
 * PersonalCanvas entity - re-exports types from Lambda function
 * @see amplify/data/ai-operations/generatePersonalCanvas.ts
 */

import type {
  PersonalCanvasInput,
  PersonalCanvasOutput,
} from '@amplify/data/ai-operations/generatePersonalCanvas';

// Re-export Lambda types with frontend-friendly names
export type { PersonalCanvasInput };
export type PersonalCanvas = PersonalCanvasOutput;

/**
 * Validates that an object is a valid PersonalCanvas
 */
export function isPersonalCanvas(obj: unknown): obj is PersonalCanvas {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const typed = obj as Record<string, unknown>;

  const requiredArrayFields: (keyof PersonalCanvas)[] = [
    'valueProposition',
    'keyActivities',
    'strengthsAdvantage',
    'targetRoles',
    'channels',
    'resources',
    'careerDirection',
    'painRelievers',
    'gainCreators',
  ];

  return requiredArrayFields.every(
    (field) =>
      Array.isArray(typed[field]) && typed[field].every((item: unknown) => typeof item === 'string')
  );
}
