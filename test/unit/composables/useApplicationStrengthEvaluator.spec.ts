import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useApplicationStrengthEvaluator } from '@/composables/useApplicationStrengthEvaluator';
import { ApplicationStrengthService } from '@/domain/application-strength/ApplicationStrengthService';

vi.mock('@/domain/application-strength/ApplicationStrengthService');

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
      job: {
        title: 'Engineer',
        seniorityLevel: 'Senior',
        roleSummary: 'Build things',
        responsibilities: [],
        requiredSkills: [],
        behaviours: [],
        successCriteria: [],
        explicitPains: [],
        atsKeywords: [],
      },
      cvText: 'CV content',
      coverLetterText: '',
      language: 'en',
    });

    expect(composable.loading.value).toBe(true);
    await pending;

    expect(evaluateMock).toHaveBeenCalled();
    expect(composable.loading.value).toBe(false);
    expect(composable.evaluation.value?.overallScore).toBe(80);
    expect(composable.error.value).toBeNull();
  });
});
