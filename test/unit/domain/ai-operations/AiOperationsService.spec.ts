import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiOperationsService } from '@/domain/ai-operations/AiOperationsService';
import type { AiOperationsRepository } from '@/domain/ai-operations/AiOperationsRepository';
import type { ParsedCV } from '@/domain/ai-operations/ParsedCV';
import type { ExperiencesResult } from '@/domain/ai-operations/Experience';

// Mock the repository
vi.mock('@/domain/ai-operations/AiOperationsRepository');

describe('AiOperationsService', () => {
  let service: AiOperationsService;
  let mockRepo: {
    parseCvText: ReturnType<typeof vi.fn>;
    extractExperienceBlocks: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Create mock repository
    mockRepo = {
      parseCvText: vi.fn(),
      extractExperienceBlocks: vi.fn(),
    };

    // Create service with mocked repo
    service = new AiOperationsService(mockRepo as unknown as AiOperationsRepository);
  });

  describe('parseCvText', () => {
    it('should successfully parse valid CV text', async () => {
      // Arrange
      const mockParsedCv: ParsedCV = {
        experiences: [
          {
            title: 'Senior Developer',
            company: 'TechCorp',
            start_date: '2020-01',
            end_date: '2023-12',
            description: 'Led development team',
          },
        ],
        education: [
          {
            degree: 'BSc Computer Science',
            institution: 'MIT',
            graduation_date: '2019',
            description: 'Graduated with honors',
          },
        ],
        skills: [{ skill: 'Python', category: 'Programming' }],
        certifications: [{ name: 'AWS Certified', issuer: 'Amazon', date: '2022' }],
        raw_blocks: [{ text: 'Experience section...' }],
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
            start_date: '2020-01',
            end_date: '2023-12',
            responsibilities: ['Lead team', 'Code review'],
            tasks: ['Development', 'Mentoring'],
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

  describe('parseCvAndExtractExperiences', () => {
    it('should successfully parse CV and extract experiences from raw_blocks', async () => {
      // Arrange
      const mockParsedCv: ParsedCV = {
        experiences: [
          {
            title: 'Senior Developer',
            company: 'TechCorp',
            start_date: '2020-01',
            description: 'Led development team',
          },
        ],
        education: [],
        skills: [],
        certifications: [],
        raw_blocks: [
          { text: 'EXPERIENCE section: Senior Developer at TechCorp' },
          { text: 'EDUCATION section: MIT' },
        ],
        confidence: 0.95,
      };

      const mockExperiences: ExperiencesResult = {
        experiences: [
          {
            title: 'Senior Developer',
            company: 'TechCorp',
            start_date: '2020-01',
            end_date: '2023-12',
            responsibilities: ['Lead team'],
            tasks: ['Development'],
          },
        ],
      };

      mockRepo.parseCvText.mockResolvedValue(mockParsedCv);
      mockRepo.extractExperienceBlocks.mockResolvedValue(mockExperiences);

      // Act
      const result = await service.parseCvAndExtractExperiences('Sample CV text');

      // Assert
      expect(result.parsedCv).toEqual(mockParsedCv);
      expect(result.experiences).toEqual(mockExperiences);
      expect(mockRepo.parseCvText).toHaveBeenCalledWith('Sample CV text');
      expect(mockRepo.extractExperienceBlocks).toHaveBeenCalledWith([
        'EXPERIENCE section: Senior Developer at TechCorp',
      ]);
    });

    it('should fallback to experiences descriptions when no experience blocks found', async () => {
      // Arrange
      const mockParsedCv: ParsedCV = {
        experiences: [
          {
            title: 'Senior Developer',
            company: 'TechCorp',
            start_date: '2020-01',
            description: 'Led development team',
          },
        ],
        education: [],
        skills: [],
        certifications: [],
        raw_blocks: [{ text: 'Some other section' }],
        confidence: 0.95,
      };

      const mockExperiences: ExperiencesResult = {
        experiences: [
          {
            title: 'Senior Developer',
            company: 'TechCorp',
            start_date: '2020-01',
            responsibilities: ['Lead team'],
            tasks: ['Development'],
          },
        ],
      };

      mockRepo.parseCvText.mockResolvedValue(mockParsedCv);
      mockRepo.extractExperienceBlocks.mockResolvedValue(mockExperiences);

      // Act
      const result = await service.parseCvAndExtractExperiences('Sample CV text');

      // Assert
      expect(result.parsedCv).toEqual(mockParsedCv);
      expect(result.experiences).toEqual(mockExperiences);
      expect(mockRepo.extractExperienceBlocks).toHaveBeenCalledWith(['Led development team']);
    });

    it('should propagate parsing errors', async () => {
      // Arrange
      mockRepo.parseCvText.mockRejectedValue(new Error('Parse failed'));

      // Act & Assert
      await expect(service.parseCvAndExtractExperiences('Sample CV text')).rejects.toThrow(
        'Failed to parse CV text: Parse failed'
      );
    });

    it('should propagate extraction errors', async () => {
      // Arrange
      const mockParsedCv: ParsedCV = {
        experiences: [{ title: 'Dev', company: 'Corp', start_date: '2020', description: 'Work' }],
        education: [],
        skills: [],
        certifications: [],
        raw_blocks: [{ text: 'EXPERIENCE: Dev at Corp' }],
        confidence: 0.9,
      };

      mockRepo.parseCvText.mockResolvedValue(mockParsedCv);
      mockRepo.extractExperienceBlocks.mockRejectedValue(new Error('Extract failed'));

      // Act & Assert
      await expect(service.parseCvAndExtractExperiences('Sample CV text')).rejects.toThrow(
        'Failed to extract experience blocks: Extract failed'
      );
    });
  });
});
