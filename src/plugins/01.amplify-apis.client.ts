import {
  fetchAuthSession,
  fetchUserAttributes,
  signIn,
  signOut,
  getCurrentUser,
} from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { defineNuxtPlugin } from 'nuxt/app';

// generate your data client using the Schema from your backend
const client = generateClient<Schema>();

export default defineNuxtPlugin({
  name: 'AmplifyAPIs',
  enforce: 'pre',
  setup() {
    return {
      provide: {
        // You can call the API by via the composable `useNuxtApp()`. For example:
        // `useNuxtApp().$Amplify.Auth.fetchAuthSession()`
        Amplify: {
          Auth: {
            fetchAuthSession,
            fetchUserAttributes,
            getCurrentUser,
            signIn,
            signOut,
          },
          GraphQL: {
            client,
          },
        },
      },
    };
  },
});
