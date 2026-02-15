/**
 * Application strength evaluation types
 * @see amplify/data/ai-operations/evaluateApplicationStrength.ts
 */

import type {
  EvaluateApplicationStrengthInput as LambdaEvaluateApplicationStrengthInput,
  EvaluateApplicationStrengthOutput as LambdaEvaluateApplicationStrengthOutput,
} from '@amplify/data/ai-operations/evaluateApplicationStrength';

export type EvaluateApplicationStrengthInput = LambdaEvaluateApplicationStrengthInput;
export type ApplicationStrengthResult = LambdaEvaluateApplicationStrengthOutput;
const SCORE_MIN = 0;
const SCORE_MAX = 100;

function hasIntegerScore(value: unknown): boolean {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= SCORE_MIN &&
    value <= SCORE_MAX
  );
}

function hasValidDimensions(value: ApplicationStrengthResult['dimensionScores'] | undefined): boolean {
  return Boolean(
    value &&
      hasIntegerScore(value.atsReadiness) &&
      hasIntegerScore(value.clarityFocus) &&
      hasIntegerScore(value.targetedFitSignals) &&
      hasIntegerScore(value.evidenceStrength)
  );
}

function hasValidDecision(value: ApplicationStrengthResult['decision'] | undefined): boolean {
  return Boolean(
    value &&
      typeof value.label === 'string' &&
      typeof value.readyToApply === 'boolean' &&
      Array.isArray(value.rationaleBullets)
  );
}

function hasValidNotes(value: ApplicationStrengthResult['notes'] | undefined): boolean {
  return Boolean(value && Array.isArray(value.atsNotes) && Array.isArray(value.humanReaderNotes));
}

export function isApplicationStrengthResult(value: unknown): value is ApplicationStrengthResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as ApplicationStrengthResult;

  return (
    hasIntegerScore(candidate.overallScore) &&
    hasValidDimensions(candidate.dimensionScores) &&
    hasValidDecision(candidate.decision) &&
    Array.isArray(candidate.missingSignals) &&
    Array.isArray(candidate.topImprovements) &&
    hasValidNotes(candidate.notes)
  );
}
