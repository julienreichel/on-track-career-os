import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useMatchingSummary } from '@/application/matching-summary/useMatchingSummary';
import { MatchingSummaryService } from '@/domain/matching-summary/MatchingSummaryService';
import type { MatchingSummary } from '@/domain/matching-summary/MatchingSummary';
import type { MatchingSummaryResult } from '@/domain/ai-operations/MatchingSummaryResult';

vi.mock('@/domain/matching-summary/MatchingSummaryService');

describe('useMatchingSummary', () => {
  let mockService: {
    getById: ReturnType<typeof vi.fn>;
    getByContext: ReturnType<typeof vi.fn>;
    upsertSummary: ReturnType<typeof vi.fn>;
    deleteSummary: ReturnType<typeof vi.fn>;
  };

  const summaryResult: MatchingSummaryResult = {
    summaryParagraph: 'Fit summary',
    impactAreas: ['Value'],
    contributionMap: ['Contribution'],
    riskMitigationPoints: ['Risk'],
    generatedAt: new Date().toISOString(),
    needsUpdate: false,
    userFitScore: 80,
  };

  beforeEach(() => {
    mockService = {
      getById: vi.fn(),
      getByContext: vi.fn(),
      upsertSummary: vi.fn(),
      deleteSummary: vi.fn(),
    };

    vi.mocked(MatchingSummaryService).mockImplementation(
      () => mockService as unknown as MatchingSummaryService
    );
  });

  it('loads summaries by id', async () => {
    const summary = { id: 'ms-1' } as MatchingSummary;
    mockService.getById.mockResolvedValue(summary);

    const hook = useMatchingSummary({ id: 'ms-1' });
    expect(hook.summary.value).toBeNull();

    await hook.load();

    expect(mockService.getById).toHaveBeenCalledWith('ms-1');
    expect(hook.summary.value).toEqual(summary);
  });

  it('loads summaries by context', async () => {
    const summary = { id: 'ms-ctx' } as MatchingSummary;
    mockService.getByContext.mockResolvedValue(summary);

    const hook = useMatchingSummary({ userId: 'user-1', jobId: 'job-1', companyId: 'comp-1' });
    await hook.load();

    expect(mockService.getByContext).toHaveBeenCalledWith({
      userId: 'user-1',
      jobId: 'job-1',
      companyId: 'comp-1',
    });
    expect(hook.summary.value).toEqual(summary);
  });

  it('upserts summaries when context provided', async () => {
    const updated = { id: 'ms-ctx-updated' } as MatchingSummary;
    mockService.upsertSummary.mockResolvedValue(updated);

    const hook = useMatchingSummary({ userId: 'user-1', jobId: 'job-1' });
    expect(hook.upsert).toBeTypeOf('function');

    await hook.upsert!(summaryResult);

    expect(mockService.upsertSummary).toHaveBeenCalledWith({
      userId: 'user-1',
      jobId: 'job-1',
      companyId: undefined,
      summary: summaryResult,
    });
    expect(hook.summary.value).toEqual(updated);
  });

  it('deletes summaries when remove is called', async () => {
    const hook = useMatchingSummary({ id: 'ms-1' });
    hook.summary.value = { id: 'ms-1' } as MatchingSummary;

    await hook.remove();

    expect(mockService.deleteSummary).toHaveBeenCalledWith('ms-1');
    expect(hook.summary.value).toBeNull();
  });

  it('sets error state when load fails', async () => {
    mockService.getById.mockRejectedValue(new Error('failure'));

    const hook = useMatchingSummary({ id: 'ms-1' });

    await expect(hook.load()).rejects.toThrow('failure');
    expect(hook.error.value).toBe('failure');
    expect(hook.loading.value).toBe(false);
  });
});
