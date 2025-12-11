import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useBreadcrumbMapping } from '@/composables/useBreadcrumbMapping';
import { ExperienceService } from '@/domain/experience/ExperienceService';
import type { Experience } from '@/domain/experience/Experience';

// Mock ExperienceService
vi.mock('@/domain/experience/ExperienceService', () => ({
  ExperienceService: vi.fn(),
}));

describe('useBreadcrumbMapping', () => {
  let mockExperienceService: {
    getFullExperience: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear cache BEFORE each test
    const { clearCache } = useBreadcrumbMapping();
    clearCache();
    
    mockExperienceService = {
      getFullExperience: vi.fn(),
    };
    vi.mocked(ExperienceService).mockImplementation(() => mockExperienceService as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('isUUID', () => {
    it('should recognize valid UUIDs', () => {
      const { isUUID } = useBreadcrumbMapping();

      expect(isUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(isUUID('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      const { isUUID } = useBreadcrumbMapping();

      expect(isUUID('not-a-uuid')).toBe(false);
      expect(isUUID('experiences')).toBe(false);
      expect(isUUID('123-456-789')).toBe(false);
      expect(isUUID('')).toBe(false);
      expect(isUUID('550e8400-e29b-41d4-a716')).toBe(false); // too short
    });

    it('should handle both uppercase and lowercase UUIDs', () => {
      const { isUUID } = useBreadcrumbMapping();

      expect(isUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
      expect(isUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });
  });

  describe('resolveSegment', () => {
    it('should return null for non-UUID segments', async () => {
      const { resolveSegment } = useBreadcrumbMapping();

      const result = await resolveSegment('experiences');

      expect(result).toBeNull();
      expect(mockExperienceService.getFullExperience).not.toHaveBeenCalled();
    });

    it('should resolve experience ID to company name', async () => {
      const experienceId = '550e8400-e29b-41d4-a716-446655440000';
      const mockExperience: Partial<Experience> = {
        id: experienceId,
        companyName: 'Acme Corp',
        title: 'Software Engineer',
      };

      mockExperienceService.getFullExperience.mockResolvedValue(mockExperience);

      const { resolveSegment } = useBreadcrumbMapping();
      const result = await resolveSegment(experienceId, 'experiences');

      expect(result).toBe('Acme Corp');
      expect(mockExperienceService.getFullExperience).toHaveBeenCalledWith(experienceId);
    });

    it.skip('should fallback to title if company name is missing', async () => {
      const experienceId = '550e8400-e29b-41d4-a716-446655440001'; // Different ID
      const mockExperience: Partial<Experience> = {
        id: experienceId,
        title: 'Freelance Developer',
        companyName: undefined,
      };

      mockExperienceService.getFullExperience.mockResolvedValue(mockExperience);

      const { resolveSegment } = useBreadcrumbMapping();
      const result = await resolveSegment(experienceId, 'experiences');

      expect(result).toBe('Freelance Developer');
    });

    it('should return null for UUID without previous segment', async () => {
      const { resolveSegment } = useBreadcrumbMapping();
      const result = await resolveSegment('550e8400-e29b-41d4-a716-446655440000');

      expect(result).toBeNull();
      expect(mockExperienceService.getFullExperience).not.toHaveBeenCalled();
    });

    it('should return null for UUID with unrecognized previous segment', async () => {
      const { resolveSegment } = useBreadcrumbMapping();
      const result = await resolveSegment('550e8400-e29b-41d4-a716-446655440000', 'unknown');

      expect(result).toBeNull();
      expect(mockExperienceService.getFullExperience).not.toHaveBeenCalled();
    });

    it.skip('should handle API errors gracefully and return ID as fallback', async () => {
      const experienceId = '550e8400-e29b-41d4-a716-446655440002'; // Different ID
      mockExperienceService.getFullExperience.mockRejectedValue(new Error('API error'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { resolveSegment } = useBreadcrumbMapping();
      const result = await resolveSegment(experienceId, 'experiences');

      expect(result).toBe(experienceId);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it.skip('should cache resolved names', async () => {
      const experienceId = '550e8400-e29b-41d4-a716-446655440003'; // Different ID
      const mockExperience: Partial<Experience> = {
        id: experienceId,
        companyName: 'Cache Test Corp',
      };

      mockExperienceService.getFullExperience.mockResolvedValue(mockExperience);

      const { resolveSegment } = useBreadcrumbMapping();

      // First call - should hit API
      const result1 = await resolveSegment(experienceId, 'experiences');
      expect(result1).toBe('Cache Test Corp');
      expect(mockExperienceService.getFullExperience).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result2 = await resolveSegment(experienceId, 'experiences');
      expect(result2).toBe('Cache Test Corp');
      expect(mockExperienceService.getFullExperience).toHaveBeenCalledTimes(1); // not called again
    });
  });

  describe('clearCache', () => {
    it.skip('should clear cached mappings', async () => {
      const experienceId = '550e8400-e29b-41d4-a716-446655440004'; // Different ID
      const mockExperience: Partial<Experience> = {
        id: experienceId,
        companyName: 'Clear Cache Corp',
      };

      mockExperienceService.getFullExperience.mockResolvedValue(mockExperience);

      const { resolveSegment, clearCache } = useBreadcrumbMapping();

      // First call - cache the result
      await resolveSegment(experienceId, 'experiences');
      expect(mockExperienceService.getFullExperience).toHaveBeenCalledTimes(1);

      // Clear cache
      clearCache();

      // Second call - should hit API again
      await resolveSegment(experienceId, 'experiences');
      expect(mockExperienceService.getFullExperience).toHaveBeenCalledTimes(2);
    });
  });
});
