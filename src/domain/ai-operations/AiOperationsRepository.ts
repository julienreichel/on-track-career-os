import { gqlOptions } from '@/data/graphql/options';
import type { ParsedCV } from './ParsedCV';
import type { ExperiencesResult } from './Experience';
import type { STARStory } from './STARStory';
import type { AchievementsAndKpis } from './AchievementsAndKpis';
import type { PersonalCanvas, PersonalCanvasInput } from './PersonalCanvas';
import type { GenerateCvInput, GenerateCvResult } from './types/generateCv';
import type { ParsedJobDescription } from './ParsedJobDescription';
import type { AnalyzeCompanyInfoInput, CompanyAnalysisResult } from './CompanyAnalysis';
import type { GeneratedCompanyCanvas, GeneratedCompanyCanvasInput } from './CompanyCanvasResult';
import type { MatchingSummaryInput, MatchingSummaryResult } from './MatchingSummaryResult';

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
   * Extract structured experience data from text blocks
   * @param experienceTextBlocks - Array of experience text sections
   * @returns Structured experience objects with dates, responsibilities, tasks
   */
  extractExperienceBlocks(experienceTextBlocks: string[]): Promise<ExperiencesResult>;

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
   * @param input - User profile, experiences, stories, skills, and optional job description
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
}

/**
 * Type for Amplify AI operations queries
 * Maps to GraphQL schema defined in amplify/data/resource.ts
 */
