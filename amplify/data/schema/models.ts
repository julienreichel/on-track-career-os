import { a } from '@aws-amplify/backend';

export const schemaModels = {
  // =====================================================
  // 1. USER IDENTITY DOMAIN
  // =====================================================

  UserProfile: a
    .model({
      fullName: a.string().required(),
      owner: a.string().required(),
      headline: a.string(),
      location: a.string(),
      seniorityLevel: a.string(),
      primaryEmail: a.string(),
      primaryPhone: a.string(),
      workPermitInfo: a.string(),
      profilePhotoKey: a.string(),
      socialLinks: a.string().array(),

      goals: a.string().array(),
      aspirations: a.string().array(),
      personalValues: a.string().array(),
      strengths: a.string().array(),
      interests: a.string().array(),
      skills: a.string().array(),
      certifications: a.string().array(),
      languages: a.string().array(),
      earnedBadges: a.string().array(),

      // Relationships
      experiences: a.hasMany('Experience', 'userId'),
      canvas: a.hasOne('PersonalCanvas', 'userId'),

      cvs: a.hasMany('CVDocument', 'userId'),
      coverLetters: a.hasMany('CoverLetter', 'userId'),
      speechBlocks: a.hasMany('SpeechBlock', 'userId'),
      cvTemplates: a.hasMany('CVTemplate', 'userId'),
      cvSettings: a.hasOne('CVSettings', 'userId'),
      matchingSummaries: a.hasMany('MatchingSummary', 'userId'),
    })
    .authorization((allow) => [allow.owner()]),

  PersonalCanvas: a
    .model({
      // 1. Customer Segments
      customerSegments: a.string().array(),

      // 2. Value Proposition
      valueProposition: a.string().array(),

      // 3. Channels
      channels: a.string().array(),

      // 4. Customer Relationships
      customerRelationships: a.string().array(),

      // 5. Key Activities
      keyActivities: a.string().array(),

      // 6. Key Resources
      keyResources: a.string().array(),

      // 7. Key Partners
      keyPartners: a.string().array(),

      // 8. Cost Structure
      costStructure: a.string().array(),

      // 9. Revenue Streams
      revenueStreams: a.string().array(),

      // Meta fields for platform workflow
      lastGeneratedAt: a.date(),
      needsUpdate: a.boolean().default(false),

      // Relationship to the user
      userId: a.id().required(),
      user: a.belongsTo('UserProfile', 'userId'),
    })
    .authorization((allow) => [allow.owner()]),

  // =====================================================
  // 2. EXPERIENCE & STORY DOMAIN
  // =====================================================

  Experience: a
    .model({
      title: a.string().required(),
      companyName: a.string(),
      startDate: a.date().required(),
      endDate: a.date(),
      responsibilities: a.string().array(),
      tasks: a.string().array(),
      rawText: a.string(),
      status: a.enum(['draft', 'complete']),
      experienceType: a.enum(['work', 'education', 'volunteer', 'project']),

      userId: a.id().required(),
      user: a.belongsTo('UserProfile', 'userId'),

      stories: a.hasMany('STARStory', 'experienceId'),
    })
    .authorization((allow) => [allow.owner()]),

  STARStory: a
    .model({
      title: a.string(),
      situation: a.string().required(),
      task: a.string().required(),
      action: a.string().required(),
      result: a.string().required(),
      achievements: a.string().array(),
      kpiSuggestions: a.string().array(),

      experienceId: a.id().required(),
      experience: a.belongsTo('Experience', 'experienceId'),
    })
    .authorization((allow) => [allow.owner()]),

  // =====================================================
  // 3. JOB & COMPANY DOMAIN
  // =====================================================

  JobDescription: a
    .model({
      rawText: a.string(),
      owner: a.string(),
      title: a.string().required(),
      seniorityLevel: a.string(),
      roleSummary: a.string(), // short narrative
      responsibilities: a.string().array(),
      requiredSkills: a.string().array(),
      behaviours: a.string().array(),
      successCriteria: a.string().array(),
      explicitPains: a.string().array(),
      atsKeywords: a.string().array(),
      status: a.enum(['draft', 'analyzed', 'complete']),

      companyId: a.id(),
      company: a.belongsTo('Company', 'companyId'),

      coverLetters: a.hasMany('CoverLetter', 'jobId'),
      cvs: a.hasMany('CVDocument', 'jobId'),
      speechBlocks: a.hasMany('SpeechBlock', 'jobId'),
      matchingSummaries: a.hasMany('MatchingSummary', 'jobId'),
    })
    .secondaryIndexes((index) => [index('owner')])
    .authorization((allow) => [allow.owner()]),

  Company: a
    .model({
      companyName: a.string().required(),
      owner: a.string(),
      industry: a.string(),
      sizeRange: a.string(),
      website: a.string(),
      productsServices: a.string().array(),
      targetMarkets: a.string().array(),
      customerSegments: a.string().array(),
      description: a.string(),
      rawNotes: a.string(),

      canvas: a.hasOne('CompanyCanvas', 'companyId'),
      jobs: a.hasMany('JobDescription', 'companyId'),
      matchingSummaries: a.hasMany('MatchingSummary', 'companyId'),
    })
    .secondaryIndexes((index) => [index('owner')])
    .authorization((allow) => [allow.owner()]),

  CompanyCanvas: a
    .model({
      companyName: a.string(),
      customerSegments: a.string().array(),
      valuePropositions: a.string().array(),
      channels: a.string().array(),
      customerRelationships: a.string().array(),
      revenueStreams: a.string().array(),
      keyResources: a.string().array(),
      keyActivities: a.string().array(),
      keyPartners: a.string().array(),
      costStructure: a.string().array(),
      lastGeneratedAt: a.datetime(),
      needsUpdate: a.boolean().default(false),

      companyId: a.id().required(),
      company: a.belongsTo('Company', 'companyId'),
    })
    .authorization((allow) => [allow.owner()]),

  MatchingSummary: a
    .model({
      // New simplified scoring structure
      overallScore: a.integer().required(),
      scoreBreakdown: a.json().required(), // { skillFit, experienceFit, interestFit, edge }
      recommendation: a.string().required(), // "apply" | "maybe" | "skip"

      // Structured actionable outputs
      reasoningHighlights: a.string().array(),
      strengthsForThisRole: a.string().array(),
      skillMatch: a.string().array(), // [MATCH], [PARTIAL], [MISSING], [OVER] tagged items
      riskyPoints: a.string().array(), // "Risk: ... Mitigation: ..." format
      impactOpportunities: a.string().array(),
      tailoringTips: a.string().array(),

      // Metadata for traceability + refresh logic
      generatedAt: a.datetime(),
      needsUpdate: a.boolean().default(false),

      // Relationships
      userId: a.id().required(),
      user: a.belongsTo('UserProfile', 'userId'),

      jobId: a.id().required(),
      job: a.belongsTo('JobDescription', 'jobId'),

      // Company should be optional in MVP (job may not have one)
      companyId: a.id(),
      company: a.belongsTo('Company', 'companyId'),
    })
    .authorization((allow) => [allow.owner()]),

  // =====================================================
  // 4. APPLICATION MATERIALS DOMAIN
  // =====================================================

  CVDocument: a
    .model({
      name: a.string(),
      templateId: a.string(),
      isTailored: a.boolean(),
      content: a.string(),
      showProfilePhoto: a.boolean().default(true),

      userId: a.id().required(),
      user: a.belongsTo('UserProfile', 'userId'),

      jobId: a.id(),
      job: a.belongsTo('JobDescription', 'jobId'),
    })
    .authorization((allow) => [allow.owner()]),

  CVTemplate: a
    .model({
      name: a.string().required(),
      content: a.string().required(),
      source: a.string(),

      userId: a.id().required(),
      user: a.belongsTo('UserProfile', 'userId'),
    })
    .authorization((allow) => [allow.owner()]),

  CVSettings: a
    .model({
      defaultTemplateId: a.string(),
      askEachTime: a.boolean().default(false),
      defaultIncludedExperienceIds: a.string().array(),
      defaultEnabledSections: a.string().array(),
      showProfilePhoto: a.boolean().default(true),

      userId: a.id().required(),
      user: a.belongsTo('UserProfile', 'userId'),
    })
    .authorization((allow) => [allow.owner()]),

  CoverLetter: a
    .model({
      name: a.string(),
      tone: a.string(),
      content: a.string(),

      userId: a.id().required(),
      user: a.belongsTo('UserProfile', 'userId'),

      jobId: a.id(),
      job: a.belongsTo('JobDescription', 'jobId'),
    })
    .authorization((allow) => [allow.owner()]),

  SpeechBlock: a
    .model({
      name: a.string(),
      elevatorPitch: a.string().required(),
      careerStory: a.string().required(),
      whyMe: a.string().required(),

      userId: a.id().required(),
      user: a.belongsTo('UserProfile', 'userId'),

      jobId: a.id(),
      job: a.belongsTo('JobDescription', 'jobId'),
    })
    .authorization((allow) => [allow.owner()]),
};
