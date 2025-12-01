import { defineFunction } from '@aws-amplify/backend';

export const deleteUserProfile = defineFunction({
  name: 'delete-user-profile',
  timeoutSeconds: 30,
  resourceGroupName: 'data', // Assign to data stack to avoid circular dependency
});
