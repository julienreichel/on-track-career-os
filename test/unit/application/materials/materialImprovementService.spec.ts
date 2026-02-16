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
        presets: ['More concise', '', '   ', '__other__'],
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
    expect(payload.instructions.presets).toEqual(['More concise', 'focus on measurable outcomes']);
    expect(payload.improvementContext.overallScore).toBe(64);
  });

  it('builds improve payload without feedback context', () => {
    const payload = buildImproveMaterialPayload({
      materialType: 'coverLetter',
      currentMarkdown: 'Dear team,\n\nI can help.',
      evaluation: null,
      instructions: {
        presets: ['More professional'],
      },
      grounding: {
        language: 'en',
        profile: {
          fullName: 'Alex Candidate',
        },
        experiences: [],
      },
    });

    expect(payload.materialType).toBe('coverLetter');
    expect(payload.instructions.presets).toEqual(['More professional']);
    expect(payload.improvementContext).toBeUndefined();
  });
});
