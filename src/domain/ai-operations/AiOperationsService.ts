import { AiOperationsRepository } from './AiOperationsRepository';
import type { ParsedCV } from './ParsedCV';
import { isParsedCV } from './ParsedCV';
import type { ExperiencesResult } from './Experience';
import { isExperiencesResult } from './Experience';
import type { STARStory } from './STARStory';
import { isSTARStory } from './STARStory';
import type { AchievementsAndKpis } from './AchievementsAndKpis';
import { isAchievementsAndKpis } from './AchievementsAndKpis';
import type { PersonalCanvas, PersonalCanvasInput } from './PersonalCanvas';
import { isPersonalCanvas } from './PersonalCanvas';
import type { GenerateCvInput, GenerateCvResult } from './types/generateCv';
import type { ParsedJobDescription } from './ParsedJobDescription';
import { isParsedJobDescription } from './ParsedJobDescription';
import type { AnalyzeCompanyInfoInput, CompanyAnalysisResult } from './CompanyAnalysis';
import { isCompanyAnalysisResult } from './CompanyAnalysis';
import type { GeneratedCompanyCanvas, GeneratedCompanyCanvasInput } from './CompanyCanvasResult';
import { isGeneratedCompanyCanvas } from './CompanyCanvasResult';
import type { MatchingSummaryInput, MatchingSummaryResult } from './MatchingSummaryResult';
import { isMatchingSummaryResult } from './MatchingSummaryResult';
import type { SpeechInput, SpeechResult } from './SpeechResult';
import { isSpeechResult } from './SpeechResult';

type AnalyzeCompanyMock =
  | CompanyAnalysisResult
  | ((input: AnalyzeCompanyInfoInput) => CompanyAnalysisResult);
type CanvasMock =
  | GeneratedCompanyCanvas
  | ((input: GeneratedCompanyCanvasInput) => GeneratedCompanyCanvas);
type MatchingSummaryMock =
  | MatchingSummaryResult
  | ((input: MatchingSummaryInput) => MatchingSummaryResult);
type SpeechMock = SpeechResult | ((input: SpeechInput) => SpeechResult);
type CoverLetterMock = string | ((input: SpeechInput) => string);

function cloneResult<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function resolveAiMock(
  key: 'analyzeCompanyInfo',
  input: AnalyzeCompanyInfoInput
): CompanyAnalysisResult | null;
function resolveAiMock(
  key: 'generateCompanyCanvas',
  input: GeneratedCompanyCanvasInput
): GeneratedCompanyCanvas | null;
function resolveAiMock(
  key: 'generateMatchingSummary',
  input: MatchingSummaryInput
): MatchingSummaryResult | null;
function resolveAiMock(key: 'generateSpeech', input: SpeechInput): SpeechResult | null;
function resolveAiMock(key: 'generateCoverLetter', input: SpeechInput): string | null;
function resolveAiMock(
  key:
    | 'analyzeCompanyInfo'
    | 'generateCompanyCanvas'
    | 'generateMatchingSummary'
    | 'generateSpeech'
    | 'generateCoverLetter',
  input:
    | AnalyzeCompanyInfoInput
    | GeneratedCompanyCanvasInput
    | MatchingSummaryInput
    | SpeechInput
    | SpeechInput
) {
  if (typeof window === 'undefined' || !window.__AI_OPERATION_MOCKS__) {
    return null;
  }

  const handler = window.__AI_OPERATION_MOCKS__[key];
  if (!handler) {
    return null;
  }

  const result = typeof handler === 'function' ? handler(input as never) : handler;
  return cloneResult(result);
}

/**
 * Service for AI-powered CV and experience operations
 *
 * Provides business logic layer between application (composables) and data (repository).
 * Handles validation, error handling, and data transformation.
 */
export class AiOperationsService {
  constructor(private repo = new AiOperationsRepository()) {}

