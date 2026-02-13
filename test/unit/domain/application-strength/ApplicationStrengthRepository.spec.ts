import { describe, expect, it, vi } from 'vitest';
import { ApplicationStrengthRepository } from '@/domain/application-strength/ApplicationStrengthRepository';
import type { IAiOperationsRepository } from '@/domain/ai-operations/AiOperationsRepository';

describe('ApplicationStrengthRepository', () => {
  it('converts AI output into safe domain DTO with stable defaults', async () => {
    const aiRepo: Partial<IAiOperationsRepository> = {
      evaluateApplicationStrength: vi.fn().mockResolvedValue({
        overallScore: '88',
        dimensionScores: {
          atsReadiness: 90,
        },
        decision: {
          label: 'strong',
          readyToApply: true,
          rationaleBullets: ['Looks strong'],
        },
        topImprovements: [
          {
            title: 'Improve section',
            action: 'Do action',
            impact: 'high',
            target: { document: 'cv', anchor: 'unsupportedAnchor' },
          },
        ],
        notes: {
          atsNotes: null,
          humanReaderNotes: ['Note'],
        },
      }),
    };

    const repository = new ApplicationStrengthRepository(aiRepo as IAiOperationsRepository);
    const result = await repository.evaluate({
      job: {
        title: 'Senior Product Manager',
        seniorityLevel: 'Senior',
        roleSummary: 'Lead product strategy.',
        responsibilities: ['Drive strategy'],
        requiredSkills: ['Stakeholder management'],
        behaviours: ['Ownership'],
        successCriteria: ['Improve adoption'],
        explicitPains: ['Roadmap fragmentation'],
        atsKeywords: ['Product strategy'],
      },
      cvText: 'CV content',
      coverLetterText: 'Cover letter content',
      language: 'en',
    });

    expect(result.overallScore).toBe(88);
    expect(result.dimensionScores.keywordCoverage).toBe(0);
    expect(Array.isArray(result.missingSignals)).toBe(true);
    expect(Array.isArray(result.notes.atsNotes)).toBe(true);
    expect(result.topImprovements[0]?.target.anchor).toBe('general');
  });

  it('normalizes cover-letter-only targets to cv when cover letter is empty', async () => {
    const aiRepo: Partial<IAiOperationsRepository> = {
      evaluateApplicationStrength: vi.fn().mockResolvedValue({
        overallScore: 60,
        dimensionScores: {
          atsReadiness: 60,
          keywordCoverage: 60,
          clarityFocus: 60,
          targetedFitSignals: 60,
          evidenceStrength: 60,
        },
        decision: {
          label: 'borderline',
          readyToApply: false,
          rationaleBullets: ['Needs work', 'Improve evidence'],
        },
        missingSignals: [],
        topImprovements: [
          {
            title: 'Rewrite cover letter intro',
            action: 'Strengthen opening sentence',
            impact: 'medium',
            target: { document: 'coverLetter', anchor: 'opening' },
          },
        ],
        notes: {
          atsNotes: [],
          humanReaderNotes: [],
        },
      }),
    };

    const repository = new ApplicationStrengthRepository(aiRepo as IAiOperationsRepository);
    const result = await repository.evaluate({
      job: {
        title: 'Senior Product Manager',
        seniorityLevel: 'Senior',
        roleSummary: 'Lead product strategy.',
        responsibilities: ['Drive strategy'],
        requiredSkills: ['Stakeholder management'],
        behaviours: ['Ownership'],
        successCriteria: ['Improve adoption'],
        explicitPains: ['Roadmap fragmentation'],
        atsKeywords: ['Product strategy'],
      },
      cvText: 'CV content',
      coverLetterText: '',
      language: 'en',
    });

    expect(result.topImprovements.every((item) => item.target.document === 'cv')).toBe(true);
  });
});
