import { defineFunction } from '@aws-amplify/backend';

export const deleteUserProfile = defineFunction({
  name: 'delete-user-profile',
  entry: './handler.ts',
  timeoutSeconds: 30,
});
