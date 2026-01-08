/**
 * ParsedCV entity - re-exports types from Lambda function
 * @see amplify/data/ai-operations/parseCvText.ts
 */

import type { ParseCvTextInput, ParseCvTextOutput } from '@amplify/data/ai-operations/parseCvText';

// Re-export Lambda types with frontend-friendly names
export type ParseCvInput = ParseCvTextInput;
export type ParsedCV = ParseCvTextOutput;

/**
 * Type guard to validate ParsedCV structure
 */
export function isParsedCV(data: unknown): data is ParsedCV {
  if (typeof data !== 'object' || data === null) return false;

  const cv = data as Record<string, unknown>;

  if (!cv.sections || typeof cv.sections !== 'object') return false;
  if (!cv.profile || typeof cv.profile !== 'object') return false;

  const sections = cv.sections as Record<string, unknown>;

  return (
    Array.isArray(sections.experiences) &&
    Array.isArray(sections.education) &&
    Array.isArray(sections.skills) &&
    Array.isArray(sections.certifications) &&
    Array.isArray(sections.rawBlocks) &&
    typeof cv.confidence === 'number'
  );
}
