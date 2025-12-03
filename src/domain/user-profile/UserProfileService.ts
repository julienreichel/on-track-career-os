import { UserProfileRepository } from './UserProfileRepository';
import type { UserProfile, UserProfileUpdateInput } from './UserProfile';
// import { loadLazy } from '@/data/graphql/lazy'

export class UserProfileService {
  constructor(private repo = new UserProfileRepository()) {}

  async getFullUserProfile(id: string): Promise<UserProfile | null> {
    const item = await this.repo.get(id);
    if (!item) return null;

    // Example for extending lazy relations:
    // const relations = await loadLazy(item.experiences);

    return item;
  }

  async updateUserProfile(input: UserProfileUpdateInput): Promise<UserProfile | null> {
    return await this.repo.update(input);
  }
}
