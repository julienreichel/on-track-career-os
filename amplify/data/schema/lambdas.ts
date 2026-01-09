import { a, defineFunction } from '@aws-amplify/backend';
import { deleteUserProfile } from '../delete-user-profile/resource';

// Bedrock model ID (Amazon Nova Lite)
export const MODEL_ID = 'eu.amazon.nova-micro-v1:0';

// Define AI operation Lambda functions
export const parseCvTextFunction = defineFunction({
  entry: '../ai-operations/parseCvText.ts',
  environment: {
    MODEL_ID,
  },
  timeoutSeconds: 60,
});

export const extractExperienceBlocksFunction = defineFunction({
  entry: '../ai-operations/extractExperienceBlocks.ts',
  environment: {
    MODEL_ID,
  },
  timeoutSeconds: 60,
});

export const generateStarStoryFunction = defineFunction({
  entry: '../ai-operations/generateStarStory.ts',
  environment: {
    MODEL_ID,
  },
  timeoutSeconds: 60,
});

export const generateAchievementsAndKpisFunction = defineFunction({
  entry: '../ai-operations/generateAchievementsAndKpis.ts',
  environment: {
    MODEL_ID,
  },
  timeoutSeconds: 60,
});

export const generatePersonalCanvasFunction = defineFunction({
  entry: '../ai-operations/generatePersonalCanvas.ts',
  environment: {
    MODEL_ID,
  },
  timeoutSeconds: 60,
});

export const generateCvFunction = defineFunction({
  entry: '../ai-operations/generateCv.ts',
  environment: {
    MODEL_ID,
  },
  timeoutSeconds: 90, // Longer timeout for full CV generation
});

export const parseJobDescriptionFunction = defineFunction({
  entry: '../ai-operations/parseJobDescription.ts',
  environment: {
    MODEL_ID,
  },
  timeoutSeconds: 60,
});

export const analyzeCompanyInfoFunction = defineFunction({
  entry: '../ai-operations/analyzeCompanyInfo.ts',
  environment: {
    MODEL_ID,
  },
  timeoutSeconds: 60,
});

export const generateCompanyCanvasFunction = defineFunction({
  entry: '../ai-operations/generateCompanyCanvas.ts',
  environment: {
    MODEL_ID,
  },
  timeoutSeconds: 60,
});

export const generateMatchingSummaryFunction = defineFunction({
  entry: '../ai-operations/generateMatchingSummary.ts',
  environment: {
    MODEL_ID,
  },
  timeoutSeconds: 60,
});

export const generateSpeechFunction = defineFunction({
  entry: '../ai-operations/generateSpeech.ts',
  environment: {
    MODEL_ID,
  },
  timeoutSeconds: 60,
});

export const generateCoverLetterFunction = defineFunction({
  entry: '../ai-operations/generateCoverLetter.ts',
  environment: {
    MODEL_ID,
  },
  timeoutSeconds: 60,
});

export const schemaLambdas = {
  // =====================================================
  // AI OPERATIONS (Custom Queries)
  // =====================================================

  parseCvText: a
    .query()
    .arguments({ cvText: a.string().required() })
    .returns(a.ref('ParseCvTextOutputType'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(parseCvTextFunction)),

  extractExperienceBlocks: a
    .query()
    .arguments({ experienceTextBlocks: a.string().array().required() })
    .returns(a.ref('ExperienceBlockType').array())
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
};
