import { gqlOptions } from '@/data/graphql/options';
import type { AmplifyUserProfileModel } from '@/domain/user-profile/UserProfileRepository';
import type { UserProfile } from '@/domain/user-profile/UserProfile';
import type { SpeechBlockCreateInput, SpeechBlockUpdateInput, SpeechBlock } from './SpeechBlock';

export type AmplifySpeechBlockModel = {
  get: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: SpeechBlock | null }>;
  create: (
    input: SpeechBlockCreateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: SpeechBlock | null }>;
  update: (
    input: SpeechBlockUpdateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: SpeechBlock | null }>;
  delete: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: SpeechBlock | null }>;
};

type UserProfileWithSpeechBlocks = UserProfile & {
  speechBlocks?: (SpeechBlock | null)[] | null;
};

export class SpeechBlockRepository {
  private readonly _model: AmplifySpeechBlockModel;
  private readonly _userProfileModel: AmplifyUserProfileModel;

  /**
   * Constructor with optional dependency injection for testing
   * @param model - Optional Amplify model instance (for testing)
   */
  constructor(model?: AmplifySpeechBlockModel, userProfileModel?: AmplifyUserProfileModel) {
    if (model && userProfileModel) {
      // Use injected model (for tests)
      this._model = model;
      this._userProfileModel = userProfileModel;
    } else {
      // Use Nuxt's auto-imported useNuxtApp (for production)
      const amplify = useNuxtApp().$Amplify.GraphQL.client;
      this._model = amplify.models.SpeechBlock;
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

  async listByUser(userId: string): Promise<SpeechBlock[]> {
    if (!userId) {
      return [];
    }

    const selectionSet = ['id', 'speechBlocks.*'];
    const { data } = await this._userProfileModel.get(
      { id: userId },
      gqlOptions({ selectionSet })
    );
    const profile = data as UserProfileWithSpeechBlocks | null;
    const items = (profile?.speechBlocks ?? []) as SpeechBlock[];
    return items.filter((item): item is SpeechBlock => Boolean(item));
  }

  async create(input: SpeechBlockCreateInput) {
    const { data } = await this.model.create(input, gqlOptions());
    return data;
  }

  async update(input: SpeechBlockUpdateInput) {
    const { data } = await this.model.update(input, gqlOptions());
    return data;
  }

  async delete(id: string) {
    await this.model.delete({ id }, gqlOptions());
  }
}
