import { defineBackend } from '@aws-amplify/backend';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource';
import {
  data,
  MODEL_ID,
  parseCvTextFunction,
  extractExperienceBlocksFunction,
  generateStarStoryFunction,
} from './data/resource';
import { deleteUserProfile } from './data/delete-user-profile/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  parseCvTextFunction,
  extractExperienceBlocksFunction,
  generateStarStoryFunction,
  deleteUserProfile,
});

// Grant Bedrock permissions to AI operation Lambda functions
backend.parseCvTextFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['bedrock:InvokeModel'],
    resources: [`arn:aws:bedrock:*::foundation-model/${MODEL_ID}`],
  })
);

backend.extractExperienceBlocksFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['bedrock:InvokeModel'],
    resources: [`arn:aws:bedrock:*::foundation-model/${MODEL_ID}`],
  })
);

backend.generateStarStoryFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['bedrock:InvokeModel'],
    resources: [`arn:aws:bedrock:*::foundation-model/${MODEL_ID}`],
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

// Pass User Pool ID to delete-user-profile Lambda
backend.deleteUserProfile.addEnvironment(
  'USER_POOL_ID',
  backend.auth.resources.userPool.userPoolId
);
