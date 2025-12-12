import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ExperienceRepository,
  type AmplifyExperienceModel,
} from '@/domain/experience/ExperienceRepository';
import type {
  ExperienceCreateInput,
  ExperienceUpdateInput,
  Experience,
} from '@/domain/experience/Experience';
import type { UserProfile } from '@/domain/user-profile/UserProfile';
import { loadLazyAll } from '@/data/graphql/lazy';

// Mock gqlOptions and lazy loading utilities
vi.mock('@/data/graphql/options', () => ({
  gqlOptions: (custom?: Record<string, unknown>) => ({
    authMode: 'userPool',
    ...custom,
  }),
}));

vi.mock('@/data/graphql/lazy', () => ({
  loadLazyAll: vi.fn(),
}));

describe('ExperienceRepository', () => {
  let repository: ExperienceRepository;
  let mockModel: {
    get: ReturnType<typeof vi.fn>;
    list: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Create fresh mocks for each test
    mockModel = {
      get: vi.fn(),
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    // Inject the mocks via constructor (dependency injection)
    repository = new ExperienceRepository(mockModel as AmplifyExperienceModel);
  });

  describe('get', () => {
    it('should fetch an experience by id', async () => {
      const mockExperience: Experience = {
        id: 'exp-123',
        userId: 'user-123',
        title: 'Senior Software Engineer',
        companyName: 'Tech Corp',
        startDate: '2020-01-01',
        endDate: '2023-12-31',
        responsibilities: ['Led development team', 'Designed architecture'],
        tasks: ['Implemented features', 'Conducted code reviews'],
        status: 'complete',
        rawText: 'Experience text',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      } as Experience;

      mockModel.get.mockResolvedValue({
        data: mockExperience,
      });

      const result = await repository.get('exp-123');

      expect(mockModel.get).toHaveBeenCalledWith(
        { id: 'exp-123' },
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(result).toEqual(mockExperience);
      expect(result?.title).toBe('Senior Software Engineer');
    });

    it('should return null when experience is not found', async () => {
      mockModel.get.mockResolvedValue({
        data: null,
      });

      const result = await repository.get('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    it('should fetch a list of experiences', async () => {
      const mockExperiences: Experience[] = [
        {
          id: 'exp-1',
          userId: 'user-123',
          title: 'Senior Software Engineer',
          companyName: 'Tech Corp',
          startDate: '2020-01-01',
          endDate: '2023-12-31',
          responsibilities: ['Led team'],
          tasks: ['Built systems'],
          status: 'complete',
          rawText: 'Text 1',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 'exp-2',
          userId: 'user-123',
          title: 'Software Engineer',
          companyName: 'StartupCo',
          startDate: '2018-01-01',
          endDate: '2020-12-31',
          responsibilities: ['Developed features'],
          tasks: ['Fixed bugs'],
          status: 'draft',
          rawText: 'Text 2',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ] as Experience[];

      const mockUserProfile = {
        id: 'user-123',
        experiences: vi.fn(),
      } as unknown as UserProfile;

      vi.mocked(loadLazyAll).mockResolvedValue(mockExperiences);

      const result = await repository.list(mockUserProfile);

      expect(result).toEqual(mockExperiences);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when userProfile has no experiences', async () => {
      const mockUserProfile = {
        id: 'user-123',
        experiences: undefined,
      } as unknown as UserProfile;

      const result = await repository.list(mockUserProfile);

      expect(result).toEqual([]);
    });

    it('should return empty array when no experiences exist', async () => {
      const mockUserProfile = {
        id: 'user-123',
        experiences: vi.fn(),
      } as unknown as UserProfile;

      vi.mocked(loadLazyAll).mockResolvedValue([]);

      const result = await repository.list(mockUserProfile);

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create a new experience', async () => {
      const mockInput: ExperienceCreateInput = {
        userId: 'user-123',
        title: 'Senior Software Engineer',
        companyName: 'Tech Corp',
        startDate: '2020-01-01',
        endDate: '2023-12-31',
        responsibilities: ['Led team', 'Designed systems'],
        tasks: ['Implemented features', 'Reviewed code'],
        status: 'draft',
        rawText: 'Experience raw text',
      } as unknown as ExperienceCreateInput;

      const mockCreatedExperience: Experience = {
        id: 'exp-new',
        ...mockInput,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      } as Experience;

      mockModel.create.mockResolvedValue({
        data: mockCreatedExperience,
      });

      const result = await repository.create(mockInput);

      expect(mockModel.create).toHaveBeenCalledWith(
        mockInput,
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(result).toEqual(mockCreatedExperience);
      expect(result?.id).toBe('exp-new');
    });

    it('should return null when creation fails', async () => {
      const mockInput: ExperienceCreateInput = {
        userId: 'user-123',
        title: 'Test',
        companyName: 'Test Corp',
        startDate: '2020-01-01',
        responsibilities: [],
        tasks: [],
        status: 'draft',
        rawText: '',
      } as unknown as ExperienceCreateInput;

      mockModel.create.mockResolvedValue({
        data: null,
      });

      const result = await repository.create(mockInput);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update an existing experience', async () => {
      const mockInput: ExperienceUpdateInput = {
        id: 'exp-123',
        title: 'Principal Software Engineer',
        status: 'complete',
      } as unknown as ExperienceUpdateInput;

      const mockUpdatedExperience: Experience = {
        id: 'exp-123',
        userId: 'user-123',
        title: 'Principal Software Engineer',
        companyName: 'Tech Corp',
        startDate: '2020-01-01',
        endDate: '2023-12-31',
        responsibilities: ['Led team'],
        tasks: ['Built systems'],
        status: 'complete',
        rawText: 'Text',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z',
      } as Experience;

      mockModel.update.mockResolvedValue({
        data: mockUpdatedExperience,
      });

      const result = await repository.update(mockInput);

      expect(mockModel.update).toHaveBeenCalledWith(
        mockInput,
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(result).toEqual(mockUpdatedExperience);
      expect(result?.title).toBe('Principal Software Engineer');
    });

    it('should handle partial updates', async () => {
      const mockInput: ExperienceUpdateInput = {
        id: 'exp-123',
        status: 'complete',
      } as unknown as ExperienceUpdateInput;

      mockModel.update.mockResolvedValue({
        data: {
          id: 'exp-123',
          status: 'complete',
        } as Experience,
      });

      const result = await repository.update(mockInput);

      expect(result?.status).toBe('complete');
    });
  });

  describe('delete', () => {
    it('should delete an experience by id', async () => {
      mockModel.delete.mockResolvedValue({
        data: {
          id: 'exp-123',
        } as Experience,
      });

      await repository.delete('exp-123');

      expect(mockModel.delete).toHaveBeenCalledWith(
        { id: 'exp-123' },
        expect.objectContaining({ authMode: 'userPool' })
      );
    });

    it('should not throw error when deleting non-existent experience', async () => {
      mockModel.delete.mockResolvedValue({
        data: null,
      });

      await expect(repository.delete('non-existent-id')).resolves.not.toThrow();
    });
  });
});
