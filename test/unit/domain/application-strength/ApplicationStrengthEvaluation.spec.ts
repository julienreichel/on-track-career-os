import { describe, expect, it } from 'vitest';
import {
  defaultAnchorForImprovementType,
  isAnchorSupported,
  isApplicationStrengthEvaluation,
  normalizeAnchor,
  normalizeEvaluationDto,
  normalizeImprovementTarget,
} from '@/domain/application-strength/ApplicationStrengthEvaluation';

describe('ApplicationStrengthEvaluation', () => {
  it('normalizes anchors and supports known aliases', () => {
    expect(normalizeAnchor('summary')).toBe('summary');
    expect(normalizeAnchor('workExperience')).toBe('experience');
    expect(normalizeAnchor('intro')).toBe('opening');
  });

  it('returns general for unknown anchors', () => {
    expect(normalizeAnchor('foobar')).toBe('general');
    expect(normalizeImprovementTarget({ document: 'cv', anchor: 'foobar' })).toEqual({
      document: 'cv',
      anchor: 'general',
    });
  });

  it('flags supported anchors correctly', () => {
    expect(isAnchorSupported('skills')).toBe(true);
    expect(isAnchorSupported('coverLetterBody')).toBe(true);
    expect(isAnchorSupported('')).toBe(false);
    expect(isAnchorSupported('unknown')).toBe(false);
  });

  it('normalizes DTO with safe defaults and no null arrays', () => {
    const dto = normalizeEvaluationDto({
      overallScore: 120,
      dimensionScores: {
        atsReadiness: -10,
      },
      decision: {
        label: 'unknown',
      },
      topImprovements: [
        {
          title: 'Improve intro',
          action: 'Rewrite opening',
          impact: 'high',
          target: {
            document: 'coverLetter',
            anchor: 'unsupported',
          },
        },
      ],
      notes: {},
    });

    expect(dto.overallScore).toBe(100);
    expect(dto.dimensionScores.atsReadiness).toBe(0);
    expect(dto.dimensionScores.clarityFocus).toBe(0);
    expect(dto.decision.label).toBe('risky');
    expect(Array.isArray(dto.decision.rationaleBullets)).toBe(true);
    expect(Array.isArray(dto.missingSignals)).toBe(true);
    expect(Array.isArray(dto.notes.atsNotes)).toBe(true);
    expect(Array.isArray(dto.notes.humanReaderNotes)).toBe(true);
    expect(dto.topImprovements[0]?.target.anchor).toBe('general');
    expect(isApplicationStrengthEvaluation(dto)).toBe(true);
  });

  it('derives default anchors for improvements', () => {
    expect(
      defaultAnchorForImprovementType({
        title: 'Improve skills section',
        action: 'Add missing skills',
        target: { document: 'cv', anchor: 'general' },
      })
    ).toBe('skills');

    expect(
      defaultAnchorForImprovementType({
        title: 'Strengthen opening',
        action: 'Rewrite intro paragraph',
        target: { document: 'coverLetter', anchor: 'general' },
      })
    ).toBe('opening');
  });
});
