import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  AiOperationsRepository,
  type AmplifyAiOperations,
} from '@/domain/ai-operations/AiOperationsRepository';
import type { STARStory } from '@/domain/ai-operations/STARStory';
import type { PersonalCanvasInput } from '@/domain/ai-operations/PersonalCanvas';

// Mock gqlOptions
vi.mock('@/data/graphql/options', () => ({
  gqlOptions: (custom?: Record<string, unknown>) => ({
    authMode: 'userPool',
    ...custom,
  }),
}));

describe('AiOperationsRepository', () => {
  let repository: AiOperationsRepository;
  let mockClient: {
    parseCvText: ReturnType<typeof vi.fn>;
    parseJobDescription: ReturnType<typeof vi.fn>;
    extractExperienceBlocks: ReturnType<typeof vi.fn>;
    generateStarStory: ReturnType<typeof vi.fn>;
    generateAchievementsAndKpis: ReturnType<typeof vi.fn>;
    generatePersonalCanvas: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Create fresh mocks for each test
    mockClient = {
      parseCvText: vi.fn(),
      parseJobDescription: vi.fn(),
      extractExperienceBlocks: vi.fn(),
      generateStarStory: vi.fn(),
      generateAchievementsAndKpis: vi.fn(),
      generatePersonalCanvas: vi.fn(),
    };

    // Inject the mocks via constructor (dependency injection)
    repository = new AiOperationsRepository(mockClient as AmplifyAiOperations);
  });

  describe('parseJobDescription', () => {
    it('should parse job description text and return structured data', async () => {
      const mockJobText = 'We are hiring a Senior Product Manager...';
      const mockParsedJob = {
        title: 'Senior Product Manager',
        seniorityLevel: 'Senior',
        roleSummary: 'Owns analytics roadmap',
        responsibilities: ['Own roadmap'],
        requiredSkills: ['Stakeholder management'],
        behaviours: ['Ownership'],
        successCriteria: ['Adoption'],
        explicitPains: ['Fragmentation'],
        aiConfidenceScore: 0.9,
      };

      mockClient.parseJobDescription.mockResolvedValue({
        data: JSON.stringify(mockParsedJob),
        errors: undefined,
      });

      const result = await repository.parseJobDescription(mockJobText);

      expect(mockClient.parseJobDescription).toHaveBeenCalledWith(
        { jobText: mockJobText },
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(result).toEqual(mockParsedJob);
    });

    it('should throw when operation returns errors', async () => {
      mockClient.parseJobDescription.mockResolvedValue({
        data: null,
        errors: [{ message: 'AI failure' }],
      });

      await expect(repository.parseJobDescription('Broken')).rejects.toThrow('AI operation failed');
    });

    it('should throw when no data returned', async () => {
      mockClient.parseJobDescription.mockResolvedValue({
        data: null,
        errors: undefined,
      });

      await expect(repository.parseJobDescription('Missing data')).rejects.toThrow(
        'AI operation returned no data'
      );
    });
  });

  describe('parseCvText', () => {
    it('should parse CV text and return structured data', async () => {
      const mockCvText = 'Senior Software Engineer at Tech Corp\n2020-2023';
      const mockParsedData = {
        sections: {
          experiences: ['Experience 1', 'Experience 2'],
          education: ['Education 1'],
          skills: ['Skill 1', 'Skill 2'],
        },
        confidence_score: 0.95,
      };

      mockClient.parseCvText.mockResolvedValue({
        data: JSON.stringify(mockParsedData),
        errors: undefined,
      });

      const result = await repository.parseCvText(mockCvText);

      expect(mockClient.parseCvText).toHaveBeenCalledWith(
        { cvText: mockCvText },
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(result).toEqual(mockParsedData);
    });

    it('should throw error when AI operation returns errors', async () => {
      const mockErrors = [{ message: 'AI processing failed' }];
      mockClient.parseCvText.mockResolvedValue({
        data: null,
        errors: mockErrors,
      });

      await expect(repository.parseCvText('invalid text')).rejects.toThrow('AI operation failed');
    });

    it('should throw error when no data is returned', async () => {
      mockClient.parseCvText.mockResolvedValue({
        data: null,
        errors: undefined,
      });

      await expect(repository.parseCvText('test')).rejects.toThrow('AI operation returned no data');
    });
  });

  describe('extractExperienceBlocks', () => {
    it('should extract structured experiences from text blocks', async () => {
      const mockTextBlocks = [
        'Senior Software Engineer at Tech Corp (2020-2023)',
        'Software Engineer at StartupCo (2018-2020)',
      ];
      const mockExperiencesResult = {
        experiences: [
          {
            title: 'Senior Software Engineer',
            company: 'Tech Corp',
            startDate: '2020-01-01',
            endDate: '2023-12-31',
            responsibilities: ['Led team', 'Designed systems'],
            tasks: ['Implemented features', 'Conducted reviews'],
          },
          {
            title: 'Software Engineer',
            company: 'StartupCo',
            startDate: '2018-01-01',
            endDate: '2020-12-31',
            responsibilities: ['Developed features'],
            tasks: ['Built APIs'],
          },
        ],
      };

      mockClient.extractExperienceBlocks.mockResolvedValue({
        data: JSON.stringify(mockExperiencesResult),
        errors: undefined,
      });

      const result = await repository.extractExperienceBlocks(mockTextBlocks);

      expect(mockClient.extractExperienceBlocks).toHaveBeenCalledWith(
        { experienceTextBlocks: mockTextBlocks },
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(result).toEqual(mockExperiencesResult);
      expect(result.experiences).toHaveLength(2);
    });

    it('should handle empty experience blocks', async () => {
      mockClient.extractExperienceBlocks.mockResolvedValue({
        data: JSON.stringify({ experiences: [] }),
        errors: undefined,
      });

      const result = await repository.extractExperienceBlocks([]);

      expect(result.experiences).toHaveLength(0);
    });
  });

  describe('generateStarStory', () => {
    it('should generate STAR story from source text', async () => {
      const mockSourceText = 'Led migration project that improved performance by 40%';
      const mockStarStory: STARStory = {
        situation: 'System had performance issues',
        task: 'Migrate to new architecture',
        action: 'Designed and implemented new system',
        result: 'Improved performance by 40%',
      };

      mockClient.generateStarStory.mockResolvedValue({
        data: JSON.stringify(mockStarStory),
        errors: undefined,
      });

      const result = await repository.generateStarStory(mockSourceText);

      expect(mockClient.generateStarStory).toHaveBeenCalledWith(
        { sourceText: mockSourceText },
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(result).toEqual(mockStarStory);
      expect(result.situation).toBeDefined();
      expect(result.task).toBeDefined();
      expect(result.action).toBeDefined();
      expect(result.result).toBeDefined();
    });
  });

  describe('generateAchievementsAndKpis', () => {
    it('should generate achievements and KPIs from STAR story', async () => {
      const mockStarStory: STARStory = {
        situation: 'System had performance issues',
        task: 'Migrate to new architecture',
        action: 'Designed and implemented new system',
        result: 'Improved performance by 40%',
      };
      const mockAchievementsAndKpis = {
        achievements: [
          'Successfully migrated system to new architecture',
          'Improved system performance by 40%',
        ],
        kpi_suggestions: ['Response time reduction', 'System throughput increase'],
      };

      mockClient.generateAchievementsAndKpis.mockResolvedValue({
        data: JSON.stringify(mockAchievementsAndKpis),
        errors: undefined,
      });

      const result = await repository.generateAchievementsAndKpis(mockStarStory);

      expect(mockClient.generateAchievementsAndKpis).toHaveBeenCalledWith(
        { starStory: mockStarStory },
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(result).toEqual(mockAchievementsAndKpis);
      expect(result.achievements.length).toBeGreaterThan(0);
    });
  });

  describe('generatePersonalCanvas', () => {
    it('should generate personal canvas from user data', async () => {
      const mockInput: PersonalCanvasInput = {
        profile: {
          fullName: 'John Doe',
          headline: 'Senior Software Engineer',
          summary: 'Experienced engineer',
        },
        experiences: [
          {
            title: 'Senior Software Engineer',
            company: 'Tech Corp',
          },
        ],
        stories: [
          {
            action: 'Implemented system',
            result: 'Improved performance',
          },
        ],
      };
      const mockPersonalCanvas = {
        valueProposition: 'Deliver high-performance solutions',
        targetRoles: ['Engineering Manager', 'Principal Engineer'],
        keyActivities: ['System design', 'Team leadership'],
        keyResources: ['Technical expertise', 'Leadership skills'],
        channels: ['LinkedIn', 'GitHub'],
        customerSegments: ['Tech companies', 'Startups'],
        costStructure: ['Time investment', 'Continuous learning'],
        revenueStreams: ['Salary', 'Consulting'],
        strengthsAdvantage: 'Strong technical background',
        careerDirection: 'Move into technical leadership',
      };

      // GraphQL returns a.json() which is a JSON string
      mockClient.generatePersonalCanvas.mockResolvedValue({
        data: JSON.stringify(mockPersonalCanvas),
        errors: undefined,
      });

      const result = await repository.generatePersonalCanvas(mockInput);

      // GraphQL expects JSON strings as input, not objects
      expect(mockClient.generatePersonalCanvas).toHaveBeenCalledWith(
        {
          profile: JSON.stringify(mockInput.profile),
          experiences: JSON.stringify(mockInput.experiences),
          stories: JSON.stringify(mockInput.stories),
        },
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(result).toEqual(mockPersonalCanvas);
      expect(result.valueProposition).toBeDefined();
      expect(result.targetRoles).toBeDefined();
    });

    it('should throw error when canvas generation fails', async () => {
      const mockInput: PersonalCanvasInput = {
        profile: { fullName: 'Test' },
        experiences: [],
        stories: [],
      };

      mockClient.generatePersonalCanvas.mockResolvedValue({
        data: null,
        errors: [{ message: 'Canvas generation failed' }],
      });

      await expect(repository.generatePersonalCanvas(mockInput)).rejects.toThrow(
        'AI operation failed'
      );
    });
  });
});
