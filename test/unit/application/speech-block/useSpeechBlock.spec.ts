import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSpeechBlock } from '@/application/speech-block/useSpeechBlock';
import { SpeechBlockService } from '@/domain/speech-block/SpeechBlockService';
import type { SpeechBlock } from '@/domain/speech-block/SpeechBlock';
import { allowConsoleOutput } from '../../../setup/console-guard';

// Mock the SpeechBlockService
vi.mock('@/domain/speech-block/SpeechBlockService');

describe('useSpeechBlock', () => {
  let mockService: ReturnType<typeof vi.mocked<SpeechBlockService>>;

  beforeEach(() => {
    mockService = {
      getFullSpeechBlock: vi.fn(),
      updateSpeechBlock: vi.fn(),
      deleteSpeechBlock: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<SpeechBlockService>>;

    // Mock the constructor to return our mock service
    vi.mocked(SpeechBlockService).mockImplementation(() => mockService);
  });

  it('should initialize with null item and loading false', () => {
    const { item, loading, error } = useSpeechBlock('speechblock-123');

    expect(item.value).toBeNull();
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it('should load SpeechBlock successfully', async () => {
    const mockSpeechBlock = {
      id: 'speechblock-123',
      // TODO: Add model-specific fields
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      owner: 'user-123::user-123',
    } as SpeechBlock;

    mockService.getFullSpeechBlock.mockResolvedValue(mockSpeechBlock);

    const { item, loading, load } = useSpeechBlock('speechblock-123');

    expect(loading.value).toBe(false);

    const loadPromise = load();

    // Loading should be true during the async operation
    expect(loading.value).toBe(true);

    await loadPromise;

    expect(loading.value).toBe(false);
    expect(item.value).toEqual(mockSpeechBlock);
    expect(mockService.getFullSpeechBlock).toHaveBeenCalledWith('speechblock-123');
  });

  it('should handle loading state correctly', async () => {
    mockService.getFullSpeechBlock.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(null), 100))
    );

    const { loading, load } = useSpeechBlock('speechblock-123');

    expect(loading.value).toBe(false);

    const loadPromise = load();
    expect(loading.value).toBe(true);

    await loadPromise;
    expect(loading.value).toBe(false);
  });

  it('should set item to null when SpeechBlock not found', async () => {
    mockService.getFullSpeechBlock.mockResolvedValue(null);

    const { item, load } = useSpeechBlock('non-existent-id');

    await load();

    expect(item.value).toBeNull();
    expect(mockService.getFullSpeechBlock).toHaveBeenCalledWith('non-existent-id');
  });

  it('should handle errors and set error state', async () => {
    mockService.getFullSpeechBlock.mockRejectedValue(new Error('Service failed'));

    const { item, loading, error, load } = useSpeechBlock('speechblock-123');

    await allowConsoleOutput(async () => {
      await load();
    });

    expect(loading.value).toBe(false);
    expect(error.value).toBe('Service failed');
    expect(item.value).toBeNull();
  });

  it('should save updates and refresh item', async () => {
    const mockSpeechBlock = { id: 'speechblock-123' } as SpeechBlock;
    mockService.updateSpeechBlock.mockResolvedValue(mockSpeechBlock);

    const { item, save } = useSpeechBlock('speechblock-123');

    const result = await save({ id: 'speechblock-123', whyMe: 'Updated' } as never);

    expect(result).toEqual(mockSpeechBlock);
    expect(item.value).toEqual(mockSpeechBlock);
    expect(mockService.updateSpeechBlock).toHaveBeenCalledWith({
      id: 'speechblock-123',
      whyMe: 'Updated',
    });
  });

  it('should handle save errors', async () => {
    mockService.updateSpeechBlock.mockRejectedValue(new Error('Save failed'));

    const { error, save } = useSpeechBlock('speechblock-123');

    await allowConsoleOutput(async () => {
      const result = await save({ id: 'speechblock-123', whyMe: 'Updated' } as never);
      expect(result).toBeNull();
    });

    expect(error.value).toBe('Save failed');
  });

  it('should delete the speech block', async () => {
    const { item, remove } = useSpeechBlock('speechblock-123');
    item.value = { id: 'speechblock-123' } as SpeechBlock;

    mockService.deleteSpeechBlock.mockResolvedValue(undefined);

    const result = await remove();

    expect(result).toBe(true);
    expect(item.value).toBeNull();
    expect(mockService.deleteSpeechBlock).toHaveBeenCalledWith('speechblock-123');
  });

  it('should handle delete errors', async () => {
    const { item, error, remove } = useSpeechBlock('speechblock-123');
    item.value = { id: 'speechblock-123' } as SpeechBlock;
    mockService.deleteSpeechBlock.mockRejectedValue(new Error('Delete failed'));

    await allowConsoleOutput(async () => {
      const result = await remove();
      expect(result).toBe(false);
    });

    expect(error.value).toBe('Delete failed');
  });

  // TODO: Add more tests for error handling and edge cases
});
