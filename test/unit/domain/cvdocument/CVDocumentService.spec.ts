import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CVDocumentService } from '@/domain/cvdocument/CVDocumentService';
import { CVDocumentRepository } from '@/domain/cvdocument/CVDocumentRepository';
import type { CVDocument } from '@/domain/cvdocument/CVDocument';

// Mock the repository
vi.mock('@/domain/cvdocument/CVDocumentRepository');

describe('CVDocumentService', () => {
  let service: CVDocumentService;
  let mockRepository: ReturnType<typeof vi.mocked<CVDocumentRepository>>;

  beforeEach(() => {
    mockRepository = {
      get: vi.fn(),
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<CVDocumentRepository>>;

    service = new CVDocumentService(mockRepository);
  });

  describe('getFullCVDocument', () => {
    it('should fetch a complete CVDocument by id', async () => {
      const mockCVDocument = {
        id: 'cvdocument-123',
        // TODO: Add model-specific fields
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        owner: 'user-123::user-123',
      } as CVDocument;

      mockRepository.get.mockResolvedValue(mockCVDocument);

      const result = await service.getFullCVDocument('cvdocument-123');

      expect(mockRepository.get).toHaveBeenCalledWith('cvdocument-123');
      expect(result).toEqual(mockCVDocument);
    });

    it('should return null when CVDocument does not exist', async () => {
      mockRepository.get.mockResolvedValue(null);

      const result = await service.getFullCVDocument('non-existent-id');

      expect(mockRepository.get).toHaveBeenCalledWith('non-existent-id');
      expect(result).toBeNull();
    });

    // TODO: Add more tests for lazy loading and relations
  });
});
