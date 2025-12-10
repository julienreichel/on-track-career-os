import { gqlOptions } from '@/data/graphql/options';
import { loadLazy } from '@/data/graphql/lazy';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
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
  private readonly experienceRepo: ExperienceRepository;

  /**
   * Constructor with optional dependency injection for testing
   * @param model - Optional Amplify model instance (for testing)
   * @param experienceRepository - Optional Experience repository instance (for testing)
   */
  constructor(
    model?: AmplifySTARStoryModel,
    experienceRepository?: ExperienceRepository
  ) {
    if (model) {
      // Use injected model (for tests)
      this._model = model;
    } else {
      // Use Nuxt's auto-imported useNuxtApp (for production)
      this._model = useNuxtApp().$Amplify.GraphQL.client.models.STARStory;
    }
    this.experienceRepo = experienceRepository || new ExperienceRepository();
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
   * Get all stories for a specific experience using GraphQL relationship
   * @param experienceId - Experience ID to filter by
   * @returns Array of stories for that experience
   */
  async getStoriesByExperience(experienceId: string): Promise<STARStory[]> {
    const experience = await this.experienceRepo.get(experienceId);
    if (!experience?.stories) {
      return [];
    }
    const { data } = await loadLazy(experience.stories);
    return data;
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
