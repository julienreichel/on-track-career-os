/**
 * Input for generateCv AI operation
 */
export interface GenerateCvInput {
  userProfile: {
    fullName: string;
    email?: string;
    phone?: string;
    location?: string;
    headline?: string;
    summary?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
    goals?: string[];
    strengths?: string[];
  };
  selectedExperiences: Array<{
    id: string;
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate?: string;
    isCurrent?: boolean;
    experienceType?: 'work' | 'education' | 'volunteer' | 'project';
    responsibilities?: string[];
    tasks?: string[];
  }>;
  stories?: Array<{
    id?: string;
    experienceId?: string;
    situation: string;
    task: string;
    action: string;
    result: string;
    achievements?: string[];
  }>;
  skills?: string[];
  languages?: string[];
  certifications?: string[];
  interests?: string[];
  jobDescription?: string;
}

/**
 * Result from generateCv AI operation
 * Returns the complete CV as plain Markdown text
 */
export type GenerateCvResult = string;
