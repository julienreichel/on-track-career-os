import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  useParseCvText,
  useExtractExperienceBlocks,
  useAiOperations,
} from '@/application/ai-operations/useAiOperations';
import { AiOperationsService } from '@/domain/ai-operations/AiOperationsService';
import type { ParsedCV } from '@/domain/ai-operations/ParsedCV';
import type { ExperiencesResult } from '@/domain/ai-operations/Experience';

// Mock the service
vi.mock('@/domain/ai-operations/AiOperationsService');

describe('useAiOperations composables', () => {
  let mockService: {
    parseCvText: ReturnType<typeof vi.fn>;
    extractExperienceBlocks: ReturnType<typeof vi.fn>;
    parseCvAndExtractExperiences: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Create mock service
    mockService = {
      parseCvText: vi.fn(),
      extractExperienceBlocks: vi.fn(),
      parseCvAndExtractExperiences: vi.fn(),
    };

    // Mock the service constructor
    vi.mocked(AiOperationsService).mockImplementation(
      () => mockService as unknown as AiOperationsService
    );
  });

  describe('useParseCvText', () => {
    it('should initialize with default state', () => {
      // Act
      const { parsedCv, loading, error } = useParseCvText();

      // Assert
      expect(parsedCv.value).toBeNull();
      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
    });

    it('should successfully parse CV text', async () => {
      // Arrange
      const mockParsedCv: ParsedCV = {
        experiences: [],
        education: [],
        skills: [],
        certifications: [],
        rawBlocks: [],
        confidence: 0.95,
      };
      mockService.parseCvText.mockResolvedValue(mockParsedCv);

      // Act
      const { parsedCv, loading, error, parse } = useParseCvText();

      expect(loading.value).toBe(false);
      const parsePromise = parse('Sample CV');
      expect(loading.value).toBe(true);

      await parsePromise;

      // Assert
      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
      expect(parsedCv.value).toEqual(mockParsedCv);
    });

    it('should handle parsing errors', async () => {
      // Arrange
      mockService.parseCvText.mockRejectedValue(new Error('Parse failed'));

      // Act
      const { parsedCv, loading, error, parse } = useParseCvText();
      await parse('Sample CV');

      // Assert
      expect(loading.value).toBe(false);
      expect(error.value).toBe('Parse failed');
      expect(parsedCv.value).toBeNull();
    });

    it('should reset state', () => {
      // Arrange
      const { parsedCv, loading, error, reset } = useParseCvText();
      parsedCv.value = {
        sections: {
          experiences: [],
          education: [],
          skills: [],
          certifications: [],
          rawBlocks: [],
        },
        confidence: 0.9,
      };
      loading.value = true;
      error.value = 'Some error';

      // Act
      reset();

      // Assert
      expect(parsedCv.value).toBeNull();
      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
    });
  });

  describe('useExtractExperienceBlocks', () => {
    it('should initialize with default state', () => {
      // Act
      const { experiences, loading, error } = useExtractExperienceBlocks();

      // Assert
      expect(experiences.value).toBeNull();
      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
    });

    it('should successfully extract experience blocks', async () => {
      // Arrange
      const mockExperiences: ExperiencesResult = {
        experiences: [
          {
            title: 'Developer',
            company: 'TechCorp',
            startDate: '2020-01',
            responsibilities: [],
            tasks: [],
          },
        ],
      };
      mockService.extractExperienceBlocks.mockResolvedValue(mockExperiences);

      // Act
      const { experiences, loading, error, extract } = useExtractExperienceBlocks();

      expect(loading.value).toBe(false);
      const extractPromise = extract(['Experience 1']);
      expect(loading.value).toBe(true);

      await extractPromise;

      // Assert
      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
      expect(experiences.value).toEqual(mockExperiences);
    });

    it('should handle extraction errors', async () => {
      // Arrange
      mockService.extractExperienceBlocks.mockRejectedValue(new Error('Extract failed'));

      // Act
      const { experiences, loading, error, extract } = useExtractExperienceBlocks();
      await extract(['Experience 1']);

      // Assert
      expect(loading.value).toBe(false);
      expect(error.value).toBe('Extract failed');
      expect(experiences.value).toBeNull();
    });

    it('should reset state', () => {
      // Arrange
      const { experiences, loading, error, reset } = useExtractExperienceBlocks();
      experiences.value = { experiences: [] };
      loading.value = true;
      error.value = 'Some error';

      // Act
      reset();

      // Assert
      expect(experiences.value).toBeNull();
      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
    });
  });

  describe('useAiOperations', () => {
    it('should initialize with default state', () => {
      // Act
      const { parsedCv, experiences, loading, error } = useAiOperations();

      // Assert
      expect(parsedCv.value).toBeNull();
      expect(experiences.value).toBeNull();
      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
    });

    it('should successfully parse CV', async () => {
      // Arrange
      const mockParsedCv: ParsedCV = {
        sections: {
          experiences: [],
          education: [],
          skills: [],
          certifications: [],
          rawBlocks: [],
        },
        confidence: 0.95,
      };
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

    it('should successfully parse and extract in one operation', async () => {
      // Arrange
      const mockParsedCv: ParsedCV = {
        sections: {
          experiences: [],
          education: [],
          skills: [],
          certifications: [],
          rawBlocks: [],
        },
        confidence: 0.95,
      };
      const mockExperiences: ExperiencesResult = {
        experiences: [
          {
            title: 'Developer',
            company: 'TechCorp',
            startDate: '2020-01',
            responsibilities: [],
            tasks: [],
          },
        ],
      };
      mockService.parseCvAndExtractExperiences.mockResolvedValue({
        parsedCv: mockParsedCv,
        experiences: mockExperiences,
      });

      // Act
      const { parsedCv, experiences, loading, error, parseAndExtract } = useAiOperations();

      expect(loading.value).toBe(false);
      const parsePromise = parseAndExtract('Sample CV');
      expect(loading.value).toBe(true);

      await parsePromise;

      // Assert
      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
      expect(parsedCv.value).toEqual(mockParsedCv);
      expect(experiences.value).toEqual(mockExperiences);
    });

    it('should handle errors in parseAndExtract', async () => {
      // Arrange
      mockService.parseCvAndExtractExperiences.mockRejectedValue(
        new Error('Combined operation failed')
      );

      // Act
      const { parsedCv, experiences, loading, error, parseAndExtract } = useAiOperations();
      await parseAndExtract('Sample CV');

      // Assert
      expect(loading.value).toBe(false);
      expect(error.value).toBe('Combined operation failed');
      expect(parsedCv.value).toBeNull();
      expect(experiences.value).toBeNull();
    });

    it('should reset state', () => {
      // Arrange
      const { parsedCv, experiences, loading, error, reset } = useAiOperations();
      parsedCv.value = {
        sections: {
          experiences: [],
          education: [],
          skills: [],
          certifications: [],
          rawBlocks: [],
        },
        confidence: 0.9,
      };
      experiences.value = { experiences: [] };
      loading.value = true;
      error.value = 'Some error';

      // Act
      reset();

      // Assert
      expect(parsedCv.value).toBeNull();
      expect(experiences.value).toBeNull();
      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
    });
  });
});
