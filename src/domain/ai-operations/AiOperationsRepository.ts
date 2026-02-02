import { gqlOptions } from '@/data/graphql/options';
import type { ParsedCV, ParseCvInput } from './ParsedCV';
import type { ExperiencesResult, ExtractExperienceInput } from './Experience';
import type { STARStory, GenerateStoryInput } from './STARStory';
import type { AchievementsAndKpis, GenerateAchievementsInput } from './AchievementsAndKpis';
import type { PersonalCanvas, PersonalCanvasInput } from './PersonalCanvas';
import type { GenerateCvInput, GenerateCvResult } from './types/generateCv';
import type { ParsedJobDescription, ParseJobInput } from './ParsedJobDescription';
import type { AnalyzeCompanyInfoInput, CompanyAnalysisResult } from './CompanyAnalysis';
import type { GeneratedCompanyCanvas, GeneratedCompanyCanvasInput } from './CompanyCanvasResult';
import type { MatchingSummaryInput, MatchingSummaryResult } from './MatchingSummaryResult';
import type { SpeechInput, SpeechResult } from './SpeechResult';

/**
 * Repository interface for AI operations
 *
 * Provides type-safe access to Amplify GraphQL AI queries.
 * Implementation will use Amplify's auto-generated client.
 */
export interface IAiOperationsRepository {
  /**
   * Parse CV text into structured sections
   * @param cvText - Raw CV text content
   * @returns Structured CV data with confidence score
   */
  parseCvText(cvText: string): Promise<ParsedCV>;

  /**
   * Extract structured experience data from experience items
   * @param language - Target language for responsibilities and tasks
   * @param experienceItems - Experience items with raw blocks and types
   * @returns Structured experience objects with dates, responsibilities, tasks
   */
  extractExperienceBlocks(
    language: string,
    experienceItems: ExtractExperienceInput['experienceItems']
  ): Promise<ExperiencesResult>;

  /**
   * Generate STAR story from experience text
   * @param sourceText - Experience text to convert to STAR format
   * @returns Array of STAR stories (one or more extracted from the text)
   */
  generateStarStory(sourceText: string): Promise<STARStory[]>;

  /**
   * Generate achievements and KPIs from STAR story
   * @param starStory - STAR story to extract achievements and KPIs from
   * @returns Achievements and KPI suggestions
   */
  generateAchievementsAndKpis(starStory: STARStory): Promise<AchievementsAndKpis>;

  /**
   * Generate Personal Business Model Canvas from user data
   * @param input - User profile, experiences, and stories
   * @returns Complete Personal Canvas with all 9 sections
   */
  generatePersonalCanvas(input: PersonalCanvasInput): Promise<PersonalCanvas>;

  /**
   * Generate complete CV in Markdown format
   * @param input - Profile, experiences, stories, and optional tailoring context
   * @returns Complete CV as Markdown text
   */
  generateCv(input: GenerateCvInput): Promise<GenerateCvResult>;

  /**
   * Parse job description text into structured fields
   * @param jobText - Raw job description text
   * @returns Structured job description aligned with domain model
   */
  parseJobDescription(jobText: string): Promise<ParsedJobDescription>;

  /**
   * Analyze company research text into structured company profile
   */
  analyzeCompanyInfo(input: AnalyzeCompanyInfoInput): Promise<CompanyAnalysisResult>;

  /**
   * Generate full company canvas from structured profile
   */
  generateCompanyCanvas(input: GeneratedCompanyCanvasInput): Promise<GeneratedCompanyCanvas>;

  /**
   * Generate a structured matching summary between user and job
   */
  generateMatchingSummary(input: MatchingSummaryInput): Promise<MatchingSummaryResult>;

  /**
   * Generate speech blocks from user data and optional job context
   */
  generateSpeech(input: SpeechInput): Promise<SpeechResult>;
  generateCoverLetter(input: SpeechInput): Promise<string>;
}

