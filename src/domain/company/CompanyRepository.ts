import { gqlOptions } from '@/data/graphql/options';
import { fetchAllListItems } from '@/data/graphql/pagination';
import type { CompanyCreateInput, CompanyUpdateInput, Company } from './Company';
import { normalizeCompanyName } from './companyMatching';

export type AmplifyCompanyModel = {
  get: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: Company | null }>;
  listCompanyByOwner: (
    input: { owner: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: Company[]; nextToken?: string | null }>;
  create: (
    input: CompanyCreateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: Company | null }>;
  update: (
    input: CompanyUpdateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: Company | null }>;
  delete: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: Company | null }>;
};

export class CompanyRepository {
  private readonly _model: AmplifyCompanyModel;

  /**
   * Constructor with optional dependency injection for testing
   * @param model - Optional Amplify model instance (for testing)
   */
  constructor(model?: AmplifyCompanyModel) {
    if (model) {
      // Use injected model (for tests)
      this._model = model;
    } else {
      // Use Nuxt's auto-imported useNuxtApp (for production)
      this._model = useNuxtApp().$Amplify.GraphQL.client.models.Company;
    }
  }

  private get model() {
    return this._model;
  }

  async get(id: string) {
    const res = await this.model.get({ id }, gqlOptions());
    return res.data;
  }

  async listByOwner(owner: string): Promise<Company[]> {
    if (!owner) {
      return [];
    }

    return fetchAllListItems<Company>((options) =>
      this.model.listCompanyByOwner({ owner }, options)
    );
  }

  async create(input: CompanyCreateInput) {
    const { data } = await this.model.create(input, gqlOptions());
    return data;
  }

  async update(input: CompanyUpdateInput) {
    const { data } = await this.model.update(input, gqlOptions());
    return data;
  }

  async delete(id: string) {
    await this.model.delete({ id }, gqlOptions());
  }

  async findByNormalizedName(name: string, owner: string) {
    const normalized = normalizeCompanyName(name);
    if (!normalized || !owner) {
      return null;
    }
    const companies = await this.listByOwner(owner);
    return (
      companies.find((company) => normalizeCompanyName(company.companyName) === normalized) ?? null
    );
  }
}
