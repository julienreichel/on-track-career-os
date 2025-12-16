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
    responsibilities?: string[];
    tasks?: string[];
  }>;
  stories?: Array<{
    situation: string;
    task: string;
    action: string;
    result: string;
  }>;
  skills?: string[];
  languages?: string[];
  certifications?: string[];
  interests?: string[];
  jobDescription?: string;
}

/**
 * Result from generateCv AI operation
 */
export interface GenerateCvResult {
  markdown: string;
  sections: string[];
}
