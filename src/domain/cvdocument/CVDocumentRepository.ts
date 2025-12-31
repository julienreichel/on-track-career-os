import { gqlOptions } from '@/data/graphql/options';
import { fetchAllListItems } from '@/data/graphql/pagination';
import type { CVDocumentCreateInput, CVDocumentUpdateInput, CVDocument } from './CVDocument';

export type AmplifyCVDocumentModel = {
  get: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: CVDocument | null }>;
  list: (
    options?: Record<string, unknown>
  ) => Promise<{ data: CVDocument[]; nextToken?: string | null }>;
  create: (
    input: CVDocumentCreateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: CVDocument | null }>;
  update: (
    input: CVDocumentUpdateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: CVDocument | null }>;
  delete: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: CVDocument | null }>;
};

export class CVDocumentRepository {
  private readonly _model: AmplifyCVDocumentModel;

  /**
   * Constructor with optional dependency injection for testing
   * @param model - Optional Amplify model instance (for testing)
   */
  constructor(model?: AmplifyCVDocumentModel) {
    if (model) {
      // Use injected model (for tests)
      this._model = model;
    } else {
      // Use Nuxt's auto-imported useNuxtApp (for production)
      this._model = useNuxtApp().$Amplify.GraphQL.client.models.CVDocument;
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
    return fetchAllListItems<CVDocument>(this.model.list.bind(this.model), filter);
  }

  async create(input: CVDocumentCreateInput) {
    const { data } = await this.model.create(
      {
        ...input,
        contentJSON: input.contentJSON ? JSON.stringify(input.contentJSON) : undefined,
      },
      gqlOptions()
    );
    return data;
  }

  async update(input: CVDocumentUpdateInput) {
    const { data } = await this.model.update(
      {
        ...input,
        contentJSON: input.contentJSON ? JSON.stringify(input.contentJSON) : undefined,
      },
      gqlOptions()
    );
    return data;
  }

  async delete(id: string) {
    await this.model.delete({ id }, gqlOptions());
  }
}
