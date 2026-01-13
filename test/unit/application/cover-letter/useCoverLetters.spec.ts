import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCoverLetters } from '@/application/cover-letter/useCoverLetters';
import { CoverLetterRepository } from '@/domain/cover-letter/CoverLetterRepository';
import type { CoverLetter } from '@/domain/cover-letter/CoverLetter';
import { allowConsoleOutput } from '../../../setup/console-guard';

vi.mock('@/domain/cover-letter/CoverLetterRepository');
vi.mock('@/composables/useAuthUser', () => ({
  useAuthUser: () => ({
    userId: { value: 'user-1' },
    loadUserId: vi.fn().mockResolvedValue(undefined),
  }),
}));

describe('useCoverLetters', () => {
  let mockRepository: {
    listByUser: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockRepository = {
      listByUser: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      get: vi.fn(),
    };

    vi.mocked(CoverLetterRepository).mockImplementation(() => mockRepository as never);
  });

  describe('loadAll', () => {
    it('should load all cover letters', async () => {
      const mockLetters = [{ id: 'cl-1' }, { id: 'cl-2' }] as CoverLetter[];

      mockRepository.listByUser.mockResolvedValue(mockLetters);

      const { items, loading, error, loadAll } = useCoverLetters();

      await loadAll();

      expect(mockRepository.listByUser).toHaveBeenCalledWith('user-1');
      expect(items.value).toEqual(mockLetters);
      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
    });

    it('should handle errors during load', async () => {
      mockRepository.listByUser.mockRejectedValue(new Error('Load failed'));

      const { items, error, loadAll } = useCoverLetters();

      await allowConsoleOutput(async () => {
        await loadAll();
      });

      expect(items.value).toEqual([]);
      expect(error.value).toBe('Load failed');
    });
  });

  describe('createCoverLetter', () => {
    it('should create a new cover letter', async () => {
      const input = {
        userId: 'user-1',
        tone: 'Formal',
        content: 'Hello',
        jobId: null,
      };
      const created = { id: 'cl-1', ...input } as CoverLetter;

      mockRepository.create.mockResolvedValue(created);

      const { items, createCoverLetter } = useCoverLetters();

      const result = await createCoverLetter(input as never);

      expect(result).toEqual(created);
      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: 'user-1',
        tone: 'Formal',
        content: 'Hello',
        jobId: undefined,
      });
      expect(items.value).toHaveLength(1);
      expect(items.value[0]).toEqual(created);
    });

    it('should persist jobId when provided', async () => {
      const input = {
        userId: 'user-1',
        tone: 'Formal',
        content: 'Hello',
        jobId: 'job-123',
      };
      const created = { id: 'cl-2', ...input } as CoverLetter;

      mockRepository.create.mockResolvedValue(created);

      const { items, createCoverLetter } = useCoverLetters();

      const result = await createCoverLetter(input as never);

      expect(result).toEqual(created);
      expect(mockRepository.create).toHaveBeenCalledWith(input);
      expect(items.value).toHaveLength(1);
    });

    it('should handle creation errors', async () => {
      mockRepository.create.mockRejectedValue(new Error('Creation failed'));

      const { error, createCoverLetter } = useCoverLetters();

      await allowConsoleOutput(async () => {
        const result = await createCoverLetter({ userId: 'user-1' } as never);
        expect(result).toBeNull();
      });

      expect(error.value).toBe('Creation failed');
    });
  });

  describe('updateCoverLetter', () => {
    it('should update an existing cover letter', async () => {
      const mockLetter = { id: 'cl-1', content: 'Old' } as CoverLetter;
      const updated = { ...mockLetter, content: 'New' } as CoverLetter;

      mockRepository.update.mockResolvedValue(updated);

      const { items, updateCoverLetter } = useCoverLetters();
      items.value = [mockLetter];

      const result = await updateCoverLetter({
        id: 'cl-1',
        content: 'New',
        jobId: null,
      } as never);

      expect(result).toEqual(updated);
      expect(items.value[0]).toEqual(updated);
      expect(items.value).toHaveLength(1);
      expect(mockRepository.update).toHaveBeenCalledWith({
        id: 'cl-1',
        content: 'New',
        jobId: undefined,
      });
    });

    it('should keep jobId when updating tailored cover letter', async () => {
      const mockLetter = { id: 'cl-2', content: 'Old', jobId: 'job-123' } as CoverLetter;
      const updated = { ...mockLetter, content: 'New' } as CoverLetter;

      mockRepository.update.mockResolvedValue(updated);

      const { items, updateCoverLetter } = useCoverLetters();
      items.value = [mockLetter];

      const result = await updateCoverLetter({
        id: 'cl-2',
        content: 'New',
        jobId: 'job-123',
      } as never);

      expect(result).toEqual(updated);
      expect(items.value[0]).toEqual(updated);
      expect(mockRepository.update).toHaveBeenCalledWith({
        id: 'cl-2',
        content: 'New',
        jobId: 'job-123',
      });
    });

    it('should handle update errors', async () => {
      mockRepository.update.mockRejectedValue(new Error('Update failed'));

      const { error, updateCoverLetter } = useCoverLetters();

      await allowConsoleOutput(async () => {
        const result = await updateCoverLetter({ id: 'cl-1', content: 'New' } as never);
        expect(result).toBeNull();
      });

      expect(error.value).toBe('Update failed');
    });
  });

  describe('deleteCoverLetter', () => {
    it('should delete a cover letter', async () => {
      const mockLetters = [{ id: 'cl-1' }, { id: 'cl-2' }] as CoverLetter[];
      mockRepository.delete.mockResolvedValue(undefined);

      const { items, deleteCoverLetter } = useCoverLetters();
      items.value = mockLetters;

      const result = await deleteCoverLetter('cl-1');

      expect(result).toBe(true);
      expect(items.value).toHaveLength(1);
      expect(items.value[0].id).toBe('cl-2');
    });

    it('should handle deletion errors', async () => {
      mockRepository.delete.mockRejectedValue(new Error('Deletion failed'));

      const { error, deleteCoverLetter } = useCoverLetters();

      await allowConsoleOutput(async () => {
        const result = await deleteCoverLetter('cl-1');
        expect(result).toBe(false);
      });

      expect(error.value).toBe('Deletion failed');
    });
  });
});