/**
 * Type for Amplify AI operations queries
 * Maps to GraphQL schema defined in amplify/data/resource.ts
 */
export type AmplifyAiOperations = {
  parseCvText: (
    input: ParseCvInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: ParsedCV; errors?: unknown[] }>;

  extractExperienceBlocks: (
    input: ExtractExperienceInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: ExperiencesResult | null; errors?: unknown[] }>;

  generateStarStory: (
    input: GenerateStoryInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: STARStory[] | null; errors?: unknown[] }>;

  generateAchievementsAndKpis: (
    input: GenerateAchievementsInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: AchievementsAndKpis | null; errors?: unknown[] }>;

  generatePersonalCanvas: (
    input: PersonalCanvasInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: PersonalCanvas | null; errors?: unknown[] }>;

  parseJobDescription: (
    input: ParseJobInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: ParsedJobDescription | null; errors?: unknown[] }>;

  analyzeCompanyInfo: (
    input: AnalyzeCompanyInfoInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: CompanyAnalysisResult | null; errors?: unknown[] }>;

  generateCompanyCanvas: (
    input: GeneratedCompanyCanvasInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: GeneratedCompanyCanvas | null; errors?: unknown[] }>;

  generateMatchingSummary: (
    input: MatchingSummaryInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: unknown | null; errors?: unknown[] }>;

  generateSpeech: (
    input: SpeechInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: unknown | null; errors?: unknown[] }>;

  generateCoverLetter: (
    input: SpeechInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: unknown | null; errors?: unknown[] }>;

  generateCv: (
    input: GenerateCvInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: unknown | null; errors?: unknown[] }>;
};

/**
 * Concrete implementation of AI operations repository
 * Uses Amplify's GraphQL client to call Lambda functions
 */
export class AiOperationsRepository implements IAiOperationsRepository {
  private readonly _client: AmplifyAiOperations;

  /**
   * Constructor with optional dependency injection for testing
   * @param client - Optional Amplify client instance (for testing)
   */
  constructor(client?: AmplifyAiOperations | unknown) {
    if (client) {
      // Use injected client (for tests)
      // Cast to AmplifyAiOperations to handle Amplify's generated types with optional fields
      this._client = client as AmplifyAiOperations;
    } else {
      // Use Nuxt's auto-imported useNuxtApp (for production)
      // Cast to AmplifyAiOperations since Amplify's generated types are complex
      this._client = useNuxtApp().$Amplify.GraphQL.client.queries as unknown as AmplifyAiOperations;
    }
  }

  private get client() {
    return this._client;
  }

  async parseCvText(cvText: string): Promise<ParsedCV> {
    const { data, errors } = await this.client.parseCvText({ cvText }, gqlOptions());

    if (errors && errors.length > 0) {
      throw new Error(`AI operation failed: ${JSON.stringify(errors)}`);
    }

    if (!data) {
      throw new Error('AI operation returned no data');
    }

    return data;
  }

  async extractExperienceBlocks(
    language: string,
    experienceItems: ExtractExperienceInput['experienceItems']
  ): Promise<ExperiencesResult> {
    const { data, errors } = await this.client.extractExperienceBlocks(
      { language, experienceItems },
      gqlOptions()
    );

    if (errors && errors.length > 0) {
      throw new Error(`AI operation failed: ${JSON.stringify(errors)}`);
    }

    if (!data) {
      throw new Error('AI operation returned no data');
    }

    return data;
  }

  async generateStarStory(sourceText: string): Promise<STARStory[]> {
    const { data, errors } = await this.client.generateStarStory({ sourceText }, gqlOptions());

    if (errors && errors.length > 0) {
      throw new Error(`AI operation failed: ${JSON.stringify(errors)}`);
    }

    if (!data) {
      throw new Error('AI operation returned no data');
    }

    return data;
  }

