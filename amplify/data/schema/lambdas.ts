import { a, defineFunction } from '@aws-amplify/backend';
import { deleteUserProfile } from '../delete-user-profile/resource';

// Bedrock model ID (Amazon Nova Lite)
export const MODEL_ID = 'eu.amazon.nova-micro-v1:0';

// PostHog configuration for LLM analytics
export const POSTHOG_API_KEY = process.env.PUBLIC_POSTHOG_KEY || '';
export const POSTHOG_HOST = process.env.PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com';

// Define AI operation Lambda functions
export const parseCvTextFunction = defineFunction({
  entry: '../ai-operations/parseCvText.ts',
  environment: {
    MODEL_ID,
    POSTHOG_API_KEY,
    POSTHOG_HOST,
  },
  timeoutSeconds: 60,
});

export const extractExperienceBlocksFunction = defineFunction({
  entry: '../ai-operations/extractExperienceBlocks.ts',
  environment: {
    MODEL_ID,
    POSTHOG_API_KEY,
    POSTHOG_HOST,
  },
  timeoutSeconds: 60,
});

export const generateStarStoryFunction = defineFunction({
  entry: '../ai-operations/generateStarStory.ts',
  environment: {
    MODEL_ID,
    POSTHOG_API_KEY,
    POSTHOG_HOST,
  },
  timeoutSeconds: 60,
});

export const generateAchievementsAndKpisFunction = defineFunction({
  entry: '../ai-operations/generateAchievementsAndKpis.ts',
  environment: {
    MODEL_ID,
    POSTHOG_API_KEY,
    POSTHOG_HOST,
  },
  timeoutSeconds: 60,
});

export const generatePersonalCanvasFunction = defineFunction({
  entry: '../ai-operations/generatePersonalCanvas.ts',
  environment: {
    MODEL_ID,
    POSTHOG_API_KEY,
    POSTHOG_HOST,
  },
  timeoutSeconds: 60,
});

export const generateCvFunction = defineFunction({
  entry: '../ai-operations/generateCv.ts',
  environment: {
    MODEL_ID,
    POSTHOG_API_KEY,
    POSTHOG_HOST,
  },
  timeoutSeconds: 90, // Longer timeout for full CV generation
});

export const parseJobDescriptionFunction = defineFunction({
  entry: '../ai-operations/parseJobDescription.ts',
  environment: {
    MODEL_ID,
    POSTHOG_API_KEY,
    POSTHOG_HOST,
  },
  timeoutSeconds: 60,
});

export const analyzeCompanyInfoFunction = defineFunction({
  entry: '../ai-operations/analyzeCompanyInfo.ts',
  environment: {
    MODEL_ID,
    POSTHOG_API_KEY,
    POSTHOG_HOST,
  },
  timeoutSeconds: 60,
});

export const generateCompanyCanvasFunction = defineFunction({
  entry: '../ai-operations/generateCompanyCanvas.ts',
  environment: {
    MODEL_ID,
    POSTHOG_API_KEY,
    POSTHOG_HOST,
  },
  timeoutSeconds: 60,
});

export const generateMatchingSummaryFunction = defineFunction({
  entry: '../ai-operations/generateMatchingSummary.ts',
  environment: {
    MODEL_ID,
    POSTHOG_API_KEY,
    POSTHOG_HOST,
  },
  timeoutSeconds: 60,
});

export const generateSpeechFunction = defineFunction({
  entry: '../ai-operations/generateSpeech.ts',
  environment: {
    MODEL_ID,
    POSTHOG_API_KEY,
    POSTHOG_HOST,
  },
  timeoutSeconds: 60,
});

export const generateCoverLetterFunction = defineFunction({
  entry: '../ai-operations/generateCoverLetter.ts',
  environment: {
    MODEL_ID,
    POSTHOG_API_KEY,
    POSTHOG_HOST,
  },
  timeoutSeconds: 60,
});

export const evaluateApplicationStrengthFunction = defineFunction({
  entry: '../ai-operations/evaluateApplicationStrength.ts',
  environment: {
    MODEL_ID,
    POSTHOG_API_KEY,
    POSTHOG_HOST,
  },
  timeoutSeconds: 60,
});

