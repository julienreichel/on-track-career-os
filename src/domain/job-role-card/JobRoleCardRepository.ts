import { gqlOptions } from '@/data/graphql/options';
import type { JobRoleCardCreateInput, JobRoleCardUpdateInput, JobRoleCard } from './JobRoleCard';

export type AmplifyJobRoleCardModel = {
  get: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: JobRoleCard | null }>;
  list: (options?: Record<string, unknown>) => Promise<{ data: JobRoleCard[] }>;
  create: (
    input: JobRoleCardCreateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: JobRoleCard | null }>;
  update: (
    input: JobRoleCardUpdateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: JobRoleCard | null }>;
  delete: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: JobRoleCard | null }>;
};

export class JobRoleCardRepository {
  private readonly _model: AmplifyJobRoleCardModel;

  /**
   * Constructor with optional dependency injection for testing
   * @param model - Optional Amplify model instance (for testing)
   */
  constructor(model?: AmplifyJobRoleCardModel) {
    if (model) {
      // Use injected model (for tests)
      this._model = model;
    } else {
      // Use Nuxt's auto-imported useNuxtApp (for production)
      this._model = useNuxtApp().$Amplify.GraphQL.client.models.JobRoleCard;
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

  async create(input: JobRoleCardCreateInput) {
    const { data } = await this.model.create(input, gqlOptions());
    return data;
  }

  async update(input: JobRoleCardUpdateInput) {
    const { data } = await this.model.update(input, gqlOptions());
    return data;
  }

  async delete(id: string) {
    await this.model.delete({ id }, gqlOptions());
  }
}
