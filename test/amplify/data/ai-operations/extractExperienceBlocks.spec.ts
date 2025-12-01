import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

// Mock AWS SDK
const mockSend = vi.fn();
vi.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: vi.fn(() => ({
    send: mockSend,
  })),
  InvokeModelCommand: vi.fn((input) => ({ input })),
}));

describe('ai.extractExperienceBlocks', () => {
  let handler: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Import handler after mocks are set up
    const module = await import('@amplify/data/ai-operations/extractExperienceBlocks');
    handler = module.handler;
  });

  /**
   * Mock AI response generator that simulates actual parsing of experience text
   * Uses regex to extract structured data from input, mimicking real AI behavior
   */
  const generateMockResponse = (experienceBlocks: string[]) => {
    const experiences = experienceBlocks.map((block, index) => {
      // Extract title and company: "Title at Company (dates)"
      const titleCompanyMatch = block.match(/^(.*?)\s+at\s+(.*?)\s*\(/);
      const title = titleCompanyMatch ? titleCompanyMatch[1].trim() : `Experience ${index + 1}`;
      const company = titleCompanyMatch ? titleCompanyMatch[2].trim() : 'Unknown Company';

      // Extract dates: "(Month Year - Month Year)" or "(Year-present)"
      const datesMatch = block.match(/\((.*?)\)/);
      let startDate = '2020-01';
      let endDate: string | null = null;

      if (datesMatch) {
        const dateStr = datesMatch[1];
        if (dateStr.includes('present')) {
          endDate = null;
        } else if (dateStr.includes('-')) {
          const [startPart, endPart] = dateStr.split('-').map((d) => d.trim());
          // Parse month and year from text like "March 2020"
          const startMatch = startPart.match(/(\w+)\s+(\d{4})/);
          if (startMatch) {
            const monthMap: Record<string, string> = {
              January: '01',
              February: '02',
              March: '03',
              April: '04',
              May: '05',
              June: '06',
              July: '07',
              August: '08',
              September: '09',
              October: '10',
              November: '11',
              December: '12',
            };
            startDate = `${startMatch[2]}-${monthMap[startMatch[1]] || '01'}`;
          }
          if (endPart) {
            const endMatch = endPart.match(/(\w+)\s+(\d{4})/);
            if (endMatch) {
              const monthMap: Record<string, string> = {
                January: '01',
                February: '02',
                March: '03',
                April: '04',
                May: '05',
                June: '06',
                July: '07',
                August: '08',
                September: '09',
                October: '10',
                November: '11',
                December: '12',
              };
              endDate = `${endMatch[2]}-${monthMap[endMatch[1]] || '12'}`;
            } else if (/\d{4}/.test(endPart)) {
              endDate = `${endPart}-12`;
            }
          }
        }
      }

      // Extract responsibilities and tasks from bullet points
      const bulletPoints = block.match(/^[-•]\s*(.+)$/gm) || [];
      const responsibilities = bulletPoints
        .slice(0, Math.ceil(bulletPoints.length / 2))
        .map((b) => b.replace(/^[-•]\s*/, '').trim());
      const tasks = bulletPoints
        .slice(Math.ceil(bulletPoints.length / 2))
        .map((b) => b.replace(/^[-•]\s*/, '').trim());

      return {
        title,
        company,
        startDate,
        endDate,
        responsibilities,
        tasks,
      };
    });

    return { experiences };
  };

  describe('Handler Integration Tests', () => {
    it('should successfully extract experience blocks with all fields', async () => {
      const inputBlocks = [
        'Senior Software Engineer at TechCorp Inc. (March 2020 - December 2023)\n- Lead development team\n- Architecture decisions\n- Implemented microservices\n- Mentored junior developers',
      ];

      mockSend.mockImplementationOnce(async () => {
        // Get the command input from InvokeModelCommand constructor
        const commandCall = (vi.mocked(InvokeModelCommand).mock.calls[0] as unknown[])[0] as {
          body: string;
        };
        const requestBody = JSON.parse(commandCall.body);
        const userPrompt = requestBody.messages[0].content[0].text;

        // Extract experience blocks from prompt
        const blocksMatch = userPrompt.match(/Experience blocks to parse:\n([\s\S]*)/);
        const extractedBlocks = blocksMatch ? [blocksMatch[1].trim()] : inputBlocks;

        const mockResponse = generateMockResponse(extractedBlocks);

        return {
          body: new TextEncoder().encode(
            JSON.stringify({
              output: {
                message: {
                  content: [{ text: JSON.stringify(mockResponse) }],
                },
              },
            })
          ),
        };
      });

      const result = await handler({
        arguments: {
          experienceTextBlocks: inputBlocks,
        },
      });

      expect(result.experiences).toHaveLength(1);
      expect(result.experiences[0].title).toBe('Senior Software Engineer');
      expect(result.experiences[0].company).toBe('TechCorp Inc.');
      expect(result.experiences[0].startDate).toBe('2020-03');
      expect(result.experiences[0].endDate).toBe('2023-12');
      expect(result.experiences[0].responsibilities).toContain('Lead development team');
      expect(result.experiences[0].tasks).toContain('Implemented microservices');
    });

    it('should handle multiple experience blocks', async () => {
      const inputBlocks = [
        'Senior Developer at Company A (2020-present)\n- Team lead\n- Code reviews',
        'Junior Developer at Company B (June 2018 - December 2019)\n- Development\n- Bug fixes',
      ];

      mockSend.mockImplementationOnce(async () => {
        // Generate response from input blocks
        const mockResponse = generateMockResponse(inputBlocks);

        return {
          body: new TextEncoder().encode(
            JSON.stringify({
              output: {
                message: {
                  content: [{ text: JSON.stringify(mockResponse) }],
                },
              },
            })
          ),
        };
      });

      const result = await handler({
        arguments: {
          experienceTextBlocks: inputBlocks,
        },
      });

      expect(result.experiences).toHaveLength(2);
      expect(result.experiences[0].title).toBe('Senior Developer');
      expect(result.experiences[0].company).toBe('Company A');
      expect(result.experiences[0].endDate).toBeNull();
      expect(result.experiences[1].title).toBe('Junior Developer');
      expect(result.experiences[1].company).toBe('Company B');
      expect(result.experiences[1].startDate).toBe('2018-06');
      expect(result.experiences[1].endDate).toBe('2019-12');
    });

    it('should apply operation-specific validation fallbacks', async () => {
      const inputBlocks = ['Incomplete experience'];

      mockSend.mockImplementationOnce(async () => {
        // Simulate incomplete response that will trigger fallbacks
        return {
          body: new TextEncoder().encode(
            JSON.stringify({
              output: {
                message: {
                  content: [
                    {
                      text: JSON.stringify({
                        experiences: [
                          {
                            // Missing title and company - will use fallbacks
                            startDate: '2020-01',
                            endDate: null,
                            // Missing responsibilities and tasks - will default to []
                          },
                        ],
                      }),
                    },
                  ],
                },
              },
            })
          ),
        };
      });

      const result = await handler({
        arguments: {
          experienceTextBlocks: inputBlocks,
        },
      });

      expect(result.experiences).toHaveLength(1);
      expect(result.experiences[0].title).toBe('Experience 1'); // Fallback
      expect(result.experiences[0].company).toBe('Unknown Company'); // Fallback
      expect(result.experiences[0].responsibilities).toEqual([]); // Fallback
      expect(result.experiences[0].tasks).toEqual([]); // Fallback
    });

    it('should throw error for invalid output structure', async () => {
      mockSend.mockImplementationOnce(async () => {
        return {
          body: new TextEncoder().encode(
            JSON.stringify({
              output: {
                message: {
                  content: [
                    {
                      text: JSON.stringify({
                        invalid_field: 'data',
                      }),
                    },
                  ],
                },
              },
            })
          ),
        };
      });

      await expect(
        handler({
          arguments: {
            experienceTextBlocks: ['Experience text'],
          },
        })
      ).rejects.toThrow('Missing required field: experiences');
    });
  });
});
