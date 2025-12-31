/**
 * Matching summary generation types
 * @see amplify/data/ai-operations/generateMatchingSummary.ts
 */

import type {
  GenerateMatchingSummaryInput as LambdaMatchingSummaryInput,
  GenerateMatchingSummaryOutput as LambdaMatchingSummaryOutput,
} from '@amplify/data/ai-operations/generateMatchingSummary';

export type MatchingSummaryInput = LambdaMatchingSummaryInput;
export type MatchingSummaryResult = LambdaMatchingSummaryOutput;

export function isMatchingSummaryResult(value: unknown): value is MatchingSummaryResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as MatchingSummaryResult;
  const arraysValid =
    Array.isArray(candidate.impactAreas) &&
    Array.isArray(candidate.contributionMap) &&
    Array.isArray(candidate.riskMitigationPoints);

  return (
    arraysValid &&
    typeof candidate.summaryParagraph === 'string' &&
    typeof candidate.generatedAt === 'string' &&
    typeof candidate.needsUpdate === 'boolean'
  );
}
