import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { PDFParse } from 'pdf-parse';
import { useAiOperations } from '@/application/ai-operations/useAiOperations';
import { useCvParsing } from '@/composables/useCvParsing';

// Mock FileReader for Node.js environment
global.FileReader = class MockFileReader {
  onload: ((event: { target: { result: string } }) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  readAsText(file: Blob) {
    setTimeout(() => {
      if (this.onload) {
        // Read the file content (mock implementation)
        const reader = new Promise<string>((resolve) => {
          const fr = new window.FileReader();
          fr.onload = (e) => resolve(e.target?.result as string);
          fr.readAsText(file);
        });
        reader.then((text) => {
          this.onload?.({ target: { result: text } });
        });
      }
    }, 0);
  }
} as never;

// For simpler mocking, just read the file synchronously in tests
global.FileReader = class MockFileReader {
  onload: ((event: { target: { result: string } }) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  result: string | null = null;

  readAsText(file: Blob) {
    // Simulate async reading
    setTimeout(async () => {
      try {
        const text = await file.text();
        this.result = text;
        if (this.onload) {
          this.onload({ target: { result: text } });
        }
      } catch {
        if (this.onerror) {
          this.onerror(new Event('error'));
        }
      }
    }, 0);
  }
} as never;

// Mock dependencies
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('pdf-parse', () => ({
  PDFParse: Object.assign(
    vi.fn().mockImplementation(() => ({
      getText: vi.fn(),
      destroy: vi.fn(),
    })),
    {
      setWorker: vi.fn(),
    }
  ),
}));

vi.mock('@/application/ai-operations/useAiOperations', () => ({
  useAiOperations: vi.fn(),
}));

describe('useCvParsing', () => {
  let mockAiOps: {
    parsedCv: ReturnType<typeof ref>;
    experiences: ReturnType<typeof ref>;
    error: ReturnType<typeof ref>;
    parseCv: ReturnType<typeof vi.fn>;
    extractExperiences: ReturnType<typeof vi.fn>;
    reset: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockAiOps = {
      parsedCv: ref(null),
      experiences: ref(null),
      error: ref(null),
      parseCv: vi.fn(),
      extractExperiences: vi.fn(),
      reset: vi.fn(),
    };

    vi.mocked(useAiOperations).mockReturnValue(mockAiOps as never);
  });

  describe('initialization', () => {
    it('should initialize with empty values', () => {
      const parsing = useCvParsing();

      expect(parsing.extractedText.value).toBe('');
      expect(parsing.extractedExperiences.value).toEqual([]);
      expect(parsing.extractedProfile.value).toBeNull();
    });
  });

  describe('parseFile - PDF', () => {
    it('should parse PDF file successfully', async () => {
      const parsing = useCvParsing();
      const pdfFile = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });

      const mockParser = {
        getText: vi.fn().mockResolvedValue({ text: 'Extracted PDF text' }),
        destroy: vi.fn(),
      };
      vi.mocked(PDFParse).mockImplementation(() => mockParser as never);

      mockAiOps.parsedCv.value = {
        sections: {
          experiencesBlocks: ['Experience 1'],
          educationBlocks: [],
          skills: [],
          certifications: [],
          rawBlocks: [],
        },
        profile: {
          fullName: 'John Doe',
        },
      };

      mockAiOps.experiences.value = [
        {
          title: 'Developer',
          companyName: 'Tech Corp',
          startDate: '2020-01',
          endDate: null,
          responsibilities: [],
          tasks: [],
        },
      ];

      await parsing.parseFile(pdfFile);

      expect(mockParser.getText).toHaveBeenCalled();
      expect(mockParser.destroy).toHaveBeenCalled();
      expect(parsing.extractedText.value).toBe('Extracted PDF text');
      expect(mockAiOps.parseCv).toHaveBeenCalledWith('Extracted PDF text');
      expect(parsing.extractedExperiences.value).toHaveLength(1);
      expect(parsing.extractedProfile.value).toEqual({ fullName: 'John Doe' });
    });

    it('should throw error for PDF with no text', async () => {
      const parsing = useCvParsing();
      const pdfFile = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });

      const mockParser = {
        getText: vi.fn().mockResolvedValue({ text: '  ' }),
        destroy: vi.fn(),
      };
      vi.mocked(PDFParse).mockImplementation(() => mockParser as never);

      await expect(parsing.parseFile(pdfFile)).rejects.toThrow('cvUpload.errors.noTextExtracted');
    });
  });

  describe('parseFile - TXT', () => {
    it('should parse text file successfully', async () => {
      const parsing = useCvParsing();
      const textFile = new File(['Plain text CV'], 'test.txt', { type: 'text/plain' });

      mockAiOps.parsedCv.value = {
        sections: {
          experiencesBlocks: ['Experience 1'],
          educationBlocks: [],
          skills: [],
          certifications: [],
          rawBlocks: [],
        },
        profile: {},
      };

      mockAiOps.experiences.value = [
        {
          title: 'Software Engineer',
          companyName: 'Tech Corp',
          experienceType: 'work',
          startDate: '2020-01',
          endDate: '2023-12',
          responsibilities: ['Build software'],
          tasks: ['Code'],
        },
      ];

      await parsing.parseFile(textFile);

      expect(parsing.extractedText.value).toBe('Plain text CV');
      expect(mockAiOps.parseCv).toHaveBeenCalledWith('Plain text CV');
    });

    it('should throw error for empty text file', async () => {
      const parsing = useCvParsing();
      const textFile = new File([''], 'test.txt', { type: 'text/plain' });

      await expect(parsing.parseFile(textFile)).rejects.toThrow('cvUpload.errors.noTextExtracted');
    });
  });

  describe('error handling', () => {
    it('should throw error when AI parsing fails', async () => {
      const parsing = useCvParsing();
      const textFile = new File(['CV text'], 'test.txt', { type: 'text/plain' });

      mockAiOps.error.value = 'AI parsing error';

      await expect(parsing.parseFile(textFile)).rejects.toThrow('AI parsing error');
    });

    it('should throw error when no experiences extracted', async () => {
      const parsing = useCvParsing();
      const textFile = new File(['CV text'], 'test.txt', { type: 'text/plain' });

      mockAiOps.parsedCv.value = {
        sections: {
          experiencesBlocks: [],
          educationBlocks: [],
          skills: [],
          certifications: [],
          rawBlocks: [],
        },
        profile: {},
      };

      await expect(parsing.parseFile(textFile)).rejects.toThrow('cvUpload.errors.parsingFailed');
    });

    it('should throw error when experience extraction fails', async () => {
      const parsing = useCvParsing();
      const textFile = new File(['CV text'], 'test.txt', { type: 'text/plain' });

      mockAiOps.parsedCv.value = {
        sections: {
          experiencesBlocks: ['Experience 1'],
          educationBlocks: [],
          skills: [],
          certifications: [],
          rawBlocks: [],
        },
        profile: {},
      };

      mockAiOps.error.value = 'Extraction error';

      await expect(parsing.parseFile(textFile)).rejects.toThrow('Extraction error');
    });

    it('should throw error when no experiences in result', async () => {
      const parsing = useCvParsing();
      const textFile = new File(['CV text'], 'test.txt', { type: 'text/plain' });

      mockAiOps.parsedCv.value = {
        sections: {
          experiencesBlocks: ['Experience 1'],
          educationBlocks: [],
          skills: [],
          certifications: [],
          rawBlocks: [],
        },
        profile: {},
      };

      mockAiOps.experiences.value = null;

      await expect(parsing.parseFile(textFile)).rejects.toThrow('cvUpload.errors.extractionFailed');
    });
  });

  describe('removeExperience', () => {
    it('should remove experience by index', () => {
      const parsing = useCvParsing();

      parsing.extractedExperiences.value = [
        {
          title: 'Job 1',
          companyName: 'Company 1',
          startDate: '2020-01',
          endDate: null,
          responsibilities: [],
          tasks: [],
          experienceType: 'work',
        },
        {
          title: 'Job 2',
          companyName: 'Company 2',
          startDate: '2021-01',
          endDate: null,
          responsibilities: [],
          tasks: [],
          experienceType: 'work',
        },
      ];

      parsing.removeExperience(0);

      expect(parsing.extractedExperiences.value).toHaveLength(1);
      expect(parsing.extractedExperiences.value[0].title).toBe('Job 2');
    });

    it('should handle removing last item', () => {
      const parsing = useCvParsing();

      parsing.extractedExperiences.value = [
        {
          title: 'Job 1',
          companyName: 'Company 1',
          startDate: '2020-01',
          endDate: null,
          responsibilities: [],
          tasks: [],
          experienceType: 'work',
        },
      ];

      parsing.removeExperience(0);

      expect(parsing.extractedExperiences.value).toHaveLength(0);
    });
  });

  describe('removeProfileField', () => {
    it('should remove profile field', () => {
      const parsing = useCvParsing();

      parsing.extractedProfile.value = {
        fullName: 'John Doe',
        headline: 'Developer',
        location: 'SF',
        seniorityLevel: 'Senior',
        aspirations: [],
        personalValues: [],
        strengths: [],
        interests: [],
        languages: [],
      };

      parsing.removeProfileField('fullName');

      expect(parsing.extractedProfile.value.fullName).toBeUndefined();
      expect(parsing.extractedProfile.value.headline).toBe('Developer');
    });

    it('should handle null profile', () => {
      const parsing = useCvParsing();

      parsing.extractedProfile.value = null;

      expect(() => parsing.removeProfileField('fullName')).not.toThrow();
    });
  });

  describe('removeProfileArrayItem', () => {
    it('should remove item from profile array', () => {
      const parsing = useCvParsing();

      parsing.extractedProfile.value = {
        aspirations: ['Aspiration 1', 'Aspiration 2', 'Aspiration 3'],
        personalValues: [],
        strengths: [],
        interests: [],
        languages: [],
      };

      parsing.removeProfileArrayItem('aspirations', 1);

      expect(parsing.extractedProfile.value.aspirations).toHaveLength(2);
      expect(parsing.extractedProfile.value.aspirations).toEqual(['Aspiration 1', 'Aspiration 3']);
    });

    it('should handle null profile', () => {
      const parsing = useCvParsing();

      parsing.extractedProfile.value = null;

      expect(() => parsing.removeProfileArrayItem('aspirations', 0)).not.toThrow();
    });

    it('should handle non-array field', () => {
      const parsing = useCvParsing();

      parsing.extractedProfile.value = {
        fullName: 'John',
        aspirations: [],
        personalValues: [],
        strengths: [],
        interests: [],
        languages: [],
      };

      expect(() => parsing.removeProfileArrayItem('fullName' as never, 0)).not.toThrow();
    });
  });

  describe('reset', () => {
    it('should reset all state', () => {
      const parsing = useCvParsing();

      parsing.extractedText.value = 'Some text';
      parsing.extractedExperiences.value = [
        {
          title: 'Job',
          companyName: 'Company',
          startDate: '2020-01',
          endDate: null,
          responsibilities: [],
          tasks: [],
          experienceType: 'work',
        },
      ];
      parsing.extractedProfile.value = {
        fullName: 'John',
        aspirations: [],
        personalValues: [],
        strengths: [],
        interests: [],
        languages: [],
      };

      parsing.reset();

      expect(parsing.extractedText.value).toBe('');
      expect(parsing.extractedExperiences.value).toEqual([]);
      expect(parsing.extractedProfile.value).toBeNull();
      expect(mockAiOps.reset).toHaveBeenCalled();
    });
  });

  describe('profile extraction', () => {
    it('should extract profile if present in parsed CV', async () => {
      const parsing = useCvParsing();
      const textFile = new File(['CV text'], 'test.txt', { type: 'text/plain' });

      mockAiOps.parsedCv.value = {
        sections: {
          experiencesBlocks: ['Experience 1'],
          educationBlocks: [],
          skills: [],
          certifications: [],
          rawBlocks: [],
        },
        profile: {
          fullName: 'Jane Smith',
          headline: 'Engineer',
          aspirations: ['Aspiration 1'],
          personalValues: [],
          strengths: [],
          interests: [],
          languages: [],
        },
      };

      mockAiOps.experiences.value = [
        {
          title: 'Developer',
          companyName: 'Tech',
          startDate: '2020-01',
          endDate: null,
          responsibilities: [],
          tasks: [],
          experienceType: 'work',
        },
      ];

      await parsing.parseFile(textFile);

      expect(parsing.extractedProfile.value).toEqual({
        fullName: 'Jane Smith',
        headline: 'Engineer',
        aspirations: ['Aspiration 1'],
        personalValues: [],
        strengths: [],
        interests: [],
        languages: [],
      });
    });

    it('should handle missing profile in parsed CV', async () => {
      const parsing = useCvParsing();
      const textFile = new File(['CV text'], 'test.txt', { type: 'text/plain' });

      mockAiOps.parsedCv.value = {
        sections: {
          experiencesBlocks: ['Experience 1'],
          educationBlocks: [],
          skills: [],
          certifications: [],
          rawBlocks: [],
        },
        profile: undefined,
      };

      mockAiOps.experiences.value = [
        {
          title: 'Developer',
          companyName: 'Tech',
          startDate: '2020-01',
          endDate: null,
          responsibilities: [],
          tasks: [],
          experienceType: 'work',
        },
      ];

      await parsing.parseFile(textFile);

      expect(parsing.extractedProfile.value).toBeNull();
    });
  });
});
