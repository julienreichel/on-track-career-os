import { gqlOptions } from '@/data/graphql/options';
import type { AmplifyUserProfileModel } from '@/domain/user-profile/UserProfileRepository';
import type { UserProfile } from '@/domain/user-profile/UserProfile';
import type { CVDocumentCreateInput, CVDocumentUpdateInput, CVDocument } from './CVDocument';

export type AmplifyCVDocumentModel = {
  get: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: CVDocument | null }>;
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

type UserProfileWithCvs = UserProfile & {
  cvs?: (CVDocument | null)[] | null;
};

export class CVDocumentRepository {
  private readonly _model: AmplifyCVDocumentModel;
  private readonly _userProfileModel: AmplifyUserProfileModel;

  /**
   * Constructor with optional dependency injection for testing
   * @param model - Optional Amplify model instance (for testing)
   */
  constructor(model?: AmplifyCVDocumentModel, userProfileModel?: AmplifyUserProfileModel) {
    if (model && userProfileModel) {
      // Use injected model (for tests)
      this._model = model;
      this._userProfileModel = userProfileModel;
    } else {
      // Use Nuxt's auto-imported useNuxtApp (for production)
      const amplify = useNuxtApp().$Amplify.GraphQL.client;
      this._model = amplify.models.CVDocument;
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

  async listByUser(userId: string): Promise<CVDocument[]> {
    if (!userId) {
      return [];
    }

    const selectionSet = ['id', 'cvs.*'];
    const { data } = await this._userProfileModel.get(
      { id: userId },
      gqlOptions({ selectionSet })
    );
    const profile = data as UserProfileWithCvs | null;
    const items = (profile?.cvs ?? []) as CVDocument[];
    return items.filter((item): item is CVDocument => Boolean(item));
  }

  async create(input: CVDocumentCreateInput) {
    const { data } = await this.model.create(input, gqlOptions());
    return data;
  }

  async update(input: CVDocumentUpdateInput) {
    const { data } = await this.model.update(input, gqlOptions());
    return data;
  }

  async delete(id: string) {
    await this.model.delete({ id }, gqlOptions());
  }
}
