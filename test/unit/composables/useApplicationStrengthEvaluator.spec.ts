import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useApplicationStrengthEvaluator } from '@/composables/useApplicationStrengthEvaluator';
import { ApplicationStrengthService } from '@/domain/application-strength/ApplicationStrengthService';
import {
  APPLICATION_STRENGTH_COVER_LETTER_TEXT_FIXTURE,
  APPLICATION_STRENGTH_CV_TEXT_FIXTURE,
  APPLICATION_STRENGTH_JOB_FIXTURE,
} from '../../fixtures/application-strength';

vi.mock('@/domain/application-strength/ApplicationStrengthService');
vi.mock('@/composables/useAnalytics', () => ({
  useAnalytics: () => ({
    captureEvent: vi.fn(),
  }),
}));
vi.mock('@/utils/logError', () => ({
  logError: vi.fn(),
}));

describe('useApplicationStrengthEvaluator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets loading and stores evaluation result', async () => {
    const evaluateMock = vi.fn().mockResolvedValue({
      overallScore: 80,
      dimensionScores: {
        atsReadiness: 80,
        clarityFocus: 78,
        targetedFitSignals: 79,
        evidenceStrength: 81,
      },
      decision: {
        label: 'strong',
        readyToApply: true,
        rationaleBullets: ['Good fit', 'Clear evidence'],
      },
      missingSignals: [],
      topImprovements: [
        {
          title: 'Add quantified outcomes',
          action: 'Include metrics',
          impact: 'high',
          target: { document: 'cv', anchor: 'experience' },
        },
        {
          title: 'Strengthen summary',
          action: 'Refine role focus',
          impact: 'medium',
          target: { document: 'cv', anchor: 'summary' },
        },
      ],
      notes: {
        atsNotes: [],
        humanReaderNotes: [],
      },
    });

    vi.mocked(ApplicationStrengthService).mockImplementation(
      () =>
        ({
          evaluate: evaluateMock,
        }) as never
    );

    const composable = useApplicationStrengthEvaluator();
    const pending = composable.evaluate({
      job: APPLICATION_STRENGTH_JOB_FIXTURE,
      cvText: APPLICATION_STRENGTH_CV_TEXT_FIXTURE,
      coverLetterText: APPLICATION_STRENGTH_COVER_LETTER_TEXT_FIXTURE,
      language: 'en',
    });

    expect(composable.loading.value).toBe(true);
    expect(composable.status.value).toBe('loading');
    await pending;

    expect(evaluateMock).toHaveBeenCalled();
    expect(composable.loading.value).toBe(false);
    expect(composable.status.value).toBe('success');
    expect(composable.evaluation.value?.overallScore).toBe(80);
    expect(composable.error.value).toBeNull();
    expect(composable.errorCode.value).toBeNull();
    expect(composable.errorMessageKey.value).toBeNull();
  });

  it('maps validation errors to deterministic UI key', async () => {
    const evaluateMock = vi
      .fn()
      .mockRejectedValue(new Error('At least one document is required (cvText or coverLetterText).'));

    vi.mocked(ApplicationStrengthService).mockImplementation(
      () =>
        ({
          evaluate: evaluateMock,
        }) as never
    );

    const composable = useApplicationStrengthEvaluator();

    await expect(
      composable.evaluate({
        job: APPLICATION_STRENGTH_JOB_FIXTURE,
        cvText: '',
        coverLetterText: '',
        language: 'en',
      })
    ).rejects.toThrow();

    expect(composable.status.value).toBe('error');
    expect(composable.errorCode.value).toBe('validation');
    expect(composable.errorMessageKey.value).toBe('applicationStrength.errors.validation');
    expect(composable.rawError.value).toBeInstanceOf(Error);
  });
});