  /**
   * Parse CV text into structured sections with validation
   * @param cvText - Raw CV text content
   * @returns Structured CV data with confidence score
   * @throws Error if parsing fails or validation fails
   */
  async parseCvText(cvText: string): Promise<ParsedCV> {
    // Validate input
    if (!cvText || cvText.trim().length === 0) {
      throw new Error('CV text cannot be empty');
    }

    try {
      const result = await this.repo.parseCvText(cvText);

      // Validate output structure
      if (!isParsedCV(result)) {
        throw new Error('Invalid CV parsing result structure');
      }

      return result;
    } catch (error) {
      // Re-throw with more context
      throw new Error(
        `Failed to parse CV text: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Parse job description text into structured data
   * @param jobText - Raw job description text
   * @returns Structured JobDescription data aligned with domain model
   * @throws Error when validation fails
   */
  async parseJobDescription(jobText: string): Promise<ParsedJobDescription> {
    if (!jobText || jobText.trim().length === 0) {
      throw new Error('Job description text cannot be empty');
    }

    try {
      const result = await this.repo.parseJobDescription(jobText);

      if (!isParsedJobDescription(result)) {
        throw new Error('Invalid job description parsing result structure');
      }

      return result;
    } catch (error) {
      throw new Error(
        `Failed to parse job description: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Extract structured experience data from text blocks with validation
   * @param experienceTextBlocks - Array of experience text sections
   * @returns Structured experience objects
   * @throws Error if extraction fails or validation fails
   */
  async extractExperienceBlocks(experienceTextBlocks: string[]): Promise<ExperiencesResult> {
    // Validate input
    if (!experienceTextBlocks || experienceTextBlocks.length === 0) {
      throw new Error('Experience text blocks cannot be empty');
    }

    if (experienceTextBlocks.some((block) => !block || block.trim().length === 0)) {
      throw new Error('Experience text blocks cannot contain empty strings');
    }

    try {
      const result = await this.repo.extractExperienceBlocks(experienceTextBlocks);

      // Validate output structure
      if (!isExperiencesResult(result)) {
        throw new Error('Invalid experience extraction result structure');
      }

      return result;
    } catch (error) {
      // Re-throw with more context
      throw new Error(
        `Failed to extract experience blocks: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate STAR stories from experience text with validation
   * @param sourceText - Experience text to convert to STAR format
   * @returns Array of STAR stories (one or more extracted from text)
   * @throws Error if generation fails or validation fails
   */
  async generateStarStory(sourceText: string): Promise<STARStory[]> {
    // Validate input
    if (!sourceText || sourceText.trim().length === 0) {
      throw new Error('Source text cannot be empty');
    }

    try {
      const result = await this.repo.generateStarStory(sourceText);

      // Validate output structure (array of STAR stories)
      if (!Array.isArray(result) || result.length === 0) {
        throw new Error('Invalid STAR story result: expected non-empty array');
      }

      // Validate each story
      for (const story of result) {
        if (!isSTARStory(story)) {
          throw new Error('Invalid STAR story structure in array');
        }
      }

      return result;
    } catch (error) {
      // Re-throw with more context
      throw new Error(
        `Failed to generate STAR story: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate achievements and KPIs from STAR story with validation
   * @param starStory - STAR story to extract achievements and KPIs from
   * @returns Achievements and KPI suggestions
   * @throws Error if generation fails or validation fails
   */
  async generateAchievementsAndKpis(starStory: STARStory): Promise<AchievementsAndKpis> {
    // Validate input
    if (!isSTARStory(starStory)) {
      throw new Error('Invalid STAR story structure');
    }

    // Check that all STAR story fields have content
    if (
      !starStory.situation?.trim() ||
      !starStory.task?.trim() ||
      !starStory.action?.trim() ||
      !starStory.result?.trim()
    ) {
      throw new Error('All STAR story fields (situation, task, action, result) must be non-empty');
    }

    try {
      const result = await this.repo.generateAchievementsAndKpis(starStory);

      // Validate output structure
      if (!isAchievementsAndKpis(result)) {
        throw new Error('Invalid achievements and KPIs result structure');
      }

      return result;
    } catch (error) {
      // Re-throw with more context
      throw new Error(
        `Failed to generate achievements and KPIs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate Personal Business Model Canvas with validation
   * @param input - User profile, experiences, and stories
   * @returns Complete Personal Canvas with all 9 sections
   * @throws Error if generation fails or validation fails
   */
  async generatePersonalCanvas(input: PersonalCanvasInput): Promise<PersonalCanvas> {
    // Validate input structure
    if (!input || typeof input !== 'object') {
      throw new Error('Invalid input structure');
    }

    if (!input.profile || typeof input.profile !== 'object') {
      throw new Error('Profile is required');
    }

    if (!Array.isArray(input.experiences)) {
      throw new Error('Experiences must be an array');
    }

    if (!Array.isArray(input.stories)) {
      throw new Error('Stories must be an array');
    }

    try {
      const result = await this.repo.generatePersonalCanvas(input);

      // Validate output structure
      if (!isPersonalCanvas(result)) {
        throw new Error('Invalid Personal Canvas result structure');
      }

      return result;
    } catch (error) {
      // Re-throw with more context
      throw new Error(
        `Failed to generate Personal Canvas: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validate CV input structure
   * @private
   */
  private validateCvInput(input: GenerateCvInput): void {
    if (!input || typeof input !== 'object') {
      throw new Error('Invalid input structure');
    }

    if (input.language !== 'en') {
      throw new Error('Language must be "en"');
    }

    if (!input.profile || typeof input.profile !== 'object') {
      throw new Error('Profile is required');
    }

    if (!input.profile.fullName?.trim()) {
      throw new Error('Profile must have a fullName');
    }

    if (!Array.isArray(input.experiences)) {
      throw new Error('Experiences must be an array');
    }

    // Validate each experience has required fields
    for (const exp of input.experiences) {
      if (!exp.title || !exp.startDate) {
        throw new Error('Each experience must have title and startDate');
      }
    }
  }

  /**
   * Generate complete CV in Markdown format with validation
   * @param input - Profile, experiences, stories, and optional tailoring context
   * @returns CV as plain Markdown text
   * @throws Error if generation fails or validation fails
   */
  async generateCv(input: GenerateCvInput): Promise<GenerateCvResult> {
    // Validate input
    this.validateCvInput(input);

    try {
      const result = await this.repo.generateCv(input);

      // Validate output is a non-empty string
      if (typeof result !== 'string') {
        throw new Error('Invalid CV result: expected string');
      }

      if (!result.trim()) {
        throw new Error('CV generation produced empty markdown');
      }

      return result;
    } catch (error) {
      // Re-throw with more context
      throw new Error(
        `Failed to generate CV: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async analyzeCompanyInfo(input: AnalyzeCompanyInfoInput): Promise<CompanyAnalysisResult> {
    if (!input.rawText?.trim()) {
      throw new Error('Company research text cannot be empty');
    }

    const mock = resolveAiMock('analyzeCompanyInfo', input);
    if (mock) {
      return mock;
    }

    const result = await this.repo.analyzeCompanyInfo(input);
    if (!isCompanyAnalysisResult(result)) {
      throw new Error('Invalid company analysis structure');
    }
    return result;
  }

  async generateCompanyCanvas(input: GeneratedCompanyCanvasInput): Promise<GeneratedCompanyCanvas> {
    const mock = resolveAiMock('generateCompanyCanvas', input);
    if (mock) {
      return mock;
    }

    const result = await this.repo.generateCompanyCanvas(input);
    if (!isGeneratedCompanyCanvas(result)) {
      throw new Error('Invalid company canvas result');
    }
    return result;
  }

  async generateMatchingSummary(input: MatchingSummaryInput): Promise<MatchingSummaryResult> {
    if (!input?.profile?.fullName) {
      throw new Error('User profile with fullName is required');
    }
    if (!input?.jobDescription?.title) {
      throw new Error('Job title is required to generate a matching summary');
    }

    const mocked = resolveAiMock('generateMatchingSummary', input);
    if (mocked) {
      return mocked;
    }

    const result = await this.repo.generateMatchingSummary(input);

    if (!isMatchingSummaryResult(result)) {
      throw new Error('Invalid matching summary result');
    }
    return result;
  }

  async generateSpeech(input: SpeechInput): Promise<SpeechResult> {
    if (!input?.profile?.fullName) {
      throw new Error('User profile with fullName is required');
    }
    if (input.language !== 'en') {
      throw new Error('Language must be "en"');
    }

    const mocked = resolveAiMock('generateSpeech', input);
    if (mocked) {
      return mocked;
    }

    const result = await this.repo.generateSpeech(input);
    if (!isSpeechResult(result)) {
      throw new Error('Invalid speech generation result');
    }
    return result;
  }

  async generateCoverLetter(input: SpeechInput): Promise<string> {
    if (!input?.profile?.fullName) {
      throw new Error('User profile with fullName is required');
    }
    if (input.language !== 'en') {
      throw new Error('Language must be "en"');
    }

    const mocked = resolveAiMock('generateCoverLetter', input);
    if (mocked) {
      return mocked;
    }

    const result = await this.repo.generateCoverLetter(input);
    if (typeof result !== 'string') {
      throw new Error('Invalid cover letter generation result');
    }
    return result;
  }
}

declare global {
  interface Window {
    __AI_OPERATION_MOCKS__?: {
      analyzeCompanyInfo?: AnalyzeCompanyMock;
      generateCompanyCanvas?: CanvasMock;
      generateMatchingSummary?: MatchingSummaryMock;
      generateSpeech?: SpeechMock;
      generateCoverLetter?: CoverLetterMock;
    };
  }
}
