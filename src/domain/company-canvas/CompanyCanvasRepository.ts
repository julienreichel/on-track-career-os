import { gqlOptions } from '@/data/graphql/options';
import { fetchAllListItems } from '@/data/graphql/pagination';
import type {
  CompanyCanvasCreateInput,
  CompanyCanvasUpdateInput,
  CompanyCanvas,
} from './CompanyCanvas';

export type AmplifyCompanyCanvasModel = {
  get: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: CompanyCanvas | null }>;
  list: (
    options?: Record<string, unknown>
  ) => Promise<{ data: CompanyCanvas[]; nextToken?: string | null }>;
  create: (
    input: CompanyCanvasCreateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: CompanyCanvas | null }>;
  update: (
    input: CompanyCanvasUpdateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: CompanyCanvas | null }>;
  delete: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: CompanyCanvas | null }>;
};

export class CompanyCanvasRepository {
  private readonly _model: AmplifyCompanyCanvasModel;

  /**
   * Constructor with optional dependency injection for testing
   * @param model - Optional Amplify model instance (for testing)
   */
  constructor(model?: AmplifyCompanyCanvasModel) {
    if (model) {
      // Use injected model (for tests)
      this._model = model;
    } else {
      // Use Nuxt's auto-imported useNuxtApp (for production)
      this._model = useNuxtApp().$Amplify.GraphQL.client.models.CompanyCanvas;
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
    return fetchAllListItems<CompanyCanvas>(this.model.list.bind(this.model), filter);
  }

  async create(input: CompanyCanvasCreateInput) {
    const { data } = await this.model.create(input, gqlOptions());
    return data;
  }

  async update(input: CompanyCanvasUpdateInput) {
    const { data } = await this.model.update(input, gqlOptions());
    return data;
  }

  async delete(id: string) {
    await this.model.delete({ id }, gqlOptions());
  }

  async getByCompanyId(companyId: string) {
    const results = await this.list({
      filter: {
        companyId: { eq: companyId },
      },
    });
    return results[0] ?? null;
  }
}
