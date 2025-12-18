import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'profileMedia',
  access: (allow) => ({
    'profile-photos/{entity_id}/*': [allow.entity('identity').to(['read', 'write', 'delete'])],
  }),
});
