import { describe, expect, it, vi } from 'vitest';
import { ApplicationStrengthService } from '@/domain/application-strength/ApplicationStrengthService';
import type { ApplicationStrengthRepository } from '@/domain/application-strength/ApplicationStrengthRepository';

describe('ApplicationStrengthService', () => {
  const validInput = {
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
  };

  it('validates input and delegates to repository', async () => {
    const repo = {
      evaluate: vi.fn().mockResolvedValue({ overallScore: 0 }),
    } as unknown as ApplicationStrengthRepository;

    const service = new ApplicationStrengthService(repo);
    await service.evaluate(validInput as never);

    expect((repo.evaluate as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(validInput);
  });

  it('throws on missing job title', async () => {
    const repo = { evaluate: vi.fn() } as unknown as ApplicationStrengthRepository;
    const service = new ApplicationStrengthService(repo);

    await expect(
      service.evaluate({ ...validInput, job: { ...validInput.job, title: '' } } as never)
    ).rejects.toThrow('Job title is required');
  });

  it('throws when both cv text and cover letter text are empty', async () => {
    const repo = { evaluate: vi.fn() } as unknown as ApplicationStrengthRepository;
    const service = new ApplicationStrengthService(repo);

    await expect(
      service.evaluate({ ...validInput, cvText: '', coverLetterText: '' } as never)
    ).rejects.toThrow('At least one document is required (cvText or coverLetterText).');
  });

  it('accepts cover-letter-only input', async () => {
    const repo = {
      evaluate: vi.fn().mockResolvedValue({ overallScore: 0 }),
    } as unknown as ApplicationStrengthRepository;
    const service = new ApplicationStrengthService(repo);

    await service.evaluate({ ...validInput, cvText: '', coverLetterText: 'Cover letter content' } as never);

    expect((repo.evaluate as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith({
      ...validInput,
      cvText: '',
      coverLetterText: 'Cover letter content',
    });
  });
});
