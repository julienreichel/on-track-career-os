import { gqlOptions } from '@/data/graphql/options';
import type { AmplifyUserProfileModel } from '@/domain/user-profile/UserProfileRepository';
import type { UserProfile } from '@/domain/user-profile/UserProfile';
import type { CoverLetterCreateInput, CoverLetterUpdateInput, CoverLetter } from './CoverLetter';

export type AmplifyCoverLetterModel = {
  get: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: CoverLetter | null }>;
  create: (
    input: CoverLetterCreateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: CoverLetter | null }>;
  update: (
    input: CoverLetterUpdateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: CoverLetter | null }>;
  delete: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: CoverLetter | null }>;
};

type UserProfileWithCoverLetters = UserProfile & {
  coverLetters?: (CoverLetter | null)[] | null;
};

export class CoverLetterRepository {
  private readonly _model: AmplifyCoverLetterModel;
  private readonly _userProfileModel: AmplifyUserProfileModel;

  /**
   * Constructor with optional dependency injection for testing
   * @param model - Optional Amplify model instance (for testing)
   */
  constructor(model?: AmplifyCoverLetterModel, userProfileModel?: AmplifyUserProfileModel) {
    if (model && userProfileModel) {
      // Use injected model (for tests)
      this._model = model;
      this._userProfileModel = userProfileModel;
    } else {
      // Use Nuxt's auto-imported useNuxtApp (for production)
      const amplify = useNuxtApp().$Amplify.GraphQL.client;
      this._model = amplify.models.CoverLetter;
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

  async listByUser(userId: string): Promise<CoverLetter[]> {
    if (!userId) {
      return [];
    }

    const selectionSet = ['id', 'coverLetters.*'];
    const { data } = await this._userProfileModel.get(
      { id: userId },
      gqlOptions({ selectionSet })
    );
    const profile = data as UserProfileWithCoverLetters | null;
    const items = (profile?.coverLetters ?? []) as CoverLetter[];
    return items.filter((item): item is CoverLetter => Boolean(item));
  }

  async create(input: CoverLetterCreateInput) {
    const { data } = await this.model.create(input, gqlOptions());
    return data;
  }

  async update(input: CoverLetterUpdateInput) {
    const { data } = await this.model.update(input, gqlOptions());
    return data;
  }

  async delete(id: string) {
    await this.model.delete({ id }, gqlOptions());
  }
}
