import { STARStoryRepository } from './STARStoryRepository';
import { AiOperationsService } from '@/domain/ai-operations/AiOperationsService';
import type { STARStory, STARStoryCreateInput, STARStoryUpdateInput } from './STARStory';
import type { STARStory as AiSTARStory } from '@/domain/ai-operations/STARStory';
import type { AchievementsAndKpis } from '@/domain/ai-operations/AchievementsAndKpis';
import type { Experience } from '@/domain/experience/Experience';

/**
 * Service for STAR Story business logic
 * Handles AI generation, persistence, and relationships
 */
export class STARStoryService {
  constructor(
    private repo = new STARStoryRepository(),
    private aiService = new AiOperationsService()
  ) {}

  /**
   * Get a full STAR story with all details
   * @param id - Story ID
   * @returns Story or null if not found
   */
  async getFullSTARStory(id: string): Promise<STARStory | null> {
    const item = await this.repo.get(id);
    if (!item) return null;

    // Future: Load lazy relations if needed
    // const experience = await loadLazy(item.experience);

    return item;
  }

  /**
   * Get all stories for a specific experience
   * @param experience - Experience object
   * @returns Array of stories
   */
  async getStoriesByExperience(experience: Experience): Promise<STARStory[]> {
    return await this.repo.getStoriesByExperience(experience);
  }

  /**
   * Get all stories for the current user (across all experiences)
   * @returns Array of all stories
   */
  async getAllStories(): Promise<STARStory[]> {
    return await this.repo.list();
  }

  /**
   * Generate STAR stories from source text using AI
   * @param sourceText - Experience text to convert
   * @returns Array of AI-generated STAR story structures
   */
  async generateStar(sourceText: string): Promise<STARStory[]> {
    if (!sourceText || sourceText.trim().length === 0) {
      throw new Error('Source text cannot be empty');
    }

    return await this.aiService.generateStarStory(sourceText);
  }

  /**
   * Generate achievements and KPIs from a STAR story using AI
   * @param starStory - STAR story to analyze
   * @returns Achievements and KPI suggestions
   */
  async generateAchievements(starStory: AiSTARStory): Promise<AchievementsAndKpis> {
    return await this.aiService.generateAchievementsAndKpis(starStory);
  }

  /**
   * Create and link a new story to an experience
   * @param storyData - STAR story data from AI
   * @param experienceId - Experience to link to
   * @param achievements - Optional achievements and KPIs
   * @returns Created story
   */
  async createAndLinkStory(
    storyData: AiSTARStory,
    experienceId: string,
    achievements?: AchievementsAndKpis
  ): Promise<STARStory | null> {
    const input: STARStoryCreateInput = {
      situation: storyData.situation,
      task: storyData.task,
      action: storyData.action,
      result: storyData.result,
      experienceId,
      achievements: achievements?.achievements || [],
      kpiSuggestions: achievements?.kpiSuggestions || [],
    };

    return await this.repo.create(input);
  }

  /**
   * Update an existing STAR story
   * @param id - Story ID
   * @param updates - Fields to update
   * @returns Updated story
   */
  async updateStory(
    id: string,
    updates: Partial<Omit<STARStoryUpdateInput, 'id'>>
  ): Promise<STARStory | null> {
    return await this.repo.update({ id, ...updates });
  }

  /**
   * Delete a STAR story
   * @param id - Story ID
   */
  async deleteStory(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  /**
   * Link an existing story to an experience (update experienceId)
   * @param storyId - Story ID
   * @param experienceId - Experience ID to link to
   * @returns Updated story
   */
  async linkStoryToExperience(storyId: string, experienceId: string): Promise<STARStory | null> {
    return await this.repo.update({ id: storyId, experienceId });
  }
}
