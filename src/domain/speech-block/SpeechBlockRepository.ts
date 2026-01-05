import { gqlOptions } from '@/data/graphql/options';
import { fetchAllListItems } from '@/data/graphql/pagination';
import type { SpeechBlockCreateInput, SpeechBlockUpdateInput, SpeechBlock } from './SpeechBlock';

export type AmplifySpeechBlockModel = {
  get: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: SpeechBlock | null }>;
  list: (
    options?: Record<string, unknown>
  ) => Promise<{ data: SpeechBlock[]; nextToken?: string | null }>;
  create: (
    input: SpeechBlockCreateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: SpeechBlock | null }>;
  update: (
    input: SpeechBlockUpdateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: SpeechBlock | null }>;
  delete: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: SpeechBlock | null }>;
};

export class SpeechBlockRepository {
  private readonly _model: AmplifySpeechBlockModel;

  /**
   * Constructor with optional dependency injection for testing
   * @param model - Optional Amplify model instance (for testing)
   */
  constructor(model?: AmplifySpeechBlockModel) {
    if (model) {
      // Use injected model (for tests)
      this._model = model;
    } else {
      // Use Nuxt's auto-imported useNuxtApp (for production)
      this._model = useNuxtApp().$Amplify.GraphQL.client.models.SpeechBlock;
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
    return fetchAllListItems<SpeechBlock>(this.model.list.bind(this.model), filter);
  }

  async create(input: SpeechBlockCreateInput) {
    const { data } = await this.model.create(input, gqlOptions());
    return data;
  }

  async update(input: SpeechBlockUpdateInput) {
    const { data } = await this.model.update(input, gqlOptions());
    return data;
  }

  async delete(id: string) {
    await this.model.delete({ id }, gqlOptions());
  }
}
