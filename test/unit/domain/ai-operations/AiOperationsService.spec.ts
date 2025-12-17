import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiOperationsService } from '@/domain/ai-operations/AiOperationsService';
import type { AiOperationsRepository } from '@/domain/ai-operations/AiOperationsRepository';
import type { ParsedCV } from '@/domain/ai-operations/ParsedCV';
import type { ExperiencesResult } from '@/domain/ai-operations/Experience';
import type { STARStory } from '@/domain/ai-operations/STARStory';
import type { AchievementsAndKpis } from '@/domain/ai-operations/AchievementsAndKpis';

// Mock the repository
vi.mock('@/domain/ai-operations/AiOperationsRepository');

describe('AiOperationsService', () => {
  let service: AiOperationsService;
  let mockRepo: {
    parseCvText: ReturnType<typeof vi.fn>;
    extractExperienceBlocks: ReturnType<typeof vi.fn>;
    generateStarStory: ReturnType<typeof vi.fn>;
    generateAchievementsAndKpis: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Create mock repository
    mockRepo = {
      parseCvText: vi.fn(),
      extractExperienceBlocks: vi.fn(),
      generateStarStory: vi.fn(),
      generateAchievementsAndKpis: vi.fn(),
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
});
