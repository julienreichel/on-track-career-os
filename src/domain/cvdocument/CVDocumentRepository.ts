import { gqlOptions } from '@/data/graphql/options';
import type { CVDocumentCreateInput, CVDocumentUpdateInput, CVDocument } from './CVDocument';

export type AmplifyCVDocumentModel = {
  get: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: CVDocument | null }>;
  list: (options?: Record<string, unknown>) => Promise<{ data: CVDocument[] }>;
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

  /**
   * Parse contentJSON if it's a string
   */
  private parseContentJSON(doc: CVDocument | null): CVDocument | null {
    if (!doc) return null;

    if (doc.contentJSON && typeof doc.contentJSON === 'string') {
      try {
        return {
          ...doc,
          contentJSON: JSON.parse(doc.contentJSON),
        };
      } catch (error) {
        console.error('[CVDocumentRepository] Failed to parse contentJSON:', error);
        return doc;
      }
    }

    return doc;
  }

  async get(id: string) {
    const res = await this.model.get({ id }, gqlOptions());
    return this.parseContentJSON(res.data);
  }

  async list(filter: Record<string, unknown> = {}) {
    const { data } = await this.model.list(gqlOptions(filter));
    return data.map((doc) => this.parseContentJSON(doc));
  }

  async create(input: CVDocumentCreateInput) {
    // Stringify contentJSON if it's an object (but not null)
    const processedInput = {
      ...input,
      contentJSON:
        input.contentJSON && typeof input.contentJSON === 'object'
          ? JSON.stringify(input.contentJSON)
          : input.contentJSON,
    };
    const { data } = await this.model.create(processedInput as CVDocumentCreateInput, gqlOptions());
    return this.parseContentJSON(data);
  }

  async update(input: CVDocumentUpdateInput) {
    // Stringify contentJSON if it's an object
    const processedInput = {
      ...input,
      contentJSON:
        input.contentJSON && typeof input.contentJSON === 'object'
          ? JSON.stringify(input.contentJSON)
          : input.contentJSON,
    };
    const { data } = await this.model.update(processedInput as CVDocumentUpdateInput, gqlOptions());
    return this.parseContentJSON(data);
  }

  async delete(id: string) {
    await this.model.delete({ id }, gqlOptions());
  }
}
