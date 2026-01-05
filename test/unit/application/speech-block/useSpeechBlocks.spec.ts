import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSpeechBlocks } from '@/application/speech-block/useSpeechBlocks';
import { SpeechBlockRepository } from '@/domain/speech-block/SpeechBlockRepository';
import type { SpeechBlock } from '@/domain/speech-block/SpeechBlock';
import { withMockedConsoleError } from '../../../utils/withMockedConsole';

vi.mock('@/domain/speech-block/SpeechBlockRepository');

describe('useSpeechBlocks', () => {
  let mockRepository: {
    list: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockRepository = {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      get: vi.fn(),
    };

    vi.mocked(SpeechBlockRepository).mockImplementation(() => mockRepository as never);
  });

  describe('loadAll', () => {
    it('should load all speech blocks', async () => {
      const mockBlocks = [{ id: 'sb-1' }, { id: 'sb-2' }] as SpeechBlock[];

      mockRepository.list.mockResolvedValue(mockBlocks);

      const { items, loading, error, loadAll } = useSpeechBlocks();

      await loadAll();

      expect(mockRepository.list).toHaveBeenCalledWith({});
      expect(items.value).toEqual(mockBlocks);
      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
    });

    it('should load speech blocks with filter', async () => {
      const mockFilter = { userId: { eq: 'user-1' } };
      const mockBlocks = [{ id: 'sb-1' }] as SpeechBlock[];

      mockRepository.list.mockResolvedValue(mockBlocks);

      const { items, loadAll } = useSpeechBlocks();

      await loadAll(mockFilter);

      expect(mockRepository.list).toHaveBeenCalledWith(mockFilter);
      expect(items.value).toEqual(mockBlocks);
    });

    it(
      'should handle errors during load',
      withMockedConsoleError(async () => {
        mockRepository.list.mockRejectedValue(new Error('Load failed'));

        const { items, error, loadAll } = useSpeechBlocks();

        await loadAll();

        expect(items.value).toEqual([]);
        expect(error.value).toBe('Load failed');
      })
    );
  });

  describe('createSpeechBlock', () => {
    it('should create a new speech block', async () => {
      const input = {
        userId: 'user-1',
        elevatorPitch: 'Pitch',
        careerStory: 'Story',
        whyMe: 'Why',
      };
      const created = { id: 'sb-1', ...input } as SpeechBlock;

      mockRepository.create.mockResolvedValue(created);

      const { items, createSpeechBlock } = useSpeechBlocks();

      const result = await createSpeechBlock(input as never);

      expect(result).toEqual(created);
      expect(items.value).toHaveLength(1);
      expect(items.value[0]).toEqual(created);
    });

    it(
      'should handle creation errors',
      withMockedConsoleError(async () => {
        mockRepository.create.mockRejectedValue(new Error('Creation failed'));

        const { error, createSpeechBlock } = useSpeechBlocks();

        const result = await createSpeechBlock({ userId: 'user-1' } as never);

        expect(result).toBeNull();
        expect(error.value).toBe('Creation failed');
      })
    );
  });

  describe('updateSpeechBlock', () => {
    it('should update an existing speech block', async () => {
      const mockBlock = { id: 'sb-1', whyMe: 'Old' } as SpeechBlock;
      const updated = { ...mockBlock, whyMe: 'New' } as SpeechBlock;

      mockRepository.update.mockResolvedValue(updated);

      const { items, updateSpeechBlock } = useSpeechBlocks();
      items.value = [mockBlock];

      const result = await updateSpeechBlock({ id: 'sb-1', whyMe: 'New' } as never);

      expect(result).toEqual(updated);
      expect(items.value[0]).toEqual(updated);
    });

    it(
      'should handle update errors',
      withMockedConsoleError(async () => {
        mockRepository.update.mockRejectedValue(new Error('Update failed'));

        const { error, updateSpeechBlock } = useSpeechBlocks();

        const result = await updateSpeechBlock({ id: 'sb-1', whyMe: 'New' } as never);

        expect(result).toBeNull();
        expect(error.value).toBe('Update failed');
      })
    );
  });

  describe('deleteSpeechBlock', () => {
    it('should delete a speech block', async () => {
      const mockBlocks = [{ id: 'sb-1' }, { id: 'sb-2' }] as SpeechBlock[];
      mockRepository.delete.mockResolvedValue(undefined);

      const { items, deleteSpeechBlock } = useSpeechBlocks();
      items.value = mockBlocks;

      const result = await deleteSpeechBlock('sb-1');

      expect(result).toBe(true);
      expect(items.value).toHaveLength(1);
      expect(items.value[0].id).toBe('sb-2');
    });

    it(
      'should handle deletion errors',
      withMockedConsoleError(async () => {
        mockRepository.delete.mockRejectedValue(new Error('Deletion failed'));

        const { error, deleteSpeechBlock } = useSpeechBlocks();

        const result = await deleteSpeechBlock('sb-1');

        expect(result).toBe(false);
        expect(error.value).toBe('Deletion failed');
      })
    );
  });
});
