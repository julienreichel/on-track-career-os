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
    Array.isArray(candidate.reasoningHighlights) &&
    Array.isArray(candidate.strengthsForThisRole) &&
    Array.isArray(candidate.skillMatch) &&
    Array.isArray(candidate.riskyPoints) &&
    Array.isArray(candidate.impactOpportunities) &&
    Array.isArray(candidate.tailoringTips);

  return (
    arraysValid &&
    typeof candidate.overallScore === 'number' &&
    typeof candidate.scoreBreakdown === 'object' &&
    typeof candidate.recommendation === 'string' &&
    typeof candidate.generatedAt === 'string' &&
    typeof candidate.needsUpdate === 'boolean'
  );
}
