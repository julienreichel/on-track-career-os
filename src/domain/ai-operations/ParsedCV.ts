/**
 * ParsedCV entity - re-exports types from Lambda function
 * @see amplify/data/ai-operations/parseCvText.ts
 */

import type { ParseCvTextInput, ParseCvTextOutput } from '@amplify/data/ai-operations/parseCvText';

// Re-export Lambda types with frontend-friendly names
export type ParseCvInput = ParseCvTextInput;
export type ParsedCV = ParseCvTextOutput;

export type ParsedCvExperienceType = 'work' | 'education' | 'volunteer' | 'project';

/**
 * Type guard to validate ParsedCV structure
 */
export function isParsedCV(data: unknown): data is ParsedCV {
  if (typeof data !== 'object' || data === null) return false;

  const cv = data as Record<string, unknown>;

  if (!cv.profile || typeof cv.profile !== 'object') return false;
  if (!Array.isArray(cv.experienceItems)) return false;
  if (!Array.isArray(cv.rawBlocks)) return false;
  if (typeof cv.confidence !== 'number') return false;
  if (typeof cv.isCv !== 'boolean') return false;
  if (typeof cv.errorMessage !== 'string') return false;

  const profile = cv.profile as Record<string, unknown>;
  const stringFields = [
    'fullName',
    'headline',
    'location',
    'seniorityLevel',
    'primaryEmail',
    'primaryPhone',
    'workPermitInfo',
  ];
  const arrayFields = [
    'socialLinks',
    'aspirations',
    'personalValues',
    'strengths',
    'interests',
    'skills',
    'certifications',
    'languages',
  ];

  const hasStringFields = stringFields.every((key) => typeof profile[key] === 'string');
  const hasArrayFields = arrayFields.every((key) => Array.isArray(profile[key]));
  const hasExperienceItems = cv.experienceItems.every(
    (item) =>
      item &&
      typeof item === 'object' &&
      typeof (item as Record<string, unknown>).experienceType === 'string' &&
      typeof (item as Record<string, unknown>).rawBlock === 'string'
  );

  return hasStringFields && hasArrayFields && hasExperienceItems;
}
