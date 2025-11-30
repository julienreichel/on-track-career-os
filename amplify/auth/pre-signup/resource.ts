import { defineFunction } from '@aws-amplify/backend';

export const preSignup = defineFunction({
  name: 'pre-signup',
  entry: './handler.ts',
  // AMPLIFY_ENVIRONMENT is automatically set by Amplify Gen 2:
  // - 'sandbox' when running npx ampx sandbox
  // - Branch name when deployed via Amplify Hosting
  // No need to manually configure it here
});