export const improveMaterialFunction = defineFunction({
  entry: '../ai-operations/improveMaterial/handler.ts',
  environment: {
    MODEL_ID,
    POSTHOG_API_KEY,
    POSTHOG_HOST,
  },
  timeoutSeconds: 60,
});

export const schemaLambdas = {
  // =====================================================
  // AI OPERATIONS (Custom Queries)
  // =====================================================

  parseCvText: a
    .query()
    .arguments({ cvText: a.string().required(), language: a.string().required() })
    .returns(a.ref('ParseCvTextOutputType'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(parseCvTextFunction)),

  extractExperienceBlocks: a
    .query()
    .arguments({
      language: a.string().required(),
      experienceItems: a.ref('ExperienceItemInputType').array().required(),
    })
    .returns(a.ref('ExtractExperienceBlocksOutputType'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(extractExperienceBlocksFunction)),

  generateStarStory: a
    .query()
    .arguments({ sourceText: a.string().required() })
    .returns(a.ref('StarStoryType').array())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(generateStarStoryFunction)),

  generateAchievementsAndKpis: a
    .query()
    .arguments({
      starStory: a.ref('StarStoryType').required(),
    })
    .returns(a.ref('AchievementsAndKpisType'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(generateAchievementsAndKpisFunction)),

  generatePersonalCanvas: a
    .query()
    .arguments({
      profile: a.ref('ProfileType').required(),
      experiences: a.ref('ExperienceType').array().required(),
      stories: a.ref('SpeechStoryType').array().required(),
    })
    .returns(a.ref('PersonalCanvasType'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(generatePersonalCanvasFunction)),

  generateCv: a
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
      templateMarkdown: a.string(),
    })
    .returns(a.string())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(generateCvFunction)),

  parseJobDescription: a
    .query()
    .arguments({ jobText: a.string().required() })
    .returns(a.ref('JobType'))
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
    .returns(a.ref('AnalyzeCompanyInfoOutputType'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(analyzeCompanyInfoFunction)),

  generateCompanyCanvas: a
    .query()
    .arguments({
      companyProfile: a.ref('CompanyType').required(),
      additionalNotes: a.string().array(),
    })
    .returns(a.ref('GenerateCompanyCanvasOutputType'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(generateCompanyCanvasFunction)),

  generateMatchingSummary: a
    .query()
    .arguments({
      profile: a.ref('ProfileType').required(),
      experiences: a.ref('ExperienceType').array().required(),
      stories: a.ref('SpeechStoryType').array(),
      personalCanvas: a.ref('PersonalCanvasType'),
      jobDescription: a.ref('JobType'),
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

  evaluateApplicationStrength: a
    .query()
    .arguments({
      job: a.ref('JobType').required(),
      cvText: a.string().required(),
      coverLetterText: a.string().required(),
      language: a.string().required(),
    })
    .returns(a.ref('EvaluateApplicationStrengthType'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(evaluateApplicationStrengthFunction)),

  improveMaterial: a
    .query()
    .arguments({
      language: a.string().required(),
      materialType: a.enum(['cv', 'coverLetter']),
      currentMarkdown: a.string().required(),
      instructions: a.ref('ImproveMaterialInstructionsType').required(),
      improvementContext: a.ref('EvaluateApplicationStrengthType').required(),
      profile: a.ref('ProfileType').required(),
      experiences: a.ref('ExperienceType').array().required(),
      stories: a.ref('SpeechStoryType').array(),
      jobDescription: a.ref('JobType'),
      matchingSummary: a.ref('MatchingSummaryContextType'),
      company: a.ref('CompanyType'),
    })
    .returns(a.string())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(improveMaterialFunction)),

  // =====================================================
  // UTILITY FUNCTIONS (Custom Queries)
  // =====================================================

  deleteUserProfileWithAuth: a
    .mutation()
    .arguments({ userId: a.string().required() })
    .returns(a.boolean())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(deleteUserProfile)),
};
