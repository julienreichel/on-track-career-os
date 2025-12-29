/**
 * ParsedJobDescription entity - re-export Lambda output type
 * @see amplify/data/ai-operations/parseJobDescription.ts
 */

import type { ParseJobDescriptionOutput } from '@amplify/data/ai-operations/parseJobDescription';

export type ParsedJobDescription = ParseJobDescriptionOutput;

/**
 * Runtime validation to ensure AI output matches contract
 */
export function isParsedJobDescription(data: unknown): data is ParsedJobDescription {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const job = data as Record<string, unknown>;

  const arrayFields: Array<keyof ParsedJobDescription> = [
    'responsibilities',
    'requiredSkills',
    'behaviours',
    'successCriteria',
    'explicitPains',
  ];

  return (
    typeof job.title === 'string' &&
    typeof job.seniorityLevel === 'string' &&
    typeof job.roleSummary === 'string' &&
    arrayFields.every((field) => Array.isArray(job[field]))
  );
}
