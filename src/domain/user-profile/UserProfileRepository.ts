import { gqlOptions } from '@/data/graphql/options';
import type { UserProfileCreateInput, UserProfileUpdateInput, UserProfile } from './UserProfile';

export type AmplifyUserProfileModel = {
  get: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: UserProfile | null }>;
  list: (options?: Record<string, unknown>) => Promise<{ data: UserProfile[] }>;
  create: (
    input: UserProfileCreateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: UserProfile | null }>;
  update: (
    input: UserProfileUpdateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: UserProfile | null }>;
  delete: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: UserProfile | null }>;
};

export class UserProfileRepository {
  private readonly _model: AmplifyUserProfileModel;

  /**
   * Constructor with optional dependency injection for testing
   * @param model - Optional Amplify model instance (for testing)
   */
  constructor(model?: AmplifyUserProfileModel) {
    if (model) {
      // Use injected model (for tests)
      this._model = model;
    } else {
      // Use Nuxt's auto-imported useNuxtApp (for production)
      this._model = useNuxtApp().$Amplify.GraphQL.client.models.UserProfile;
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
    const { data } = await this.model.list(gqlOptions(filter));
    return data;
  }

  async create(input: UserProfileCreateInput) {
    const { data } = await this.model.create(input, gqlOptions());
    return data;
  }

  async update(input: UserProfileUpdateInput) {
    const { data } = await this.model.update(input, gqlOptions());
    return data;
  }

  async delete(id: string) {
    await this.model.delete({ id }, gqlOptions());
  }
}
