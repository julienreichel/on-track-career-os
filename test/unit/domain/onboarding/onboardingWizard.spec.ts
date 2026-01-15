import { describe, it, expect } from 'vitest';
import {
  getRequiredOnboardingStep,
  clampOnboardingStep,
  getOnboardingStepIndex,
} from '@/domain/onboarding';
import type { ProgressCheckResult, UserProgressState } from '@/domain/onboarding';

const buildCheck = (missing: ProgressCheckResult['missing']): ProgressCheckResult => ({
  isComplete: missing.length === 0,
  missing,
  reasonKeys: [],
});

const buildState = (phase1Missing: ProgressCheckResult['missing']): UserProgressState => ({
  phase: phase1Missing.length === 0 ? 'phase2' : 'phase1',
  phase1: buildCheck(phase1Missing),
  phase2A: buildCheck([]),
  phase2B: buildCheck([]),
  phase3: buildCheck([]),
});

describe('onboardingWizard', () => {
  it('requires CV upload when cv is missing', () => {
    const state = buildState(['cvUploaded']);
    expect(getRequiredOnboardingStep(state)).toBe('cv-upload');
  });

  it('requires experience review when experiences are missing', () => {
    const state = buildState(['experienceCount']);
    expect(getRequiredOnboardingStep(state)).toBe('experience-review');
  });

  it('requires profile basics when only profile basics are missing', () => {
    const state = buildState(['profileBasics']);
    expect(getRequiredOnboardingStep(state)).toBe('profile-basics');
  });

  it('marks onboarding complete when phase 1 is complete', () => {
    const state = buildState([]);
    expect(getRequiredOnboardingStep(state)).toBe('complete');
  });

  it('clamps desired step to required step', () => {
    expect(clampOnboardingStep('complete', 'experience-review')).toBe('experience-review');
  });

  it('returns the index for a known step', () => {
    expect(getOnboardingStepIndex('profile-basics')).toBe(2);
  });
});
