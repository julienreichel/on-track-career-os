import { gqlOptions } from '@/data/graphql/options';
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

export class STARStoryRepository {
  private readonly _model: AmplifySTARStoryModel;

  /**
   * Constructor with optional dependency injection for testing
   * @param model - Optional Amplify model instance (for testing)
   */
  constructor(model?: AmplifySTARStoryModel) {
    if (model) {
      // Use injected model (for tests)
      this._model = model;
    } else {
      // Use Nuxt's auto-imported useNuxtApp (for production)
      this._model = useNuxtApp().$Amplify.GraphQL.client.models.STARStory;
    }
  }

  private get model() {
    return this._model;
  }

  async get(id: string) {
    const res = await this.model.get({ id }, gqlOptions());
    return res.data;
  }

  async list(filter: Record<string, unknown> = {}) {
    const { data } = await this.model.list(gqlOptions(filter));
    return data;
  }

  async create(input: STARStoryCreateInput) {
    const { data } = await this.model.create(input, gqlOptions());
    return data;
  }

  async update(input: STARStoryUpdateInput) {
    const { data } = await this.model.update(input, gqlOptions());
    return data;
  }

  async delete(id: string) {
    await this.model.delete({ id }, gqlOptions());
  }
}
