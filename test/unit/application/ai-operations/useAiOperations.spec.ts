import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAiOperations } from '@/application/ai-operations/useAiOperations';
import { AiOperationsService } from '@/domain/ai-operations/AiOperationsService';
import type { ParsedCV } from '@/domain/ai-operations/ParsedCV';
import type { ExperiencesResult } from '@/domain/ai-operations/Experience';
import type { STARStory } from '@/domain/ai-operations/STARStory';
import type { AchievementsAndKpis } from '@/domain/ai-operations/AchievementsAndKpis';
import type { ParsedJobDescription } from '@/domain/ai-operations/ParsedJobDescription';
import { ApplicationStrengthService } from '@/domain/application-strength/ApplicationStrengthService';

// Mock the service
vi.mock('@/domain/ai-operations/AiOperationsService');
vi.mock('@/domain/application-strength/ApplicationStrengthService');

describe('useAiOperations', () => {
  let mockService: {
    parseCvText: ReturnType<typeof vi.fn>;
    parseJobDescription: ReturnType<typeof vi.fn>;
    extractExperienceBlocks: ReturnType<typeof vi.fn>;
    generateStarStory: ReturnType<typeof vi.fn>;
    generateAchievementsAndKpis: ReturnType<typeof vi.fn>;
  };
  let mockApplicationStrengthService: {
    evaluate: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Create mock service
    mockService = {
      parseCvText: vi.fn(),
      parseJobDescription: vi.fn(),
      extractExperienceBlocks: vi.fn(),
      generateStarStory: vi.fn(),
      generateAchievementsAndKpis: vi.fn(),
    };
    mockApplicationStrengthService = {
      evaluate: vi.fn(),
    };

    // Mock the service constructor
    vi.mocked(AiOperationsService).mockImplementation(
      () => mockService as unknown as AiOperationsService
    );
    vi.mocked(ApplicationStrengthService).mockImplementation(
      () => mockApplicationStrengthService as unknown as ApplicationStrengthService
    );
  });

  it('should initialize with default state', () => {
    // Act
    const {
      parsedCv,
      parsedJobDescription,
      experiences,
      starStories,
      achievementsAndKpis,
      loading,
      error,
    } = useAiOperations();

    // Assert
    expect(parsedCv.value).toBeNull();
    expect(parsedJobDescription.value).toBeNull();
    expect(experiences.value).toBeNull();
    expect(starStories.value).toBeNull();
    expect(achievementsAndKpis.value).toBeNull();
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it('should successfully parse CV', async () => {
    // Arrange
    const mockParsedCv = {
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
        skills: [],
        certifications: [],
        languages: [],
      },
      experienceItems: [],
      rawBlocks: [],
      confidence: 0.5,
    } as ParsedCV;
    mockService.parseCvText.mockResolvedValue(mockParsedCv);

    // Act
    const { parsedCv, loading, error, parseCv } = useAiOperations();
    await parseCv('Sample CV', 'en');

    // Assert
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
    expect(parsedCv.value).toEqual(mockParsedCv);
  });

  it('should successfully parse job description text', async () => {
    const mockParsedJob: ParsedJobDescription = {
      title: 'Senior Product Manager',
      seniorityLevel: 'Senior',
      roleSummary: 'Drives the roadmap for enterprise analytics.',
      responsibilities: ['Own the analytics roadmap'],
      requiredSkills: ['Stakeholder management'],
      behaviours: ['Bias for action'],
      successCriteria: ['Increased adoption'],
      explicitPains: ['Fragmented data'],
      atsKeywords: [],
    };

    mockService.parseJobDescription.mockResolvedValue(mockParsedJob);

    const { parsedJobDescription, loading, error, parseJobDescription } = useAiOperations();
    await parseJobDescription('We are hiring a Senior Product Manager...');

    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
    expect(parsedJobDescription.value).toEqual(mockParsedJob);
  });

  it('should handle errors when parsing job descriptions', async () => {
    mockService.parseJobDescription.mockRejectedValue(new Error('Job parsing failed'));

    const { parsedJobDescription, loading, error, parseJobDescription } = useAiOperations();
    await parseJobDescription('Broken job posting');

    expect(loading.value).toBe(false);
    expect(error.value).toBe('Job parsing failed');
    expect(parsedJobDescription.value).toBeNull();
  });

  it('should successfully extract experiences', async () => {
    // Arrange
    const mockExperiences: ExperiencesResult = {
      experiences: [
        {
          title: 'Developer',
          companyName: 'TechCorp',
          startDate: '2020-01',
          endDate: '2023-12',
          responsibilities: [],
          tasks: [],
          status: 'draft',
          experienceType: 'work',
        },
      ],
    };
    mockService.extractExperienceBlocks.mockResolvedValue(mockExperiences);

    // Act
    const { experiences, loading, error, extractExperiences } = useAiOperations();
    await extractExperiences('en', [{ experienceType: 'work', rawBlock: 'Experience 1' }]);

    // Assert
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
    expect(experiences.value).toEqual(mockExperiences);
  });

  it('should successfully generate STAR story', async () => {
    // Arrange
    const mockStarStory: STARStory = {
      title: 'Distributed team',
      situation: 'Led a distributed team during company restructuring',
      task: 'Maintain team productivity and morale',
      action: 'Implemented daily standups and 1-on-1s',
      result: 'Team maintained 95% sprint completion rate',
    };
    mockService.generateStarStory.mockResolvedValue([mockStarStory]);

    // Act
    const { starStories, loading, error, generateStarStory } = useAiOperations();
    await generateStarStory('Led team during restructuring...');

    // Assert
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
    expect(starStories.value).toEqual([mockStarStory]);
  });

  it('should handle errors in generateStarStory', async () => {
    // Arrange
    mockService.generateStarStory.mockRejectedValue(new Error('STAR generation failed'));

    // Act
    const { starStories, loading, error, generateStarStory } = useAiOperations();
    await generateStarStory('Some experience text');

    // Assert
    expect(loading.value).toBe(false);
    expect(error.value).toBe('STAR generation failed');
    expect(starStories.value).toBeNull();
  });

  it('should successfully generate achievements and KPIs', async () => {
    // Arrange
    const mockStarStory: STARStory = {
      title: 'Distributed team',
      situation: 'Led distributed team',
      task: 'Maintain productivity',
      action: 'Implemented standups',
      result: '95% completion rate',
    };
    const mockResult: AchievementsAndKpis = {
      achievements: ['Led distributed team successfully', 'Maintained high productivity'],
      kpiSuggestions: ['95% sprint completion rate', 'Team satisfaction improved'],
    };
    mockService.generateAchievementsAndKpis.mockResolvedValue(mockResult);

    // Act
    const { achievementsAndKpis, loading, error, generateAchievementsAndKpis } = useAiOperations();
    await generateAchievementsAndKpis(mockStarStory);

    // Assert
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
    expect(achievementsAndKpis.value).toEqual(mockResult);
  });

  it('should handle errors in generateAchievementsAndKpis', async () => {
    // Arrange
    const mockStarStory: STARStory = {
      title: 'Distributed team',
      situation: 'Led team',
      task: 'Maintain productivity',
      action: 'Implemented standups',
      result: 'High completion',
    };
    mockService.generateAchievementsAndKpis.mockRejectedValue(new Error('KPI generation failed'));

    // Act
    const { achievementsAndKpis, loading, error, generateAchievementsAndKpis } = useAiOperations();
    await generateAchievementsAndKpis(mockStarStory);

    // Assert
    expect(loading.value).toBe(false);
    expect(error.value).toBe('KPI generation failed');
    expect(achievementsAndKpis.value).toBeNull();
  });

  it('should evaluate application strength via domain service', async () => {
    const mockEvaluation = {
      overallScore: 70,
      dimensionScores: {
        atsReadiness: 72,
        clarityFocus: 69,
        targetedFitSignals: 70,
        evidenceStrength: 71,
      },
      decision: {
        label: 'borderline',
        readyToApply: false,
        rationaleBullets: ['Good base', 'Needs stronger metrics'],
      },
      missingSignals: [],
      topImprovements: [],
      notes: {
        atsNotes: [],
        humanReaderNotes: [],
      },
    };
    mockApplicationStrengthService.evaluate.mockResolvedValue(mockEvaluation);

    const { applicationStrength, loading, error, evaluateApplicationStrength } = useAiOperations();
    await evaluateApplicationStrength({
      job: {
        title: 'Senior Product Manager',
        seniorityLevel: 'Senior',
        roleSummary: 'Lead roadmap',
        responsibilities: ['Drive strategy'],
        requiredSkills: ['Stakeholder management'],
        behaviours: ['Ownership'],
        successCriteria: ['Improve adoption'],
        explicitPains: ['Fragmented roadmap'],
        atsKeywords: ['Product strategy'],
      },
      cvText: 'CV content',
      coverLetterText: '',
      language: 'en',
    });

    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
    expect(applicationStrength.value).toEqual(mockEvaluation);
  });

  it('should reset state', () => {
    // Arrange
    const {
      parsedCv,
      parsedJobDescription,
      experiences,
      starStories,
      achievementsAndKpis,
      applicationStrength,
      loading,
      error,
      reset,
    } = useAiOperations();
    parsedCv.value = {
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
        skills: [],
        certifications: [],
        languages: [],
      },
      experienceItems: [],
      rawBlocks: [],
      confidence: 0.5,
    } as ParsedCV;
    parsedJobDescription.value = {
      title: 'Example',
      seniorityLevel: 'Lead',
      roleSummary: 'Example summary',
      responsibilities: [],
      requiredSkills: [],
      behaviours: [],
      successCriteria: [],
      explicitPains: [],
      atsKeywords: [],
    };
    experiences.value = [];
    starStories.value = [
      {
        title: 'Test',
        situation: 'Test',
        task: 'Test',
        action: 'Test',
        result: 'Test',
      },
    ];
    achievementsAndKpis.value = {
      achievements: ['Test'],
      kpiSuggestions: ['Test KPI'],
    };
    applicationStrength.value = {
      overallScore: 0,
      dimensionScores: {
        atsReadiness: 0,
        clarityFocus: 0,
        targetedFitSignals: 0,
        evidenceStrength: 0,
      },
      decision: {
        label: 'risky',
        readyToApply: false,
        rationaleBullets: [],
      },
      missingSignals: [],
      topImprovements: [],
      notes: {
        atsNotes: [],
        humanReaderNotes: [],
      },
    };
    loading.value = true;
    error.value = 'Some error';

    // Act
    reset();

    // Assert
    expect(parsedCv.value).toBeNull();
    expect(parsedJobDescription.value).toBeNull();
    expect(experiences.value).toBeNull();
    expect(starStories.value).toBeNull();
    expect(achievementsAndKpis.value).toBeNull();
    expect(applicationStrength.value).toBeNull();
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });
});
