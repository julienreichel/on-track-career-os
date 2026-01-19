import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  PersonalCanvasRepository,
  type AmplifyPersonalCanvasModel,
} from '@/domain/personal-canvas/PersonalCanvasRepository';
import type {
  PersonalCanvasCreateInput,
  PersonalCanvasUpdateInput,
} from '@/domain/personal-canvas/PersonalCanvas';

// Mock gqlOptions
vi.mock('@/data/graphql/options', () => ({
  gqlOptions: (custom?: Record<string, unknown>) => ({
    authMode: 'userPool',
    ...custom,
  }),
}));

describe('PersonalCanvasRepository', () => {
  let repository: PersonalCanvasRepository;
  let mockModel: {
    get: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Create fresh mocks for each test
    mockModel = {
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    // Inject the mock via constructor (dependency injection)
    repository = new PersonalCanvasRepository(mockModel as AmplifyPersonalCanvasModel);
  });

  describe('get', () => {
    it('should fetch a PersonalCanvas by id', async () => {
      const mockPersonalCanvas = {
        id: 'canvas-123',
        userId: 'user-123',
        valueProposition: 'Experienced engineer',
        keyActivities: ['Development', 'Mentoring'],
        strengthsAdvantage: 'Technical leadership',
        targetRoles: ['Senior Engineer'],
        channels: ['LinkedIn'],
        resources: ['AWS Certification'],
        careerDirection: 'Technical leadership',
        painRelievers: ['Process improvement'],
        gainCreators: ['Team productivity'],
        needsUpdate: false,
      };

      mockModel.get.mockResolvedValue({
        data: mockPersonalCanvas,
      });

      const result = await repository.get('canvas-123');

      expect(mockModel.get).toHaveBeenCalledWith(
        { id: 'canvas-123' },
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(result).toEqual(mockPersonalCanvas);
    });

    it('should return null when PersonalCanvas is not found', async () => {
      mockModel.get.mockResolvedValue({
        data: null,
      });

      const result = await repository.get('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new PersonalCanvas', async () => {
      const input = {
        userId: 'user-123',
        valueProposition: 'New value proposition',
        keyActivities: ['Activity 1', 'Activity 2'],
        strengthsAdvantage: 'Key strength',
        targetRoles: ['Target Role 1'],
        channels: ['Channel 1'],
        resources: ['Resource 1'],
        careerDirection: 'Career path',
        painRelievers: ['Pain 1'],
        gainCreators: ['Gain 1'],
        needsUpdate: false,
      } as unknown as PersonalCanvasCreateInput;

      const mockCreatedCanvas = {
        ...input,
        id: 'canvas-456',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockModel.create.mockResolvedValue({
        data: mockCreatedCanvas,
      });

      const result = await repository.create(input);

      expect(mockModel.create).toHaveBeenCalledWith(
        input,
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(result).toEqual(mockCreatedCanvas);
    });

    it('should handle creating PersonalCanvas with minimal fields', async () => {
      const input = {
        userId: 'user-123',
        needsUpdate: true,
      } as unknown as PersonalCanvasCreateInput;

      const mockCreatedCanvas = {
        ...input,
        id: 'canvas-789',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockModel.create.mockResolvedValue({
        data: mockCreatedCanvas,
      });

      const result = await repository.create(input);

      expect(result).toEqual(mockCreatedCanvas);
    });

    it('should handle creating PersonalCanvas with empty arrays', async () => {
      const input = {
        userId: 'user-123',
        keyActivities: [],
        targetRoles: [],
        channels: [],
        resources: [],
        painRelievers: [],
        gainCreators: [],
        needsUpdate: false,
      } as unknown as PersonalCanvasCreateInput;

      mockModel.create.mockResolvedValue({
        data: { ...input, id: 'canvas-new' },
      });

      const result = await repository.create(input);

      expect(result?.keyActivities).toEqual([]);
      expect(result?.targetRoles).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update an existing PersonalCanvas', async () => {
      const input = {
        id: 'canvas-123',
        valueProposition: 'Updated value proposition',
        needsUpdate: false,
      } as unknown as PersonalCanvasUpdateInput;

      const mockUpdatedCanvas = {
        ...input,
        userId: 'user-123',
        updatedAt: new Date().toISOString(),
      };

      mockModel.update.mockResolvedValue({
        data: mockUpdatedCanvas,
      });

      const result = await repository.update(input);

      expect(mockModel.update).toHaveBeenCalledWith(
        input,
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(result).toEqual(mockUpdatedCanvas);
    });

    it('should handle partial updates', async () => {
      const input = {
        id: 'canvas-123',
        needsUpdate: true,
      } as unknown as PersonalCanvasUpdateInput;

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

    it('should handle updating array fields', async () => {
      const input = {
        id: 'canvas-123',
        keyActivities: ['Updated Activity 1', 'Updated Activity 2', 'Updated Activity 3'],
        targetRoles: ['Updated Role 1', 'Updated Role 2'],
      } as unknown as PersonalCanvasUpdateInput;

      mockModel.update.mockResolvedValue({
        data: input,
      });

      const result = await repository.update(input);

      expect(result?.keyActivities).toHaveLength(3);
      expect(result?.targetRoles).toHaveLength(2);
    });

    it('should handle updating lastGeneratedAt timestamp', async () => {
      const input = {
        id: 'canvas-123',
        lastGeneratedAt: '2025-01-15T12:00:00Z',
        needsUpdate: false,
      } as unknown as PersonalCanvasUpdateInput;

      mockModel.update.mockResolvedValue({
        data: input,
      });

      const result = await repository.update(input);

      expect(result?.lastGeneratedAt).toBe('2025-01-15T12:00:00Z');
      expect(result?.needsUpdate).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete a PersonalCanvas by id', async () => {
      mockModel.delete.mockResolvedValue({
        data: { id: 'canvas-123' },
      });

      await repository.delete('canvas-123');

      expect(mockModel.delete).toHaveBeenCalledWith(
        { id: 'canvas-123' },
        expect.objectContaining({ authMode: 'userPool' })
      );
    });

    it('should handle deletion errors', async () => {
      mockModel.delete.mockRejectedValue(new Error('Deletion failed'));

      await expect(repository.delete('canvas-123')).rejects.toThrow('Deletion failed');
    });

    it('should not throw when deleting non-existent PersonalCanvas', async () => {
      mockModel.delete.mockResolvedValue({
        data: null,
      });

      await expect(repository.delete('non-existent-id')).resolves.not.toThrow();
    });
  });

  describe('constructor', () => {
    it('should accept a custom model via dependency injection', () => {
      const customModel = {
        get: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      };

      const repoWithCustomModel = new PersonalCanvasRepository(
        customModel as AmplifyPersonalCanvasModel
      );

      expect(repoWithCustomModel).toBeInstanceOf(PersonalCanvasRepository);
    });
  });
});
