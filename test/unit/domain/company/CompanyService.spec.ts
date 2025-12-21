import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompanyService } from '@/domain/company/CompanyService';
import { CompanyRepository } from '@/domain/company/CompanyRepository';
import type { Company } from '@/domain/company/Company';

// Mock the repository
vi.mock('@/domain/company/CompanyRepository');

describe('CompanyService', () => {
  let service: CompanyService;
  let mockRepository: ReturnType<typeof vi.mocked<CompanyRepository>>;

  beforeEach(() => {
    mockRepository = {
      get: vi.fn(),
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<CompanyRepository>>;

    service = new CompanyService(mockRepository);
  });

  describe('getFullCompany', () => {
    it('should fetch a complete Company by id', async () => {
      const mockCompany = {
        id: 'company-123',
        // TODO: Add model-specific fields
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        owner: 'user-123::user-123',
      } as Company;

      mockRepository.get.mockResolvedValue(mockCompany);

      const result = await service.getFullCompany('company-123');

      expect(mockRepository.get).toHaveBeenCalledWith('company-123');
      expect(result).toEqual(mockCompany);
    });

    it('should return null when Company does not exist', async () => {
      mockRepository.get.mockResolvedValue(null);

      const result = await service.getFullCompany('non-existent-id');

      expect(mockRepository.get).toHaveBeenCalledWith('non-existent-id');
      expect(result).toBeNull();
    });

    // TODO: Add more tests for lazy loading and relations
  });
});
