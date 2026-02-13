import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { postConfirmation } from '../auth/post-confirmation/resource';
import { schemaModels } from './schema/models';
import { schemaTypes } from './schema/types';
import {
  MODEL_ID,
  analyzeCompanyInfoFunction,
  extractExperienceBlocksFunction,
  generateAchievementsAndKpisFunction,
  generateCompanyCanvasFunction,
  generateCoverLetterFunction,
  generateCvFunction,
  evaluateApplicationStrengthFunction,
  generateMatchingSummaryFunction,
  generatePersonalCanvasFunction,
  generateSpeechFunction,
  generateStarStoryFunction,
  parseCvTextFunction,
  parseJobDescriptionFunction,
  schemaLambdas,
} from './schema/lambdas';

export const schema = a
  .schema({
    ...schemaModels,
    ...schemaLambdas,
    ...schemaTypes,
  })
  .authorization((allow) => [allow.resource(postConfirmation)]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'identityPool',
  },
});

export {
  MODEL_ID,
  analyzeCompanyInfoFunction,
  extractExperienceBlocksFunction,
  generateAchievementsAndKpisFunction,
  generateCompanyCanvasFunction,
  generateCoverLetterFunction,
  generateCvFunction,
  evaluateApplicationStrengthFunction,
  generateMatchingSummaryFunction,
  generatePersonalCanvasFunction,
  generateSpeechFunction,
  generateStarStoryFunction,
  parseCvTextFunction,
  parseJobDescriptionFunction,
};
