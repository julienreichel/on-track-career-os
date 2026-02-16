import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildImproveMaterialPayload,
  mapEvaluationToImprovementContext,
  resolveMaterialImprovementErrorKey,
  MaterialImprovementService,
} from '@/application/materials/materialImprovementService';
import type { ApplicationStrengthEvaluation } from '@/domain/application-strength/ApplicationStrengthEvaluation';
import { ApplicationStrengthService } from '@/domain/application-strength/ApplicationStrengthService';
import { AiOperationsRepository } from '@/domain/ai-operations/AiOperationsRepository';

vi.mock('@/domain/application-strength/ApplicationStrengthService');
vi.mock('@/domain/ai-operations/AiOperationsRepository');

const evaluationFixture: ApplicationStrengthEvaluation = {
  overallScore: 64,
  dimensionScores: {
    atsReadiness: 70,
    clarityFocus: 65,
    targetedFitSignals: 58,
    evidenceStrength: 62,
  },
  decision: {
    label: 'borderline',
    readyToApply: false,
    rationaleBullets: ['Need stronger role fit evidence'],
  },
  missingSignals: ['Stakeholder alignment metrics'],
  topImprovements: [
    {
      title: 'Tighten summary',
      action: 'Align summary with target role outcomes.',
      impact: 'high',
      target: {
        document: 'cv',
        anchor: 'summary',
      },
    },
  ],
  notes: {
    atsNotes: ['Add target role keywords'],
    humanReaderNotes: ['Keep first bullets concise'],
  },
};

describe('materialImprovementService payload builders', () => {
  it('maps evaluation output to improvementContext contract', () => {
    const context = mapEvaluationToImprovementContext(evaluationFixture);

    expect(context.overallScore).toBe(64);
    expect(context.dimensionScores.targetedFitSignals).toBe(58);
    expect(context.topImprovements[0]?.target.anchor).toBe('summary');
    expect(context.notes.humanReaderNotes).toEqual(['Keep first bullets concise']);
  });

  it('maps and sanitizes instruction presets for improve payload', () => {
    const payload = buildImproveMaterialPayload({
      materialType: 'cv',
      currentMarkdown: '  # CV\n\ncontent  ',
      evaluation: evaluationFixture,
      instructions: {
        presets: ['impact-first', '', '   ', 'concise-bullets'],
        note: '  focus on measurable outcomes  ',
      },
      grounding: {
        language: 'en',
        profile: {
          fullName: 'Alex Candidate',
        },
        experiences: [],
      },
    });

    expect(payload.currentMarkdown).toBe('# CV\n\ncontent');
    expect(payload.instructions.presets).toEqual(['impact-first', 'concise-bullets']);
    expect(payload.instructions.note).toBe('focus on measurable outcomes');
    expect(payload.improvementContext.overallScore).toBe(64);
  });

  it('throws error when currentMarkdown is empty', () => {
    expect(() =>
      buildImproveMaterialPayload({
        materialType: 'cv',
        currentMarkdown: '   ',
        evaluation: evaluationFixture,
        instructions: { presets: ['impact-first'] },
        grounding: { profile: { fullName: 'Test' }, experiences: [] },
      })
    ).toThrow('ERR_MATERIAL_IMPROVEMENT_EMPTY_MARKDOWN');
  });

  it('throws error when evaluation is missing', () => {
    expect(() =>
      buildImproveMaterialPayload({
        materialType: 'cv',
        currentMarkdown: '# CV',
        evaluation: null,
        instructions: { presets: ['impact-first'] },
        grounding: { profile: { fullName: 'Test' }, experiences: [] },
      })
    ).toThrow('ERR_MATERIAL_IMPROVEMENT_FEEDBACK_REQUIRED');
  });

  it('throws error when presets are empty after sanitization', () => {
    expect(() =>
      buildImproveMaterialPayload({
        materialType: 'cv',
        currentMarkdown: '# CV',
        evaluation: evaluationFixture,
        instructions: { presets: ['', '   '] },
        grounding: { profile: { fullName: 'Test' }, experiences: [] },
      })
    ).toThrow('ERR_IMPROVE_MATERIAL_INVALID_INPUT:instructions.presets');
  });

  it('includes optional grounding context when provided', () => {
    const payload = buildImproveMaterialPayload({
      materialType: 'coverLetter',
      currentMarkdown: '# Letter',
      evaluation: evaluationFixture,
      instructions: { presets: ['impact-first'] },
      grounding: {
        language: 'en',
        profile: { fullName: 'Test' },
        experiences: [],
        stories: [{ title: 'Story', situation: 'sit', task: 'task', action: 'act', result: 'res' }],
        jobDescription: { title: 'Engineer' },
        matchingSummary: { overallFit: 'strong' },
        company: { name: 'Company' },
      },
    });

    expect(payload.stories).toBeDefined();
    expect(payload.jobDescription).toBeDefined();
    expect(payload.matchingSummary).toBeDefined();
    expect(payload.company).toBeDefined();
  });
});

