import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserProfileRepository, type AmplifyUserProfileModel } from '@/domain/user-profile/UserProfileRepository';
import type { UserProfileCreateInput, UserProfileUpdateInput } from '@/domain/user-profile/UserProfile';

// Mock gqlOptions
vi.mock('@/data/graphql/options', () => ({
  gqlOptions: (custom?: Record<string, unknown>) => ({
    authMode: 'userPool',
    ...custom,
  }),
}));

describe('UserProfileRepository', () => {
  let repository: UserProfileRepository;
  let mockModel: AmplifyUserProfileModel;

  beforeEach(() => {
    // Create a fresh mock model for each test
    mockModel = {
      get: vi.fn(),
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    // Inject the mock model via constructor (dependency injection)
    repository = new UserProfileRepository(mockModel);
  });

  describe('get', () => {
    it('should fetch a user profile by id', async () => {
      const mockUserProfile = {
        id: 'user-123',
        fullName: 'John Doe',
        email: 'john@example.com',
        headline: 'Software Engineer',
      };

      mockModel.get.mockResolvedValue({
        data: mockUserProfile,
      });

      const result = await repository.get('user-123');

      expect(mockModel.get).toHaveBeenCalledWith(
        { id: 'user-123' },
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(result).toEqual(mockUserProfile);
    });

    it('should return null when user profile is not found', async () => {
      mockModel.get.mockResolvedValue({
        data: null,
      });

      const result = await repository.get('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    it('should fetch a list of user profiles', async () => {
      const mockUserProfiles = [
        { id: 'user-1', fullName: 'John Doe' },
        { id: 'user-2', fullName: 'Jane Smith' },
      ];

      mockModel.list.mockResolvedValue({
        data: mockUserProfiles,
      });

      const result = await repository.list();

      expect(mockModel.list).toHaveBeenCalledWith(
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(result).toEqual(mockUserProfiles);
    });

    it('should apply filters when provided', async () => {
      const mockFilter = { seniorityLevel: 'Senior' };
      mockModel.list.mockResolvedValue({
        data: [],
      });

      await repository.list(mockFilter);

      // The actual implementation passes filter as first argument, options as second
      expect(mockModel.list).toHaveBeenCalledWith(
        expect.objectContaining({ authMode: 'userPool', seniorityLevel: 'Senior' })
      );
    });
  });

  describe('create', () => {
    it('should create a new user profile', async () => {
      const input: UserProfileCreateInput = {
        fullName: 'John Doe',
        headline: 'Software Engineer',
        location: 'San Francisco, CA',
      };

      const mockCreatedProfile = {
        id: 'new-user-123',
        ...input,
        createdAt: new Date().toISOString(),
      };

      mockModel.create.mockResolvedValue({
        data: mockCreatedProfile,
      });

      const result = await repository.create(input);

      expect(mockModel.create).toHaveBeenCalledWith(
        input,
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(result).toEqual(mockCreatedProfile);
    });

    it('should handle creation errors', async () => {
      const input: UserProfileCreateInput = {
        fullName: 'John Doe',
      };

      mockModel.create.mockRejectedValue(new Error('Creation failed'));

      await expect(repository.create(input)).rejects.toThrow('Creation failed');
    });
  });

  describe('update', () => {
    it('should update an existing user profile', async () => {
      const input: UserProfileUpdateInput = {
        id: 'user-123',
        fullName: 'John Doe Updated',
        headline: 'Senior Software Engineer',
      };

      const mockUpdatedProfile = {
        ...input,
        updatedAt: new Date().toISOString(),
      };

      mockModel.update.mockResolvedValue({
        data: mockUpdatedProfile,
      });

      const result = await repository.update(input);

      expect(mockModel.update).toHaveBeenCalledWith(
        input,
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(result).toEqual(mockUpdatedProfile);
    });

    it('should handle partial updates', async () => {
      const input: UserProfileUpdateInput = {
        id: 'user-123',
        headline: 'New Headline',
      };

      mockModel.update.mockResolvedValue({
        data: input,
      });

      const result = await repository.update(input);

      expect(mockModel.update).toHaveBeenCalledWith(
        input,
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(result).toEqual(input);
    });
  });

  describe('delete', () => {
    it('should delete a user profile by id', async () => {
      mockModel.delete.mockResolvedValue({
        data: null,
      });

      await repository.delete('user-123');

      expect(mockModel.delete).toHaveBeenCalledWith(
        { id: 'user-123' },
        expect.objectContaining({ authMode: 'userPool' })
      );
    });

    it('should handle deletion errors', async () => {
      mockModel.delete.mockRejectedValue(new Error('Deletion failed'));

      await expect(repository.delete('user-123')).rejects.toThrow('Deletion failed');
    });
  });
});
