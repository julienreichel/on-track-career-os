import { type ClientSchema, a, defineData, defineFunction } from '@aws-amplify/backend';
import { postConfirmation } from '../auth/post-confirmation/resource';
import { deleteUserProfile } from './delete-user-profile/resource';

// Bedrock model ID (Amazon Nova Lite)
export const MODEL_ID = 'eu.amazon.nova-micro-v1:0';

// Define AI operation Lambda functions
export const parseCvTextFunction = defineFunction({
  entry: './ai-operations/parseCvText.ts',
  environment: {
    MODEL_ID,
  },
  timeoutSeconds: 60,
});

export const extractExperienceBlocksFunction = defineFunction({
  entry: './ai-operations/extractExperienceBlocks.ts',
  environment: {
    MODEL_ID,
  },
  timeoutSeconds: 60,
});

export const generateStarStoryFunction = defineFunction({
  entry: './ai-operations/generateStarStory.ts',
  environment: {
    MODEL_ID,
  },
  timeoutSeconds: 60,
});

export const generateAchievementsAndKpisFunction = defineFunction({
  entry: './ai-operations/generateAchievementsAndKpis.ts',
  environment: {
    MODEL_ID,
  },
  timeoutSeconds: 60,
});

export const generatePersonalCanvasFunction = defineFunction({
  entry: './ai-operations/generatePersonalCanvas.ts',
  environment: {
    MODEL_ID,
  },
  timeoutSeconds: 60,
});

export const generateCvFunction = defineFunction({
  entry: './ai-operations/generateCv.ts',
  environment: {
    MODEL_ID,
  },
  timeoutSeconds: 90, // Longer timeout for full CV generation
});

export const parseJobDescriptionFunction = defineFunction({
  entry: './ai-operations/parseJobDescription.ts',
  environment: {
    MODEL_ID,
  },
  timeoutSeconds: 60,
});

export const analyzeCompanyInfoFunction = defineFunction({
  entry: './ai-operations/analyzeCompanyInfo.ts',
  environment: {
    MODEL_ID,
  },
  timeoutSeconds: 60,
});

export const generateCompanyCanvasFunction = defineFunction({
  entry: './ai-operations/generateCompanyCanvas.ts',
  environment: {
    MODEL_ID,
  },
  timeoutSeconds: 60,
});

export const generateMatchingSummaryFunction = defineFunction({
  entry: './ai-operations/generateMatchingSummary.ts',
  environment: {
    MODEL_ID,
  },
  timeoutSeconds: 60,
});

export const generateSpeechFunction = defineFunction({
  entry: './ai-operations/generateSpeech.ts',
  environment: {
    MODEL_ID,
  },
  timeoutSeconds: 60,
});

export const generateCoverLetterFunction = defineFunction({
  entry: './ai-operations/generateCoverLetter.ts',
  environment: {
    MODEL_ID,
  },
  timeoutSeconds: 60,
});

