import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CoverLetterRepository,
  type AmplifyCoverLetterModel,
} from '@/domain/cover-letter/CoverLetterRepository';
import type { CoverLetter } from '@/domain/cover-letter/CoverLetter';
import type { AmplifyUserProfileModel } from '@/domain/user-profile/UserProfileRepository';

vi.mock('@/data/graphql/options', () => ({
  gqlOptions: (custom?: Record<string, unknown>) => ({
    authMode: 'userPool',
    ...(custom ?? {}),
  }),
}));

describe('CoverLetterRepository', () => {
  let repository: CoverLetterRepository;
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

    repository = new CoverLetterRepository(
      mockModel as unknown as AmplifyCoverLetterModel,
      mockUserProfileModel as AmplifyUserProfileModel
    );
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

  it('lists cover letters by user', async () => {
    const letters = [{ id: 'cl-1' }] as CoverLetter[];
    mockUserProfileModel.get.mockResolvedValue({
      data: { id: 'user-1', coverLetters: letters },
    });

    const result = await repository.listByUser('user-1');

    expect(mockUserProfileModel.get).toHaveBeenCalledWith(
      { id: 'user-1' },
      expect.objectContaining({ authMode: 'userPool', selectionSet: ['id', 'coverLetters.*'] })
    );
    expect(result).toEqual(letters);
  });

  it('returns empty array when userId missing', async () => {
    const result = await repository.listByUser('');

    expect(result).toEqual([]);
    expect(mockUserProfileModel.get).not.toHaveBeenCalled();
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
