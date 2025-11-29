import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserProfileService } from '@/domain/user-profile/UserProfileService';
import { UserProfileRepository } from '@/domain/user-profile/UserProfileRepository';
import type { UserProfile } from '@/domain/user-profile/UserProfile';

// Mock the repository
vi.mock('@/domain/user-profile/UserProfileRepository');

describe('UserProfileService', () => {
  let service: UserProfileService;
  let mockRepository: ReturnType<typeof vi.mocked<UserProfileRepository>>;

  beforeEach(() => {
    mockRepository = {
      get: vi.fn(),
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<UserProfileRepository>>;

    service = new UserProfileService(mockRepository);
  });

  describe('getFullUserProfile', () => {
    it('should fetch a complete user profile by id', async () => {
      const mockUserProfile = {
        id: 'user-123',
        fullName: 'John Doe',
        headline: 'Software Engineer',
        location: 'San Francisco, CA',
        seniorityLevel: 'Senior',
        goals: ['Lead a team', 'Learn AI/ML'],
        aspirations: ['CTO'],
        personalValues: ['Innovation', 'Collaboration'],
        strengths: ['Problem Solving', 'Communication'],
        interests: ['Web Development', 'DevOps'],
        skills: ['TypeScript', 'Vue.js', 'AWS'],
        certifications: ['AWS Solutions Architect'],
        languages: ['English', 'Spanish'],
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        owner: 'user-123::user-123',
      } as UserProfile;

      mockRepository.get.mockResolvedValue(mockUserProfile);

      const result = await service.getFullUserProfile('user-123');

      expect(mockRepository.get).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockUserProfile);
    });

    it('should return null when user profile does not exist', async () => {
      mockRepository.get.mockResolvedValue(null);

      const result = await service.getFullUserProfile('non-existent-id');

      expect(mockRepository.get).toHaveBeenCalledWith('non-existent-id');
      expect(result).toBeNull();
    });

    it('should handle errors from repository', async () => {
      mockRepository.get.mockRejectedValue(new Error('Database error'));

      await expect(service.getFullUserProfile('user-123')).rejects.toThrow('Database error');
    });

    it('should handle user profiles with minimal data', async () => {
      const minimalProfile = {
        id: 'user-123',
        fullName: 'John Doe',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        owner: 'user-123::user-123',
      } as UserProfile;

      mockRepository.get.mockResolvedValue(minimalProfile);

      const result = await service.getFullUserProfile('user-123');

      expect(result).toEqual(minimalProfile);
    });

    it('should handle user profiles with empty arrays', async () => {
      const profileWithEmptyArrays = {
        id: 'user-123',
        fullName: 'John Doe',
        goals: [],
        aspirations: [],
        personalValues: [],
        strengths: [],
        interests: [],
        skills: [],
        certifications: [],
        languages: [],
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        owner: 'user-123::user-123',
      } as UserProfile;

      mockRepository.get.mockResolvedValue(profileWithEmptyArrays);

      const result = await service.getFullUserProfile('user-123');

      expect(result).toEqual(profileWithEmptyArrays);
      expect(result?.goals).toEqual([]);
      expect(result?.skills).toEqual([]);
    });
  });

  describe('constructor', () => {
    it('should use default repository when not provided', () => {
      const serviceWithDefaultRepo = new UserProfileService();
      expect(serviceWithDefaultRepo).toBeInstanceOf(UserProfileService);
    });

    it('should accept a custom repository', () => {
      const customRepo = new UserProfileRepository();
      const serviceWithCustomRepo = new UserProfileService(customRepo);
      expect(serviceWithCustomRepo).toBeInstanceOf(UserProfileService);
    });
  });
});
