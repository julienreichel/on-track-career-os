/**
 * ParsedCV entity - represents the structured output from CV text parsing
 * Maps to the JSON output schema from parseCvText Lambda function
 */

export interface CVSection {
  text: string;
}

export interface CVExperience {
  title: string;
  company: string;
  start_date?: string;
  end_date?: string;
  description: string;
}

export interface CVEducation {
  degree?: string;
  institution: string;
  graduation_date?: string;
  description: string;
}

export interface CVSkill {
  skill: string;
  category?: string;
}

export interface CVCertification {
  name: string;
  issuer?: string;
  date?: string;
}

export interface ParsedCV {
  experiences: CVExperience[];
  education: CVEducation[];
  skills: CVSkill[];
  certifications: CVCertification[];
  raw_blocks: CVSection[];
  confidence: number;
}

/**
 * Type guard to validate ParsedCV structure
 */
export function isParsedCV(data: unknown): data is ParsedCV {
  if (typeof data !== 'object' || data === null) return false;
  
  const cv = data as Record<string, unknown>;
  
  return (
    Array.isArray(cv.experiences) &&
    Array.isArray(cv.education) &&
    Array.isArray(cv.skills) &&
    Array.isArray(cv.certifications) &&
    Array.isArray(cv.raw_blocks) &&
    typeof cv.confidence === 'number'
  );
}
