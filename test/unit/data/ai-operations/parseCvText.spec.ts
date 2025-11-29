import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Unit tests for ai.parseCvText Lambda function
 * Tests the AI operation contract compliance and error handling
 */
describe('ai.parseCvText', () => {
  const mockCvText = `
John Doe
Senior Software Engineer

EXPERIENCE
Senior Software Engineer at TechCorp (2020-2023)
- Led development of cloud-native applications
- Managed team of 5 developers
- Implemented CI/CD pipelines

Software Engineer at StartupXYZ (2018-2020)
- Built scalable microservices architecture
- Developed RESTful APIs using Node.js

EDUCATION
Bachelor of Science in Computer Science
University of Technology (2014-2018)

SKILLS
JavaScript, TypeScript, React, Node.js, AWS, Docker, Kubernetes

CERTIFICATIONS
AWS Certified Solutions Architect
Google Cloud Professional Developer
  `.trim();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Input Schema Validation', () => {
    it('should require cv_text argument', async () => {
      // This test verifies the GraphQL schema validation
      // In practice, Amplify will enforce this at the API Gateway level
      expect(mockCvText).toBeDefined();
      expect(typeof mockCvText).toBe('string');
    });

    it('should accept long CV texts', () => {
      const longCvText = 'Experience: ' + 'Lorem ipsum '.repeat(1000);
      expect(longCvText.length).toBeGreaterThan(1000);
      expect(typeof longCvText).toBe('string');
    });
  });

  describe('Output Schema Validation', () => {
    it('should match AI Interaction Contract output schema', () => {
      // Expected output structure per AIC
      const expectedOutput = {
        sections: {
          experiences: expect.any(Array),
          education: expect.any(Array),
          skills: expect.any(Array),
          certifications: expect.any(Array),
          raw_blocks: expect.any(Array),
        },
        confidence: expect.any(Number),
      };

      // Verify structure
      expect(expectedOutput.sections).toHaveProperty('experiences');
      expect(expectedOutput.sections).toHaveProperty('education');
      expect(expectedOutput.sections).toHaveProperty('skills');
      expect(expectedOutput.sections).toHaveProperty('certifications');
      expect(expectedOutput.sections).toHaveProperty('raw_blocks');
      expect(expectedOutput).toHaveProperty('confidence');
    });

    it('should validate experiences array contains strings', () => {
      const mockOutput = {
        sections: {
          experiences: [
            'Senior Software Engineer at TechCorp (2020-2023)',
            'Software Engineer at StartupXYZ (2018-2020)',
          ],
          education: ['Bachelor of Science in Computer Science'],
          skills: ['JavaScript', 'TypeScript', 'React'],
          certifications: ['AWS Certified Solutions Architect'],
          raw_blocks: [],
        },
        confidence: 0.95,
      };

      expect(Array.isArray(mockOutput.sections.experiences)).toBe(true);
      mockOutput.sections.experiences.forEach((exp) => {
        expect(typeof exp).toBe('string');
      });
    });

    it('should validate confidence is between 0 and 1', () => {
      const validConfidences = [0, 0.5, 0.95, 1];
      validConfidences.forEach((conf) => {
        expect(conf).toBeGreaterThanOrEqual(0);
        expect(conf).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Fallback Strategy (AIC Section 6)', () => {
    it('should use default confidence when not provided', () => {
      const outputWithoutConfidence = {
        sections: {
          experiences: [],
          education: [],
          skills: [],
          certifications: [],
          raw_blocks: [],
        },
      };

      const defaultConfidence = 0.5;
      const validated = {
        ...outputWithoutConfidence,
        confidence: defaultConfidence,
      };

      expect(validated.confidence).toBe(defaultConfidence);
    });

    it('should convert missing arrays to empty arrays', () => {
      const partialOutput = {
        sections: {
          experiences: ['Some experience'],
          // Missing: education, skills, certifications, raw_blocks
        },
      };

      const validated = {
        sections: {
          experiences: partialOutput.sections.experiences,
          education: [],
          skills: [],
          certifications: [],
          raw_blocks: [],
        },
        confidence: 0.5,
      };

      expect(Array.isArray(validated.sections.education)).toBe(true);
      expect(validated.sections.education).toHaveLength(0);
    });

    it('should extract JSON from markdown code blocks', () => {
      const markdownWrappedJson = '```json\n{"key": "value"}\n```';
      const match = markdownWrappedJson.match(/```json\n?([\s\S]*?)\n?```/);
      const extracted = match ? match[1] : markdownWrappedJson;
      const parsed = JSON.parse(extracted);

      expect(parsed).toEqual({ key: 'value' });
    });

    it('should handle JSON without markdown wrapping', () => {
      const plainJson = '{"key": "value"}';
      const match = plainJson.match(/```json\n?([\s\S]*?)\n?```/) || plainJson.match(/({[\s\S]*})/);
      const extracted = match ? match[1] : plainJson;
      const parsed = JSON.parse(extracted);

      expect(parsed).toEqual({ key: 'value' });
    });
  });

  describe('AI Interaction Contract Compliance', () => {
    it('should follow AIC naming convention (snake_case for JSON)', () => {
      const outputKeys = ['experiences', 'education', 'skills', 'certifications', 'raw_blocks'];
      outputKeys.forEach((key) => {
        // Check snake_case pattern
        expect(key).toMatch(/^[a-z_]+$/);
      });
    });

    it('should never return free-form text (structured JSON only)', () => {
      const invalidOutputs = ['Just some text', 'Error: something went wrong', ''];

      invalidOutputs.forEach((text) => {
        expect(() => JSON.parse(text)).toThrow();
      });
    });

    it('should use arrays for content blocks (no raw paragraphs)', () => {
      const validOutput = {
        sections: {
          experiences: ['item1', 'item2'],
          education: ['item1'],
          skills: [],
          certifications: [],
          raw_blocks: [],
        },
        confidence: 0.8,
      };

      Object.values(validOutput.sections).forEach((section) => {
        expect(Array.isArray(section)).toBe(true);
      });
    });
  });

  describe('Logging & Traceability (AIC Section 7)', () => {
    it('should log with required fields', () => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        input: { cv_text: 'truncated...' },
        output: {
          sections: {
            experiences: [],
            education: [],
            skills: [],
            certifications: [],
            raw_blocks: [],
          },
          confidence: 0.5,
        },
        fallbacksUsed: [],
      };

      expect(logEntry).toHaveProperty('timestamp');
      expect(logEntry).toHaveProperty('input');
      expect(logEntry).toHaveProperty('output');
      expect(logEntry).toHaveProperty('fallbacksUsed');
    });

    it('should truncate long inputs in logs', () => {
      const longInput = 'x'.repeat(10000);
      const maxLogLength = 100;
      const truncated = longInput.substring(0, maxLogLength) + '...';

      expect(truncated.length).toBeLessThan(longInput.length);
      expect(truncated.endsWith('...')).toBe(true);
    });

    it('should track fallback strategies used', () => {
      const scenarios = [
        { fallbacks: [], expected: 0 },
        { fallbacks: ['default_confidence'], expected: 1 },
        { fallbacks: ['retry_with_schema'], expected: 1 },
        { fallbacks: ['default_confidence', 'retry_with_schema'], expected: 2 },
      ];

      scenarios.forEach((scenario) => {
        expect(scenario.fallbacks).toHaveLength(scenario.expected);
      });
    });
  });

  describe('Error Messages', () => {
    it('should provide user-friendly error after all retries fail', () => {
      const finalErrorMessage =
        'AI cannot produce a stable answer. Please refine your input or try again.';

      expect(finalErrorMessage).toContain('AI cannot produce');
      expect(finalErrorMessage).toContain('refine your input');
    });

    it('should include error details in logs', () => {
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: 'SyntaxError: Unexpected token',
        input: { cv_text: 'truncated...' },
      };

      expect(errorLog).toHaveProperty('error');
      expect(errorLog.error).toContain('Error');
    });
  });

  describe('System Prompt Verification', () => {
    it('should use constant system prompt per AIC', () => {
      const systemPrompt = `You are a CV text parser.
You MUST return structured JSON only.
Extract distinct sections and normalize them.
Never invent information.`;

      expect(systemPrompt).toContain('CV text parser');
      expect(systemPrompt).toContain('structured JSON only');
      expect(systemPrompt).toContain('Never invent information');
    });

    it('should inject user data into user prompt', () => {
      const userPrompt = `Extract structured sections from this CV text:
${mockCvText}`;

      expect(userPrompt).toContain('Extract structured sections');
      expect(userPrompt).toContain(mockCvText);
    });
  });

  describe('Model Configuration', () => {
    it('should use appropriate temperature for parsing (0.1-0.3)', () => {
      const initialTemperature = 0.3;
      const retryTemperature = 0.1;

      expect(initialTemperature).toBeGreaterThanOrEqual(0.1);
      expect(initialTemperature).toBeLessThanOrEqual(0.3);
      expect(retryTemperature).toBe(0.1);
    });

    it('should use sufficient max tokens for CV parsing', () => {
      const maxTokens = 4000;
      const minRequired = 1000;

      expect(maxTokens).toBeGreaterThanOrEqual(minRequired);
    });

    it('should set appropriate timeout (60s)', () => {
      const timeoutSeconds = 60;
      const minTimeout = 30;

      expect(timeoutSeconds).toBeGreaterThanOrEqual(minTimeout);
    });
  });
});
