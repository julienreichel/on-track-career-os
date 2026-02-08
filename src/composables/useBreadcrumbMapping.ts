import { logError } from '@/utils/logError';
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

type UseBreadcrumbMappingOptions = {
  toast?: {
    add: (options: Record<string, unknown>) => void;
  };
  fallbackLabel?: string;
  errorTitle?: string;
  errorDescription?: string;
};

const resolveErrorMessage = (value: string | undefined, fallback: string) =>
  value && value.trim().length > 0 ? value : fallback;

const getExperienceName = async (
  experienceId: string,
  fallbackLabel: string,
  notifyFailure: () => void
): Promise<string> => {
  if (!experienceService) {
    experienceService = new ExperienceService();
  }

  if (mappingCache.value[experienceId]) {
    return mappingCache.value[experienceId];
  }

  try {
    const experience = await experienceService.getFullExperience(experienceId);
    const name = experience?.companyName || experience?.title;
    if (name) {
      mappingCache.value[experienceId] = name;
      return name;
    }
  } catch (err) {
    logError('[useBreadcrumbMapping] Error fetching experience', err, { experienceId });
    notifyFailure();
  }

  return fallbackLabel;
};

const getCVDocumentName = async (
  cvId: string,
  fallbackLabel: string,
  notifyFailure: () => void
): Promise<string> => {
  if (!cvDocumentService) {
    cvDocumentService = new CVDocumentService();
  }

  if (mappingCache.value[cvId]) {
    return mappingCache.value[cvId];
  }

  try {
    const cvDocument = await cvDocumentService.getFullCVDocument(cvId);
    const name = cvDocument?.name;
    if (name) {
      mappingCache.value[cvId] = name;
      return name;
    }
  } catch (err) {
    logError('[useBreadcrumbMapping] Error fetching CV document', err, { cvId });
    notifyFailure();
  }

  return fallbackLabel;
};

const getCVTemplateName = async (
  templateId: string,
  fallbackLabel: string,
  notifyFailure: () => void
): Promise<string> => {
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
    logError('[useBreadcrumbMapping] Error fetching CV template', err, { templateId });
    notifyFailure();
  }

  return fallbackLabel;
};

export function useBreadcrumbMapping(options: UseBreadcrumbMappingOptions) {
  const toast = options.toast ?? null;
  const fallbackLabel = resolveErrorMessage(options.fallbackLabel, 'Unknown');
  const errorTitle = resolveErrorMessage(options.errorTitle, 'Error');
  const errorDescription = resolveErrorMessage(
    options.errorDescription,
    'Unable to resolve breadcrumb name.'
  );

  const notifyFailure = () => {
    toast?.add({
      title: errorTitle,
      description: errorDescription,
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle',
    });
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
      return await getExperienceName(segment, fallbackLabel, notifyFailure);
    }

    if (previousSegment === 'cv') {
      if (previousParentSegment === 'settings') {
        return await getCVTemplateName(segment, fallbackLabel, notifyFailure);
      }
      return await getCVDocumentName(segment, fallbackLabel, notifyFailure);
    }

    if (previousSegment === 'companies') {
      return await getCompanyName(segment, fallbackLabel, notifyFailure);
    }

    if (previousSegment === 'jobs') {
      return await getJobName(segment, fallbackLabel, notifyFailure);
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
    experienceService = null;
    cvDocumentService = null;
    cvTemplateService = null;
    companyService = null;
    jobService = null;
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
const getCompanyName = async (
  companyId: string,
  fallbackLabel: string,
  notifyFailure: () => void
): Promise<string> => {
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
    logError('[useBreadcrumbMapping] Error fetching company', err, { companyId });
    notifyFailure();
  }

  return fallbackLabel;
};

const getJobName = async (
  jobId: string,
  fallbackLabel: string,
  notifyFailure: () => void
): Promise<string> => {
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
    logError('[useBreadcrumbMapping] Error fetching job', err, { jobId });
    notifyFailure();
  }

  return fallbackLabel;
};
