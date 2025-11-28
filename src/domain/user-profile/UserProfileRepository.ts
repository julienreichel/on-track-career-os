import { gqlOptions } from '@/data/graphql/options'
import type { UserProfileCreateInput, UserProfileUpdateInput } from './UserProfile';

export class UserProfileRepository {
  private get model() {
    return useNuxtApp().$Amplify.GraphQL.client.models.UserProfile;
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
