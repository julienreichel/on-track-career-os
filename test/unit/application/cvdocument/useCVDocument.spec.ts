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
      name: 'Senior Engineer CV',
      userId: 'user-123',
      templateId: 'template-modern',
      isTailored: true,
      jobId: 'job-456',
      contentJSON: {
        header: { name: 'John Doe', title: 'Senior Engineer' },
        sections: { experience: [], education: [] },
      },
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

  it('should handle network errors', async () => {
    mockService.getFullCVDocument.mockRejectedValue(new Error('Network error'));

    const { loading, error, item, load } = useCVDocument('cvdocument-123');

    await load();

    expect(loading.value).toBe(false);
    expect(error.value).toBe('Network error');
    expect(item.value).toBeNull();
  });

  it('should allow multiple load calls', async () => {
    const mockCV1 = {
      id: 'cvdocument-123',
      name: 'CV Version 1',
      userId: 'user-123',
      templateId: 'template-1',
      isTailored: false,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      owner: 'user-123::user-123',
    } as CVDocument;

    const mockCV2 = {
      id: 'cvdocument-123',
      name: 'CV Version 2',
      userId: 'user-123',
      templateId: 'template-2',
      isTailored: true,
      jobId: 'job-456',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
      owner: 'user-123::user-123',
    } as CVDocument;

    mockService.getFullCVDocument.mockResolvedValueOnce(mockCV1).mockResolvedValueOnce(mockCV2);

    const { item, load } = useCVDocument('cvdocument-123');

    await load();
    expect(item.value).toEqual(mockCV1);

    await load();
    expect(item.value).toEqual(mockCV2);
    expect(mockService.getFullCVDocument).toHaveBeenCalledTimes(2);
  });

  it('should create a new service instance for each composable call', () => {
    const composable1 = useCVDocument('cv-1');
    const composable2 = useCVDocument('cv-2');

    expect(composable1).not.toBe(composable2);
    expect(composable1.item).not.toBe(composable2.item);
    expect(composable1.loading).not.toBe(composable2.loading);
  });

  it('should maintain reactivity on item', async () => {
    const mockCVDocument = {
      id: 'cvdocument-123',
      name: 'Test CV',
      userId: 'user-123',
      isTailored: false,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      owner: 'user-123::user-123',
    } as CVDocument;

    mockService.getFullCVDocument.mockResolvedValue(mockCVDocument);

    const { item, load } = useCVDocument('cvdocument-123');

    await load();

    expect(item.value).toEqual(mockCVDocument);
  });

  it('should pass correct CV id to service', async () => {
    const cvId = 'specific-cv-id-456';
    mockService.getFullCVDocument.mockResolvedValue(null);

    const { load } = useCVDocument(cvId);
    await load();

    expect(mockService.getFullCVDocument).toHaveBeenCalledWith(cvId);
  });

  it('should handle tailored CV with jobId', async () => {
    const tailoredCV = {
      id: 'cvdocument-123',
      name: 'Tailored for Tech Corp',
      userId: 'user-123',
      jobId: 'job-789',
      isTailored: true,
      templateId: 'template-professional',
      contentJSON: { tailored: true },
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-15T00:00:00Z',
      owner: 'user-123::user-123',
    } as CVDocument;

    mockService.getFullCVDocument.mockResolvedValue(tailoredCV);

    const { item, load } = useCVDocument('cvdocument-123');

    await load();

    expect(item.value?.isTailored).toBe(true);
    expect(item.value?.jobId).toBe('job-789');
  });

  it('should handle CV with complex contentJSON', async () => {
    const cvWithContent = {
      id: 'cvdocument-123',
      name: 'Comprehensive CV',
      userId: 'user-123',
      templateId: 'template-modern',
      isTailored: false,
      contentJSON: {
        header: { name: 'Jane Doe', title: 'Engineer' },
        sections: {
          experience: [{ company: 'Tech Corp' }],
          education: [{ degree: 'BS CS' }],
        },
      },
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      owner: 'user-123::user-123',
    } as CVDocument;

    mockService.getFullCVDocument.mockResolvedValue(cvWithContent);

    const { item, load } = useCVDocument('cvdocument-123');

    await load();

    expect(item.value?.contentJSON).toBeDefined();
    expect(item.value?.contentJSON).toEqual(cvWithContent.contentJSON);
  });

  it('should handle CV with null contentJSON', async () => {
    const cvWithNullContent = {
      id: 'cvdocument-123',
      name: 'Empty CV',
      userId: 'user-123',
      contentJSON: null,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      owner: 'user-123::user-123',
    } as CVDocument;

    mockService.getFullCVDocument.mockResolvedValue(cvWithNullContent);

    const { item, load } = useCVDocument('cvdocument-123');

    await load();

    expect(item.value?.contentJSON).toBeNull();
  });
});
