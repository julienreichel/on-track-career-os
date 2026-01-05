import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CoverLetterRepository,
  type AmplifyCoverLetterModel,
} from '@/domain/cover-letter/CoverLetterRepository';
import type { CoverLetter } from '@/domain/cover-letter/CoverLetter';

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

describe('CoverLetterRepository', () => {
  let repository: CoverLetterRepository;
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

    repository = new CoverLetterRepository(mockModel as unknown as AmplifyCoverLetterModel);
    fetchAllListItemsMock.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('gets a cover letter by id', async () => {
    const letter = { id: 'cl-1' } as CoverLetter;
    mockModel.get.mockResolvedValue({ data: letter });

    const result = await repository.get('cl-1');

    expect(result).toEqual(letter);
    expect(mockModel.get).toHaveBeenCalledWith(
      { id: 'cl-1' },
      expect.objectContaining({ authMode: 'userPool' })
    );
  });

  it('lists cover letters with optional filter', async () => {
    await repository.list({ userId: { eq: 'user-1' } });

    expect(fetchAllListItemsMock).toHaveBeenCalledTimes(1);
    const [listFn, options] = fetchAllListItemsMock.mock.calls[0];
    expect(typeof listFn).toBe('function');
    expect(options).toEqual(expect.objectContaining({ userId: { eq: 'user-1' } }));
  });

  it('creates cover letters', async () => {
    const payload = {
      userId: 'user-1',
      tone: 'Professional',
      content: 'Hello',
    } as CoverLetter;
    mockModel.create.mockResolvedValue({ data: payload });

    const result = await repository.create(payload);

    expect(result).toEqual(payload);
    expect(mockModel.create).toHaveBeenCalledWith(
      payload,
      expect.objectContaining({ authMode: 'userPool' })
    );
  });

  it('updates cover letters', async () => {
    const payload = {
      id: 'cl-1',
      content: 'Updated',
    } as CoverLetter;
    mockModel.update.mockResolvedValue({ data: payload });

    const result = await repository.update(payload);

    expect(result).toEqual(payload);
    expect(mockModel.update).toHaveBeenCalledWith(
      payload,
      expect.objectContaining({ authMode: 'userPool' })
    );
  });

  it('deletes cover letters', async () => {
    mockModel.delete.mockResolvedValue({ data: null });

    await repository.delete('cl-1');

    expect(mockModel.delete).toHaveBeenCalledWith(
      { id: 'cl-1' },
      expect.objectContaining({ authMode: 'userPool' })
    );
  });
});
