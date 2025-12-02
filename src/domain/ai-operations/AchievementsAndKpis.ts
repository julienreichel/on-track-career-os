/**
 * AchievementsAndKpis entity - re-exports types from Lambda function
 * @see amplify/data/ai-operations/generateAchievementsAndKpis.ts
 */

import type { GenerateAchievementsAndKpisOutput } from '@amplify/data/ai-operations/generateAchievementsAndKpis';

// Re-export Lambda type with frontend-friendly name
export type AchievementsAndKpis = GenerateAchievementsAndKpisOutput;

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

