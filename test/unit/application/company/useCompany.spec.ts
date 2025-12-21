import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCompany } from '@/application/company/useCompany';
import { CompanyService } from '@/domain/company/CompanyService';
import type { Company } from '@/domain/company/Company';

// Mock the CompanyService
vi.mock('@/domain/company/CompanyService');

describe('useCompany', () => {
  let mockService: ReturnType<typeof vi.mocked<CompanyService>>;

  beforeEach(() => {
    mockService = {
      getFullCompany: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<CompanyService>>;

    // Mock the constructor to return our mock service
    vi.mocked(CompanyService).mockImplementation(() => mockService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with null item and loading false', () => {
    const { item, loading, error } = useCompany('company-123');

    expect(item.value).toBeNull();
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it('should load Company successfully', async () => {
    const mockCompany = {
      id: 'company-123',
      // TODO: Add model-specific fields
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      owner: 'user-123::user-123',
    } as Company;

    mockService.getFullCompany.mockResolvedValue(mockCompany);

    const { item, loading, load } = useCompany('company-123');

    expect(loading.value).toBe(false);

    const loadPromise = load();

    // Loading should be true during the async operation
    expect(loading.value).toBe(true);

    await loadPromise;

    expect(loading.value).toBe(false);
    expect(item.value).toEqual(mockCompany);
    expect(mockService.getFullCompany).toHaveBeenCalledWith('company-123');
  });

  it('should handle loading state correctly', async () => {
    mockService.getFullCompany.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(null), 100))
    );

    const { loading, load } = useCompany('company-123');

    expect(loading.value).toBe(false);

    const loadPromise = load();
    expect(loading.value).toBe(true);

    await loadPromise;
    expect(loading.value).toBe(false);
  });

  it('should set item to null when Company not found', async () => {
    mockService.getFullCompany.mockResolvedValue(null);

    const { item, load } = useCompany('non-existent-id');

    await load();

    expect(item.value).toBeNull();
    expect(mockService.getFullCompany).toHaveBeenCalledWith('non-existent-id');
  });

  it('should handle errors and set error state', async () => {
    mockService.getFullCompany.mockRejectedValue(new Error('Service failed'));

    const { item, loading, error, load } = useCompany('company-123');

    await load();

    expect(loading.value).toBe(false);
    expect(error.value).toBe('Service failed');
    expect(item.value).toBeNull();
  });

  it('should use a fallback error message when rejection is not an Error instance', async () => {
    mockService.getFullCompany.mockRejectedValue('boom');

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { error, load } = useCompany('company-123');

    await load();

    expect(error.value).toBe('Unknown error occurred');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  // TODO: Add more tests for error handling and edge cases
});
