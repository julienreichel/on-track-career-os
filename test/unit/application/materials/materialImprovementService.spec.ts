import { describe, expect, it } from 'vitest';
import {
  buildImproveMaterialPayload,
  mapEvaluationToImprovementContext,
} from '@/application/materials/materialImprovementService';
import type { ApplicationStrengthEvaluation } from '@/domain/application-strength/ApplicationStrengthEvaluation';

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
});
