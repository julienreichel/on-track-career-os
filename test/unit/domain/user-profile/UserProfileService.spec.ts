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
      getForTailoring: vi.fn(),
      getCanvasSnapshot: vi.fn(),
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getProgressSnapshot: vi.fn(),
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
      } as unknown as UserProfile;

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

  describe('getProgressSnapshot', () => {
    it('should delegate to repository', async () => {
      const snapshot = { profile: { id: 'user-123' } } as unknown as {
        profile: UserProfile;
      };
      mockRepository.getProgressSnapshot.mockResolvedValue(snapshot);

      const result = await service.getProgressSnapshot('user-123');

      expect(mockRepository.getProgressSnapshot).toHaveBeenCalledWith('user-123');
      expect(result).toBe(snapshot);
    });
  });

  describe('getProfileForTailoring', () => {
    it('should delegate to repository', async () => {
      const profile = { id: 'user-123' } as UserProfile;
      mockRepository.getForTailoring.mockResolvedValue(profile);

      const result = await service.getProfileForTailoring('user-123');

      expect(mockRepository.getForTailoring).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(profile);
    });
  });

  describe('getCanvasForUser', () => {
    it('should delegate to repository', async () => {
      const canvas = { id: 'canvas-1' };
      mockRepository.getCanvasSnapshot.mockResolvedValue(canvas);

      const result = await service.getCanvasForUser('user-123');

      expect(mockRepository.getCanvasSnapshot).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(canvas);
    });
  });

  describe('updateUserProfile', () => {
    it('should update profile via repository', async () => {
      const updatedProfile = { id: 'user-123', fullName: 'Updated' } as UserProfile;
      mockRepository.update.mockResolvedValue(updatedProfile);

      const result = await service.updateUserProfile({
        id: 'user-123',
        fullName: 'Updated',
      });

      expect(mockRepository.update).toHaveBeenCalledWith({
        id: 'user-123',
        fullName: 'Updated',
      });
      expect(result).toEqual(updatedProfile);
    });
  });
});
