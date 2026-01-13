import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCoverLetter } from '@/application/cover-letter/useCoverLetter';
import { CoverLetterService } from '@/domain/cover-letter/CoverLetterService';
import type { CoverLetter } from '@/domain/cover-letter/CoverLetter';
import { allowConsoleOutput } from '../../../setup/console-guard';

// Mock the CoverLetterService
vi.mock('@/domain/cover-letter/CoverLetterService');

describe('useCoverLetter', () => {
  let mockService: ReturnType<typeof vi.mocked<CoverLetterService>>;

  beforeEach(() => {
    mockService = {
      getFullCoverLetter: vi.fn(),
      updateCoverLetter: vi.fn(),
      deleteCoverLetter: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<CoverLetterService>>;

    // Mock the constructor to return our mock service
    vi.mocked(CoverLetterService).mockImplementation(() => mockService);
  });

  it('should initialize with null item and loading false', () => {
    const { item, loading, error } = useCoverLetter('coverletter-123');

    expect(item.value).toBeNull();
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it('should load CoverLetter successfully', async () => {
    const mockCoverLetter = {
      id: 'coverletter-123',
      // TODO: Add model-specific fields
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      owner: 'user-123::user-123',
    } as CoverLetter;

    mockService.getFullCoverLetter.mockResolvedValue(mockCoverLetter);

    const { item, loading, load } = useCoverLetter('coverletter-123');

    expect(loading.value).toBe(false);

    const loadPromise = load();

    // Loading should be true during the async operation
    expect(loading.value).toBe(true);

    await loadPromise;

    expect(loading.value).toBe(false);
    expect(item.value).toEqual(mockCoverLetter);
    expect(mockService.getFullCoverLetter).toHaveBeenCalledWith('coverletter-123');
  });

  it('should handle loading state correctly', async () => {
    mockService.getFullCoverLetter.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(null), 100))
    );

    const { loading, load } = useCoverLetter('coverletter-123');

    expect(loading.value).toBe(false);

    const loadPromise = load();
    expect(loading.value).toBe(true);

    await loadPromise;
    expect(loading.value).toBe(false);
  });

  it('should set item to null when CoverLetter not found', async () => {
    mockService.getFullCoverLetter.mockResolvedValue(null);

    const { item, load } = useCoverLetter('non-existent-id');

    await load();

    expect(item.value).toBeNull();
    expect(mockService.getFullCoverLetter).toHaveBeenCalledWith('non-existent-id');
  });

  it('should handle errors and set error state', async () => {
    mockService.getFullCoverLetter.mockRejectedValue(new Error('Service failed'));

    const { item, loading, error, load } = useCoverLetter('coverletter-123');

    await allowConsoleOutput(async () => {
      await load();
    });

    expect(loading.value).toBe(false);
    expect(error.value).toBe('Service failed');
    expect(item.value).toBeNull();
  });

  it('should save updates and refresh item', async () => {
    const mockCoverLetter = { id: 'coverletter-123' } as CoverLetter;
    mockService.updateCoverLetter.mockResolvedValue(mockCoverLetter);

    const { item, save } = useCoverLetter('coverletter-123');

    const result = await save({ id: 'coverletter-123', content: 'Updated' } as never);

    expect(result).toEqual(mockCoverLetter);
    expect(item.value).toEqual(mockCoverLetter);
    expect(mockService.updateCoverLetter).toHaveBeenCalledWith({
      id: 'coverletter-123',
      content: 'Updated',
    });
  });

  it('should handle save errors', async () => {
    mockService.updateCoverLetter.mockRejectedValue(new Error('Save failed'));

    const { error, save } = useCoverLetter('coverletter-123');

    await allowConsoleOutput(async () => {
      const result = await save({ id: 'coverletter-123', content: 'Updated' } as never);
      expect(result).toBeNull();
    });

    expect(error.value).toBe('Save failed');
  });

  it('should delete the cover letter', async () => {
    const { item, remove } = useCoverLetter('coverletter-123');
    item.value = { id: 'coverletter-123' } as CoverLetter;

    mockService.deleteCoverLetter.mockResolvedValue(undefined);

    const result = await remove();

    expect(result).toBe(true);
    expect(item.value).toBeNull();
    expect(mockService.deleteCoverLetter).toHaveBeenCalledWith('coverletter-123');
  });

  it('should handle delete errors', async () => {
    const { item, error, remove } = useCoverLetter('coverletter-123');
    item.value = { id: 'coverletter-123' } as CoverLetter;
    mockService.deleteCoverLetter.mockRejectedValue(new Error('Delete failed'));

    await allowConsoleOutput(async () => {
      const result = await remove();
      expect(result).toBe(false);
    });

    expect(error.value).toBe('Delete failed');
  });
});
