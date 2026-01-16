import { describe, it, expect } from 'vitest';
import { getNextAction } from '@/domain/onboarding';
import type { UserProgressState } from '@/domain/onboarding';

const baseState = (overrides: Partial<UserProgressState> = {}): UserProgressState => ({
  phase: 'phase1',
  phase1: { isComplete: false, missing: ['cvUploaded'], reasonKeys: [] },
  phase2B: { isComplete: false, missing: ['profileDepth'], reasonKeys: [] },
  phase2A: { isComplete: false, missing: ['jobUploaded'], reasonKeys: [] },
  phase3: { isComplete: false, missing: ['tailoredCv'], reasonKeys: [] },
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
      phase1: { isComplete: true, missing: [], reasonKeys: [] },
      phase2B: { isComplete: false, missing: ['profileDepth'], reasonKeys: [] },
      phase2A: { isComplete: true, missing: [], reasonKeys: [] },
    });
    const action = getNextAction(state);
    expect(action.primary.id).toBe('profile-depth');
    expect(action.secondary.length).toBeGreaterThan(0);
  });

  it('returns job upload when phase 2B is incomplete', () => {
    const state = baseState({
      phase: 'phase2',
      phase1: { isComplete: true, missing: [], reasonKeys: [] },
      phase2B: { isComplete: true, missing: [], reasonKeys: [] },
      phase2A: { isComplete: false, missing: ['jobUploaded'], reasonKeys: [] },
    });
    const action = getNextAction(state);
    expect(action.primary.id).toBe('upload-job');
  });

  it('returns tailored materials CTA for phase 3', () => {
    const state = baseState({
      phase: 'phase3',
      phase1: { isComplete: true, missing: [], reasonKeys: [] },
      phase2B: { isComplete: true, missing: [], reasonKeys: [] },
      phase2A: { isComplete: true, missing: [], reasonKeys: [] },
      phase3: { isComplete: false, missing: ['tailoredCv'], reasonKeys: [] },
    });
    const action = getNextAction(state);
    expect(action.primary.id).toBe('tailor-materials');
  });

  it('returns bonus CTA when all phases complete', () => {
    const state = baseState({
      phase: 'bonus',
      phase1: { isComplete: true, missing: [], reasonKeys: [] },
      phase2B: { isComplete: true, missing: [], reasonKeys: [] },
      phase2A: { isComplete: true, missing: [], reasonKeys: [] },
      phase3: { isComplete: true, missing: [], reasonKeys: [] },
    });
    const action = getNextAction(state);
    expect(action.primary.id).toBe('optimize-materials');
  });
});
