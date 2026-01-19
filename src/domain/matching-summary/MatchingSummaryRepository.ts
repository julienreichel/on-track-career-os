import { gqlOptions } from '@/data/graphql/options';
import type {
  MatchingSummaryCreateInput,
  MatchingSummaryUpdateInput,
  MatchingSummary,
} from './MatchingSummary';

export type AmplifyMatchingSummaryModel = {
  get: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: MatchingSummary | null }>;
  create: (
    input: MatchingSummaryCreateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: MatchingSummary | null }>;
  update: (
    input: MatchingSummaryUpdateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: MatchingSummary | null }>;
  delete: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: MatchingSummary | null }>;
};

export class MatchingSummaryRepository {
  private readonly _model: AmplifyMatchingSummaryModel;

  /**
   * Constructor with optional dependency injection for testing
   * @param model - Optional Amplify model instance (for testing)
   */
  constructor(model?: AmplifyMatchingSummaryModel) {
    if (model) {
      // Use injected model (for tests)
      this._model = model;
    } else {
      // Use Nuxt's auto-imported useNuxtApp (for production)
      this._model = useNuxtApp().$Amplify.GraphQL.client.models.MatchingSummary;
    }
  }

  private get model() {
    return this._model;
  }

  async get(id: string) {
    const res = await this.model.get({ id }, gqlOptions());
    return res.data;
  }

  async create(input: MatchingSummaryCreateInput) {
    const { data } = await this.model.create(input, gqlOptions());
    return data;
  }

  async update(input: MatchingSummaryUpdateInput) {
    const { data } = await this.model.update(input, gqlOptions());
    return data;
  }

  async delete(id: string) {
    await this.model.delete({ id }, gqlOptions());
  }
}
