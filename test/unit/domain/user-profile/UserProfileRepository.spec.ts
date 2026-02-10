import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  UserProfileRepository,
  type AmplifyUserProfileModel,
  type AmplifyMutations,
} from '@/domain/user-profile/UserProfileRepository';
import type { UserProfileUpdateInput } from '@/domain/user-profile/UserProfile';

// Mock gqlOptions
vi.mock('@/data/graphql/options', () => ({
  gqlOptions: (custom?: Record<string, unknown>) => ({
    authMode: 'userPool',
    ...custom,
  }),
}));

describe('UserProfileRepository', () => {
  let repository: UserProfileRepository;
  let mockModel: {
    get: ReturnType<typeof vi.fn>;
    list: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let mockMutations: {
    deleteUserProfileWithAuth: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Create fresh mocks for each test
    mockModel = {
      get: vi.fn(),
      list: vi.fn(),
      update: vi.fn(),
    };

    mockMutations = {
      deleteUserProfileWithAuth: vi.fn(),
    };

    // Inject the mocks via constructor (dependency injection)
    repository = new UserProfileRepository(
      mockModel as AmplifyUserProfileModel,
      mockMutations as AmplifyMutations
    );
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

  describe('getForTailoring', () => {
    it('should return null when id is missing', async () => {
      const result = await repository.getForTailoring('');

      expect(mockModel.get).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should fetch tailoring profile with related data', async () => {
      const mockUserProfile = {
        id: 'user-123',
        fullName: 'John Doe',
      };

      mockModel.get.mockResolvedValue({
        data: mockUserProfile,
      });

      const result = await repository.getForTailoring('user-123');

      expect(mockModel.get).toHaveBeenCalledWith(
        { id: 'user-123' },
        expect.objectContaining({
          selectionSet: expect.arrayContaining([
            'experiences.*',
            'experiences.stories.*',
            'canvas.*',
          ]),
        })
      );
      expect(result).toEqual(mockUserProfile);
    });
  });

  describe('getCanvasSnapshot', () => {
    it('should return null when id is missing', async () => {
      const result = await repository.getCanvasSnapshot('');

      expect(mockModel.get).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should fetch canvas snapshot with selection set', async () => {
      const mockUserProfile = {
        id: 'user-123',
        canvas: { id: 'canvas-1' },
      };

      mockModel.get.mockResolvedValue({
        data: mockUserProfile,
      });

      const result = await repository.getCanvasSnapshot('user-123');

      expect(mockModel.get).toHaveBeenCalledWith(
        { id: 'user-123' },
        expect.objectContaining({
          selectionSet: expect.arrayContaining(['canvas.*']),
        })
      );
      expect(result).toEqual({ id: 'canvas-1' });
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

  describe('getProgressSnapshot', () => {
    it('should return null when id is missing', async () => {
      const result = await repository.getProgressSnapshot('');

      expect(mockModel.get).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null when no profile data is returned', async () => {
      mockModel.get.mockResolvedValue({ data: null });

      const result = await repository.getProgressSnapshot('user-123');

      expect(result).toBeNull();
    });

    it('should normalize snapshot arrays and stories', async () => {
      mockModel.get.mockResolvedValue({
        data: {
          id: 'user-123',
          experiences: [
            { id: 'exp-1', stories: [{ id: 'story-1' }] },
            null,
            { id: 'exp-2', stories: null },
          ],
          canvas: { id: 'canvas-1' },
          cvs: [{ id: 'cv-1' }, null],
          coverLetters: [{ id: 'cover-1' }],
          speechBlocks: null,
          matchingSummaries: [{ id: 'match-1' }],
        },
      });

      const result = await repository.getProgressSnapshot('user-123');

      expect(mockModel.get).toHaveBeenCalledWith(
        { id: 'user-123' },
        expect.objectContaining({
          selectionSet: expect.arrayContaining([
            'experiences.*',
            'canvas.*',
            'matchingSummaries.*',
          ]),
        })
      );
      expect(result?.experiences).toHaveLength(2);
      expect(result?.stories).toHaveLength(1);
      expect(result?.personalCanvas).toEqual({ id: 'canvas-1' });
      expect(result?.cvs).toHaveLength(1);
      expect(result?.speechBlocks).toEqual([]);
      expect(result?.matchingSummaries).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update an existing user profile', async () => {
      const input = {
        id: 'user-123',
        fullName: 'John Doe Updated',
        headline: 'Senior Software Engineer',
      } as unknown as UserProfileUpdateInput;

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
      const input = {
        id: 'user-123',
        headline: 'New Headline',
      } as unknown as UserProfileUpdateInput;

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
      mockMutations.deleteUserProfileWithAuth.mockResolvedValue({
        data: true,
      });

      const result = await repository.delete('user-123');

      expect(mockMutations.deleteUserProfileWithAuth).toHaveBeenCalledWith({
        userId: 'user-123',
      }, {
        authMode: 'userPool',
      });
      expect(result).toBe(true);
    });

    it('should handle deletion errors', async () => {
      mockMutations.deleteUserProfileWithAuth.mockRejectedValue(new Error('Deletion failed'));

      await expect(repository.delete('user-123')).rejects.toThrow('Deletion failed');
    });
  });
});
