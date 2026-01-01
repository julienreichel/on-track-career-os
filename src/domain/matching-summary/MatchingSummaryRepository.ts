import { gqlOptions } from '@/data/graphql/options';
import { fetchAllListItems } from '@/data/graphql/pagination';
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
  list: (
    options?: Record<string, unknown>
  ) => Promise<{ data: MatchingSummary[]; nextToken?: string | null }>;
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

  async list(options: Record<string, unknown> = {}) {
    return fetchAllListItems<MatchingSummary>(this.model.list.bind(this.model), options);
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

  async findByContext(userId: string, jobId: string, companyId?: string | null) {
    const results = await this.list({
      filter: {
        userId: { eq: userId },
        jobId: { eq: jobId },
      },
    });

    if (!results?.length) {
      return null;
    }

    if (companyId) {
      return results.find((item) => item?.companyId === companyId) ?? null;
    }

    return results.find((item) => !item?.companyId) ?? results[0] ?? null;
  }

  async listByJob(jobId: string) {
    return this.list({
      filter: {
        jobId: { eq: jobId },
      },
    });
  }
}
