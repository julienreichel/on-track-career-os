import { describe, it, expect } from 'vitest';
import { getNextAction } from '@/domain/onboarding';
import type { UserProgressState } from '@/domain/onboarding';

const baseState = (overrides: Partial<UserProgressState> = {}): UserProgressState => ({
  phase: 'phase1',
  phase1: { isComplete: false, missing: ['cvUploaded'] },
  phase2B: { isComplete: false, missing: ['profileDepth'] },
  phase2A: { isComplete: false, missing: ['jobUploaded'] },
  phase3: { isComplete: false, missing: ['tailoredCv'] },
  ...overrides,
});

describe('getNextAction', () => {
  it('returns CV upload as primary when phase 1 is incomplete', () => {
    const action = getNextAction(baseState());
    expect(action.primary.id).toBe('upload-cv');
    expect(action.primary.to).toBe('/profile/cv-upload');
  });

  it('returns profile depth when phase 2A is incomplete', () => {
    const state = baseState({
      phase: 'phase2',
      phase1: { isComplete: true, missing: [] },
      phase2B: { isComplete: false, missing: ['profileDepth'] },
      phase2A: { isComplete: true, missing: [] },
    });
    const action = getNextAction(state);
    expect(action.primary.id).toBe('profile-depth');
  });

  it('returns job upload when phase 2B is incomplete', () => {
    const state = baseState({
      phase: 'phase2',
      phase1: { isComplete: true, missing: [] },
      phase2B: { isComplete: true, missing: [] },
      phase2A: { isComplete: false, missing: ['jobUploaded'] },
    });
    const action = getNextAction(state);
    expect(action.primary.id).toBe('upload-job');
  });

  it('returns tailored materials CTA for phase 3', () => {
    const state = baseState({
      phase: 'phase3',
      phase1: { isComplete: true, missing: [] },
      phase2B: { isComplete: true, missing: [] },
      phase2A: { isComplete: true, missing: [] },
      phase3: { isComplete: false, missing: ['tailoredCv'] },
    });
    const action = getNextAction(state);
    expect(action.primary.id).toBe('tailor-materials');
  });

  it('returns bonus CTA when all phases complete', () => {
    const state = baseState({
      phase: 'bonus',
      phase1: { isComplete: true, missing: [] },
      phase2B: { isComplete: true, missing: [] },
      phase2A: { isComplete: true, missing: [] },
      phase3: { isComplete: true, missing: [] },
    });
    const action = getNextAction(state);
    expect(action.primary.id).toBe('optimize-materials');
  });
});
