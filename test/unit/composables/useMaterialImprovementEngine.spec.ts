import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useMaterialImprovementEngine } from '@/composables/useMaterialImprovementEngine';
import type { MaterialImprovementService } from '@/application/materials/materialImprovementService';
import type { ApplicationStrengthEvaluation } from '@/domain/application-strength/ApplicationStrengthEvaluation';

vi.mock('@/utils/logError', () => ({
  logError: vi.fn(),
}));

describe('useMaterialImprovementEngine', () => {
  const evaluationFixture: ApplicationStrengthEvaluation = {
    overallScore: 72,
    dimensionScores: {
      atsReadiness: 74,
      clarityFocus: 70,
      targetedFitSignals: 69,
      evidenceStrength: 75,
    },
    decision: {
      label: 'borderline',
      readyToApply: false,
      rationaleBullets: ['Improve role-specific evidence'],
    },
    missingSignals: ['Leadership impact metrics'],
    topImprovements: [
      {
        title: 'Strengthen summary',
        action: 'Align summary to role outcomes',
        impact: 'high',
        target: { document: 'cv', anchor: 'summary' },
      },
    ],
    notes: {
      atsNotes: ['Use role keywords'],
      humanReaderNotes: ['Trim long bullet sentences'],
    },
  };

  const buildErrorDisplayStub = () => {
    const pageError = ref<string | null>(null);
    const pageErrorMessageKey = ref<string | null>(null);

    return {
      pageError,
      pageErrorMessageKey,
      setPageError: (message: string, key?: string) => {
        pageError.value = message;
        pageErrorMessageKey.value = key ?? null;
      },
      clearPageError: () => {
        pageError.value = null;
        pageErrorMessageKey.value = null;
      },
      notifyActionError: vi.fn(),
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('transitions idle -> analyzing -> ready on successful feedback', async () => {
    let resolveFeedback: ((value: ApplicationStrengthEvaluation) => void) | null = null;
    const runFeedback = vi.fn(
      () =>
        new Promise<ApplicationStrengthEvaluation>((resolve) => {
          resolveFeedback = resolve;
        })
    );

    const service = {
      runFeedback,
      runImprove: vi.fn(),
    } as unknown as MaterialImprovementService;

    const errorDisplay = buildErrorDisplayStub();

    const engine = useMaterialImprovementEngine({
      materialType: 'cv',
      currentDocumentId: 'cv-1',
      getCurrentMarkdown: () => '# CV',
      setCurrentMarkdown: vi.fn(),
      getFeedbackInput: () => ({
        job: {
          title: 'Staff Engineer',
          seniorityLevel: 'Senior',
          roleSummary: 'Lead engineering delivery',
          responsibilities: ['Lead delivery'],
          requiredSkills: ['TypeScript'],
          behaviours: ['Ownership'],
          successCriteria: ['Improve throughput'],
          explicitPains: ['Delivery predictability'],
          atsKeywords: ['TypeScript'],
        },
        cvText: '# CV',
        coverLetterText: '',
        language: 'en',
      }),
      getGroundingContext: () => ({
        profile: { fullName: 'Alex' },
        experiences: [],
      }),
      initialPresets: ['impact-first'],
      dependencies: {
        service,
        analytics: { captureEvent: vi.fn() },
        errorDisplay,
      },
    });

    const pending = engine.actions.runFeedback();
    expect(engine.state.value).toBe('analyzing');

    resolveFeedback?.(evaluationFixture);
    await pending;

    expect(engine.state.value).toBe('ready');
    expect(engine.score.value).toBe(72);
    expect(engine.details.value?.decision.label).toBe('borderline');
    expect(engine.canImprove.value).toBe(true);
  });

  it('maps improve errors to deterministic message keys and sets error state', async () => {
    const service = {
      runFeedback: vi.fn().mockResolvedValue(evaluationFixture),
      runImprove: vi.fn().mockRejectedValue(new Error('ERR_MATERIAL_IMPROVEMENT_FEEDBACK_REQUIRED')),
    } as unknown as MaterialImprovementService;

    const errorDisplay = buildErrorDisplayStub();

    const engine = useMaterialImprovementEngine({
      materialType: 'coverLetter',
      currentDocumentId: 'letter-1',
      getCurrentMarkdown: () => 'Dear team,\n\nI am writing...',
      setCurrentMarkdown: vi.fn(),
      getFeedbackInput: () => ({
        job: {
          title: 'Staff Engineer',
          seniorityLevel: 'Senior',
          roleSummary: 'Lead engineering delivery',
          responsibilities: ['Lead delivery'],
          requiredSkills: ['TypeScript'],
          behaviours: ['Ownership'],
          successCriteria: ['Improve throughput'],
          explicitPains: ['Delivery predictability'],
          atsKeywords: ['TypeScript'],
        },
        cvText: '',
        coverLetterText: 'Dear team,\n\nI am writing...',
        language: 'en',
      }),
      getGroundingContext: () => ({
        profile: { fullName: 'Alex' },
        experiences: [],
      }),
      initialPresets: ['tone-tighten'],
      dependencies: {
        service,
        analytics: { captureEvent: vi.fn() },
        errorDisplay,
      },
    });

    await engine.actions.runFeedback();
    await expect(engine.actions.runImprove()).rejects.toThrow('ERR_MATERIAL_IMPROVEMENT_FEEDBACK_REQUIRED');

    expect(engine.state.value).toBe('error');
    expect(errorDisplay.pageErrorMessageKey.value).toBe('materialImprovement.errors.feedbackRequired');
  });

  it('resets form values on improve trigger while using captured instructions', async () => {
    const setMarkdown = vi.fn();
    let resolveImprove: ((value: string) => void) | null = null;

    const service = {
      runFeedback: vi.fn().mockResolvedValue(evaluationFixture),
      runImprove: vi.fn(
        () =>
          new Promise<string>((resolve) => {
            resolveImprove = resolve;
          })
      ),
    } as unknown as MaterialImprovementService;

    const engine = useMaterialImprovementEngine({
      materialType: 'cv',
      currentDocumentId: 'cv-1',
      getCurrentMarkdown: () => '# Original markdown',
      setCurrentMarkdown: setMarkdown,
      getFeedbackInput: () => ({
        job: {
          title: 'Staff Engineer',
          seniorityLevel: 'Senior',
          roleSummary: 'Lead engineering delivery',
          responsibilities: ['Lead delivery'],
          requiredSkills: ['TypeScript'],
          behaviours: ['Ownership'],
          successCriteria: ['Improve throughput'],
          explicitPains: ['Delivery predictability'],
          atsKeywords: ['TypeScript'],
        },
        cvText: '# Original markdown',
        coverLetterText: '',
        language: 'en',
      }),
      getGroundingContext: () => ({
        profile: { fullName: 'Alex' },
        experiences: [],
      }),
      initialPresets: ['impact-first'],
      initialNote: 'Focus on measurable outcomes',
      dependencies: {
        service,
        analytics: { captureEvent: vi.fn() },
        errorDisplay: buildErrorDisplayStub(),
      },
    });

    await engine.actions.runFeedback();
    const pendingImprove = engine.actions.runImprove();

    expect(engine.presets.value).toEqual([]);
    expect(engine.note.value).toBe('');
    expect(service.runImprove).toHaveBeenCalledWith(
      expect.objectContaining({
        instructions: {
          presets: ['impact-first'],
          note: 'Focus on measurable outcomes',
        },
      })
    );

    resolveImprove?.('# Updated markdown');
    await pendingImprove;

    expect(setMarkdown).toHaveBeenCalledWith('# Updated markdown');
    expect(engine.state.value).toBe('idle');
    expect(engine.details.value).toBeNull();
    expect(engine.score.value).toBeNull();
    expect(engine.canImprove.value).toBe(false);
  });
});