  async generateAchievementsAndKpis(starStory: STARStory): Promise<AchievementsAndKpis> {
    const { data, errors } = await this.client.generateAchievementsAndKpis(
      { starStory },
      gqlOptions()
    );

    if (errors && errors.length > 0) {
      throw new Error(`AI operation failed: ${JSON.stringify(errors)}`);
    }

    if (!data) {
      throw new Error('AI operation returned no data');
    }

    return data;
  }

  async generatePersonalCanvas(input: PersonalCanvasInput): Promise<PersonalCanvas> {
    const { data, errors } = await this.client.generatePersonalCanvas(input, gqlOptions());

    if (errors && errors.length > 0) {
      throw new Error(`AI operation failed: ${JSON.stringify(errors)}`);
    }

    if (!data) {
      throw new Error('AI operation returned no data');
    }

    return data;
  }

  async generateCv(input: GenerateCvInput): Promise<GenerateCvResult> {
    // Input structure matches GraphQL schema directly - a.ref() types need no transformation
    const { data, errors } = await this.client.generateCv(input, gqlOptions());

    if (errors && errors.length > 0) {
      throw new Error(`AI operation failed: ${JSON.stringify(errors)}`);
    }

    if (!data) {
      throw new Error('AI operation returned no data');
    }

    // GraphQL schema returns a.string() - plain Markdown text
    return data as string;
  }

  async parseJobDescription(jobText: string): Promise<ParsedJobDescription> {
    const { data, errors } = await this.client.parseJobDescription({ jobText }, gqlOptions());

    if (errors && errors.length > 0) {
      throw new Error(`AI operation failed: ${JSON.stringify(errors)}`);
    }

    if (!data) {
      throw new Error('AI operation returned no data');
    }

    return data;
  }

  async analyzeCompanyInfo(input: AnalyzeCompanyInfoInput): Promise<CompanyAnalysisResult> {
    const { data, errors } = await this.client.analyzeCompanyInfo(input, gqlOptions());

    if (errors && errors.length > 0) {
      throw new Error(`AI operation failed: ${JSON.stringify(errors)}`);
    }

    if (!data) {
      throw new Error('AI operation returned no data');
    }

    return data;
  }

  async generateCompanyCanvas(input: GeneratedCompanyCanvasInput): Promise<GeneratedCompanyCanvas> {
    const { data, errors } = await this.client.generateCompanyCanvas(input, gqlOptions());

    if (errors && errors.length > 0) {
      throw new Error(`AI operation failed: ${JSON.stringify(errors)}`);
    }

    if (!data) {
      throw new Error('AI operation returned no data');
    }

    return data;
  }

  async generateMatchingSummary(input: MatchingSummaryInput): Promise<MatchingSummaryResult> {
    // Input structure matches GraphQL schema directly - no transformation needed
    const { data, errors } = await this.client.generateMatchingSummary(input, gqlOptions());

    if (errors && errors.length > 0) {
      throw new Error(`AI operation failed: ${JSON.stringify(errors)}`);
    }

    if (!data) {
      throw new Error('AI operation returned no data');
    }

    // With a.ref() types, data comes back properly typed
    return data as MatchingSummaryResult;
  }

  async generateSpeech(input: SpeechInput): Promise<SpeechResult> {
    const { data, errors } = await this.client.generateSpeech(input, gqlOptions());

    if (errors && errors.length > 0) {
      throw new Error(`AI operation failed: ${JSON.stringify(errors)}`);
    }

    if (!data) {
      throw new Error('AI operation returned no data');
    }

    return data as SpeechResult;
  }
  async generateCoverLetter(input: SpeechInput): Promise<string> {
    const { data, errors } = await this.client.generateCoverLetter(input, gqlOptions());

    if (errors && errors.length > 0) {
      throw new Error(`AI operation failed: ${JSON.stringify(errors)}`);
    }

    if (!data) {
      throw new Error('AI operation returned no data');
    }

    return data as string;
  }
}
