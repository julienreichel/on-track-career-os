import { defineBackend } from '@aws-amplify/backend';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource';
import {
  data,
  parseCvTextFunction,
  extractExperienceBlocksFunction,
  generateStarStoryFunction,
  generateAchievementsAndKpisFunction,
  generatePersonalCanvasFunction,
  generateCvFunction,
  parseJobDescriptionFunction,
  analyzeCompanyInfoFunction,
  generateCompanyCanvasFunction,
  generateMatchingSummaryFunction,
} from './data/resource';
import { deleteUserProfile } from './data/delete-user-profile/resource';
import { storage } from './storage/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  storage,
  parseCvTextFunction,
  extractExperienceBlocksFunction,
  generateStarStoryFunction,
  generateAchievementsAndKpisFunction,
  generatePersonalCanvasFunction,
  generateCvFunction,
  parseJobDescriptionFunction,
  analyzeCompanyInfoFunction,
  generateCompanyCanvasFunction,
  generateMatchingSummaryFunction,
  deleteUserProfile,
});

// Grant Bedrock permissions to AI operation Lambda functions
// Note: Using wildcard to support all Bedrock models (foundation models, inference profiles, cross-region)
backend.parseCvTextFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['bedrock:InvokeModel'],
    resources: ['arn:aws:bedrock:*::foundation-model/*', 'arn:aws:bedrock:*:*:inference-profile/*'],
  })
);

backend.extractExperienceBlocksFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['bedrock:InvokeModel'],
    resources: ['arn:aws:bedrock:*::foundation-model/*', 'arn:aws:bedrock:*:*:inference-profile/*'],
  })
);

backend.generateStarStoryFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['bedrock:InvokeModel'],
    resources: ['arn:aws:bedrock:*::foundation-model/*', 'arn:aws:bedrock:*:*:inference-profile/*'],
  })
);

backend.generateAchievementsAndKpisFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['bedrock:InvokeModel'],
    resources: ['arn:aws:bedrock:*::foundation-model/*', 'arn:aws:bedrock:*:*:inference-profile/*'],
  })
);

backend.generatePersonalCanvasFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['bedrock:InvokeModel'],
    resources: ['arn:aws:bedrock:*::foundation-model/*', 'arn:aws:bedrock:*:*:inference-profile/*'],
  })
);

backend.generateCvFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['bedrock:InvokeModel'],
    resources: ['arn:aws:bedrock:*::foundation-model/*', 'arn:aws:bedrock:*:*:inference-profile/*'],
  })
);

backend.parseJobDescriptionFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['bedrock:InvokeModel'],
    resources: ['arn:aws:bedrock:*::foundation-model/*', 'arn:aws:bedrock:*:*:inference-profile/*'],
  })
);

backend.analyzeCompanyInfoFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['bedrock:InvokeModel'],
    resources: ['arn:aws:bedrock:*::foundation-model/*', 'arn:aws:bedrock:*:*:inference-profile/*'],
  })
);

backend.generateCompanyCanvasFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['bedrock:InvokeModel'],
    resources: ['arn:aws:bedrock:*::foundation-model/*', 'arn:aws:bedrock:*:*:inference-profile/*'],
  })
);

backend.generateMatchingSummaryFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['bedrock:InvokeModel'],
    resources: ['arn:aws:bedrock:*::foundation-model/*', 'arn:aws:bedrock:*:*:inference-profile/*'],
  })
);

// Grant Cognito permissions to delete-user-profile Lambda
backend.deleteUserProfile.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['cognito-idp:AdminDeleteUser'],
    resources: [backend.auth.resources.userPool.userPoolArn],
  })
);

// Grant DynamoDB permissions to delete-user-profile Lambda
backend.deleteUserProfile.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['dynamodb:DeleteItem'],
    resources: [backend.data.resources.tables['UserProfile'].tableArn],
  })
);

// Pass User Pool ID and Table Name to delete-user-profile Lambda
backend.deleteUserProfile.addEnvironment(
  'USER_POOL_ID',
  backend.auth.resources.userPool.userPoolId
);

backend.deleteUserProfile.addEnvironment(
  'USERPROFILE_TABLE_NAME',
  backend.data.resources.tables['UserProfile'].tableName
);
