import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PersonalCanvasService } from '@/domain/personal-canvas/PersonalCanvasService';
import { PersonalCanvasRepository } from '@/domain/personal-canvas/PersonalCanvasRepository';
import type { PersonalCanvas } from '@/domain/personal-canvas/PersonalCanvas';

// Mock the repository
vi.mock('@/domain/personal-canvas/PersonalCanvasRepository');

describe('PersonalCanvasService', () => {
  let service: PersonalCanvasService;
  let mockRepository: ReturnType<typeof vi.mocked<PersonalCanvasRepository>>;

  beforeEach(() => {
    mockRepository = {
      get: vi.fn(),
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<PersonalCanvasRepository>>;

    service = new PersonalCanvasService(mockRepository);
  });

  describe('getFullPersonalCanvas', () => {
    it('should fetch a complete PersonalCanvas by id', async () => {
      const mockPersonalCanvas = {
        id: 'personalcanvas-123',
        // TODO: Add model-specific fields
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        owner: 'user-123::user-123',
      } as PersonalCanvas;

      mockRepository.get.mockResolvedValue(mockPersonalCanvas);

      const result = await service.getFullPersonalCanvas('personalcanvas-123');

      expect(mockRepository.get).toHaveBeenCalledWith('personalcanvas-123');
      expect(result).toEqual(mockPersonalCanvas);
    });

    it('should return null when PersonalCanvas does not exist', async () => {
      mockRepository.get.mockResolvedValue(null);

      const result = await service.getFullPersonalCanvas('non-existent-id');

      expect(mockRepository.get).toHaveBeenCalledWith('non-existent-id');
      expect(result).toBeNull();
    });

    // TODO: Add more tests for lazy loading and relations
  });
});
