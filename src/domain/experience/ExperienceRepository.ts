import { gqlOptions } from '@/data/graphql/options';
import type { ExperienceCreateInput, ExperienceUpdateInput, Experience } from './Experience';

export type AmplifyExperienceModel = {
  get: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: Experience | null }>;
  list: (options?: Record<string, unknown>) => Promise<{ data: Experience[] }>;
  create: (
    input: ExperienceCreateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: Experience | null }>;
  update: (
    input: ExperienceUpdateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: Experience | null }>;
  delete: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: Experience | null }>;
};

export class ExperienceRepository {
  private readonly _model: AmplifyExperienceModel;

  /**
   * Constructor with optional dependency injection for testing
   * @param model - Optional Amplify model instance (for testing)
   */
  constructor(model?: AmplifyExperienceModel) {
    if (model) {
      // Use injected model (for tests)
      this._model = model;
    } else {
      // Use Nuxt's auto-imported useNuxtApp (for production)
      this._model = useNuxtApp().$Amplify.GraphQL.client.models.Experience;
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

  async create(input: ExperienceCreateInput) {
    const { data } = await this.model.create(input, gqlOptions());
    return data;
  }

  async update(input: ExperienceUpdateInput) {
    const { data } = await this.model.update(input, gqlOptions());
    return data;
  }

  async delete(id: string) {
    await this.model.delete({ id }, gqlOptions());
  }
}
