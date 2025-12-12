import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PersonalCanvasService } from '@/domain/personal-canvas/PersonalCanvasService';
import { PersonalCanvasRepository } from '@/domain/personal-canvas/PersonalCanvasRepository';
import { AiOperationsRepository } from '@/domain/ai-operations/AiOperationsRepository';
import type { PersonalCanvas } from '@/domain/personal-canvas/PersonalCanvas';
import type { PersonalCanvasInput } from '@/domain/ai-operations/PersonalCanvas';

// Mock the repositories
vi.mock('@/domain/personal-canvas/PersonalCanvasRepository');
vi.mock('@/domain/ai-operations/AiOperationsRepository');

describe('PersonalCanvasService', () => {
  let service: PersonalCanvasService;
  let mockRepository: ReturnType<typeof vi.mocked<PersonalCanvasRepository>>;
  let mockAiRepository: ReturnType<typeof vi.mocked<AiOperationsRepository>>;

  beforeEach(() => {
    mockRepository = {
      get: vi.fn(),
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<PersonalCanvasRepository>>;

    mockAiRepository = {
      generatePersonalCanvas: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<AiOperationsRepository>>;

    service = new PersonalCanvasService(mockRepository, mockAiRepository);
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

  describe('regenerateCanvas', () => {
    it('should call AI operation to generate PersonalCanvas', async () => {
      const mockInput: PersonalCanvasInput = {
        profile: {
          name: 'John Doe',
          currentRole: 'Senior Engineer',
          yearsOfExperience: 8,
          targetRole: 'Tech Lead',
        },
        experiences: [
          {
            title: 'Senior Software Engineer',
            company: 'Tech Corp',
            description: 'Led team of 5 engineers',
          },
        ],
        stories: [
          {
            situation: 'Complex migration project',
            task: 'Lead database migration',
            action: 'Designed and executed migration strategy',
            result: 'Zero downtime, 50% performance improvement',
          },
        ],
      };

      const mockGeneratedCanvas = {
        id: 'generated-canvas-123',
        userId: 'user-123',
        valueProposition: 'Technical leader with proven track record',
        keyActivities: ['Leadership', 'Architecture', 'Mentoring'],
        strengthsAdvantage: 'Strong technical and people skills',
        targetRoles: ['Tech Lead', 'Engineering Manager'],
        channels: ['LinkedIn', 'GitHub', 'Conferences'],
        resources: ['Technical expertise', 'Leadership experience'],
        careerDirection: 'Technical leadership path',
        painRelievers: ['Process improvement', 'Team enablement'],
        gainCreators: ['High-quality delivery', 'Team growth'],
        lastGeneratedAt: '2025-01-15T00:00:00Z',
        needsUpdate: false,
        createdAt: '2025-01-15T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        owner: 'user-123::user-123',
      } as PersonalCanvas;

      mockAiRepository.generatePersonalCanvas.mockResolvedValue(mockGeneratedCanvas);

      const result = await service.regenerateCanvas(mockInput);

      expect(mockAiRepository.generatePersonalCanvas).toHaveBeenCalledWith(mockInput);
      expect(result).toEqual(mockGeneratedCanvas);
    });

    it('should handle AI operation errors', async () => {
      const mockInput: PersonalCanvasInput = {
        profile: { name: 'John Doe', currentRole: 'Engineer', yearsOfExperience: 5 },
        experiences: [],
        stories: [],
      };

      mockAiRepository.generatePersonalCanvas.mockRejectedValue(
        new Error('AI service unavailable')
      );

      await expect(service.regenerateCanvas(mockInput)).rejects.toThrow('AI service unavailable');
      expect(mockAiRepository.generatePersonalCanvas).toHaveBeenCalledWith(mockInput);
    });

    it('should pass through all input data to AI operation', async () => {
      const complexInput: PersonalCanvasInput = {
        profile: {
          name: 'Jane Smith',
          currentRole: 'Staff Engineer',
          yearsOfExperience: 12,
          targetRole: 'Principal Engineer',
          skills: ['TypeScript', 'System Design', 'Leadership'],
        },
        experiences: [
          {
            title: 'Staff Engineer',
            company: 'Big Tech',
            description: 'Led multiple cross-functional initiatives',
            achievements: ['Reduced latency by 60%', 'Mentored 10+ engineers'],
          },
          {
            title: 'Senior Engineer',
            company: 'Startup',
            description: 'Built core platform from scratch',
          },
        ],
        stories: [
          {
            situation: 'System scaling challenge',
            task: 'Scale to 10x traffic',
            action: 'Redesigned architecture',
            result: 'Handled 10x load with 99.99% uptime',
          },
        ],
      };

      const mockResult = {
        userId: 'user-123',
        valueProposition: 'Generated from complex input',
        keyActivities: ['Technical Strategy'],
        strengthsAdvantage: 'Deep technical expertise',
        targetRoles: ['Principal Engineer'],
        channels: ['Tech Talks'],
        resources: ['Network'],
        careerDirection: 'IC leadership',
        painRelievers: ['Scaling solutions'],
        gainCreators: ['System reliability'],
        lastGeneratedAt: '2025-01-15T00:00:00Z',
        needsUpdate: false,
        createdAt: '2025-01-15T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        owner: 'user-123::user-123',
      } as PersonalCanvas;

      mockAiRepository.generatePersonalCanvas.mockResolvedValue(mockResult);

      const result = await service.regenerateCanvas(complexInput);

      expect(mockAiRepository.generatePersonalCanvas).toHaveBeenCalledWith(complexInput);
      expect(result).toEqual(mockResult);
    });
  });

  describe('constructor', () => {
    it('should use default repositories when not provided', () => {
      const serviceWithDefaultRepos = new PersonalCanvasService();
      expect(serviceWithDefaultRepos).toBeInstanceOf(PersonalCanvasService);
    });

    it('should accept custom repositories', () => {
      const customRepo = new PersonalCanvasRepository();
      const customAiRepo = new AiOperationsRepository();
      const serviceWithCustomRepos = new PersonalCanvasService(customRepo, customAiRepo);
      expect(serviceWithCustomRepos).toBeInstanceOf(PersonalCanvasService);
    });
  });
});
