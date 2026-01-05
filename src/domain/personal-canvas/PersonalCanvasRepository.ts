import { gqlOptions } from '@/data/graphql/options';
import { fetchAllListItems } from '@/data/graphql/pagination';
import type {
  PersonalCanvasCreateInput,
  PersonalCanvasUpdateInput,
  PersonalCanvas,
} from './PersonalCanvas';

export type AmplifyPersonalCanvasModel = {
  get: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: PersonalCanvas | null }>;
  list: (
    options?: Record<string, unknown>
  ) => Promise<{ data: PersonalCanvas[]; nextToken?: string | null }>;
  create: (
    input: PersonalCanvasCreateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: PersonalCanvas | null }>;
  update: (
    input: PersonalCanvasUpdateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: PersonalCanvas | null }>;
  delete: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: PersonalCanvas | null }>;
};

export class PersonalCanvasRepository {
  private readonly _model: AmplifyPersonalCanvasModel;

  /**
   * Constructor with optional dependency injection for testing
   * @param model - Optional Amplify model instance (for testing)
   */
  constructor(model?: AmplifyPersonalCanvasModel) {
    if (model) {
      // Use injected model (for tests)
      this._model = model;
    } else {
      // Use Nuxt's auto-imported useNuxtApp (for production)
      this._model = useNuxtApp().$Amplify.GraphQL.client.models.PersonalCanvas;
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
    return fetchAllListItems<PersonalCanvas>(this.model.list.bind(this.model), filter);
  }

  async create(input: PersonalCanvasCreateInput) {
    const { data } = await this.model.create(input, gqlOptions());
    return data;
  }

  async update(input: PersonalCanvasUpdateInput) {
    const { data } = await this.model.update(input, gqlOptions());
    return data;
  }

  async delete(id: string) {
    await this.model.delete({ id }, gqlOptions());
  }

  async getByUserId(userId: string) {
    const results = await this.list({
      filter: {
        userId: { eq: userId },
      },
    });
    return results[0] ?? null;
  }
}
