import { ExperienceRepository } from './ExperienceRepository';
import { STARStoryService } from '@/domain/starstory/STARStoryService';
import type { Experience } from './Experience';
// import { loadLazy } from '@/data/graphql/lazy'

/**
 * Dependencies for ExperienceService
 */
export interface ExperienceServiceDependencies {
  repo?: ExperienceRepository;
  starStoryService?: STARStoryService;
}

export class ExperienceService {
  private repo: ExperienceRepository;
  private starStoryService: STARStoryService;

  constructor(deps: ExperienceServiceDependencies = {}) {
    this.repo = deps.repo ?? new ExperienceRepository();
    this.starStoryService = deps.starStoryService ?? new STARStoryService();
  }

  async getFullExperience(id: string): Promise<Experience | null> {
    const item = await this.repo.get(id);
    if (!item) return null;

    // Example for extending lazy relations:
    // const relations = await loadLazy(item.experiences);

    return item;
  }

  /**
   * Delete an experience and cascade delete all associated STAR stories
   * @param experienceId - Experience ID to delete
   * @throws Error if experienceId is empty
   */
  async deleteExperience(experienceId: string): Promise<void> {
    if (!experienceId) {
      throw new Error('Experience ID is required');
    }

    // Get all stories associated with this experience
    const stories = await this.starStoryService.getStoriesByExperience(experienceId);

    // Delete all associated stories first
    await Promise.all(stories.map((story) => this.starStoryService.deleteStory(story.id)));

    // Then delete the experience
    await this.repo.delete(experienceId);
  }
}
