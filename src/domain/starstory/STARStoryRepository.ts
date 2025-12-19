import { gqlOptions } from '@/data/graphql/options';
import type { AmplifyExperienceModel } from '@/domain/experience/ExperienceRepository';
import type { STARStoryCreateInput, STARStoryUpdateInput, STARStory } from './STARStory';

export type AmplifySTARStoryModel = {
  get: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: STARStory | null }>;
  list: (options?: Record<string, unknown>) => Promise<{ data: STARStory[] }>;
  create: (
    input: STARStoryCreateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: STARStory | null }>;
  update: (
    input: STARStoryUpdateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: STARStory | null }>;
  delete: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: STARStory | null }>;
};

/**
 * Repository for STAR Story data access
 * Handles CRUD operations and filtering for STAR stories
 */
export class STARStoryRepository {
  private readonly _model: AmplifySTARStoryModel;
  private readonly _experienceModel: AmplifyExperienceModel;

  /**
   * Constructor with optional dependency injection for testing
   * @param model - Optional Amplify model instance (for testing)
   */
  constructor(model?: AmplifySTARStoryModel, experienceModel?: AmplifyExperienceModel) {
    if (model && experienceModel) {
      // Use injected model (for tests)
      this._model = model;
      this._experienceModel = experienceModel;
    } else {
      // Use Nuxt's auto-imported useNuxtApp (for production)
      const amplify = useNuxtApp().$Amplify.GraphQL.client;
      this._model = amplify.models.STARStory;
      this._experienceModel = amplify.models.Experience;
    }
  }

  private get model() {
    return this._model;
  }

  /**
   * Get a single STAR story by ID
   * @param id - Story ID
   * @returns Story or null if not found
   */
  async get(id: string): Promise<STARStory | null> {
    const res = await this.model.get({ id }, gqlOptions());
    return res.data;
  }

  /**
   * List all stories (optionally filtered)
   * @param filter - Optional filter object
   * @returns Array of stories
   */
  async list(filter: Record<string, unknown> = {}): Promise<STARStory[]> {
    const { data } = await this.model.list(gqlOptions(filter));
    return data;
  }

  /**
   * Get all stories for an experience using a single GraphQL query
   * Fetches the experience along with its nested stories via selection set.
   * @param experienceId - Experience ID to load stories for
   * @returns Array of all stories for that experience (all pages combined)
   */
  async getStoriesByExperience(experienceId: string): Promise<STARStory[]> {
    if (!experienceId) {
      return [];
    }

    const selectionSet = ['id', 'stories.*'];

    const { data } = await this._experienceModel.get(
      { id: experienceId },
      gqlOptions({ selectionSet })
    );

    const stories = data?.stories ?? [];
    return stories.filter((story): story is STARStory => Boolean(story));
  }

  /**
   * Create a new STAR story
   * @param input - Story data
   * @returns Created story or null
   */
  async create(input: STARStoryCreateInput): Promise<STARStory | null> {
    const { data } = await this.model.create(input, gqlOptions());
    return data;
  }

  /**
   * Update an existing STAR story
   * @param input - Story update data (must include id)
   * @returns Updated story or null
   */
  async update(input: STARStoryUpdateInput): Promise<STARStory | null> {
    const { data } = await this.model.update(input, gqlOptions());
    return data;
  }

  /**
   * Delete a STAR story
   * @param id - Story ID to delete
   */
  async delete(id: string): Promise<void> {
    await this.model.delete({ id }, gqlOptions());
  }
}