export const schema = a
  .schema({
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

        // Relationships
        experiences: a.hasMany('Experience', 'userId'),
        canvas: a.hasOne('PersonalCanvas', 'userId'),

        cvs: a.hasMany('CVDocument', 'userId'),
        coverLetters: a.hasMany('CoverLetter', 'userId'),
        speechBlocks: a.hasMany('SpeechBlock', 'userId'),
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
        owner: a.string().required(),
        title: a.string().required(),
        seniorityLevel: a.string(),
        roleSummary: a.string(), // short narrative
        responsibilities: a.string().array(),
        requiredSkills: a.string().array(),
        behaviours: a.string().array(),
        successCriteria: a.string().array(),
        explicitPains: a.string().array(),
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
        owner: a.string().required(),
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

    // =====================================================
    // AI OPERATIONS (Custom Queries)
    // =====================================================

    parseCvText: a
      .query()
      .arguments({ cvText: a.string().required() })
      .returns(a.string())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(parseCvTextFunction)),

    extractExperienceBlocks: a
      .query()
      .arguments({ experienceTextBlocks: a.string().array().required() })
      .returns(a.string())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(extractExperienceBlocksFunction)),

    generateStarStory: a
      .query()
      .arguments({ sourceText: a.string().required() })
      .returns(a.string())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(generateStarStoryFunction)),

    generateAchievementsAndKpis: a
      .query()
      .arguments({
        starStory: a.customType({
          title: a.string(),
          situation: a.string().required(),
          task: a.string().required(),
          action: a.string().required(),
          result: a.string().required(),
        }),
      })
      .returns(a.string())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(generateAchievementsAndKpisFunction)),

    generatePersonalCanvas: a
      .query()
      .arguments({
        profile: a.json().required(),
        experiences: a.json().required(),
        stories: a.json().required(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(generatePersonalCanvasFunction)),

    generateCv: a
      .query()
      .arguments({
        language: a.string().required(),
        userProfile: a.ref('ProfileType').required(),
        selectedExperiences: a.ref('ExperienceType').array().required(),
        stories: a.ref('SpeechStoryType').array(),
        skills: a.string().array(),
        languages: a.string().array(),
        certifications: a.string().array(),
        interests: a.string().array(),
        jobDescription: a.ref('JobType'),
        matchingSummary: a.ref('MatchingSummaryContextType'),
        company: a.ref('CompanyType'),
      })
      .returns(a.string())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(generateCvFunction)),

    parseJobDescription: a
      .query()
      .arguments({ jobText: a.string().required() })
      .returns(a.string())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(parseJobDescriptionFunction)),

    analyzeCompanyInfo: a
      .query()
      .arguments({
        companyName: a.string().required(),
        industry: a.string(),
        size: a.string(),
        rawText: a.string().required(),
        jobContext: a.customType({
          title: a.string(),
          summary: a.string(),
        }),
      })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(analyzeCompanyInfoFunction)),

    generateCompanyCanvas: a
      .query()
      .arguments({
        companyProfile: a.json().required(),
        additionalNotes: a.string().array(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(generateCompanyCanvasFunction)),

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

    ExperienceType: a.customType({
      id: a.string(),
      title: a.string().required(),
      companyName: a.string(),
      startDate: a.string(),
      endDate: a.string(),
      experienceType: a.string(),
      responsibilities: a.string().array(),
      tasks: a.string().array(),
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

    UserType: a.customType({
      profile: a.ref('ProfileType').required(),
      personalCanvas: a.ref('PersonalCanvasType'),
      experienceSignals: a.customType({
        experiences: a.ref('ExperienceType').array().required(),
      }),
    }),

    JobType: a.customType({
      title: a.string().required(),
      seniorityLevel: a.string(),
      roleSummary: a.string(),
      responsibilities: a.string().array(),
      requiredSkills: a.string().array(),
      behaviours: a.string().array(),
      successCriteria: a.string().array(),
      explicitPains: a.string().array(),
    }),

    CompanyType: a.customType({
      companyName: a.string().required(),
      industry: a.string(),
      sizeRange: a.string(),
      website: a.string(),
      description: a.string(),
    }),

    generateMatchingSummary: a
      .query()
      .arguments({
        user: a.ref('UserType').required(),
        job: a.ref('JobType').required(),
        company: a.ref('CompanyType'),
      })
      .returns(
        a.customType({
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
          generatedAt: a.string().required(),
          needsUpdate: a.boolean().required(),
        })
      )
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(generateMatchingSummaryFunction)),

    generateSpeech: a
      .query()
      .arguments({
        language: a.string().required(),
        profile: a.ref('ProfileType').required(),
        experiences: a.ref('ExperienceType').array().required(),
        stories: a.ref('SpeechStoryType').array(),
        personalCanvas: a.ref('PersonalCanvasType'),
        jobDescription: a.ref('JobType'),
        matchingSummary: a.ref('MatchingSummaryContextType'),
        company: a.ref('CompanyType'),
      })
      .returns(
        a.customType({
          elevatorPitch: a.string().required(),
          careerStory: a.string().required(),
          whyMe: a.string().required(),
        })
      )
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(generateSpeechFunction)),

    generateCoverLetter: a
      .query()
      .arguments({
        language: a.string().required(),
        profile: a.ref('ProfileType').required(),
        experiences: a.ref('ExperienceType').array().required(),
        stories: a.ref('SpeechStoryType').array(),
        personalCanvas: a.ref('PersonalCanvasType'),
        jobDescription: a.ref('JobType'),
        matchingSummary: a.ref('MatchingSummaryContextType'),
        company: a.ref('CompanyType'),
      })
      .returns(a.string())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(generateCoverLetterFunction)),

    // =====================================================
    // UTILITY FUNCTIONS (Custom Queries)
    // =====================================================

    deleteUserProfileWithAuth: a
      .mutation()
      .arguments({ userId: a.string().required() })
      .returns(a.boolean())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(deleteUserProfile)),
  })
  .authorization((allow) => [allow.resource(postConfirmation)]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'identityPool',
  },
});
