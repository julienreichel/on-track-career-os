/**
 * Domain model for AI-generated achievements and KPIs
 *
 * Represents the output of ai.generateAchievementsAndKpis operation
 * which extracts achievements and KPI suggestions from STAR stories.
 *
 * @see docs/AI_Interaction_Contract.md - Operation 4
 */

/**
 * AchievementsAndKpis domain model
 *
 * Contains achievements and KPI suggestions generated from a STAR story.
 * Achievements are concrete accomplishments, while KPIs are measurable
 * indicators of success.
 */
export interface AchievementsAndKpis {
  /**
   * List of achievements extracted from the STAR story
   * Each achievement should be a clear, concise accomplishment
   */
  achievements: string[];

  /**
   * List of KPI (Key Performance Indicator) suggestions
   * Can be quantitative (with numbers) or qualitative
   */
  kpiSuggestions: string[];
}

/**
 * Validates that an object is a valid AchievementsAndKpis
 */
export function isAchievementsAndKpis(obj: unknown): obj is AchievementsAndKpis {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const typed = obj as Record<string, unknown>;

  return (
    Array.isArray(typed.achievements) &&
    typed.achievements.every((a) => typeof a === 'string') &&
    Array.isArray(typed.kpiSuggestions) &&
    typed.kpiSuggestions.every((k) => typeof k === 'string')
  );
}
