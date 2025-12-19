import { gqlOptions } from '@/data/graphql/options';
import type { AmplifyUserProfileModel } from '@/domain/user-profile/UserProfileRepository';
import type { UserProfile } from '@/domain/user-profile/UserProfile';
import type { ExperienceCreateInput, ExperienceUpdateInput, Experience } from './Experience';

export type AmplifyExperienceModel = {
  get: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: Experience | null }>;
  list: (options?: Record<string, unknown>) => Promise<{ data: Experience[] }>;
  create: (
    input: ExperienceCreateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: Experience | null }>;
  update: (
    input: ExperienceUpdateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: Experience | null }>;
  delete: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: Experience | null }>;
};

type UserProfileWithExperiences = UserProfile & {
  experiences?: (Experience | null)[] | null;
};

export class ExperienceRepository {
  private readonly _model: AmplifyExperienceModel;
  private readonly _userProfileModel: AmplifyUserProfileModel;

  /**
   * Constructor with optional dependency injection for testing
   * @param model - Optional Amplify model instance (for testing)
   */
  constructor(model?: AmplifyExperienceModel, userProfileModel?: AmplifyUserProfileModel) {
    if (model && userProfileModel) {
      // Use injected model (for tests)
      this._model = model;
      this._userProfileModel = userProfileModel;
    } else {
      // Use Nuxt's auto-imported useNuxtApp (for production)
      const amplify = useNuxtApp().$Amplify.GraphQL.client;
      this._model = amplify.models.Experience;
      this._userProfileModel = amplify.models.UserProfile;
    }
  }

  private get model() {
    return this._model;
  }

  async get(id: string) {
    const res = await this.model.get({ id }, gqlOptions());
    return res.data;
  }

  /**
   * List all experiences for a user using a single GraphQL query
   * Utilizes selection sets to fetch the user profile with nested experiences.
   * @param userId - User ID to load experiences for
   * @returns Array of experiences (all items returned by the selection set)
   */
  async list(userId: string): Promise<Experience[]> {
    if (!userId) {
      return [];
    }

    const selectionSet = ['id', 'experiences.*'];

    const { data } = await this._userProfileModel.get({ id: userId }, gqlOptions({ selectionSet }));

    const profile = data as UserProfileWithExperiences | null;
    const items = (profile?.experiences ?? []) as Experience[];
    return items.filter((item): item is Experience => Boolean(item));
  }

  async create(input: ExperienceCreateInput) {
    const { data } = await this.model.create(input, gqlOptions());
    return data;
  }

  async update(input: ExperienceUpdateInput) {
    const { data } = await this.model.update(input, gqlOptions());
    return data;
  }

  async delete(id: string) {
    await this.model.delete({ id }, gqlOptions());
  }
}
