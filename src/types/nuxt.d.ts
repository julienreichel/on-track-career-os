// Type declarations for Nuxt app extensions

import type { Schema } from '@amplify/data/resource';
import type { generateClient } from 'aws-amplify/data';
import type {
  fetchAuthSession,
  fetchUserAttributes,
  signIn,
  signOut,
  getCurrentUser,
} from 'aws-amplify/auth';

declare module '#app' {
  interface NuxtApp {
    $Amplify: {
      Auth: {
        fetchAuthSession: typeof fetchAuthSession;
        fetchUserAttributes: typeof fetchUserAttributes;
        getCurrentUser: typeof getCurrentUser;
        signIn: typeof signIn;
        signOut: typeof signOut;
      };
      GraphQL: {
        client: ReturnType<typeof generateClient<Schema>>;
      };
    };
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $Amplify: {
      Auth: {
        fetchAuthSession: typeof fetchAuthSession;
        fetchUserAttributes: typeof fetchUserAttributes;
        getCurrentUser: typeof getCurrentUser;
        signIn: typeof signIn;
        signOut: typeof signOut;
      };
      GraphQL: {
        client: ReturnType<typeof generateClient<Schema>>;
      };
    };
  }
}

export {};
