import { gqlOptions } from '@/data/graphql/options';
import type { CVTemplateCreateInput, CVTemplateUpdateInput, CVTemplate } from './CVTemplate';

export type AmplifyCVTemplateModel = {
  get: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: CVTemplate | null }>;
  create: (
    input: CVTemplateCreateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: CVTemplate | null }>;
  update: (
    input: CVTemplateUpdateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: CVTemplate | null }>;
  delete: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: CVTemplate | null }>;
};

export class CVTemplateRepository {
  private readonly _model: AmplifyCVTemplateModel;

  /**
   * Constructor with optional dependency injection for testing
   * @param model - Optional Amplify model instance (for testing)
   */
  constructor(model?: AmplifyCVTemplateModel) {
    if (model) {
      // Use injected model (for tests)
      this._model = model;
    } else {
      // Use Nuxt's auto-imported useNuxtApp (for production)
      this._model = useNuxtApp().$Amplify.GraphQL.client.models.CVTemplate;
    }
  }

  private get model() {
    return this._model;
  }

  async get(id: string) {
    const res = await this.model.get({ id }, gqlOptions());
    return res.data;
  }

  async create(input: CVTemplateCreateInput) {
    const { data } = await this.model.create(input, gqlOptions());
    return data;
  }

  async update(input: CVTemplateUpdateInput) {
    const { data } = await this.model.update(input, gqlOptions());
    return data;
  }

  async delete(id: string) {
    await this.model.delete({ id }, gqlOptions());
  }

  async createFromExemplar(input: CVTemplateCreateInput) {
    const { data } = await this.model.create(input, gqlOptions());
    return data;
  }
}
