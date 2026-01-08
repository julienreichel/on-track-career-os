import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  SpeechBlockRepository,
  type AmplifySpeechBlockModel,
} from '@/domain/speech-block/SpeechBlockRepository';
import type { AmplifyUserProfileModel } from '@/domain/user-profile/UserProfileRepository';
import type { SpeechBlock } from '@/domain/speech-block/SpeechBlock';

const { gqlOptionsMock } = vi.hoisted(() => ({
  gqlOptionsMock: vi.fn((custom?: Record<string, unknown>) => ({
    authMode: 'userPool',
    ...(custom ?? {}),
  })),
}));

vi.mock('@/data/graphql/options', () => ({
  gqlOptions: gqlOptionsMock,
}));

describe('SpeechBlockRepository', () => {
  let repository: SpeechBlockRepository;
  let mockModel: {
    get: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let mockUserProfileModel: {
    get: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockModel = {
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    mockUserProfileModel = {
      get: vi.fn(),
    };

    repository = new SpeechBlockRepository(
      mockModel as unknown as AmplifySpeechBlockModel,
      mockUserProfileModel as unknown as AmplifyUserProfileModel
    );
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

  it('lists speech blocks for a user', async () => {
    const blocks = [{ id: 'sb-1' }] as SpeechBlock[];
    mockUserProfileModel.get.mockResolvedValue({ data: { id: 'user-1', speechBlocks: blocks } });

    const result = await repository.listByUser('user-1');

    expect(result).toEqual(blocks);
    expect(mockUserProfileModel.get).toHaveBeenCalledWith(
      { id: 'user-1' },
      expect.objectContaining({
        selectionSet: ['id', 'speechBlocks.*'],
      })
    );
  });

  it('returns empty array when userId is missing', async () => {
    const result = await repository.listByUser('');

    expect(result).toEqual([]);
    expect(mockUserProfileModel.get).not.toHaveBeenCalled();
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
