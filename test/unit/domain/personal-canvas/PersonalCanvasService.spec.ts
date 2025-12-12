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
        customerSegments: ['Tech Companies', 'Startups', 'AI Companies'],
        valueProposition: [
          'Experienced software engineer passionate about AI',
          'Strong technical leadership',
        ],
        channels: ['LinkedIn', 'GitHub', 'Tech Conferences'],
        customerRelationships: ['Professional networking', 'Open source contributions'],
        keyActivities: ['Coding', 'Mentoring', 'System Design'],
        keyResources: ['AWS Certification', 'Open Source Contributions', 'Technical Blog'],
        keyPartners: ['Tech mentors', 'Professional associations'],
        costStructure: ['Certifications', 'Conference attendance', 'Tool subscriptions'],
        revenueStreams: ['Salary', 'Stock options', 'Performance bonuses'],
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
        customerSegments: [],
        valueProposition: [],
        channels: [],
        customerRelationships: [],
        keyActivities: [],
        keyResources: [],
        keyPartners: [],
        costStructure: [],
        revenueStreams: [],
        needsUpdate: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        owner: 'user-123::user-123',
      } as PersonalCanvas;

      mockRepository.get.mockResolvedValue(canvasWithEmptyArrays);

      const result = await service.getFullPersonalCanvas('personalcanvas-123');

      expect(result).toEqual(canvasWithEmptyArrays);
      expect(result?.customerSegments).toEqual([]);
      expect(result?.valueProposition).toEqual([]);
      expect(result?.channels).toEqual([]);
      expect(result?.keyActivities).toEqual([]);
    });

    it('should handle PersonalCanvas with needsUpdate flag set to true', async () => {
      const canvasNeedingUpdate = {
        id: 'personalcanvas-123',
        userId: 'user-123',
        valueProposition: ['Outdated value proposition'],
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
        customerSegments: ['Fortune 500', 'Tech Startups'],
        valueProposition: ['Full-stack engineer with cloud expertise'],
        channels: ['LinkedIn', 'Conferences', 'Meetups'],
        customerRelationships: ['Direct networking', 'Referrals'],
        keyActivities: ['Development', 'Architecture', 'Code Review'],
        keyResources: ['GitHub Portfolio', 'Technical Certifications', 'Network'],
        keyPartners: ['Recruiters', 'Tech mentors', 'Professional associations'],
        costStructure: ['Certifications', 'Conferences', 'Tools'],
        revenueStreams: ['Salary', 'Equity', 'Bonuses'],
        lastGeneratedAt: '2025-01-15T00:00:00Z',
        needsUpdate: false,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        owner: 'user-123::user-123',
      } as PersonalCanvas;

      mockRepository.get.mockResolvedValue(completeCanvas);

      const result = await service.getFullPersonalCanvas('personalcanvas-123');

      expect(result).toEqual(completeCanvas);
      expect(result?.customerSegments).toBeDefined();
      expect(result?.valueProposition).toBeDefined();
      expect(result?.channels).toBeDefined();
      expect(result?.customerRelationships).toBeDefined();
      expect(result?.keyActivities).toBeDefined();
      expect(result?.keyResources).toBeDefined();
      expect(result?.keyPartners).toBeDefined();
      expect(result?.costStructure).toBeDefined();
      expect(result?.revenueStreams).toBeDefined();
    });
  });

  describe('regenerateCanvas', () => {
    it('should call AI operation to generate PersonalCanvas', async () => {
      const mockInput = {
        profile: {
          fullName: 'John Doe',
          headline: 'Senior Engineer with 8 years experience',
          summary: 'Aspiring Tech Lead',
        },
        experiences: [
          {
            title: 'Senior Software Engineer',
            company: 'Tech Corp',
            responsibilities: ['Led team of 5 engineers'],
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
      } as PersonalCanvasInput;

      const mockGeneratedCanvas = {
        customerSegments: ['Tech Companies', 'Engineering Teams'],
        valueProposition: ['Technical leader with proven track record'],
        channels: ['LinkedIn', 'GitHub', 'Conferences'],
        customerRelationships: ['Professional networking', 'Thought leadership'],
        keyActivities: ['Leadership', 'Architecture', 'Mentoring'],
        keyResources: ['Technical expertise', 'Leadership experience'],
        keyPartners: ['Executive coaches', 'Peer network'],
        costStructure: ['Leadership training', 'Conference speaking'],
        revenueStreams: ['Salary', 'Equity', 'Performance bonuses'],
      };

      mockAiRepository.generatePersonalCanvas.mockResolvedValue(mockGeneratedCanvas as any);

      const result = await service.regenerateCanvas(mockInput);

      expect(mockAiRepository.generatePersonalCanvas).toHaveBeenCalledWith(mockInput);
      expect(result).toEqual(mockGeneratedCanvas);
    });

    it('should handle AI operation errors', async () => {
      const mockInput: PersonalCanvasInput = {
        profile: { fullName: 'John Doe', headline: 'Engineer', summary: '5 years experience' },
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
          fullName: 'Jane Smith',
          headline: 'Staff Engineer with 12 years experience',
          summary:
            'Aspiring Principal Engineer with skills in TypeScript, System Design, and Leadership',
        },
        experiences: [
          {
            title: 'Staff Engineer',
            company: 'Big Tech',
            responsibilities: [
              'Led multiple cross-functional initiatives',
              'Reduced latency by 60%',
            ],
            tasks: ['Mentored 10+ engineers'],
          },
          {
            title: 'Senior Engineer',
            company: 'Startup',
            responsibilities: ['Built core platform from scratch'],
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
        customerSegments: ['Enterprise Companies', 'Tech Giants'],
        valueProposition: ['Generated from complex input'],
        channels: ['Tech Talks', 'Publications'],
        customerRelationships: ['Thought leadership', 'Advisory'],
        keyActivities: ['Technical Strategy'],
        keyResources: ['Deep technical expertise', 'Network'],
        keyPartners: ['Industry leaders', 'Open source communities'],
        costStructure: ['Conference speaking', 'Research time'],
        revenueStreams: ['Salary', 'Stock options', 'Advisory fees'],
      };

      mockAiRepository.generatePersonalCanvas.mockResolvedValue(mockResult as any);

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
