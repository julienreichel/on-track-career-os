import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  SpeechBlockRepository,
  type AmplifySpeechBlockModel,
} from '@/domain/speech-block/SpeechBlockRepository';
import type { SpeechBlock } from '@/domain/speech-block/SpeechBlock';

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

describe('SpeechBlockRepository', () => {
  let repository: SpeechBlockRepository;
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

    repository = new SpeechBlockRepository(mockModel as unknown as AmplifySpeechBlockModel);
    fetchAllListItemsMock.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('gets a speech block by id', async () => {
    const block = { id: 'sb-1' } as SpeechBlock;
    mockModel.get.mockResolvedValue({ data: block });

    const result = await repository.get('sb-1');

    expect(result).toEqual(block);
    expect(mockModel.get).toHaveBeenCalledWith(
      { id: 'sb-1' },
      expect.objectContaining({ authMode: 'userPool' })
    );
  });

  it('lists speech blocks with optional filter', async () => {
    mockModel.list.mockResolvedValue({ data: [] });

    await repository.list({ userId: { eq: 'user-1' } });

    expect(fetchAllListItemsMock).toHaveBeenCalledTimes(1);
    const [listFn, options] = fetchAllListItemsMock.mock.calls[0];
    expect(typeof listFn).toBe('function');
    expect(options).toEqual(expect.objectContaining({ userId: { eq: 'user-1' } }));
  });

  it('creates speech blocks', async () => {
    const payload = {
      userId: 'user-1',
      elevatorPitch: 'Pitch',
      careerStory: 'Story',
      whyMe: 'Why',
    } as SpeechBlock;
    mockModel.create.mockResolvedValue({ data: payload });

    const result = await repository.create(payload);

    expect(result).toEqual(payload);
    expect(mockModel.create).toHaveBeenCalledWith(
      payload,
      expect.objectContaining({ authMode: 'userPool' })
    );
  });

  it('updates speech blocks', async () => {
    const payload = {
      id: 'sb-1',
      whyMe: 'Updated',
    } as SpeechBlock;
    mockModel.update.mockResolvedValue({ data: payload });

    const result = await repository.update(payload);

    expect(result).toEqual(payload);
    expect(mockModel.update).toHaveBeenCalledWith(
      payload,
      expect.objectContaining({ authMode: 'userPool' })
    );
  });

  it('deletes speech blocks', async () => {
    mockModel.delete.mockResolvedValue({ data: null });

    await repository.delete('sb-1');

    expect(mockModel.delete).toHaveBeenCalledWith(
      { id: 'sb-1' },
      expect.objectContaining({ authMode: 'userPool' })
    );
  });
});
