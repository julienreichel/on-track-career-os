import { describe, it, expect, vi, beforeEach } from 'vitest';
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
    };

    // Create service with mocked repo
    service = new AiOperationsService(mockRepo as unknown as AiOperationsRepository);
  });

  describe('parseCvText', () => {
    it('should successfully parse valid CV text', async () => {
      // Arrange
      const mockParsedCv: ParsedCV = {
        sections: {
          experiences: ['Senior Developer at TechCorp (2020-2023)'],
          education: ['BSc Computer Science from MIT (2019)'],
          skills: ['Python'],
          certifications: ['AWS Certified'],
          rawBlocks: ['Experience section...'],
        },
        profile: {
          fullName: 'John Doe',
          headline: 'Senior Software Engineer',
          location: 'San Francisco, CA',
          seniorityLevel: 'Senior',
          goals: ['Lead team'],
          aspirations: ['CTO'],
          personalValues: ['Innovation'],
          strengths: ['Problem solving'],
          interests: ['AI'],
          languages: ['English'],
        },
        confidence: 0.95,
      };

      mockRepo.parseCvText.mockResolvedValue(mockParsedCv);

      // Act
      const result = await service.parseCvText('Sample CV text');

      // Assert
      expect(result).toEqual(mockParsedCv);
      expect(mockRepo.parseCvText).toHaveBeenCalledWith('Sample CV text');
    });

    it('should throw error for empty CV text', async () => {
      // Act & Assert
      await expect(service.parseCvText('')).rejects.toThrow('CV text cannot be empty');
      expect(mockRepo.parseCvText).not.toHaveBeenCalled();
    });

    it('should throw error for whitespace-only CV text', async () => {
      // Act & Assert
      await expect(service.parseCvText('   ')).rejects.toThrow('CV text cannot be empty');
      expect(mockRepo.parseCvText).not.toHaveBeenCalled();
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      mockRepo.parseCvText.mockRejectedValue(new Error('AI operation failed'));

      // Act & Assert
      await expect(service.parseCvText('Sample CV text')).rejects.toThrow(
        'Failed to parse CV text: AI operation failed'
      );
    });

    it('should throw error when result structure is invalid', async () => {
      // Arrange
      mockRepo.parseCvText.mockResolvedValue({ invalid: 'structure' });

      // Act & Assert
      await expect(service.parseCvText('Sample CV text')).rejects.toThrow(
        'Invalid CV parsing result structure'
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

      await expect(service.parseJobDescription('Valid text')).rejects.toThrow(
        'Failed to parse job description: AI failure'
      );
    });

    it('should throw when structure invalid', async () => {
      mockRepo.parseJobDescription.mockResolvedValue({ invalid: true });

      await expect(service.parseJobDescription('Valid text')).rejects.toThrow(
        'Invalid job description parsing result structure'
      );
    });
  });

  describe('extractExperienceBlocks', () => {
    it('should successfully extract experience blocks', async () => {
      // Arrange
      const mockExperiences: ExperiencesResult = {
        experiences: [
          {
            title: 'Senior Developer',
            company: 'TechCorp',
            startDate: '2020-01',
            endDate: '2023-12',
            responsibilities: ['Lead team', 'Code review'],
            tasks: ['Development', 'Mentoring'],
            experienceType: 'work',
          },
        ],
      };

      mockRepo.extractExperienceBlocks.mockResolvedValue(mockExperiences);

      // Act
      const result = await service.extractExperienceBlocks(['Experience 1', 'Experience 2']);

      // Assert
      expect(result).toEqual(mockExperiences);
      expect(mockRepo.extractExperienceBlocks).toHaveBeenCalledWith([
        'Experience 1',
        'Experience 2',
      ]);
    });

    it('should throw error for empty experience blocks array', async () => {
      // Act & Assert
      await expect(service.extractExperienceBlocks([])).rejects.toThrow(
        'Experience text blocks cannot be empty'
      );
      expect(mockRepo.extractExperienceBlocks).not.toHaveBeenCalled();
    });

    it('should throw error for array with empty strings', async () => {
      // Act & Assert
      await expect(service.extractExperienceBlocks(['Experience 1', ''])).rejects.toThrow(
        'Experience text blocks cannot contain empty strings'
      );
      expect(mockRepo.extractExperienceBlocks).not.toHaveBeenCalled();
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      mockRepo.extractExperienceBlocks.mockRejectedValue(new Error('AI operation failed'));

      // Act & Assert
      await expect(service.extractExperienceBlocks(['Experience 1'])).rejects.toThrow(
        'Failed to extract experience blocks: AI operation failed'
      );
    });

    it('should throw error when result structure is invalid', async () => {
      // Arrange
      mockRepo.extractExperienceBlocks.mockResolvedValue({ invalid: 'structure' });

      // Act & Assert
      await expect(service.extractExperienceBlocks(['Experience 1'])).rejects.toThrow(
        'Invalid experience extraction result structure'
      );
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
      userProfile: { fullName: 'Jane Doe' },
      selectedExperiences: [
        {
          id: 'exp-1',
          title: 'Engineer',
          company: 'Acme',
          startDate: '2020-01-01',
        },
      ],
    };

    it('returns markdown when repo succeeds', async () => {
      mockRepo.generateCv.mockResolvedValue('## CV');

      const result = await service.generateCv(baseInput);

      expect(mockRepo.generateCv).toHaveBeenCalledWith(baseInput);
      expect(result).toBe('## CV');
    });

    it('rejects when no experiences provided', async () => {
      await expect(
        service.generateCv({ ...baseInput, selectedExperiences: [] })
      ).rejects.toThrow('At least one experience must be selected');
      expect(mockRepo.generateCv).not.toHaveBeenCalled();
    });

    it('rejects when experience missing required fields', async () => {
      await expect(
        service.generateCv({
          ...baseInput,
          selectedExperiences: [{ id: 'exp', title: '', company: '', startDate: '2020-01-01' }],
        })
      ).rejects.toThrow('Each experience must have id, title, and company');
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
  });

  describe('analyzeCompanyInfo', () => {
    const analysisResult: CompanyAnalysisResult = {
      companyProfile: {
        companyName: 'Acme',
        alternateNames: [],
        industry: '',
        sizeRange: '',
        headquarters: '',
        website: '',
        productsServices: [],
        targetMarkets: [],
        customerSegments: [],
        summary: '',
      },
      signals: {
        marketChallenges: [],
        internalPains: [],
        partnerships: [],
        hiringFocus: [],
        strategicNotes: [],
      },
      confidence: 0.7,
    };

    it('returns validated analysis result', async () => {
      mockRepo.analyzeCompanyInfo.mockResolvedValue(analysisResult);

      const result = await service.analyzeCompanyInfo({
        companyName: 'Acme',
        rawText: 'Research text',
      });

      expect(mockRepo.analyzeCompanyInfo).toHaveBeenCalledWith({
        companyName: 'Acme',
        rawText: 'Research text',
      });
      expect(result.confidence).toBe(0.7);
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
        signals: {},
        confidence: 0.5,
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
      analysisSummary: 'Summary',
      confidence: 0.65,
    };

    it('returns generated canvas when repo succeeds', async () => {
      mockRepo.generateCompanyCanvas.mockResolvedValue(canvasResult);

      const result = await service.generateCompanyCanvas({
        companyProfile: { companyName: 'Acme' },
        signals: {},
      });

      expect(mockRepo.generateCompanyCanvas).toHaveBeenCalledWith({
        companyProfile: { companyName: 'Acme' },
        signals: {},
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
        analysisSummary: 'Summary',
        confidence: 0.5,
      } as GeneratedCompanyCanvas);

      await expect(
        service.generateCompanyCanvas({
          companyProfile: { companyName: 'Acme' },
          signals: {},
        })
      ).rejects.toThrow('Invalid company canvas result');
    });
  });
});
