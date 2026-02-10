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

  async getProfileForTailoring(id: string): Promise<UserProfile | null> {
    return await this.repo.getForTailoring(id);
  }

  async getCanvasForUser(id: string) {
    return await this.repo.getCanvasSnapshot(id);
  }

  async getProgressSnapshot(id: string) {
    return this.repo.getProgressSnapshot(id);
  }

  async updateUserProfile(input: UserProfileUpdateInput): Promise<UserProfile | null> {
    return await this.repo.update(input);
  }

  async deleteUserProfile(id: string): Promise<boolean> {
    if (!id) {
      return false;
    }
    return Boolean(await this.repo.delete(id));
  }
}