describe('resolveMaterialImprovementErrorKey', () => {
  it('returns feedbackValidation error for validation issues', () => {
    const error = new Error('Job title is required');
    const key = resolveMaterialImprovementErrorKey(error, 'feedback');
    expect(key).toBe('materialImprovement.errors.feedbackValidation');
  });

  it('returns feedbackFailed error for feedback phase', () => {
    const error = new Error('Unknown error');
    const key = resolveMaterialImprovementErrorKey(error, 'feedback');
    expect(key).toBe('materialImprovement.errors.feedbackFailed');
  });

  it('returns feedbackRequired error when feedback is missing', () => {
    const error = new Error('ERR_MATERIAL_IMPROVEMENT_FEEDBACK_REQUIRED');
    const key = resolveMaterialImprovementErrorKey(error, 'improve');
    expect(key).toBe('materialImprovement.errors.feedbackRequired');
  });

  it('returns emptyMarkdown error when markdown is empty', () => {
    const error = new Error('ERR_MATERIAL_IMPROVEMENT_EMPTY_MARKDOWN');
    const key = resolveMaterialImprovementErrorKey(error, 'improve');
    expect(key).toBe('materialImprovement.errors.emptyMarkdown');
  });

  it('returns invalidPayload error for input/output validation', () => {
    const error = new Error('ERR_IMPROVE_MATERIAL_INVALID_INPUT');
    const key = resolveMaterialImprovementErrorKey(error, 'improve');
    expect(key).toBe('materialImprovement.errors.invalidPayload');
  });

  it('returns invalidOutput error for markdown validation', () => {
    const error = new Error('ERR_MATERIAL_IMPROVEMENT_INVALID_MARKDOWN');
    const key = resolveMaterialImprovementErrorKey(error, 'improve');
    expect(key).toBe('materialImprovement.errors.invalidOutput');
  });

  it('returns improveFailed error as fallback', () => {
    const error = new Error('Something unexpected');
    const key = resolveMaterialImprovementErrorKey(error, 'improve');
    expect(key).toBe('materialImprovement.errors.improveFailed');
  });
});

describe('MaterialImprovementService', () => {
  let service: MaterialImprovementService;
  let mockStrengthService: any;
  let mockAiOpsRepo: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockStrengthService = {
      evaluate: vi.fn().mockResolvedValue(evaluationFixture),
    };
    
    mockAiOpsRepo = {
      improveMaterial: vi.fn().mockResolvedValue('# Improved CV\n\nBetter content'),
    };
    
    vi.mocked(ApplicationStrengthService).mockImplementation(() => mockStrengthService as never);
    vi.mocked(AiOperationsRepository).mockImplementation(() => mockAiOpsRepo as never);
    
    service = new MaterialImprovementService();
  });

  it('runs feedback evaluation', async () => {
    const input = {
      job: { title: 'Engineer' },
      cvText: 'CV content',
      language: 'en',
    };
    
    const result = await service.runFeedback(input);
    
    expect(mockStrengthService.evaluate).toHaveBeenCalledWith(input);
    expect(result).toEqual(evaluationFixture);
  });

  it('runs improvement with valid input', async () => {
    const request = {
      materialType: 'cv' as const,
      currentMarkdown: '# CV',
      evaluation: evaluationFixture,
      instructions: { presets: ['impact-first'] },
      grounding: {
        language: 'en' as const,
        profile: { fullName: 'Test' },
        experiences: [],
      },
    };
    
    const result = await service.runImprove(request);
    
    expect(mockAiOpsRepo.improveMaterial).toHaveBeenCalled();
    expect(result).toBe('# Improved CV\n\nBetter content');
  });

  it('throws error when improved markdown is empty', async () => {
    mockAiOpsRepo.improveMaterial.mockResolvedValue('   ');
    
    const request = {
      materialType: 'cv' as const,
      currentMarkdown: '# CV',
      evaluation: evaluationFixture,
      instructions: { presets: ['impact-first'] },
      grounding: {
        profile: { fullName: 'Test' },
        experiences: [],
      },
    };
    
    await expect(service.runImprove(request)).rejects.toThrow('ERR_MATERIAL_IMPROVEMENT_INVALID_MARKDOWN');
  });
});
