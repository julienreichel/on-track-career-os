import { gqlOptions } from '@/data/graphql/options';
import type { CVSettingsCreateInput, CVSettingsUpdateInput, CVSettings } from './CVSettings';

export type AmplifyCVSettingsModel = {
  get: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: CVSettings | null }>;
  create: (
    input: CVSettingsCreateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: CVSettings | null }>;
  update: (
    input: CVSettingsUpdateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: CVSettings | null }>;
  delete: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: CVSettings | null }>;
};

export class CVSettingsRepository {
  private readonly _model: AmplifyCVSettingsModel;

  /**
   * Constructor with optional dependency injection for testing
   * @param model - Optional Amplify model instance (for testing)
   */
  constructor(model?: AmplifyCVSettingsModel) {
    if (model) {
      // Use injected model (for tests)
      this._model = model;
    } else {
      // Use Nuxt's auto-imported useNuxtApp (for production)
      this._model = useNuxtApp().$Amplify.GraphQL.client.models.CVSettings;
    }
  }

  private get model() {
    return this._model;
  }

  async get(id: string) {
    const res = await this.model.get({ id }, gqlOptions());
    return res.data;
  }

  async getOrCreate(userId: string) {
    if (!userId) {
      throw new Error('userId is required');
    }

    const existing = await this.get(userId);
    if (existing) {
      return existing;
    }

    const { data } = await this.model.create(
      {
        id: userId,
        userId,
      },
      gqlOptions()
    );
    return data;
  }

  async create(input: CVSettingsCreateInput) {
    const { data } = await this.model.create(input, gqlOptions());
    return data;
  }

  async update(input: CVSettingsUpdateInput) {
    const { data } = await this.model.update(input, gqlOptions());
    return data;
  }

  async delete(id: string) {
    await this.model.delete({ id }, gqlOptions());
  }
}
