/**
 * Input for generateCv AI operation
 */
export interface GenerateCvInput {
  language: 'en';
  profile: {
    fullName: string;
    headline?: string;
    location?: string;
    seniorityLevel?: string;
    primaryEmail?: string;
    primaryPhone?: string;
    workPermitInfo?: string;
    socialLinks?: string[];
    goals?: string[];
    aspirations?: string[];
    personalValues?: string[];
    strengths?: string[];
    interests?: string[];
    skills?: string[];
    certifications?: string[];
    languages?: string[];
  };
  experiences: Array<{
    id?: string;
    title: string;
    companyName: string;
    startDate: string;
    endDate?: string;
    experienceType: 'work' | 'education' | 'volunteer' | 'project';
    responsibilities: string[];
    tasks: string[];
    achievements?: string[];
    kpiSuggestions?: string[];
  }>;
  stories?: Array<{
    experienceId?: string;
    situation: string;
    task: string;
    action: string;
    result: string;
    achievements?: string[];
  }>;
  personalCanvas?: {
    customerSegments?: string[];
    valueProposition?: string[];
    channels?: string[];
    customerRelationships?: string[];
    keyActivities?: string[];
    keyResources?: string[];
    keyPartners?: string[];
    costStructure?: string[];
    revenueStreams?: string[];
  };
  jobDescription?: {
    title: string;
    seniorityLevel: string;
    roleSummary: string;
    responsibilities: string[];
    requiredSkills: string[];
    behaviours: string[];
    successCriteria: string[];
    explicitPains: string[];
  };
  matchingSummary?: {
    overallScore: number;
    scoreBreakdown: {
      skillFit: number;
      experienceFit: number;
      interestFit: number;
      edge: number;
    };
    recommendation: 'apply' | 'maybe' | 'skip';
    reasoningHighlights: string[];
    strengthsForThisRole: string[];
    skillMatch: string[];
    riskyPoints: string[];
    impactOpportunities: string[];
    tailoringTips: string[];
  };
  company?: {
    companyName: string;
    industry: string;
    sizeRange: string;
    website: string;
    description: string;
    productsServices: string[];
    targetMarkets: string[];
    customerSegments: string[];
    rawNotes: string;
  };
}

/**
 * Result from generateCv AI operation
 * Returns the complete CV as plain Markdown text
 */
export type GenerateCvResult = string;
