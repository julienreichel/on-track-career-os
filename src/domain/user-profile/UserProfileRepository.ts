import { gqlOptions } from '@/data/graphql/options';
import { fetchAllListItems } from '@/data/graphql/pagination';
import type { UserProfileUpdateInput, UserProfile } from './UserProfile';

export type AmplifyUserProfileModel = {
  get: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: UserProfile | null }>;
  list: (
    options?: Record<string, unknown>
  ) => Promise<{ data: UserProfile[]; nextToken?: string | null }>;
  update: (
    input: UserProfileUpdateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: UserProfile | null }>;
};

export type AmplifyMutations = {
  deleteUserProfileWithAuth: (input: { userId: string }) => Promise<{ data: boolean | null }>;
};

export class UserProfileRepository {
  private readonly _model: AmplifyUserProfileModel;
  private readonly _mutations: AmplifyMutations;

  /**
   * Constructor with optional dependency injection for testing
   * @param model - Optional Amplify model instance (for testing)
   * @param mutations - Optional Amplify mutations instance (for testing)
   */
  constructor(model?: AmplifyUserProfileModel, mutations?: AmplifyMutations) {
    if (model && mutations) {
      // Use injected dependencies (for tests)
      this._model = model;
      this._mutations = mutations;
    } else {
      // Use Nuxt's auto-imported useNuxtApp (for production)
      const amplify = useNuxtApp().$Amplify.GraphQL.client;
      this._model = amplify.models.UserProfile;
      this._mutations = amplify.mutations;
    }
  }

  private get model() {
    return this._model;
  }

  private get mutations() {
    return this._mutations;
  }

  async get(id: string) {
    const res = await this.model.get({ id }, gqlOptions());
    return res.data;
  }

  async list(filter: Record<string, unknown> = {}) {
    return fetchAllListItems<UserProfile>(this.model.list.bind(this.model), filter);
  }

  async update(input: UserProfileUpdateInput) {
    const { data } = await this.model.update(input, gqlOptions());
    return data;
  }

  /**
   * Delete user profile and associated Cognito user
   * Uses Lambda mutation to delete both DynamoDB record and Cognito user in one call
   */
  async delete(id: string) {
    const { data } = await this.mutations.deleteUserProfileWithAuth({ userId: id });
    return data;
  }
}
