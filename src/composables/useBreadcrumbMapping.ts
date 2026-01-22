import { ref } from 'vue';
import { ExperienceService } from '@/domain/experience/ExperienceService';
import { CVTemplateService } from '@/domain/cvtemplate/CVTemplateService';
import { CVDocumentService } from '@/domain/cvdocument/CVDocumentService';
import { CompanyService } from '@/domain/company/CompanyService';
import { JobDescriptionService } from '@/domain/job-description/JobDescriptionService';

/**
 * Composable for managing breadcrumb ID to name mappings
 * Provides a cache to avoid repeated API calls for the same IDs
 */

interface BreadcrumbMapping {
  [id: string]: string;
}

const mappingCache = ref<BreadcrumbMapping>({});
let experienceService: ExperienceService | null = null;
let cvDocumentService: CVDocumentService | null = null;
let cvTemplateService: CVTemplateService | null = null;
let companyService: CompanyService | null = null;
let jobService: JobDescriptionService | null = null;

export function useBreadcrumbMapping() {
  /**
   * Get display name for an experience ID
   */
  const getExperienceName = async (experienceId: string): Promise<string> => {
    // Lazy initialize service to avoid issues in test environment
    if (!experienceService) {
      experienceService = new ExperienceService();
    }

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
   * Get display name for a CV document ID
   */
  const getCVDocumentName = async (cvId: string): Promise<string> => {
    // Lazy initialize service to avoid issues in test environment
    if (!cvDocumentService) {
      cvDocumentService = new CVDocumentService();
    }

    // Check cache first
    if (mappingCache.value[cvId]) {
      return mappingCache.value[cvId];
    }

    // Fetch from API
    try {
      const cvDocument = await cvDocumentService.getFullCVDocument(cvId);
      const name = cvDocument?.name;
      if (name) {
        mappingCache.value[cvId] = name;
        return name;
      }
    } catch (err) {
      console.error('[useBreadcrumbMapping] Error fetching CV document:', err);
    }

    // Return ID as fallback
    return cvId;
  };

  /**
   * Get display name for a CV template ID
   */
  const getCVTemplateName = async (templateId: string): Promise<string> => {
    if (!cvTemplateService) {
      cvTemplateService = new CVTemplateService();
    }

    if (mappingCache.value[templateId]) {
      return mappingCache.value[templateId];
    }

    try {
      const template = await cvTemplateService.get(templateId);
      const name = template?.name;
      if (name) {
        mappingCache.value[templateId] = name;
        return name;
      }
    } catch (err) {
      console.error('[useBreadcrumbMapping] Error fetching CV template:', err);
    }

    return templateId;
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
    previousSegment?: string,
    previousParentSegment?: string
  ): Promise<string | null> => {
    // Only process if it looks like an ID
    if (!isUUID(segment)) {
      return null;
    }

    // Determine what type of ID this is based on the previous segment
    if (previousSegment === 'experiences') {
      return await getExperienceName(segment);
    }

    if (previousSegment === 'cv') {
      if (previousParentSegment === 'settings') {
        return await getCVTemplateName(segment);
      }
      return await getCVDocumentName(segment);
    }

    if (previousSegment === 'companies') {
      return await getCompanyName(segment);
    }

    if (previousSegment === 'jobs') {
      return await getJobName(segment);
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

/**
 * Get display name for a company ID
 */
const getCompanyName = async (companyId: string): Promise<string> => {
  if (!companyService) {
    companyService = new CompanyService();
  }

  if (mappingCache.value[companyId]) {
    return mappingCache.value[companyId];
  }

  try {
    const company = await companyService.getCompany(companyId);
    const name = company?.companyName;
    if (name) {
      mappingCache.value[companyId] = name;
      return name;
    }
  } catch (err) {
    console.error('[useBreadcrumbMapping] Error fetching company:', err);
  }

  return companyId;
};

const getJobName = async (jobId: string): Promise<string> => {
  if (!jobService) {
    jobService = new JobDescriptionService();
  }

  if (mappingCache.value[jobId]) {
    return mappingCache.value[jobId];
  }

  try {
    const job = await jobService.getFullJobDescription(jobId);
    const title = job?.title;
    if (title) {
      mappingCache.value[jobId] = title;
      return title;
    }
  } catch (err) {
    console.error('[useBreadcrumbMapping] Error fetching job:', err);
  }

  return jobId;
};
