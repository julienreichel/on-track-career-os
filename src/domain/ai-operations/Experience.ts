/**
 * Experience entity - represents the structured output from experience block extraction
 * Maps to the JSON output schema from extractExperienceBlocks Lambda function
 */

export interface ExtractedExperience {
  title: string;
  company: string;
  start_date: string;
  end_date?: string;
  responsibilities: string[];
  tasks: string[];
}

export interface ExperiencesResult {
  experiences: ExtractedExperience[];
}

/**
 * Type guard to validate ExperiencesResult structure
 */
export function isExperiencesResult(data: unknown): data is ExperiencesResult {
  if (typeof data !== 'object' || data === null) return false;
  
  const result = data as Record<string, unknown>;
  
  return (
    Array.isArray(result.experiences) &&
    result.experiences.every((exp) => {
      const e = exp as Record<string, unknown>;
      return (
        typeof e.title === 'string' &&
        typeof e.company === 'string' &&
        typeof e.start_date === 'string' &&
        Array.isArray(e.responsibilities) &&
        Array.isArray(e.tasks)
      );
    })
  );
}
