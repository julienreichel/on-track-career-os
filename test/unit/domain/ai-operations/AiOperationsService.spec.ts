/* eslint-disable max-lines-per-function */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AiOperationsService } from '@/domain/ai-operations/AiOperationsService';
import type { AiOperationsRepository } from '@/domain/ai-operations/AiOperationsRepository';
import type { ParsedCV } from '@/domain/ai-operations/ParsedCV';
import type { ExperiencesResult } from '@/domain/ai-operations/Experience';
import type { STARStory } from '@/domain/ai-operations/STARStory';
import type { AchievementsAndKpis } from '@/domain/ai-operations/AchievementsAndKpis';
import type { ParsedJobDescription } from '@/domain/ai-operations/ParsedJobDescription';
import type { GenerateCvInput } from '@/domain/ai-operations/types/generateCv';
import type { CompanyAnalysisResult } from '@/domain/ai-operations/CompanyAnalysis';
import type { GeneratedCompanyCanvas } from '@/domain/ai-operations/CompanyCanvasResult';
import type { MatchingSummaryResult } from '@/domain/ai-operations/MatchingSummaryResult';
import type { SpeechResult } from '@/domain/ai-operations/SpeechResult';
import type { ApplicationStrengthResult } from '@/domain/ai-operations/ApplicationStrengthResult';

// Mock the repository
vi.mock('@/domain/ai-operations/AiOperationsRepository');

