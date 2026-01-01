import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  MatchingSummaryService,
  mapMatchingSummaryResult,
} from '@/domain/matching-summary/MatchingSummaryService';
import { MatchingSummaryRepository } from '@/domain/matching-summary/MatchingSummaryRepository';
import type { MatchingSummary } from '@/domain/matching-summary/MatchingSummary';
import type { MatchingSummaryResult } from '@/domain/ai-operations/MatchingSummaryResult';

vi.mock('@/domain/matching-summary/MatchingSummaryRepository');

const buildSummary = (): MatchingSummaryResult => ({
  summaryParagraph: 'Casey aligns to the role.',
  impactAreas: ['Scale delivery', 'Improve mentoring '],
  contributionMap: [' Lead EMs '],
  riskMitigationPoints: ['Needs deeper compliance context'],
  generatedAt: '2025-01-01T00:00:00.000Z',
  needsUpdate: false,
  userFitScore: 78,
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

  beforeEach(() => {
    mockRepo = {
      get: vi.fn(),
      listByJob: vi.fn(),
      findByContext: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as typeof mockRepo;

    vi.mocked(MatchingSummaryRepository).mockImplementation(
      () => mockRepo as unknown as MatchingSummaryRepository
    );

    service = new MatchingSummaryService(mockRepo as unknown as MatchingSummaryRepository);
  });

  it('gets summaries by id and context', async () => {
    mockRepo.get.mockResolvedValue({ id: 'ms-1' } as MatchingSummary);
    mockRepo.findByContext.mockResolvedValue({ id: 'ms-ctx' } as MatchingSummary);

    expect(await service.getById('ms-1')).toEqual({ id: 'ms-1' });
    expect(
      await service.getByContext({ userId: 'user-1', jobId: 'job-1', companyId: 'comp-1' })
    ).toEqual({ id: 'ms-ctx' });
  });

  it('lists summaries by job', async () => {
    mockRepo.listByJob.mockResolvedValue([{ id: 'ms-2' }] as MatchingSummary[]);
    const list = await service.listByJob('job-1');
    expect(list).toHaveLength(1);
  });

  it('upserts summaries by creating when none exist', async () => {
    const summary = buildSummary();
    mockRepo.findByContext.mockResolvedValue(null);
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
        impactAreas: ['Scale delivery', 'Improve mentoring'],
      })
    );
  });

  it('upserts summaries by updating when one exists', async () => {
    const summary = buildSummary();
    mockRepo.findByContext.mockResolvedValue({ id: 'existing' } as MatchingSummary);
    mockRepo.update.mockResolvedValue({ id: 'existing', summaryParagraph: 'Updated' } as MatchingSummary);

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
        summaryParagraph: 'Casey aligns to the role.',
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
      summaryParagraph: '  Fit  ',
      impactAreas: ['Value', ''],
      contributionMap: [' Action '],
      riskMitigationPoints: ['Risk'],
      generatedAt: '',
      needsUpdate: false,
      userFitScore: 120,
    } as MatchingSummaryResult);

    expect(mapped.summaryParagraph).toBe('Fit');
    expect(mapped.impactAreas).toEqual(['Value']);
    expect(mapped.userFitScore).toBe(100);
    expect(mapped.generatedAt).toMatch(/T/);
  });
});
