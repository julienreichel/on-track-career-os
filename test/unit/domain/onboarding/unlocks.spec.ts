import { describe, it, expect } from 'vitest';
import { getUnlockableFeatures } from '@/domain/onboarding';
import type { UserProgressState } from '@/domain/onboarding';

const baseState = (overrides: Partial<UserProgressState> = {}): UserProgressState => ({
  phase: 'phase1',
  phase1: { isComplete: false, missing: ['cvUploaded'] },
  phase2B: { isComplete: false, missing: ['profileDepth'] },
  phase2A: { isComplete: false, missing: ['jobUploaded'] },
  phase3: { isComplete: false, missing: ['tailoredCv'] },
  ...overrides,
});

describe('getUnlockableFeatures', () => {
  it('keeps phase 2 locked until phase 1 completes', () => {
    const unlocks = getUnlockableFeatures(baseState());
    expect(unlocks.phase2Enabled).toBe(false);
    expect(unlocks.phase3Enabled).toBe(false);
    expect(unlocks.bonusEnabled).toBe(false);
  });

  it('unlocks phase 2 when phase 1 completes', () => {
    const unlocks = getUnlockableFeatures(
      baseState({
        phase1: { isComplete: true, missing: [] },
      })
    );
    expect(unlocks.phase2Enabled).toBe(true);
    expect(unlocks.phase3Enabled).toBe(false);
  });

  it('unlocks phase 3 when phase 2A and 2B complete', () => {
    const unlocks = getUnlockableFeatures(
      baseState({
        phase1: { isComplete: true, missing: [] },
        phase2A: { isComplete: true, missing: [] },
        phase2B: { isComplete: true, missing: [] },
      })
    );
    expect(unlocks.phase3Enabled).toBe(true);
    expect(unlocks.bonusEnabled).toBe(false);
  });

  it('unlocks bonus when phase 3 completes', () => {
    const unlocks = getUnlockableFeatures(
      baseState({
        phase1: { isComplete: true, missing: [] },
        phase2A: { isComplete: true, missing: [] },
        phase2B: { isComplete: true, missing: [] },
        phase3: { isComplete: true, missing: [] },
      })
    );
    expect(unlocks.bonusEnabled).toBe(true);
  });
});
