import { a } from '@aws-amplify/backend';

export const schemaTypes = {
  ParseCvTextSectionsType: a.customType({
    experiencesBlocks: a.string().array().required(),
    educationBlocks: a.string().array().required(),
    skills: a.string().array().required(),
    certifications: a.string().array().required(),
    rawBlocks: a.string().array().required(),
  }),

  ParseCvTextProfileType: a.customType({
    fullName: a.string(),
    headline: a.string(),
    location: a.string(),
    seniorityLevel: a.string(),
    goals: a.string().array(),
    aspirations: a.string().array(),
    personalValues: a.string().array(),
    strengths: a.string().array(),
    interests: a.string().array(),
    languages: a.string().array(),
  }),

  ParseCvTextOutputType: a.customType({
    sections: a.ref('ParseCvTextSectionsType').required(),
    profile: a.ref('ParseCvTextProfileType').required(),
  }),

  StarStoryType: a.customType({
    title: a.string().required(),
    situation: a.string().required(),
    task: a.string().required(),
    action: a.string().required(),
    result: a.string().required(),
  }),

  AchievementsAndKpisType: a.customType({
    achievements: a.string().array().required(),
    kpiSuggestions: a.string().array().required(),
  }),

  ProfileType: a.customType({
    fullName: a.string().required(),
    headline: a.string(),
    location: a.string(),
    seniorityLevel: a.string(),
    primaryEmail: a.string(),
    primaryPhone: a.string(),
    workPermitInfo: a.string(),
    socialLinks: a.string().array(),
    goals: a.string().array(),
    aspirations: a.string().array(),
    personalValues: a.string().array(),
    strengths: a.string().array(),
    interests: a.string().array(),
    skills: a.string().array(),
    certifications: a.string().array(),
    languages: a.string().array(),
  }),

  PersonalCanvasType: a.customType({
    customerSegments: a.string().array(),
    valueProposition: a.string().array(),
    channels: a.string().array(),
    customerRelationships: a.string().array(),
    keyActivities: a.string().array(),
    keyResources: a.string().array(),
    keyPartners: a.string().array(),
    costStructure: a.string().array(),
    revenueStreams: a.string().array(),
  }),

  PersonalCanvasProfileType: a.customType({
    fullName: a.string(),
    headline: a.string(),
    summary: a.string(),
  }),

  PersonalCanvasExperienceType: a.customType({
    title: a.string(),
    company: a.string(),
    startDate: a.string(),
    endDate: a.string(),
    responsibilities: a.string().array(),
    tasks: a.string().array(),
  }),

  PersonalCanvasStoryType: a.customType({
    situation: a.string(),
    task: a.string(),
    action: a.string(),
    result: a.string(),
    achievements: a.string().array(),
    kpiSuggestions: a.string().array(),
  }),

  ExperienceType: a.customType({
    id: a.string(),
    title: a.string().required(),
    companyName: a.string().required(),
    startDate: a.string(),
    endDate: a.string(),
    experienceType: a.string().required(),
    responsibilities: a.string().array().required(),
    tasks: a.string().array().required(),
    achievements: a.string().array(),
    kpiSuggestions: a.string().array(),
  }),

  SpeechStoryType: a.customType({
    experienceId: a.string(),
    title: a.string(),
    situation: a.string(),
    task: a.string(),
    action: a.string(),
    result: a.string(),
    achievements: a.string().array(),
  }),

  MatchingSummaryContextType: a.customType({
    overallScore: a.integer().required(),
    scoreBreakdown: a.customType({
      skillFit: a.integer().required(),
      experienceFit: a.integer().required(),
      interestFit: a.integer().required(),
      edge: a.integer().required(),
    }),
    recommendation: a.string().required(),
    reasoningHighlights: a.string().array().required(),
    strengthsForThisRole: a.string().array().required(),
    skillMatch: a.string().array().required(),
    riskyPoints: a.string().array().required(),
    impactOpportunities: a.string().array().required(),
    tailoringTips: a.string().array().required(),
  }),

  JobType: a.customType({
    title: a.string().required(),
    seniorityLevel: a.string().required(),
    roleSummary: a.string().required(),
    responsibilities: a.string().array().required(),
    requiredSkills: a.string().array().required(),
    behaviours: a.string().array().required(),
    successCriteria: a.string().array().required(),
    explicitPains: a.string().array().required(),
    atsKeywords: a.string().array().required(),
  }),

  CompanyType: a.customType({
    companyName: a.string().required(),
    industry: a.string().required(),
    sizeRange: a.string().required(),
    website: a.string().required(),
    description: a.string().required(),
    productsServices: a.string().array().required(),
    targetMarkets: a.string().array().required(),
    customerSegments: a.string().array().required(),
    rawNotes: a.string().required(),
  }),

  AnalyzeCompanyInfoOutputType: a.customType({
    companyProfile: a.ref('CompanyType').required(),
  }),

  GenerateCompanyCanvasOutputType: a.customType({
    companyName: a.string().required(),
    customerSegments: a.string().array().required(),
    valuePropositions: a.string().array().required(),
    channels: a.string().array().required(),
    customerRelationships: a.string().array().required(),
    revenueStreams: a.string().array().required(),
    keyResources: a.string().array().required(),
    keyActivities: a.string().array().required(),
    keyPartners: a.string().array().required(),
    costStructure: a.string().array().required(),
  }),
};
