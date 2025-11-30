import { defineFunction } from '@aws-amplify/backend';

export const preSignup = defineFunction({
  name: 'pre-signup',
  entry: './handler.ts',
  environment: {
    // AUTO_CONFIRM_USERS: Control whether to auto-confirm users
    // Set to 'true' for sandbox/dev, 'false' for production
    // Amplify Hosting can override this per branch
    AUTO_CONFIRM_USERS: process.env.AUTO_CONFIRM_USERS ?? 'false', // Default to secure (production) behavior
  },
});