describe('AiOperationsService', () => {
  let service: AiOperationsService;
  let mockRepo: {
    parseCvText: ReturnType<typeof vi.fn>;
    parseJobDescription: ReturnType<typeof vi.fn>;
    extractExperienceBlocks: ReturnType<typeof vi.fn>;
    generateStarStory: ReturnType<typeof vi.fn>;
    generateAchievementsAndKpis: ReturnType<typeof vi.fn>;
    generateCv: ReturnType<typeof vi.fn>;
    analyzeCompanyInfo: ReturnType<typeof vi.fn>;
    generateCompanyCanvas: ReturnType<typeof vi.fn>;
    generateMatchingSummary: ReturnType<typeof vi.fn>;
    generateSpeech: ReturnType<typeof vi.fn>;
    generateCoverLetter: ReturnType<typeof vi.fn>;
    evaluateApplicationStrength: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Create mock repository
    mockRepo = {
      parseCvText: vi.fn(),
      parseJobDescription: vi.fn(),
      extractExperienceBlocks: vi.fn(),
      generateStarStory: vi.fn(),
      generateAchievementsAndKpis: vi.fn(),
      generateCv: vi.fn(),
      analyzeCompanyInfo: vi.fn(),
      generateCompanyCanvas: vi.fn(),
      generateMatchingSummary: vi.fn(),
      generateSpeech: vi.fn(),
      generateCoverLetter: vi.fn(),
      evaluateApplicationStrength: vi.fn(),
    };

    // Create service with mocked repo
    service = new AiOperationsService(mockRepo as unknown as AiOperationsRepository);
  });

  describe('parseCvText', () => {
    it('should successfully parse valid CV text', async () => {
      // Arrange
      const mockParsedCv: ParsedCV = {
        profile: {
          fullName: 'John Doe',
          headline: 'Senior Software Engineer',
          location: 'San Francisco, CA',
          seniorityLevel: 'Senior',
          primaryEmail: '',
          primaryPhone: '',
          workPermitInfo: '',
          socialLinks: [],
          aspirations: ['CTO'],
          personalValues: ['Innovation'],
          strengths: ['Problem solving'],
          interests: ['AI'],
          skills: ['Python'],
          certifications: ['AWS Certified'],
          languages: ['English'],
        },
        experienceItems: [
          {
            experienceType: 'work',
            rawBlock: 'Senior Developer at TechCorp (2020-2023)',
          },
          {
            experienceType: 'education',
            rawBlock: 'BSc Computer Science from MIT (2019)',
          },
        ],
        rawBlocks: ['Experience section...'],
        confidence: 0.7,
      };

      mockRepo.parseCvText.mockResolvedValue(mockParsedCv);

      // Act
      const result = await service.parseCvText('Sample CV text', 'en');

      // Assert
      expect(result).toEqual(mockParsedCv);
      expect(mockRepo.parseCvText).toHaveBeenCalledWith('Sample CV text', 'en');
    });

    it('should throw error for empty CV text', async () => {
      // Act & Assert
      await expect(service.parseCvText('', 'en')).rejects.toThrow('CV text cannot be empty');
      expect(mockRepo.parseCvText).not.toHaveBeenCalled();
    });

    it('should throw error for whitespace-only CV text', async () => {
      // Act & Assert
      await expect(service.parseCvText('   ', 'en')).rejects.toThrow('CV text cannot be empty');
      expect(mockRepo.parseCvText).not.toHaveBeenCalled();
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      mockRepo.parseCvText.mockRejectedValue(new Error('AI operation failed'));

      // Act & Assert
      await expect(service.parseCvText('Sample CV text', 'en')).rejects.toThrow(
        'Failed to parse CV text: AI operation failed'
      );
    });

    it('should throw error when result structure is invalid', async () => {
      // Arrange
      mockRepo.parseCvText.mockResolvedValue({ invalid: 'structure' });

      // Act & Assert
      await expect(service.parseCvText('Sample CV text', 'en')).rejects.toThrow(
        'Invalid CV parsing result structure'
      );
    });

    it('should surface non-CV errors from repository', async () => {
      mockRepo.parseCvText.mockRejectedValue(new Error('ERR_NON_CV_DOCUMENT'));

      await expect(service.parseCvText('Random text', 'en')).rejects.toThrow(
        'Failed to parse CV text: ERR_NON_CV_DOCUMENT'
      );
    });
  });

  describe('parseJobDescription', () => {
    it('should successfully parse job description text', async () => {
      const mockParsedJob: ParsedJobDescription = {
        title: 'Senior Product Manager',
        seniorityLevel: 'Senior',
        roleSummary: 'Leads analytics roadmap.',
        responsibilities: ['Own roadmap'],
        requiredSkills: ['SaaS'],
        behaviours: ['Ownership'],
        successCriteria: ['Adoption'],
        explicitPains: ['Fragmented tooling'],
        atsKeywords: ['Product Manager', 'SaaS', 'Analytics'],
      };

      mockRepo.parseJobDescription.mockResolvedValue(mockParsedJob);

      const result = await service.parseJobDescription('We are hiring a Senior Product Manager...');

      expect(result).toEqual(mockParsedJob);
      expect(mockRepo.parseJobDescription).toHaveBeenCalledWith(
        'We are hiring a Senior Product Manager...'
      );
    });

    it('should throw when job text is empty', async () => {
      await expect(service.parseJobDescription('')).rejects.toThrow(
        'Job description text cannot be empty'
      );
      expect(mockRepo.parseJobDescription).not.toHaveBeenCalled();
    });

    it('should throw when repository fails', async () => {
      mockRepo.parseJobDescription.mockRejectedValue(new Error('AI failure'));

      await expect(service.parseJobDescription('Valid text')).rejects.toThrow('AI failure');
    });

    it('should throw when structure invalid', async () => {
      mockRepo.parseJobDescription.mockResolvedValue({ invalid: true });

      await expect(service.parseJobDescription('Valid text')).rejects.toThrow(
        'Invalid job description parsing result structure'
      );
    });

    it('should surface non-job errors from repository', async () => {
      mockRepo.parseJobDescription.mockRejectedValue(new Error('ERR_NON_JOB_DESCRIPTION'));

      await expect(service.parseJobDescription('Random text')).rejects.toThrow(
        'ERR_NON_JOB_DESCRIPTION'
      );
    });

    it('should surface NonJobSchema errors from repository', async () => {
      mockRepo.parseJobDescription.mockRejectedValue(new Error('NonJobSchema'));

      await expect(service.parseJobDescription('Random text')).rejects.toThrow('NonJobSchema');
    });
  });

  describe('extractExperienceBlocks', () => {
    it('should successfully extract experience blocks', async () => {
      // Arrange
      const mockExperiences: ExperiencesResult = {
        experiences: [
          {
            title: 'Senior Developer',
            companyName: 'TechCorp',
            startDate: '2020-01',
            endDate: '2023-12',
            responsibilities: ['Lead team', 'Code review'],
            tasks: ['Development', 'Mentoring'],
            status: 'draft',
            experienceType: 'work',
          },
        ],
      };
      const experienceItems = [
        {
          experienceType: 'work',
          rawBlock: 'Senior Developer at TechCorp',
        },
      ];

      mockRepo.extractExperienceBlocks.mockResolvedValue(mockExperiences);

      // Act
      const result = await service.extractExperienceBlocks('en', experienceItems);

      // Assert
      expect(result).toEqual(mockExperiences);
      expect(mockRepo.extractExperienceBlocks).toHaveBeenCalledWith('en', experienceItems);
    });

    it('should throw error for empty experience blocks array', async () => {
      // Act & Assert
      await expect(service.extractExperienceBlocks('en', [])).rejects.toThrow(
        'Experience items cannot be empty'
      );
      expect(mockRepo.extractExperienceBlocks).not.toHaveBeenCalled();
    });

    it('should throw error for array with empty strings', async () => {
      // Act & Assert
      await expect(
        service.extractExperienceBlocks('en', [
          { experienceType: 'work', rawBlock: 'Experience 1' },
          { experienceType: 'work', rawBlock: '' },
        ])
      ).rejects.toThrow('Experience items must include raw text and a valid experience type');
      expect(mockRepo.extractExperienceBlocks).not.toHaveBeenCalled();
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      mockRepo.extractExperienceBlocks.mockRejectedValue(new Error('AI operation failed'));

      // Act & Assert
      await expect(
        service.extractExperienceBlocks('en', [
          { experienceType: 'work', rawBlock: 'Experience 1' },
        ])
      ).rejects.toThrow('Failed to extract experience blocks: AI operation failed');
    });

    it('should throw error when result structure is invalid', async () => {
      // Arrange
      mockRepo.extractExperienceBlocks.mockResolvedValue({ invalid: 'structure' } as never);

      // Act & Assert
      await expect(
        service.extractExperienceBlocks('en', [
          { experienceType: 'work', rawBlock: 'Experience 1' },
        ])
      ).rejects.toThrow('Invalid experience extraction result structure');
    });
  });

  describe('generateStarStory', () => {
    it('should successfully generate STAR story from source text', async () => {
      // Arrange
      const mockStarStory: STARStory = {
        title: 'Restructuring leadership',
        situation: 'Led a distributed team during company restructuring',
        task: 'Maintain team productivity and morale while adapting to new organizational structure',
        action: 'Implemented daily standups, 1-on-1s, and created team charter',
        result: 'Team maintained 95% sprint completion rate and received positive feedback',
      };

      mockRepo.generateStarStory.mockResolvedValue([mockStarStory]);

      // Act
      const result = await service.generateStarStory('Led team during restructuring...');

      // Assert
      expect(result).toEqual([mockStarStory]);
      expect(mockRepo.generateStarStory).toHaveBeenCalledWith('Led team during restructuring...');
    });

    it('should throw error for empty source text', async () => {
      // Act & Assert
      await expect(service.generateStarStory('')).rejects.toThrow('Source text cannot be empty');
      expect(mockRepo.generateStarStory).not.toHaveBeenCalled();
    });

    it('should throw error for whitespace-only source text', async () => {
      // Act & Assert
      await expect(service.generateStarStory('   ')).rejects.toThrow('Source text cannot be empty');
      expect(mockRepo.generateStarStory).not.toHaveBeenCalled();
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      mockRepo.generateStarStory.mockRejectedValue(new Error('AI operation failed'));

      // Act & Assert
      await expect(service.generateStarStory('Some experience text')).rejects.toThrow(
        'Failed to generate STAR story: AI operation failed'
      );
    });

    it('should throw error when result structure is invalid', async () => {
      // Arrange
      mockRepo.generateStarStory.mockResolvedValue([{ invalid: 'structure' }]);

      // Act & Assert
      await expect(service.generateStarStory('Some experience text')).rejects.toThrow(
        'Invalid STAR story structure in array'
      );
    });
  });

  describe('generateAchievementsAndKpis', () => {
    it('should successfully generate achievements and KPIs from STAR story', async () => {
      // Arrange
      const mockStarStory: STARStory = {
        title: 'Restructuring leadership',
        situation: 'Led distributed team during restructuring',
        task: 'Maintain productivity and morale',
        action: 'Implemented daily standups and team charter',
        result: 'Achieved 95% sprint completion rate and improved team satisfaction',
      };

      const mockResult: AchievementsAndKpis = {
        achievements: [
          'Led distributed team through organizational restructuring',
          'Maintained high team productivity during change',
        ],
        kpiSuggestions: ['95% sprint completion rate', 'Team satisfaction score increased'],
      };

      mockRepo.generateAchievementsAndKpis.mockResolvedValue(mockResult);

      // Act
      const result = await service.generateAchievementsAndKpis(mockStarStory);

      // Assert
      expect(result).toEqual(mockResult);
      expect(mockRepo.generateAchievementsAndKpis).toHaveBeenCalledWith(mockStarStory);
    });

    it('should throw error for empty situation', async () => {
      // Arrange
      const invalidStory: STARStory = {
        title: 'Missing situation',
        situation: '',
        task: 'Some task',
        action: 'Some action',
        result: 'Some result',
      };

      // Act & Assert
      await expect(service.generateAchievementsAndKpis(invalidStory)).rejects.toThrow(
        'All STAR story fields (situation, task, action, result) must be non-empty'
      );
      expect(mockRepo.generateAchievementsAndKpis).not.toHaveBeenCalled();
    });

    it('should throw error for empty task', async () => {
      // Arrange
      const invalidStory: STARStory = {
        title: 'Missing task',
        situation: 'Some situation',
        task: '',
        action: 'Some action',
        result: 'Some result',
      };

      // Act & Assert
      await expect(service.generateAchievementsAndKpis(invalidStory)).rejects.toThrow(
        'All STAR story fields (situation, task, action, result) must be non-empty'
      );
      expect(mockRepo.generateAchievementsAndKpis).not.toHaveBeenCalled();
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      const mockStarStory: STARStory = {
        title: 'Valid story',
        situation: 'Led team',
        task: 'Maintain productivity',
        action: 'Implemented standups',
        result: 'High completion rate',
      };

      mockRepo.generateAchievementsAndKpis.mockRejectedValue(new Error('AI operation failed'));

      // Act & Assert
      await expect(service.generateAchievementsAndKpis(mockStarStory)).rejects.toThrow(
        'Failed to generate achievements and KPIs: AI operation failed'
      );
    });

    it('should throw error when result structure is invalid', async () => {
      // Arrange
      const mockStarStory: STARStory = {
        title: 'Valid story',
        situation: 'Led team',
        task: 'Maintain productivity',
        action: 'Implemented standups',
        result: 'High completion rate',
      };

      mockRepo.generateAchievementsAndKpis.mockResolvedValue({ invalid: 'structure' });

      // Act & Assert
      await expect(service.generateAchievementsAndKpis(mockStarStory)).rejects.toThrow(
        'Invalid achievements and KPIs result structure'
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

    it('returns markdown when repo succeeds', async () => {
      mockRepo.generateCv.mockResolvedValue('## CV');

      const result = await service.generateCv(baseInput);

      expect(mockRepo.generateCv).toHaveBeenCalledWith(baseInput);
      expect(result).toBe('## CV');
    });

    it('allows empty experiences when provided', async () => {
      mockRepo.generateCv.mockResolvedValue('## CV');

      const result = await service.generateCv({ ...baseInput, experiences: [] });

      expect(mockRepo.generateCv).toHaveBeenCalledWith({ ...baseInput, experiences: [] });
      expect(result).toBe('## CV');
    });

    it('rejects when experience missing required fields', async () => {
      await expect(
        service.generateCv({
          ...baseInput,
          experiences: [
            {
              id: 'exp',
              title: '',
              companyName: 'Acme',
              experienceType: 'work',
              startDate: '',
              responsibilities: [],
              tasks: [],
            },
          ],
        })
      ).rejects.toThrow('Each experience must have title');
    });

    it('rejects when language is not supported', async () => {
      await expect(service.generateCv({ ...baseInput, language: 'fr' as 'en' })).rejects.toThrow(
        'Language must be "en"'
      );
    });

    it('rejects when repo returns non-string payload', async () => {
      mockRepo.generateCv.mockResolvedValue({} as unknown as string);

      await expect(service.generateCv(baseInput)).rejects.toThrow(
        'Invalid CV result: expected string'
      );
    });

    it('rejects when repo returns empty markdown', async () => {
      mockRepo.generateCv.mockResolvedValue('   ');

      await expect(service.generateCv(baseInput)).rejects.toThrow(
        'CV generation produced empty markdown'
      );
    });

    it('wraps repository errors with context', async () => {
      mockRepo.generateCv.mockRejectedValue(new Error('Network down'));

      await expect(service.generateCv(baseInput)).rejects.toThrow(
        'Failed to generate CV: Network down'
      );
    });

    it('rejects when input is null', async () => {
      await expect(service.generateCv(null as any)).rejects.toThrow('Invalid input structure');
    });

    it('rejects when input is not an object', async () => {
      await expect(service.generateCv('invalid' as any)).rejects.toThrow('Invalid input structure');
    });

    it('rejects when profile is missing', async () => {
      await expect(service.generateCv({ ...baseInput, profile: null as any })).rejects.toThrow(
        'Profile is required'
      );
    });

    it('rejects when profile is not an object', async () => {
      await expect(service.generateCv({ ...baseInput, profile: 'invalid' as any })).rejects.toThrow(
        'Profile is required'
      );
    });

    it('rejects when fullName is missing', async () => {
      await expect(
        service.generateCv({
          ...baseInput,
          profile: { ...baseInput.profile, fullName: '' },
        })
      ).rejects.toThrow('Profile must have a fullName');
    });

    it('rejects when fullName is only whitespace', async () => {
      await expect(
        service.generateCv({
          ...baseInput,
          profile: { ...baseInput.profile, fullName: '   ' },
        })
      ).rejects.toThrow('Profile must have a fullName');
    });

    it('rejects when experiences is not an array', async () => {
      await expect(
        service.generateCv({ ...baseInput, experiences: 'invalid' as any })
      ).rejects.toThrow('Experiences must be an array');
    });
  });

  describe('analyzeCompanyInfo', () => {
    const analysisResult: CompanyAnalysisResult = {
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

    it('returns validated analysis result', async () => {
      mockRepo.analyzeCompanyInfo.mockResolvedValue(analysisResult);

      await service.analyzeCompanyInfo({
        companyName: 'Acme',
        rawText: 'Research text',
      });

      expect(mockRepo.analyzeCompanyInfo).toHaveBeenCalledWith({
        companyName: 'Acme',
        rawText: 'Research text',
      });
    });

    it('rejects empty research text', async () => {
      await expect(
        service.analyzeCompanyInfo({ companyName: 'Acme', rawText: '   ' })
      ).rejects.toThrow('Company research text cannot be empty');
      expect(mockRepo.analyzeCompanyInfo).not.toHaveBeenCalled();
    });

    it('rejects invalid structures', async () => {
      mockRepo.analyzeCompanyInfo.mockResolvedValue({
        companyProfile: {},
      } as CompanyAnalysisResult);

      await expect(
        service.analyzeCompanyInfo({ companyName: 'Acme', rawText: 'data' })
      ).rejects.toThrow('Invalid company analysis structure');
    });
  });

  describe('generateCompanyCanvas', () => {
    const canvasResult: GeneratedCompanyCanvas = {
      companyName: 'Acme',
      customerSegments: ['SMBs'],
      valuePropositions: ['Automation'],
      channels: [],
      customerRelationships: [],
      revenueStreams: [],
      keyResources: [],
      keyActivities: [],
      keyPartners: [],
      costStructure: [],
    };

    it('returns generated canvas when repo succeeds', async () => {
      mockRepo.generateCompanyCanvas.mockResolvedValue(canvasResult);

      const result = await service.generateCompanyCanvas({
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

      expect(mockRepo.generateCompanyCanvas).toHaveBeenCalledWith({
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
      expect(result.companyName).toBe('Acme');
    });

    it('throws when validation fails', async () => {
      mockRepo.generateCompanyCanvas.mockResolvedValue({
        companyName: 'Acme',
        customerSegments: 'invalid' as unknown as string[],
        valuePropositions: [],
        channels: [],
        customerRelationships: [],
        revenueStreams: [],
        keyResources: [],
        keyActivities: [],
        keyPartners: [],
        costStructure: [],
        confidence: 0.5,
      } as GeneratedCompanyCanvas);

      await expect(
        service.generateCompanyCanvas({
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
      ).rejects.toThrow('Invalid company canvas result');
    });
  });

  describe('AI mock overrides', () => {
    let originalWindow: typeof window | undefined;

    beforeEach(() => {
      originalWindow = (globalThis as unknown as { window?: typeof window }).window;
    });

    afterEach(() => {
      if (originalWindow === undefined) {
        delete (globalThis as unknown as { window?: typeof window }).window;
      } else {
        (globalThis as unknown as { window?: typeof window }).window = originalWindow;
      }
    });

    it('uses analyzeCompanyInfo mock when provided', async () => {
      const mockedResult: CompanyAnalysisResult = {
        companyProfile: {
          companyName: 'Mocked Inc.',
          industry: 'AI',
          sizeRange: '11-50',
          website: 'https://mocked.example',
          productsServices: ['Mock'],
          targetMarkets: [],
          customerSegments: [],
          description: 'Test',
          rawNotes: 'Mock notes',
        },
      };

      (globalThis as any).window = {
        __AI_OPERATION_MOCKS__: {
          analyzeCompanyInfo: () => mockedResult,
        },
      };

      const result = await service.analyzeCompanyInfo({
        companyName: 'Ignored',
        rawText: 'notes',
      });

      expect(result).toEqual(mockedResult);
      expect(mockRepo.analyzeCompanyInfo).not.toHaveBeenCalled();
    });

    it('uses generateCompanyCanvas mock when provided', async () => {
      const mockedCanvas: GeneratedCompanyCanvas = {
        companyName: 'Mocked Inc.',
        customerSegments: ['Segment'],
        valuePropositions: ['Mock Value'],
        channels: [],
        customerRelationships: [],
        revenueStreams: [],
        keyResources: [],
        keyActivities: [],
        keyPartners: [],
        costStructure: [],
      };

      (globalThis as any).window = {
        __AI_OPERATION_MOCKS__: {
          generateCompanyCanvas: () => mockedCanvas,
        },
      };

      const result = await service.generateCompanyCanvas({
        companyProfile: {
          companyName: 'Ignored',
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

      expect(result).toEqual(mockedCanvas);
      expect(mockRepo.generateCompanyCanvas).not.toHaveBeenCalled();
    });
  });

  describe('generateMatchingSummary', () => {
    const validInput = {
      profile: {
        fullName: 'Casey Candidate',
        strengths: ['Leadership'],
      },
      jobDescription: {
        title: 'Head of Engineering',
        seniorityLevel: '',
        roleSummary: '',
        responsibilities: ['Lead org'],
        requiredSkills: [],
        behaviours: [],
        successCriteria: [],
        explicitPains: [],
      },
    };

    const summaryResult: MatchingSummaryResult = {
      overallScore: 82,
      scoreBreakdown: {
        skillFit: 45,
        experienceFit: 25,
        interestFit: 7,
        edge: 5,
      },
      recommendation: 'apply',
      reasoningHighlights: ['Strong engineering leadership', 'Good strategic alignment'],
      strengthsForThisRole: ['Team scaling', 'Agile delivery'],
      skillMatch: ['[MATCH] Leadership — demonstrated', '[PARTIAL] Healthcare — limited'],
      riskyPoints: [
        'Risk: Limited healthcare knowledge. Mitigation: Study compliance requirements.',
      ],
      impactOpportunities: ['Accelerate delivery', 'Scale agile teams'],
      tailoringTips: ['Emphasize team growth metrics', 'Address healthcare learning plan'],
      generatedAt: '2025-01-01T00:00:00.000Z',
      needsUpdate: false,
    };

    it('returns a normalized matching summary from the repository', async () => {
      mockRepo.generateMatchingSummary.mockResolvedValue(summaryResult);

      const result = await service.generateMatchingSummary(validInput as never);

      expect(result).toEqual(summaryResult);
      expect(mockRepo.generateMatchingSummary).toHaveBeenCalledWith(validInput);
    });

    it('throws when user profile is missing', async () => {
      await expect(
        service.generateMatchingSummary({ profile: {}, jobDescription: { title: 'x' } } as never)
      ).rejects.toThrow('User profile with fullName is required');
      expect(mockRepo.generateMatchingSummary).not.toHaveBeenCalled();
    });

    it('throws when job title missing', async () => {
      await expect(
        service.generateMatchingSummary({
          profile: { fullName: 'Casey' },
          jobDescription: { title: '' },
        } as never)
      ).rejects.toThrow('Job title is required to generate a matching summary');
      expect(mockRepo.generateMatchingSummary).not.toHaveBeenCalled();
    });

    it('throws when repo returns invalid structure', async () => {
      mockRepo.generateMatchingSummary.mockResolvedValue({ invalid: true });

      await expect(service.generateMatchingSummary(validInput as never)).rejects.toThrow(
        'Invalid matching summary result'
      );
    });
  });

  describe('generateSpeech', () => {
    const validInput = {
      language: 'en',
      profile: { fullName: 'Casey Candidate' },
      experiences: [],
    };

    it('should generate speech successfully', async () => {
      const speechResult: SpeechResult = {
        elevatorPitch: 'Pitch',
        careerStory: 'Story',
        whyMe: 'Why me',
      };
      mockRepo.generateSpeech.mockResolvedValue(speechResult);

      const result = await service.generateSpeech(validInput as never);

      expect(result).toEqual(speechResult);
      expect(mockRepo.generateSpeech).toHaveBeenCalledWith(validInput);
    });

    it('should throw if profile fullName missing', async () => {
      await expect(
        service.generateSpeech({ language: 'en', profile: {}, experiences: [] } as never)
      ).rejects.toThrow('User profile with fullName is required');
      expect(mockRepo.generateSpeech).not.toHaveBeenCalled();
    });

    it('should throw if language is not supported', async () => {
      await expect(
        service.generateSpeech({ ...validInput, language: 'fr' as 'en' } as never)
      ).rejects.toThrow('Language must be "en"');
      expect(mockRepo.generateSpeech).not.toHaveBeenCalled();
    });

    it('should throw if output is invalid', async () => {
      mockRepo.generateSpeech.mockResolvedValue({ invalid: true });

      await expect(service.generateSpeech(validInput as never)).rejects.toThrow(
        'Invalid speech generation result'
      );
    });
  });

  describe('generateCoverLetter', () => {
    const validInput = {
      language: 'en',
      profile: { fullName: 'Casey Candidate' },
      experiences: [],
    };

    it('should generate cover letter successfully', async () => {
      mockRepo.generateCoverLetter = vi.fn().mockResolvedValue('Dear Hiring Manager...');

      const result = await service.generateCoverLetter(validInput as never);

      expect(result).toBe('Dear Hiring Manager...');
      expect(mockRepo.generateCoverLetter).toHaveBeenCalledWith(validInput);
    });

    it('should throw if profile fullName missing', async () => {
      mockRepo.generateCoverLetter = vi.fn();

      await expect(
        service.generateCoverLetter({ language: 'en', profile: {}, experiences: [] } as never)
      ).rejects.toThrow('User profile with fullName is required');
      expect(mockRepo.generateCoverLetter).not.toHaveBeenCalled();
    });

    it('should throw if language is not supported', async () => {
      mockRepo.generateCoverLetter = vi.fn();

      await expect(
        service.generateCoverLetter({ ...validInput, language: 'fr' as 'en' } as never)
      ).rejects.toThrow('Language must be "en"');
      expect(mockRepo.generateCoverLetter).not.toHaveBeenCalled();
    });

    it('should throw if output is not a string', async () => {
      mockRepo.generateCoverLetter = vi.fn().mockResolvedValue({ invalid: true });

      await expect(service.generateCoverLetter(validInput as never)).rejects.toThrow(
        'Invalid cover letter generation result'
      );
    });
  });

  describe('evaluateApplicationStrength', () => {
    const validInput = {
      job: {
        title: 'Senior Product Manager',
        seniorityLevel: 'Senior',
        roleSummary: 'Lead roadmap strategy.',
        responsibilities: ['Drive strategy'],
        requiredSkills: ['Stakeholder management'],
        behaviours: ['Ownership'],
        successCriteria: ['Increased adoption'],
        explicitPains: ['Roadmap fragmentation'],
        atsKeywords: ['Product strategy', 'Roadmap'],
      },
      cvText: 'Product manager with measurable outcomes.',
      coverLetterText: '',
      language: 'en',
    };

    const validResult: ApplicationStrengthResult = {
      overallScore: 70,
      dimensionScores: {
        atsReadiness: 72,
        keywordCoverage: 68,
        clarityFocus: 69,
        targetedFitSignals: 70,
        evidenceStrength: 71,
      },
      decision: {
        label: 'borderline',
        readyToApply: false,
        rationaleBullets: ['Strong base', 'Needs better metrics'],
      },
      missingSignals: ['Specific ownership examples'],
      topImprovements: [
        {
          title: 'Add quantified impact',
          action: 'Include concrete metrics in achievements.',
          impact: 'high',
          target: { document: 'cv', anchor: 'experience' },
        },
        {
          title: 'Improve summary targeting',
          action: 'Align summary wording with role scope.',
          impact: 'medium',
          target: { document: 'cv', anchor: 'summary' },
        },
      ],
      notes: {
        atsNotes: ['Keywords partially covered'],
        humanReaderNotes: ['Needs stronger evidence'],
      },
    };

    it('returns validated application strength output', async () => {
      mockRepo.evaluateApplicationStrength.mockResolvedValue(validResult);

      const result = await service.evaluateApplicationStrength(validInput as never);

      expect(result).toEqual(validResult);
      expect(mockRepo.evaluateApplicationStrength).toHaveBeenCalledWith(validInput);
    });

    it('throws when job title is missing', async () => {
      await expect(
        service.evaluateApplicationStrength({
          ...validInput,
          job: { ...validInput.job, title: '' },
        } as never)
      ).rejects.toThrow('Job title is required');
      expect(mockRepo.evaluateApplicationStrength).not.toHaveBeenCalled();
    });

    it('throws when both cvText and coverLetterText are empty', async () => {
      await expect(
        service.evaluateApplicationStrength({
          ...validInput,
          cvText: '',
          coverLetterText: '',
        } as never)
      ).rejects.toThrow('At least one document is required (cvText or coverLetterText).');
      expect(mockRepo.evaluateApplicationStrength).not.toHaveBeenCalled();
    });

    it('accepts cover-letter-only input', async () => {
      mockRepo.evaluateApplicationStrength.mockResolvedValue(validResult);

      const result = await service.evaluateApplicationStrength({
        ...validInput,
        cvText: '',
        coverLetterText: 'Strong cover letter content.',
      } as never);

      expect(result).toEqual(validResult);
      expect(mockRepo.evaluateApplicationStrength).toHaveBeenCalledWith({
        ...validInput,
        cvText: '',
        coverLetterText: 'Strong cover letter content.',
      });
    });

    it('throws when language is missing', async () => {
      await expect(
        service.evaluateApplicationStrength({ ...validInput, language: '' } as never)
      ).rejects.toThrow('Language cannot be empty');
      expect(mockRepo.evaluateApplicationStrength).not.toHaveBeenCalled();
    });

    it('throws when repo returns invalid structure', async () => {
      mockRepo.evaluateApplicationStrength.mockResolvedValue({ invalid: true });

      await expect(service.evaluateApplicationStrength(validInput as never)).rejects.toThrow(
        'Invalid application strength result'
      );
    });
  });
});
