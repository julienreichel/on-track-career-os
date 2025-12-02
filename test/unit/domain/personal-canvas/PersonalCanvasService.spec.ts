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
        userId: 'user-123',
        valueProposition: 'Experienced software engineer passionate about AI',
        keyActivities: ['Coding', 'Mentoring', 'System Design'],
        strengthsAdvantage: 'Strong technical leadership and problem-solving skills',
        targetRoles: ['Senior Engineer', 'Tech Lead', 'Engineering Manager'],
        channels: ['LinkedIn', 'GitHub', 'Tech Conferences'],
        resources: ['AWS Certification', 'Open Source Contributions', 'Technical Blog'],
        careerDirection: 'Moving towards technical leadership roles',
        painRelievers: ['Streamlining development processes', 'Reducing technical debt'],
        gainCreators: ['Improving team productivity', 'Delivering high-quality software'],
        lastGeneratedAt: '2025-01-15T00:00:00Z',
        needsUpdate: false,
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

    it('should handle errors from repository', async () => {
      mockRepository.get.mockRejectedValue(new Error('Database error'));

      await expect(service.getFullPersonalCanvas('personalcanvas-123')).rejects.toThrow(
        'Database error'
      );
    });

    it('should handle PersonalCanvas with minimal data', async () => {
      const minimalCanvas = {
        id: 'personalcanvas-123',
        userId: 'user-123',
        needsUpdate: false,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        owner: 'user-123::user-123',
      } as PersonalCanvas;

      mockRepository.get.mockResolvedValue(minimalCanvas);

      const result = await service.getFullPersonalCanvas('personalcanvas-123');

      expect(result).toEqual(minimalCanvas);
    });

    it('should handle PersonalCanvas with empty arrays', async () => {
      const canvasWithEmptyArrays = {
        id: 'personalcanvas-123',
        userId: 'user-123',
        keyActivities: [],
        targetRoles: [],
        channels: [],
        resources: [],
        painRelievers: [],
        gainCreators: [],
        needsUpdate: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        owner: 'user-123::user-123',
      } as PersonalCanvas;

      mockRepository.get.mockResolvedValue(canvasWithEmptyArrays);

      const result = await service.getFullPersonalCanvas('personalcanvas-123');

      expect(result).toEqual(canvasWithEmptyArrays);
      expect(result?.keyActivities).toEqual([]);
      expect(result?.targetRoles).toEqual([]);
      expect(result?.channels).toEqual([]);
      expect(result?.resources).toEqual([]);
    });

    it('should handle PersonalCanvas with needsUpdate flag set to true', async () => {
      const canvasNeedingUpdate = {
        id: 'personalcanvas-123',
        userId: 'user-123',
        valueProposition: 'Outdated value proposition',
        needsUpdate: true,
        lastGeneratedAt: '2025-01-01T00:00:00Z',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        owner: 'user-123::user-123',
      } as PersonalCanvas;

      mockRepository.get.mockResolvedValue(canvasNeedingUpdate);

      const result = await service.getFullPersonalCanvas('personalcanvas-123');

      expect(result?.needsUpdate).toBe(true);
      expect(result).toEqual(canvasNeedingUpdate);
    });

    it('should handle PersonalCanvas with all nine sections populated', async () => {
      const completeCanvas = {
        id: 'personalcanvas-123',
        userId: 'user-123',
        valueProposition: 'Full-stack engineer with cloud expertise',
        keyActivities: ['Development', 'Architecture', 'Code Review'],
        strengthsAdvantage: 'Comprehensive technical skills across stack',
        targetRoles: ['Staff Engineer', 'Principal Engineer'],
        channels: ['LinkedIn', 'Conferences', 'Meetups'],
        resources: ['GitHub Portfolio', 'Technical Certifications', 'Network'],
        careerDirection: 'Senior individual contributor path',
        painRelievers: ['Automation', 'Documentation', 'Best Practices'],
        gainCreators: ['Scalable Solutions', 'Team Efficiency', 'Innovation'],
        lastGeneratedAt: '2025-01-15T00:00:00Z',
        needsUpdate: false,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        owner: 'user-123::user-123',
      } as PersonalCanvas;

      mockRepository.get.mockResolvedValue(completeCanvas);

      const result = await service.getFullPersonalCanvas('personalcanvas-123');

      expect(result).toEqual(completeCanvas);
      expect(result?.valueProposition).toBeDefined();
      expect(result?.keyActivities).toBeDefined();
      expect(result?.strengthsAdvantage).toBeDefined();
      expect(result?.targetRoles).toBeDefined();
      expect(result?.channels).toBeDefined();
      expect(result?.resources).toBeDefined();
      expect(result?.careerDirection).toBeDefined();
      expect(result?.painRelievers).toBeDefined();
      expect(result?.gainCreators).toBeDefined();
    });
  });

  describe('constructor', () => {
    it('should use default repository when not provided', () => {
      const serviceWithDefaultRepo = new PersonalCanvasService();
      expect(serviceWithDefaultRepo).toBeInstanceOf(PersonalCanvasService);
    });

    it('should accept a custom repository', () => {
      const customRepo = new PersonalCanvasRepository();
      const serviceWithCustomRepo = new PersonalCanvasService(customRepo);
      expect(serviceWithCustomRepo).toBeInstanceOf(PersonalCanvasService);
    });
  });
});
