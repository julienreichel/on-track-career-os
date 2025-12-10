import { ref } from 'vue';
import { ExperienceService } from '@/domain/experience/ExperienceService';

/**
 * Composable for managing breadcrumb ID to name mappings
 * Provides a cache to avoid repeated API calls for the same IDs
 */

interface BreadcrumbMapping {
  [id: string]: string;
}

const mappingCache = ref<BreadcrumbMapping>({});
const experienceService = new ExperienceService();

export function useBreadcrumbMapping() {
  /**
   * Get display name for an experience ID
   */
  const getExperienceName = async (experienceId: string): Promise<string> => {
    // Check cache first
    if (mappingCache.value[experienceId]) {
      return mappingCache.value[experienceId];
    }

    // Fetch from API
    try {
      const experience = await experienceService.getFullExperience(experienceId);
      const name = experience?.companyName || experience?.title;
      if (name) {
        mappingCache.value[experienceId] = name;
        return name;
      }
    } catch (err) {
      console.error('[useBreadcrumbMapping] Error fetching experience:', err);
    }

    // Return ID as fallback
    return experienceId;
  };

  /**
   * Check if a string looks like a UUID
   */
  const isUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  /**
   * Resolve a path segment to its display name
   * Checks if it's an ID and fetches the appropriate name
   */
  const resolveSegment = async (
    segment: string,
    previousSegment?: string
  ): Promise<string | null> => {
    // Only process if it looks like an ID
    if (!isUUID(segment)) {
      return null;
    }

    // Determine what type of ID this is based on the previous segment
    if (previousSegment === 'experiences') {
      return await getExperienceName(segment);
    }

    // Add more mappings here as needed for other entity types
    // For example: companies, jobs, stories, etc.

    return null;
  };

  /**
   * Clear the cache (useful for testing or after data updates)
   */
  const clearCache = () => {
    mappingCache.value = {};
  };

  return {
    resolveSegment,
    isUUID,
    clearCache,
  };
}
