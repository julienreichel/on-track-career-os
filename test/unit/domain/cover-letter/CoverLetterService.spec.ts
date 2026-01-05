import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoverLetterService } from '@/domain/cover-letter/CoverLetterService';
import { CoverLetterRepository } from '@/domain/cover-letter/CoverLetterRepository';
import type {
  CoverLetter,
  CoverLetterCreateInput,
  CoverLetterUpdateInput,
} from '@/domain/cover-letter/CoverLetter';

// Mock the repository
vi.mock('@/domain/cover-letter/CoverLetterRepository');

describe('CoverLetterService', () => {
  let service: CoverLetterService;
  let mockRepository: ReturnType<typeof vi.mocked<CoverLetterRepository>>;

  beforeEach(() => {
    mockRepository = {
      get: vi.fn(),
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<CoverLetterRepository>>;

    service = new CoverLetterService(mockRepository);
  });

  describe('getFullCoverLetter', () => {
    it('should fetch a complete CoverLetter by id', async () => {
      const mockCoverLetter = {
        id: 'coverletter-123',
        // TODO: Add model-specific fields
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        owner: 'user-123::user-123',
      } as CoverLetter;

      mockRepository.get.mockResolvedValue(mockCoverLetter);

      const result = await service.getFullCoverLetter('coverletter-123');

      expect(mockRepository.get).toHaveBeenCalledWith('coverletter-123');
      expect(result).toEqual(mockCoverLetter);
    });

    it('should return null when CoverLetter does not exist', async () => {
      mockRepository.get.mockResolvedValue(null);

      const result = await service.getFullCoverLetter('non-existent-id');

      expect(mockRepository.get).toHaveBeenCalledWith('non-existent-id');
      expect(result).toBeNull();
    });

  });

  it('lists cover letters with filters', async () => {
    const letters = [{ id: 'cl-1' }] as CoverLetter[];
    mockRepository.list.mockResolvedValue(letters);

    const result = await service.listCoverLetters({ userId: { eq: 'user-1' } });

    expect(mockRepository.list).toHaveBeenCalledWith({ userId: { eq: 'user-1' } });
    expect(result).toEqual(letters);
  });

  it('creates cover letters with trimmed content', async () => {
    const input = {
      userId: 'user-1',
      tone: '  Formal ',
      content: '  Hello ',
      jobId: null,
    } as CoverLetterCreateInput;
    const created = { id: 'cl-1', ...input } as CoverLetter;

    mockRepository.create.mockResolvedValue(created);

    const result = await service.createCoverLetter(input);

    expect(mockRepository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      tone: 'Formal',
      content: 'Hello',
      jobId: undefined,
    });
    expect(result).toEqual(created);
  });

  it('updates cover letters with trimmed fields', async () => {
    const input = {
      id: 'cl-1',
      tone: '  Updated ',
      jobId: null,
    } as CoverLetterUpdateInput;
    const updated = { id: 'cl-1', tone: 'Updated' } as CoverLetter;

    mockRepository.update.mockResolvedValue(updated);

    const result = await service.updateCoverLetter(input);

    expect(mockRepository.update).toHaveBeenCalledWith({
      id: 'cl-1',
      tone: 'Updated',
      jobId: undefined,
    });
    expect(result).toEqual(updated);
  });

  it('deletes cover letters', async () => {
    mockRepository.delete.mockResolvedValue(undefined);

    await service.deleteCoverLetter('cl-1');

    expect(mockRepository.delete).toHaveBeenCalledWith('cl-1');
  });

  it('creates draft cover letters with empty content', () => {
    const draft = service.createDraftCoverLetter('user-1', 'job-1');

    expect(draft).toEqual({
      userId: 'user-1',
      jobId: 'job-1',
      tone: '',
      content: '',
    });
  });
});
