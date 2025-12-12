import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAiOperations } from '@/application/ai-operations/useAiOperations';
import { AiOperationsService } from '@/domain/ai-operations/AiOperationsService';
import type { ParsedCV } from '@/domain/ai-operations/ParsedCV';
import type { ExperiencesResult } from '@/domain/ai-operations/Experience';
import type { STARStory } from '@/domain/ai-operations/STARStory';
import type { AchievementsAndKpis } from '@/domain/ai-operations/AchievementsAndKpis';

// Mock the service
vi.mock('@/domain/ai-operations/AiOperationsService');

describe('useAiOperations', () => {
  let mockService: {
    parseCvText: ReturnType<typeof vi.fn>;
    extractExperienceBlocks: ReturnType<typeof vi.fn>;
    generateStarStory: ReturnType<typeof vi.fn>;
    generateAchievementsAndKpis: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Create mock service
    mockService = {
      parseCvText: vi.fn(),
      extractExperienceBlocks: vi.fn(),
      generateStarStory: vi.fn(),
      generateAchievementsAndKpis: vi.fn(),
    };

    // Mock the service constructor
    vi.mocked(AiOperationsService).mockImplementation(
      () => mockService as unknown as AiOperationsService
    );
  });

  it('should initialize with default state', () => {
    // Act
    const { parsedCv, experiences, starStories, achievementsAndKpis, loading, error } =
      useAiOperations();

    // Assert
    expect(parsedCv.value).toBeNull();
    expect(experiences.value).toBeNull();
    expect(starStories.value).toBeNull();
    expect(achievementsAndKpis.value).toBeNull();
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it('should successfully parse CV', async () => {
    // Arrange
    const mockParsedCv = {
      sections: {
        experiences: [],
        education: [],
        skills: [],
        certifications: [],
        rawBlocks: [],
      },
      confidence: 0.95,
    } as ParsedCV;
    mockService.parseCvText.mockResolvedValue(mockParsedCv);

    // Act
    const { parsedCv, loading, error, parseCv } = useAiOperations();
    await parseCv('Sample CV');

    // Assert
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
    expect(parsedCv.value).toEqual(mockParsedCv);
  });

  it('should successfully extract experiences', async () => {
    // Arrange
    const mockExperiences: ExperiencesResult = {
      experiences: [
        {
          title: 'Developer',
          company: 'TechCorp',
          startDate: '2020-01',
          endDate: '2023-12',
          responsibilities: [],
          tasks: [],
        },
      ],
    };
    mockService.extractExperienceBlocks.mockResolvedValue(mockExperiences);

    // Act
    const { experiences, loading, error, extractExperiences } = useAiOperations();
    await extractExperiences(['Experience 1']);

    // Assert
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
    expect(experiences.value).toEqual(mockExperiences);
  });

  it('should successfully generate STAR story', async () => {
    // Arrange
    const mockStarStory: STARStory = {
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

  it('should reset state', () => {
    // Arrange
    const { parsedCv, experiences, starStories, achievementsAndKpis, loading, error, reset } =
      useAiOperations();
    parsedCv.value = {
      sections: {
        experiences: [],
        education: [],
        skills: [],
        certifications: [],
        rawBlocks: [],
      },
      confidence: 0.9,
    } as ParsedCV;
    experiences.value = { experiences: [] };
    starStories.value = [
      {
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
    loading.value = true;
    error.value = 'Some error';

    // Act
    reset();

    // Assert
    expect(parsedCv.value).toBeNull();
    expect(experiences.value).toBeNull();
    expect(starStories.value).toBeNull();
    expect(achievementsAndKpis.value).toBeNull();
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });
});
