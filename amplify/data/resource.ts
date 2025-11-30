import { type ClientSchema, a, defineData, defineFunction } from '@aws-amplify/backend';
import { postConfirmation } from '../auth/post-confirmation/resource';

// Bedrock model ID (Amazon Nova Lite)
export const MODEL_ID = 'amazon.nova-lite-v1:0';

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

export const schema = a
  .schema({
    // =====================================================
    // 1. USER IDENTITY DOMAIN
    // =====================================================

    UserProfile: a
      .model({
        fullName: a.string().required(),
        headline: a.string(),
        location: a.string(),
        seniorityLevel: a.string(),

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
        interviewSessions: a.hasMany('InterviewSession', 'userId'),
        matchingSummaries: a.hasMany('MatchingSummary', 'userId'),
      })
      .authorization((allow) => [allow.owner()]),

    PersonalCanvas: a
      .model({
        valueProposition: a.string(),
        keyActivities: a.string().array(),
        strengthsAdvantage: a.string(),
        targetRoles: a.string().array(),
        channels: a.string().array(),
        resources: a.string().array(),
        careerDirection: a.string(),
        painRelievers: a.string().array(),
        gainCreators: a.string().array(),
        lastGeneratedAt: a.date(),
        needsUpdate: a.boolean().default(false),

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

        userId: a.id().required(),
        user: a.belongsTo('UserProfile', 'userId'),

        stories: a.hasMany('STARStory', 'experienceId'),
      })
      .authorization((allow) => [allow.owner()]),

    STARStory: a
      .model({
        situation: a.string().required(),
        task: a.string().required(),
        action: a.string().required(),
        result: a.string().required(),
        achievements: a.string().array(),
        kpiSuggestions: a.string().array(),

        experienceId: a.id().required(),
        experience: a.belongsTo('Experience', 'experienceId'),

        applicationMaterials: a.hasMany('ApplicationMaterialLink', 'storyId'),
      })
      .authorization((allow) => [allow.owner()]),

    // =====================================================
    // 3. JOB & COMPANY DOMAIN
    // =====================================================

    JobDescription: a
      .model({
        rawText: a.string(),
        title: a.string().required(),
        seniorityLevel: a.string(),
        responsibilities: a.string().array(),
        requiredSkills: a.string().array(),
        behaviours: a.string().array(),
        successCriteria: a.string().array(),
        explicitPains: a.string().array(),
        status: a.enum(['draft', 'analyzed', 'complete']),

        companyId: a.id(),
        company: a.belongsTo('Company', 'companyId'),

        roleCard: a.hasOne('JobRoleCard', 'jobId'),
        coverLetters: a.hasMany('CoverLetter', 'jobId'),
        cvs: a.hasMany('CVDocument', 'jobId'),
        speechBlocks: a.hasMany('SpeechBlock', 'jobId'),
        kpiSets: a.hasMany('KPISet', 'jobId'),
        interviewQuestions: a.hasOne('InterviewQuestionSet', 'jobId'),
        interviewSessions: a.hasMany('InterviewSession', 'jobId'),
        matchingSummaries: a.hasMany('MatchingSummary', 'jobId'),
      })
      .authorization((allow) => [allow.owner()]),

    JobRoleCard: a
      .model({
        responsibilityList: a.string().array(),
        skillsList: a.string().array(),
        behaviourList: a.string().array(),
        successCriteriaList: a.string().array(),
        jobPains: a.string().array(),
        aiConfidenceScore: a.float(),

        jobId: a.id().required(),
        job: a.belongsTo('JobDescription', 'jobId'),
      })
      .authorization((allow) => [allow.owner()]),

    Company: a
      .model({
        companyName: a.string().required(),
        industry: a.string(),
        size: a.string(),
        productsServices: a.string().array(),
        marketPosition: a.string(),
        rawText: a.string(),

        canvas: a.hasOne('CompanyCanvas', 'companyId'),
        jobs: a.hasMany('JobDescription', 'companyId'),
        matchingSummaries: a.hasMany('MatchingSummary', 'companyId'),
      })
      .authorization((allow) => [allow.owner()]),

    CompanyCanvas: a
      .model({
        valueProposition: a.string(),
        keyActivities: a.string().array(),
        strengthsAdvantage: a.string(),
        targetRoles: a.string().array(),
        channels: a.string().array(),
        resources: a.string().array(),
        marketChallenges: a.string().array(),
        internalPains: a.string().array(),
        customerPains: a.string().array(),
        strategicPriorities: a.string().array(),

        companyId: a.id().required(),
        company: a.belongsTo('Company', 'companyId'),
      })
      .authorization((allow) => [allow.owner()]),

    MatchingSummary: a
      .model({
        userFitScore: a.float(),
        impactAreas: a.string().array(),
        contributionMap: a.string(),
        riskMitigationPoints: a.string().array(),
        summaryParagraph: a.string(),

        userId: a.id().required(),
        user: a.belongsTo('UserProfile', 'userId'),

        jobId: a.id().required(),
        job: a.belongsTo('JobDescription', 'jobId'),

        companyId: a.id().required(),
        company: a.belongsTo('Company', 'companyId'),

        kpis: a.hasMany('KPISet', 'matchingSummaryId'),
      })
      .authorization((allow) => [allow.owner()]),

    // =====================================================
    // 4. APPLICATION MATERIALS DOMAIN
    // =====================================================

    CVDocument: a
      .model({
        name: a.string().required(),
        templateId: a.string(),
        isTailored: a.boolean(),
        contentJSON: a.json(),

        userId: a.id().required(),
        user: a.belongsTo('UserProfile', 'userId'),

        jobId: a.id(),
        job: a.belongsTo('JobDescription', 'jobId'),
      })
      .authorization((allow) => [allow.owner()]),

    CoverLetter: a
      .model({
        tone: a.string(),
        content: a.string(),
        aiConfidenceScore: a.float(),

        userId: a.id().required(),
        user: a.belongsTo('UserProfile', 'userId'),

        jobId: a.id().required(),
        job: a.belongsTo('JobDescription', 'jobId'),
      })
      .authorization((allow) => [allow.owner()]),

    SpeechBlock: a
      .model({
        elevatorPitch: a.string(),
        careerStory: a.string(),
        whyMe: a.string(),

        userId: a.id().required(),
        user: a.belongsTo('UserProfile', 'userId'),

        jobId: a.id(),
        job: a.belongsTo('JobDescription', 'jobId'),
      })
      .authorization((allow) => [allow.owner()]),

    KPISet: a
      .model({
        kpiList: a.string().array().required(),
        justificationList: a.string().array(),

        jobId: a.id().required(),
        job: a.belongsTo('JobDescription', 'jobId'),

        matchingSummaryId: a.id().required(),
        matchingSummary: a.belongsTo('MatchingSummary', 'matchingSummaryId'),
      })
      .authorization((allow) => [allow.owner()]),

    ApplicationMaterialLink: a
      .model({
        materialType: a.enum(['cv', 'coverletter', 'kpiset', 'speech']),

        storyId: a.id().required(),
        story: a.belongsTo('STARStory', 'storyId'),

        materialId: a.string().required(),
      })
      .authorization((allow) => [allow.owner()]),

    // =====================================================
    // 5. INTERVIEW DOMAIN
    // =====================================================

    InterviewQuestionSet: a
      .model({
        behavioralQuestions: a.string().array(),
        technicalQuestions: a.string().array(),
        culturalQuestions: a.string().array(),
        painBasedQuestions: a.string().array(),

        jobId: a.id().required(),
        job: a.belongsTo('JobDescription', 'jobId'),
      })
      .authorization((allow) => [allow.owner()]),

    InterviewSession: a
      .model({
        transcript: a.string(),
        scores: a.json(),
        feedback: a.string(),

        userId: a.id().required(),
        user: a.belongsTo('UserProfile', 'userId'),

        jobId: a.id().required(),
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
  })
  .authorization((allow) => [allow.resource(postConfirmation)]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'identityPool',
  },
});
