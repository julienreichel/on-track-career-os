import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  AiOperationsRepository,
  type AmplifyAiOperations,
} from '@/domain/ai-operations/AiOperationsRepository';
import type { STARStory } from '@/domain/ai-operations/STARStory';
import type { PersonalCanvasInput } from '@/domain/ai-operations/PersonalCanvas';
import type { GenerateCvInput } from '@/domain/ai-operations/types/generateCv';
import type { CompanyAnalysisResult } from '@/domain/ai-operations/CompanyAnalysis';
import type { GeneratedCompanyCanvas } from '@/domain/ai-operations/CompanyCanvasResult';

// Mock gqlOptions
vi.mock('@/data/graphql/options', () => ({
  gqlOptions: (custom?: Record<string, unknown>) => ({
    authMode: 'userPool',
    ...custom,
  }),
}));

// eslint-disable-next-line max-lines-per-function
describe('AiOperationsRepository', () => {
  let repository: AiOperationsRepository;
  let mockClient: {
    parseCvText: ReturnType<typeof vi.fn>;
    parseJobDescription: ReturnType<typeof vi.fn>;
    extractExperienceBlocks: ReturnType<typeof vi.fn>;
    generateStarStory: ReturnType<typeof vi.fn>;
    generateAchievementsAndKpis: ReturnType<typeof vi.fn>;
    generatePersonalCanvas: ReturnType<typeof vi.fn>;
    generateCv: ReturnType<typeof vi.fn>;
    analyzeCompanyInfo: ReturnType<typeof vi.fn>;
    generateCompanyCanvas: ReturnType<typeof vi.fn>;
    generateMatchingSummary: ReturnType<typeof vi.fn>;
    generateSpeech: ReturnType<typeof vi.fn>;
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
      generateCv: vi.fn(),
      analyzeCompanyInfo: vi.fn(),
      generateCompanyCanvas: vi.fn(),
      generateMatchingSummary: vi.fn(),
      generateSpeech: vi.fn(),
    };

    // Inject the mocks via constructor (dependency injection)
    repository = new AiOperationsRepository(mockClient as unknown as AmplifyAiOperations);
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
      };

      mockClient.parseJobDescription.mockResolvedValue({
        data: mockParsedJob,
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
          certifications: [],
          rawBlocks: [],
        },
        profile: {},
        confidence: 0.95,
      };

      mockClient.parseCvText.mockResolvedValue({
        data: mockParsedData,
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
      const mockExperiencesResult = [
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
      ];

      mockClient.extractExperienceBlocks.mockResolvedValue({
        data: mockExperiencesResult,
        errors: undefined,
      });

      const result = await repository.extractExperienceBlocks(mockTextBlocks);

      expect(mockClient.extractExperienceBlocks).toHaveBeenCalledWith(
        { experienceTextBlocks: mockTextBlocks },
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(result).toEqual(mockExperiencesResult);
      expect(result).toHaveLength(2);
    });

    it('should handle empty experience blocks', async () => {
      mockClient.extractExperienceBlocks.mockResolvedValue({
        data: [],
        errors: undefined,
      });

      const result = await repository.extractExperienceBlocks([]);

      expect(result).toHaveLength(0);
    });
  });

  describe('generateStarStory', () => {
    it('should generate STAR story from source text', async () => {
      const mockSourceText = 'Led migration project that improved performance by 40%';
      const mockStarStory: STARStory = {
        title: 'Distributed team',
        situation: 'System had performance issues',
        task: 'Migrate to new architecture',
        action: 'Designed and implemented new system',
        result: 'Improved performance by 40%',
      };

      mockClient.generateStarStory.mockResolvedValue({
        data: [mockStarStory],
        errors: undefined,
      });

      const result = await repository.generateStarStory(mockSourceText);

      expect(mockClient.generateStarStory).toHaveBeenCalledWith(
        { sourceText: mockSourceText },
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(result[0]).toEqual(mockStarStory);
      expect(result[0].situation).toBeDefined();
      expect(result[0].task).toBeDefined();
      expect(result[0].action).toBeDefined();
      expect(result[0].result).toBeDefined();
    });
  });

  describe('generateAchievementsAndKpis', () => {
    it('should generate achievements and KPIs from STAR story', async () => {
      const mockStarStory: STARStory = {
        title: 'Distributed team',
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
        kpiSuggestions: ['Response time reduction', 'System throughput increase'],
      };

      mockClient.generateAchievementsAndKpis.mockResolvedValue({
        data: mockAchievementsAndKpis,
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
        customerSegments: ['Tech companies', 'Startups'],
        valueProposition: ['Deliver high-performance solutions'],
        channels: ['LinkedIn', 'GitHub'],
        customerRelationships: ['Professional networking'],
        keyActivities: ['System design', 'Team leadership'],
        keyResources: ['Technical expertise', 'Leadership skills'],
        keyPartners: ['Mentors', 'Recruiters'],
        costStructure: ['Time investment', 'Continuous learning'],
        revenueStreams: ['Salary', 'Consulting'],
      };

      mockClient.generatePersonalCanvas.mockResolvedValue({
        data: mockPersonalCanvas,
        errors: undefined,
      });

      const result = await repository.generatePersonalCanvas(mockInput);

      expect(mockClient.generatePersonalCanvas).toHaveBeenCalledWith(
        mockInput,
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(result).toEqual(mockPersonalCanvas);
      expect(result.valueProposition).toBeDefined();
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

  describe('generateCv', () => {
    const baseInput: GenerateCvInput = {
      language: 'en',
      userProfile: { fullName: 'Jane Doe' },
      selectedExperiences: [
        {
          id: 'exp-1',
          title: 'Engineer',
          companyName: 'Acme',
          startDate: '2020-01-01',
        },
      ],
    };

    it('returns markdown string when successful', async () => {
      mockClient.generateCv.mockResolvedValue({
        data: '# CV Markdown',
        errors: undefined,
      });

      const result = await repository.generateCv(baseInput);

      expect(mockClient.generateCv).toHaveBeenCalledWith(
        baseInput,
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(result).toBe('# CV Markdown');
    });

    it('throws when AI reports errors', async () => {
      mockClient.generateCv.mockResolvedValue({
        data: null,
        errors: [{ message: 'oops' }],
      });

      await expect(repository.generateCv(baseInput)).rejects.toThrow('AI operation failed');
    });

    it('throws when no data returned', async () => {
      mockClient.generateCv.mockResolvedValue({
        data: null,
        errors: undefined,
      });

      await expect(repository.generateCv(baseInput)).rejects.toThrow(
        'AI operation returned no data'
      );
    });
  });

  describe('analyzeCompanyInfo', () => {
    const analysisResponse: CompanyAnalysisResult = {
      companyProfile: {
        companyName: 'Acme',
        industry: '',
        sizeRange: '',
        website: '',
        productsServices: [],
        targetMarkets: [],
        customerSegments: [],
        description: '',
      },
      confidence: 0.8,
    };

    it('returns structured analysis data', async () => {
      mockClient.analyzeCompanyInfo.mockResolvedValue({
        data: analysisResponse,
        errors: undefined,
      });

      const result = await repository.analyzeCompanyInfo({
        companyName: 'Acme',
        rawText: 'Some notes',
      });

      expect(mockClient.analyzeCompanyInfo).toHaveBeenCalledWith(
        expect.objectContaining({ companyName: 'Acme', rawText: 'Some notes' }),
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(result.companyProfile.companyName).toBe('Acme');
    });

    it('throws when AI returns errors', async () => {
      mockClient.analyzeCompanyInfo.mockResolvedValue({
        data: null,
        errors: [{ message: 'failure' }],
      });

      await expect(
        repository.analyzeCompanyInfo({ companyName: 'Acme', rawText: 'X' })
      ).rejects.toThrow('AI operation failed');
    });

    it('throws when no data returned', async () => {
      mockClient.analyzeCompanyInfo.mockResolvedValue({
        data: null,
        errors: undefined,
      });

      await expect(
        repository.analyzeCompanyInfo({ companyName: 'Acme', rawText: 'X' })
      ).rejects.toThrow('AI operation returned no data');
    });
  });

  describe('generateCompanyCanvas', () => {
    const canvasResponse: GeneratedCompanyCanvas = {
      companyName: 'Acme',
      customerSegments: ['SMB'],
      valuePropositions: ['Automation'],
      channels: [],
      customerRelationships: [],
      revenueStreams: [],
      keyResources: [],
      keyActivities: [],
      keyPartners: [],
      costStructure: [],
      confidence: 0.7,
    };

    it('returns generated canvas', async () => {
      mockClient.generateCompanyCanvas.mockResolvedValue({
        data: canvasResponse,
        errors: undefined,
      });

      const result = await repository.generateCompanyCanvas({
        companyProfile: { companyName: 'Acme' },
      });

      expect(result).toEqual(canvasResponse);
      expect(mockClient.generateCompanyCanvas).toHaveBeenCalledWith(
        { companyProfile: { companyName: 'Acme' } },
        expect.objectContaining({ authMode: 'userPool' })
      );
    });

    it('throws when AI returns errors', async () => {
      mockClient.generateCompanyCanvas.mockResolvedValue({
        data: null,
        errors: [{ message: 'broken' }],
      });

      await expect(
        repository.generateCompanyCanvas({
          companyProfile: { companyName: 'Acme' },
        })
      ).rejects.toThrow('AI operation failed');
    });

    it('throws when no data returned', async () => {
      mockClient.generateCompanyCanvas.mockResolvedValue({
        data: null,
        errors: undefined,
      });

      await expect(
        repository.generateCompanyCanvas({
          companyProfile: { companyName: 'Acme' },
        })
      ).rejects.toThrow('AI operation returned no data');
    });
  });

  describe('generateMatchingSummary', () => {
    const matchingInput = {
      user: { profile: { fullName: 'Casey Candidate' } },
      job: { title: 'Product Lead' },
    };

    const summaryResponse = {
      summaryParagraph: 'Casey has relevant leadership history.',
      impactAreas: ['Scale delivery'],
      contributionMap: ['Mentor engineering managers'],
      riskMitigationPoints: ['Limited hardware exposure'],
      generatedAt: '2025-01-01T00:00:00.000Z',
      needsUpdate: false,
      userFitScore: 75,
    };

    it('returns parsed matching summary', async () => {
      mockClient.generateMatchingSummary.mockResolvedValue({
        data: summaryResponse,
        errors: undefined,
      });

      const result = await repository.generateMatchingSummary(matchingInput as never);

      expect(result).toEqual(summaryResponse);
      expect(mockClient.generateMatchingSummary).toHaveBeenCalledWith(
        matchingInput,
        expect.objectContaining({ authMode: 'userPool' })
      );
    });

    it('throws when AI returns errors', async () => {
      mockClient.generateMatchingSummary.mockResolvedValue({
        data: null,
        errors: [{ message: 'bad' }],
      });

      await expect(repository.generateMatchingSummary(matchingInput as never)).rejects.toThrow(
        'AI operation failed'
      );
    });

    it('throws when no data returned', async () => {
      mockClient.generateMatchingSummary.mockResolvedValue({
        data: null,
        errors: undefined,
      });

      await expect(repository.generateMatchingSummary(matchingInput as never)).rejects.toThrow(
        'AI operation returned no data'
      );
    });
  });

  describe('generateSpeech', () => {
    const speechInput = {
      language: 'en',
      profile: { fullName: 'Casey Candidate' },
      experiences: [],
    };

    const speechResponse = {
      elevatorPitch: 'Pitch',
      careerStory: 'Story',
      whyMe: 'Why me',
    };

    it('returns parsed speech blocks', async () => {
      mockClient.generateSpeech.mockResolvedValue({
        data: speechResponse,
        errors: undefined,
      });

      const result = await repository.generateSpeech(speechInput as never);

      expect(result).toEqual(speechResponse);
      expect(mockClient.generateSpeech).toHaveBeenCalledWith(
        speechInput,
        expect.objectContaining({ authMode: 'userPool' })
      );
    });

    it('throws when AI returns errors', async () => {
      mockClient.generateSpeech.mockResolvedValue({
        data: null,
        errors: [{ message: 'bad' }],
      });

      await expect(repository.generateSpeech(speechInput as never)).rejects.toThrow(
        'AI operation failed'
      );
    });

    it('throws when no data returned', async () => {
      mockClient.generateSpeech.mockResolvedValue({
        data: null,
        errors: undefined,
      });

      await expect(repository.generateSpeech(speechInput as never)).rejects.toThrow(
        'AI operation returned no data'
      );
    });
  });
});
