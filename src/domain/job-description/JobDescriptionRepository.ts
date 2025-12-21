import { gqlOptions } from '@/data/graphql/options';
import type { JobDescriptionCreateInput, JobDescriptionUpdateInput, JobDescription } from './JobDescription';

export type AmplifyJobDescriptionModel = {
  get: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: JobDescription | null }>;
  list: (options?: Record<string, unknown>) => Promise<{ data: JobDescription[] }>;
  create: (
    input: JobDescriptionCreateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: JobDescription | null }>;
  update: (
    input: JobDescriptionUpdateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: JobDescription | null }>;
  delete: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: JobDescription | null }>;
};

export class JobDescriptionRepository {
  private readonly _model: AmplifyJobDescriptionModel;

  /**
   * Constructor with optional dependency injection for testing
   * @param model - Optional Amplify model instance (for testing)
   */
  constructor(model?: AmplifyJobDescriptionModel) {
    if (model) {
      // Use injected model (for tests)
      this._model = model;
    } else {
      // Use Nuxt's auto-imported useNuxtApp (for production)
      this._model = useNuxtApp().$Amplify.GraphQL.client.models.JobDescription;
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

  async create(input: JobDescriptionCreateInput) {
    const { data } = await this.model.create(input, gqlOptions());
    return data;
  }

  async update(input: JobDescriptionUpdateInput) {
    const { data } = await this.model.update(input, gqlOptions());
    return data;
  }

  async delete(id: string) {
    await this.model.delete({ id }, gqlOptions());
  }
}
