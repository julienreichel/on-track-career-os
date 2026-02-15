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
import type { EvaluateApplicationStrengthInput } from '@/domain/ai-operations/ApplicationStrengthResult';

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
    generateCoverLetter: ReturnType<typeof vi.fn>;
    evaluateApplicationStrength: ReturnType<typeof vi.fn>;
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
      generateCoverLetter: vi.fn(),
      evaluateApplicationStrength: vi.fn(),
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
        atsKeywords: ['Product Manager'],
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

      await expect(repository.parseJobDescription('Broken')).rejects.toThrow('AI failure');
    });

    it('should map non-job errors to error code', async () => {
      mockClient.parseJobDescription.mockResolvedValue({
        data: null,
        errors: [{ message: 'Not a job description' }],
      });

      await expect(repository.parseJobDescription('Not a job')).rejects.toThrow(
        'Not a job description'
      );
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
        profile: {
          fullName: '',
          headline: '',
          location: '',
          seniorityLevel: '',
          primaryEmail: '',
          primaryPhone: '',
          workPermitInfo: '',
          socialLinks: [],
          aspirations: [],
          personalValues: [],
          strengths: [],
          interests: [],
          skills: ['Skill 1', 'Skill 2'],
          certifications: [],
          languages: [],
        },
        experienceItems: [
          { experienceType: 'work', rawBlock: 'Experience 1' },
          { experienceType: 'work', rawBlock: 'Experience 2' },
          { experienceType: 'education', rawBlock: 'Education 1' },
        ],
        rawBlocks: [],
        confidence: 0.5,
      };

      mockClient.parseCvText.mockResolvedValue({
        data: mockParsedData,
        errors: undefined,
      });

      const result = await repository.parseCvText(mockCvText, 'en');

      expect(mockClient.parseCvText).toHaveBeenCalledWith(
        { cvText: mockCvText, language: 'en' },
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

      await expect(repository.parseCvText('invalid text', 'en')).rejects.toThrow(
        'AI processing failed'
      );
    });

    it('should throw error when no data is returned', async () => {
      mockClient.parseCvText.mockResolvedValue({
        data: null,
        errors: undefined,
      });

      await expect(repository.parseCvText('test', 'en')).rejects.toThrow(
        'AI operation returned no data'
      );
    });
  });

  describe('extractExperienceBlocks', () => {
    it('should extract structured experiences from text blocks', async () => {
      const mockExperienceItems = [
        {
          experienceType: 'work',
          rawBlock: 'Senior Software Engineer at Tech Corp (2020-2023)',
        },
        {
          experienceType: 'work',
          rawBlock: 'Software Engineer at StartupCo (2018-2020)',
        },
      ];
      const mockExperiencesResult = {
        experiences: [
          {
            title: 'Senior Software Engineer',
            companyName: 'Tech Corp',
            startDate: '2020-01-01',
            endDate: '2023-12-31',
            responsibilities: ['Led team', 'Designed systems'],
            tasks: ['Implemented features', 'Conducted reviews'],
            status: 'draft',
            experienceType: 'work',
          },
          {
            title: 'Software Engineer',
            companyName: 'StartupCo',
            startDate: '2018-01-01',
            endDate: '2020-12-31',
            responsibilities: ['Developed features'],
            tasks: ['Built APIs'],
            status: 'draft',
            experienceType: 'work',
          },
        ],
      };

      mockClient.extractExperienceBlocks.mockResolvedValue({
        data: mockExperiencesResult,
        errors: undefined,
      });

      const result = await repository.extractExperienceBlocks('en', mockExperienceItems);

      expect(mockClient.extractExperienceBlocks).toHaveBeenCalledWith(
        { language: 'en', experienceItems: mockExperienceItems },
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(result).toEqual(mockExperiencesResult);
      expect(result.experiences).toHaveLength(2);
    });

    it('should handle empty experience blocks', async () => {
      mockClient.extractExperienceBlocks.mockResolvedValue({
        data: { experiences: [] },
        errors: undefined,
      });

      const result = await repository.extractExperienceBlocks('en', []);

      expect(result.experiences).toHaveLength(0);
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
        },
        experiences: [
          {
            title: 'Senior Software Engineer',
            companyName: 'Tech Corp',
            experienceType: 'work',
            responsibilities: [],
            tasks: [],
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
      profile: { fullName: 'Jane Doe' },
      experiences: [
        {
          id: 'exp-1',
          title: 'Engineer',
          companyName: 'Acme',
          experienceType: 'work',
          startDate: '2020-01-01',
          responsibilities: [],
          tasks: [],
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
        rawNotes: '',
      },
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
    };

    it('returns generated canvas', async () => {
      mockClient.generateCompanyCanvas.mockResolvedValue({
        data: canvasResponse,
        errors: undefined,
      });

      const result = await repository.generateCompanyCanvas({
        companyProfile: {
          companyName: 'Acme',
          industry: '',
          sizeRange: '',
          website: '',
          description: '',
          productsServices: [],
          targetMarkets: [],
          customerSegments: [],
          rawNotes: '',
        },
      });

      expect(result).toEqual(canvasResponse);
      expect(mockClient.generateCompanyCanvas).toHaveBeenCalledWith(
        {
          companyProfile: {
            companyName: 'Acme',
            industry: '',
            sizeRange: '',
            website: '',
            description: '',
            productsServices: [],
            targetMarkets: [],
            customerSegments: [],
            rawNotes: '',
          },
        },
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
          companyProfile: {
            companyName: 'Acme',
            industry: '',
            sizeRange: '',
            website: '',
            description: '',
            productsServices: [],
            targetMarkets: [],
            customerSegments: [],
            rawNotes: '',
          },
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
          companyProfile: {
            companyName: 'Acme',
            industry: '',
            sizeRange: '',
            website: '',
            description: '',
            productsServices: [],
            targetMarkets: [],
            customerSegments: [],
            rawNotes: '',
          },
        })
      ).rejects.toThrow('AI operation returned no data');
    });
  });

  describe('generateMatchingSummary', () => {
    const matchingInput = {
      user: { profile: { fullName: 'Casey Candidate' } },
      job: {
        title: 'Product Lead',
        seniorityLevel: '',
        roleSummary: '',
        responsibilities: [],
        requiredSkills: [],
        behaviours: [],
        successCriteria: [],
        explicitPains: [],
      },
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

  describe('evaluateApplicationStrength', () => {
    const applicationStrengthInput: EvaluateApplicationStrengthInput = {
      job: {
        title: 'Senior Product Manager',
        seniorityLevel: 'Senior',
        roleSummary: 'Lead product roadmap and execution.',
        responsibilities: ['Drive roadmap'],
        requiredSkills: ['Stakeholder management'],
        behaviours: ['Ownership'],
        successCriteria: ['Improve adoption'],
        explicitPains: ['Fragmented roadmap'],
        atsKeywords: ['Product strategy', 'Roadmap'],
      },
      cvText: 'Product leader with 8 years experience.',
      coverLetterText: '',
      language: 'en',
    };

    const applicationStrengthResponse = {
      overallScore: 72,
      dimensionScores: {
        atsReadiness: 74,
        clarityFocus: 70,
        targetedFitSignals: 71,
        evidenceStrength: 75,
      },
      decision: {
        label: 'borderline',
        readyToApply: false,
        rationaleBullets: ['Good fit signals', 'Needs stronger quantified impact'],
      },
      missingSignals: ['Explicit ownership metrics'],
      topImprovements: [
        {
          title: 'Add measurable impact',
          action: 'Include metrics in recent experience bullets.',
          impact: 'high',
          target: { document: 'cv', anchor: 'experience' },
        },
        {
          title: 'Refine summary',
          action: 'Align summary to role priorities.',
          impact: 'medium',
          target: { document: 'cv', anchor: 'summary' },
        },
      ],
      notes: {
        atsNotes: ['Good keyword presence.'],
        humanReaderNotes: ['Tighten targeting language.'],
      },
    };

    it('routes evaluateApplicationStrength with full payload including language', async () => {
      mockClient.evaluateApplicationStrength.mockResolvedValue({
        data: applicationStrengthResponse,
        errors: undefined,
      });

      const result = await repository.evaluateApplicationStrength(applicationStrengthInput);

      expect(result).toEqual(applicationStrengthResponse);
      expect(mockClient.evaluateApplicationStrength).toHaveBeenCalledWith(
        applicationStrengthInput,
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(mockClient.evaluateApplicationStrength.mock.calls[0][0].language).toBe('en');
    });

    it('throws when AI returns errors', async () => {
      mockClient.evaluateApplicationStrength.mockResolvedValue({
        data: null,
        errors: [{ message: 'bad' }],
      });

      await expect(
        repository.evaluateApplicationStrength(applicationStrengthInput)
      ).rejects.toThrow('AI operation failed');
    });

    it('throws when no data returned', async () => {
      mockClient.evaluateApplicationStrength.mockResolvedValue({
        data: null,
        errors: undefined,
      });

      await expect(
        repository.evaluateApplicationStrength(applicationStrengthInput)
      ).rejects.toThrow('AI operation returned no data');
    });
  });
});