export type AmplifyAiOperations = {
  parseCvText: (
    input: { cvText: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: string | null; errors?: unknown[] }>;

  extractExperienceBlocks: (
    input: { experienceTextBlocks: string[] },
    options?: Record<string, unknown>
  ) => Promise<{ data: string | null; errors?: unknown[] }>;

  generateStarStory: (
    input: { sourceText: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: string | null; errors?: unknown[] }>;

  generateAchievementsAndKpis: (
    input: {
      starStory: {
        situation: string;
        task: string;
        action: string;
        result: string;
      };
    },
    options?: Record<string, unknown>
  ) => Promise<{ data: string | null; errors?: unknown[] }>;

  generatePersonalCanvas: (
    input: {
      profile: string;
      experiences: string;
      stories: string;
    },
    options?: Record<string, unknown>
  ) => Promise<{ data: unknown | null; errors?: unknown[] }>;

  parseJobDescription: (
    input: { jobText: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: string | null; errors?: unknown[] }>;

  analyzeCompanyInfo: (
    input: {
      companyName: string;
      industry?: string;
      size?: string;
      rawText: string;
      jobContext?: {
        title?: string;
        summary?: string;
      };
    },
    options?: Record<string, unknown>
  ) => Promise<{ data: unknown | null; errors?: unknown[] }>;

  generateCompanyCanvas: (
    input: {
      companyProfile: string;
      additionalNotes?: string[];
    },
    options?: Record<string, unknown>
  ) => Promise<{ data: unknown | null; errors?: unknown[] }>;

  generateMatchingSummary: (
    input: {
      payload: string;
    },
    options?: Record<string, unknown>
  ) => Promise<{ data: unknown | null; errors?: unknown[] }>;

  generateCv: (
    input: {
      userProfile: string;
      selectedExperiences: string;
      stories?: string;
      skills?: string[];
      languages?: string[];
      certifications?: string[];
      interests?: string[];
      jobDescription?: string;
    },
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
  constructor(client?: AmplifyAiOperations) {
    if (client) {
      // Use injected client (for tests)
      this._client = client;
    } else {
      // Use Nuxt's auto-imported useNuxtApp (for production)
      this._client = useNuxtApp().$Amplify.GraphQL.client.queries;
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

    // Parse JSON response from Lambda
    const parsed = JSON.parse(data) as ParsedCV;

    return parsed;
  }

  async extractExperienceBlocks(experienceTextBlocks: string[]): Promise<ExperiencesResult> {
    const { data, errors } = await this.client.extractExperienceBlocks(
      { experienceTextBlocks },
      gqlOptions()
    );

    if (errors && errors.length > 0) {
      throw new Error(`AI operation failed: ${JSON.stringify(errors)}`);
    }

    if (!data) {
      throw new Error('AI operation returned no data');
    }

    // Parse JSON response from Lambda
    const parsed = JSON.parse(data) as ExperiencesResult;

    return parsed;
  }

  async generateStarStory(sourceText: string): Promise<STARStory[]> {
    const { data, errors } = await this.client.generateStarStory({ sourceText }, gqlOptions());

    if (errors && errors.length > 0) {
      throw new Error(`AI operation failed: ${JSON.stringify(errors)}`);
    }

    if (!data) {
      throw new Error('AI operation returned no data');
    }

    // Parse JSON response from Lambda (now returns array)
    const parsed = JSON.parse(data) as STARStory[];

    return parsed;
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

    // Parse JSON response from Lambda
    const parsed = JSON.parse(data) as AchievementsAndKpis;

    return parsed;
  }

  async generatePersonalCanvas(input: PersonalCanvasInput): Promise<PersonalCanvas> {
    // GraphQL schema uses a.json() which expects JSON strings, not objects
    const stringifiedInput = {
      profile: JSON.stringify(input.profile),
      experiences: JSON.stringify(input.experiences),
      stories: JSON.stringify(input.stories),
    };

    const { data, errors } = await this.client.generatePersonalCanvas(
      stringifiedInput,
      gqlOptions()
    );

    if (errors && errors.length > 0) {
      throw new Error(`AI operation failed: ${JSON.stringify(errors)}`);
    }

    if (!data) {
      throw new Error('AI operation returned no data');
    }

    // GraphQL schema returns a.json() which is a JSON string - parse it to get PersonalCanvas object
    // Cast unknown to string since we know a.json() returns a JSON string
    const parsed = JSON.parse(data as string) as PersonalCanvas;

    return parsed;
  }

  async generateCv(input: GenerateCvInput): Promise<GenerateCvResult> {
    // GraphQL schema uses a.json() for complex objects, which expects JSON strings
    const stringifiedInput = {
      userProfile: JSON.stringify(input.userProfile),
      selectedExperiences: JSON.stringify(input.selectedExperiences),
      stories: input.stories ? JSON.stringify(input.stories) : undefined,
      skills: input.skills,
      languages: input.languages,
      certifications: input.certifications,
      interests: input.interests,
      jobDescription: input.jobDescription ?? undefined,
    };

    const { data, errors } = await this.client.generateCv(stringifiedInput, gqlOptions());

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

    return JSON.parse(data) as ParsedJobDescription;
  }

  async analyzeCompanyInfo(input: AnalyzeCompanyInfoInput): Promise<CompanyAnalysisResult> {
    const { data, errors } = await this.client.analyzeCompanyInfo(
      {
        companyName: input.companyName,
        industry: input.industry,
        size: input.size,
        rawText: input.rawText,
        jobContext: input.jobContext,
      },
      gqlOptions()
    );

    if (errors && errors.length > 0) {
      throw new Error(`AI operation failed: ${JSON.stringify(errors)}`);
    }

    if (!data) {
      throw new Error('AI operation returned no data');
    }

    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    return parsed as CompanyAnalysisResult;
  }

  async generateCompanyCanvas(input: GeneratedCompanyCanvasInput): Promise<GeneratedCompanyCanvas> {
    const { data, errors } = await this.client.generateCompanyCanvas(
      {
        companyProfile: JSON.stringify(input.companyProfile),
        additionalNotes: input.additionalNotes,
      },
      gqlOptions()
    );

    if (errors && errors.length > 0) {
      throw new Error(`AI operation failed: ${JSON.stringify(errors)}`);
    }

    if (!data) {
      throw new Error('AI operation returned no data');
    }

    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    return parsed as GeneratedCompanyCanvas;
  }

  async generateMatchingSummary(input: MatchingSummaryInput): Promise<MatchingSummaryResult> {
    // Destructure input to match GraphQL schema arguments
    const { user, job, company } = input;
    
    // Map company structure for GraphQL (simplified CompanyType vs internal structure)
    const companyArg = company?.companyProfile ? {
      companyName: company.companyProfile.companyName,
      industry: company.companyProfile.industry,
      sizeRange: company.companyProfile.sizeRange,
      website: company.companyProfile.website,
      description: company.companyProfile.description,
    } : undefined;

    const { data, errors } = await this.client.generateMatchingSummary(
      {
        user,
        job,
        company: companyArg,
      },
      gqlOptions()
    );

    if (errors && errors.length > 0) {
      throw new Error(`AI operation failed: ${JSON.stringify(errors)}`);
    }

    if (!data) {
      throw new Error('AI operation returned no data');
    }

    // With a.ref() types, data comes back properly typed
    return data as MatchingSummaryResult;
  }
}
