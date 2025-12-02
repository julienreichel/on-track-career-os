import { gqlOptions } from '@/data/graphql/options';
import type { ParsedCV } from './ParsedCV';
import type { ExperiencesResult } from './Experience';
import type { STARStory } from './STARStory';
import type { AchievementsAndKpis } from './AchievementsAndKpis';
import type { PersonalCanvas, PersonalCanvasInput } from './PersonalCanvas';

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
   * @returns STAR story with situation, task, action, result
   */
  generateStarStory(sourceText: string): Promise<STARStory>;

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
    input: PersonalCanvasInput,
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

  async generateStarStory(sourceText: string): Promise<STARStory> {
    const { data, errors } = await this.client.generateStarStory({ sourceText }, gqlOptions());

    if (errors && errors.length > 0) {
      throw new Error(`AI operation failed: ${JSON.stringify(errors)}`);
    }

    if (!data) {
      throw new Error('AI operation returned no data');
    }

    // Parse JSON response from Lambda
    const parsed = JSON.parse(data) as STARStory;

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
    const { data, errors } = await this.client.generatePersonalCanvas(input, gqlOptions());

    if (errors && errors.length > 0) {
      throw new Error(`AI operation failed: ${JSON.stringify(errors)}`);
    }

    if (!data) {
      throw new Error('AI operation returned no data');
    }

    // Data is JSON type from a.json() - cast to PersonalCanvas
    // The Lambda returns a properly typed PersonalCanvas object
    return data as PersonalCanvas;
  }
}
