import { gqlOptions } from '@/data/graphql/options';
import { fetchAllListItems } from '@/data/graphql/pagination';
import type { CoverLetterCreateInput, CoverLetterUpdateInput, CoverLetter } from './CoverLetter';

export type AmplifyCoverLetterModel = {
  get: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: CoverLetter | null }>;
  list: (
    options?: Record<string, unknown>
  ) => Promise<{ data: CoverLetter[]; nextToken?: string | null }>;
  create: (
    input: CoverLetterCreateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: CoverLetter | null }>;
  update: (
    input: CoverLetterUpdateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: CoverLetter | null }>;
  delete: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: CoverLetter | null }>;
};

export class CoverLetterRepository {
  private readonly _model: AmplifyCoverLetterModel;

  /**
   * Constructor with optional dependency injection for testing
   * @param model - Optional Amplify model instance (for testing)
   */
  constructor(model?: AmplifyCoverLetterModel) {
    if (model) {
      // Use injected model (for tests)
      this._model = model;
    } else {
      // Use Nuxt's auto-imported useNuxtApp (for production)
      this._model = useNuxtApp().$Amplify.GraphQL.client.models.CoverLetter;
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
    return fetchAllListItems<CoverLetter>(this.model.list.bind(this.model), filter);
  }

  async create(input: CoverLetterCreateInput) {
    const { data } = await this.model.create(input, gqlOptions());
    return data;
  }

  async update(input: CoverLetterUpdateInput) {
    const { data } = await this.model.update(input, gqlOptions());
    return data;
  }

  async delete(id: string) {
    await this.model.delete({ id }, gqlOptions());
  }
}
