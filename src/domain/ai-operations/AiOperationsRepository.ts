import type { ParsedCV } from './ParsedCV';
import type { ExperiencesResult } from './Experience';

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
}

/**
 * Type for Amplify AI operations queries
 * Maps to GraphQL schema defined in amplify/data/resource.ts
 */
export type AmplifyAiOperations = {
  parseCvText: (
    input: { cv_text: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: string | null; errors?: unknown[] }>;
  
  extractExperienceBlocks: (
    input: { experience_text_blocks: string[] },
    options?: Record<string, unknown>
  ) => Promise<{ data: string | null; errors?: unknown[] }>;
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
    const { data, errors } = await this.client.parseCvText(
      { cv_text: cvText },
      { authMode: 'userPool' }
    );

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
      { experience_text_blocks: experienceTextBlocks },
      { authMode: 'userPool' }
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
}
