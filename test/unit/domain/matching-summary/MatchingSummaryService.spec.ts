import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  MatchingSummaryService,
  mapMatchingSummaryResult,
} from '@/domain/matching-summary/MatchingSummaryService';
import { MatchingSummaryRepository } from '@/domain/matching-summary/MatchingSummaryRepository';
import { JobDescriptionRepository } from '@/domain/job-description/JobDescriptionRepository';
import type { MatchingSummary } from '@/domain/matching-summary/MatchingSummary';
import type { MatchingSummaryResult } from '@/domain/ai-operations/MatchingSummaryResult';

vi.mock('@/domain/matching-summary/MatchingSummaryRepository');
vi.mock('@/domain/job-description/JobDescriptionRepository');

const buildSummary = (): MatchingSummaryResult => ({
  overallScore: 78,
  scoreBreakdown: {
    skillFit: 40,
    experienceFit: 25,
    interestFit: 8,
    edge: 5,
  },
  recommendation: 'apply',
  reasoningHighlights: ['Casey aligns to the role'],
  strengthsForThisRole: ['Team leadership'],
  skillMatch: ['[MATCH] Leadership — demonstrated'],
  riskyPoints: ['Risk: Needs deeper compliance context. Mitigation: Study requirements.'],
  impactOpportunities: ['Scale delivery', 'Improve mentoring '],
  tailoringTips: [' Lead EMs '],
  generatedAt: '2025-01-01T00:00:00.000Z',
  needsUpdate: false,
});

describe('MatchingSummaryService', () => {
  let service: MatchingSummaryService;
  let mockRepo: {
    get: ReturnType<typeof vi.fn>;
    listByJob: ReturnType<typeof vi.fn>;
    findByContext: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let mockJobRepo: {
    getMatchingSummaries: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockRepo = {
      get: vi.fn(),
      listByJob: vi.fn(),
      findByContext: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as typeof mockRepo;
    mockJobRepo = {
      getMatchingSummaries: vi.fn(),
    };

    vi.mocked(MatchingSummaryRepository).mockImplementation(
      () => mockRepo as unknown as MatchingSummaryRepository
    );
    vi.mocked(JobDescriptionRepository).mockImplementation(
      () => mockJobRepo as unknown as JobDescriptionRepository
    );

    service = new MatchingSummaryService(
      mockRepo as unknown as MatchingSummaryRepository,
      mockJobRepo as unknown as JobDescriptionRepository
    );
  });

  it('gets summaries by id and context', async () => {
    mockRepo.get.mockResolvedValue({ id: 'ms-1' } as MatchingSummary);
    mockJobRepo.getMatchingSummaries.mockResolvedValue([
      {
        id: 'ms-ctx',
        userId: 'user-1',
        jobId: 'job-1',
        companyId: 'comp-1',
      } as MatchingSummary,
    ]);

    expect(await service.getById('ms-1')).toEqual({ id: 'ms-1' });
    expect(
      await service.getByContext({ userId: 'user-1', jobId: 'job-1', companyId: 'comp-1' })
    ).toEqual(
      expect.objectContaining({
        id: 'ms-ctx',
        userId: 'user-1',
        jobId: 'job-1',
        companyId: 'comp-1',
      })
    );
  });

  it('lists summaries by job', async () => {
    mockJobRepo.getMatchingSummaries.mockResolvedValue([{ id: 'ms-2' }] as MatchingSummary[]);
    const list = await service.listByJob('job-1');
    expect(list).toHaveLength(1);
  });

  it('upserts summaries by creating when none exist', async () => {
    const summary = buildSummary();
    mockJobRepo.getMatchingSummaries.mockResolvedValue([]);
    mockRepo.create.mockResolvedValue({ id: 'created' } as MatchingSummary);

    const created = await service.upsertSummary({
      userId: 'user-1',
      jobId: 'job-1',
      companyId: 'comp-1',
      summary,
    });

    expect(created.id).toBe('created');
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        jobId: 'job-1',
        companyId: 'comp-1',
        impactOpportunities: ['Scale delivery', 'Improve mentoring'],
        recommendation: 'apply',
      })
    );
  });

  it('upserts summaries by updating when one exists', async () => {
    const summary = buildSummary();
    mockJobRepo.getMatchingSummaries.mockResolvedValue([
      {
        id: 'existing',
        userId: 'user-1',
        jobId: 'job-1',
        companyId: null,
      } as MatchingSummary,
    ]);
    mockRepo.update.mockResolvedValue({ id: 'existing', overallScore: 78 } as MatchingSummary);

    const updated = await service.upsertSummary({
      userId: 'user-1',
      jobId: 'job-1',
      companyId: null,
      summary,
    });

    expect(updated.id).toBe('existing');
    expect(mockRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'existing',
        overallScore: 78,
        recommendation: 'apply',
      })
    );
  });

  it('deletes summaries', async () => {
    await service.deleteSummary('ms-3');
    expect(mockRepo.delete).toHaveBeenCalledWith('ms-3');
  });

  it('throws when upsert missing identifiers', async () => {
    await expect(
      service.upsertSummary({ userId: '', jobId: 'job', summary: buildSummary() })
    ).rejects.toThrow('userId and jobId are required');
  });
});

describe('mapMatchingSummaryResult', () => {
  it('normalizes strings, arrays, and score', () => {
    const mapped = mapMatchingSummaryResult({
      overallScore: 85,
      scoreBreakdown: {
        skillFit: 45,
        experienceFit: 25,
        interestFit: 10,
        edge: 5,
      },
      recommendation: 'apply',
      reasoningHighlights: ['  Strong fit  '],
      strengthsForThisRole: ['Value', ''],
      skillMatch: [' [MATCH] Leadership '],
      riskyPoints: ['Risk'],
      impactOpportunities: ['Impact'],
      tailoringTips: ['Tip'],
      generatedAt: '',
      needsUpdate: false,
    } as MatchingSummaryResult);

    expect(mapped.overallScore).toBe(85);
    expect(mapped.recommendation).toBe('apply');
    expect(mapped.strengthsForThisRole).toEqual(['Value']);
    expect(mapped.skillMatch).toEqual(['[MATCH] Leadership']);
    expect(mapped.generatedAt).toMatch(/T/);
    expect(JSON.parse(mapped.scoreBreakdown as string)).toEqual({
      skillFit: 45,
      experienceFit: 25,
      interestFit: 10,
      edge: 5,
    });
  });
});
