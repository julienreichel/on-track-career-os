import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCVDocument } from '@/application/cvdocument/useCVDocument';
import { CVDocumentService } from '@/domain/cvdocument/CVDocumentService';
import type { CVDocument } from '@/domain/cvdocument/CVDocument';

// Mock the CVDocumentService
vi.mock('@/domain/cvdocument/CVDocumentService');

describe('useCVDocument', () => {
  let mockService: ReturnType<typeof vi.mocked<CVDocumentService>>;

  beforeEach(() => {
    mockService = {
      getFullCVDocument: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<CVDocumentService>>;

    // Mock the constructor to return our mock service
    vi.mocked(CVDocumentService).mockImplementation(() => mockService);
  });

  it('should initialize with null item and loading false', () => {
    const { item, loading, error } = useCVDocument('cvdocument-123');

    expect(item.value).toBeNull();
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it('should load CVDocument successfully', async () => {
    const mockCVDocument = {
      id: 'cvdocument-123',
      // TODO: Add model-specific fields
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      owner: 'user-123::user-123',
    } as CVDocument;

    mockService.getFullCVDocument.mockResolvedValue(mockCVDocument);

    const { item, loading, load } = useCVDocument('cvdocument-123');

    expect(loading.value).toBe(false);

    const loadPromise = load();

    // Loading should be true during the async operation
    expect(loading.value).toBe(true);

    await loadPromise;

    expect(loading.value).toBe(false);
    expect(item.value).toEqual(mockCVDocument);
    expect(mockService.getFullCVDocument).toHaveBeenCalledWith('cvdocument-123');
  });

  it('should handle loading state correctly', async () => {
    mockService.getFullCVDocument.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(null), 100))
    );

    const { loading, load } = useCVDocument('cvdocument-123');

    expect(loading.value).toBe(false);

    const loadPromise = load();
    expect(loading.value).toBe(true);

    await loadPromise;
    expect(loading.value).toBe(false);
  });

  it('should set item to null when CVDocument not found', async () => {
    mockService.getFullCVDocument.mockResolvedValue(null);

    const { item, load } = useCVDocument('non-existent-id');

    await load();

    expect(item.value).toBeNull();
    expect(mockService.getFullCVDocument).toHaveBeenCalledWith('non-existent-id');
  });

  it('should handle errors and set error state', async () => {
    mockService.getFullCVDocument.mockRejectedValue(new Error('Service failed'));

    const { item, loading, error, load } = useCVDocument('cvdocument-123');

    await load();

    expect(loading.value).toBe(false);
    expect(error.value).toBe('Service failed');
    expect(item.value).toBeNull();
  });

  // TODO: Add more tests for error handling and edge cases
});
