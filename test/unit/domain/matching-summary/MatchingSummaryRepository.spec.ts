import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  MatchingSummaryRepository,
  type AmplifyMatchingSummaryModel,
} from '@/domain/matching-summary/MatchingSummaryRepository';
import type { MatchingSummary } from '@/domain/matching-summary/MatchingSummary';

const { gqlOptionsMock } = vi.hoisted(() => ({
  gqlOptionsMock: vi.fn((custom?: Record<string, unknown>) => ({
    authMode: 'userPool',
    ...(custom ?? {}),
  })),
}));

const { fetchAllListItemsMock } = vi.hoisted(() => ({
  fetchAllListItemsMock: vi.fn(),
}));

vi.mock('@/data/graphql/options', () => ({
  gqlOptions: gqlOptionsMock,
}));

vi.mock('@/data/graphql/pagination', () => ({
  fetchAllListItems: fetchAllListItemsMock,
}));

describe('MatchingSummaryRepository', () => {
  let repository: MatchingSummaryRepository;
  let mockModel: {
    get: ReturnType<typeof vi.fn>;
    list: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockModel = {
      get: vi.fn(),
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    repository = new MatchingSummaryRepository(mockModel as unknown as AmplifyMatchingSummaryModel);

    fetchAllListItemsMock.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('gets a summary by id', async () => {
    const summary = { id: 'ms-1' } as MatchingSummary;
    mockModel.get.mockResolvedValue({ data: summary });

    const result = await repository.get('ms-1');

    expect(result).toEqual(summary);
    expect(mockModel.get).toHaveBeenCalledWith(
      { id: 'ms-1' },
      expect.objectContaining({ authMode: 'userPool' })
    );
  });

  it('creates summaries', async () => {
    const payload = {
      userId: 'user-1',
      jobId: 'job-1',
      summaryParagraph: 'Fit',
      impactAreas: [],
      contributionMap: [],
      riskMitigationPoints: [],
      generatedAt: new Date().toISOString(),
      needsUpdate: false,
    } as unknown as MatchingSummary;
    mockModel.create.mockResolvedValue({ data: payload });

    const result = await repository.create(payload);

    expect(result).toEqual(payload);
    expect(mockModel.create).toHaveBeenCalledWith(
      payload,
      expect.objectContaining({ authMode: 'userPool' })
    );
  });

  it('updates summaries', async () => {
    const payload = {
      id: 'ms-1',
      summaryParagraph: 'Updated',
    } as unknown as MatchingSummary;
    mockModel.update.mockResolvedValue({ data: payload });

    const result = await repository.update(payload);

    expect(result).toEqual(payload);
    expect(mockModel.update).toHaveBeenCalledWith(
      payload,
      expect.objectContaining({ authMode: 'userPool' })
    );
  });

  it('deletes summaries', async () => {
    mockModel.delete.mockResolvedValue({ data: null });

    await repository.delete('ms-1');

    expect(mockModel.delete).toHaveBeenCalledWith(
      { id: 'ms-1' },
      expect.objectContaining({ authMode: 'userPool' })
    );
  });
});
