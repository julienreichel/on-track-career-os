import { resolveAuthRedirect } from '@/utils/authRouting';
import { useAuthState } from '@/composables/useAuthState';

const isTestEnvironment =
  (typeof process !== 'undefined' && process.env.VITEST === 'true') ||
  (typeof import.meta !== 'undefined' && (import.meta as { vitest?: boolean }).vitest === true);

export default defineNuxtPlugin({
  name: 'AmplifyAuthRedirect',
  enforce: 'pre',
  setup() {
    if (isTestEnvironment || import.meta.server) {
      return;
    }

    addRouteMiddleware(
      'AmplifyAuthMiddleware',
      defineNuxtRouteMiddleware(async (to) => {
        const auth = useAuthState();
        await auth.refresh();
        const redirect = resolveAuthRedirect({
          path: to.path,
          isAuthenticated: auth.isAuthenticated.value,
        });
        if (redirect) {
          return navigateTo(redirect);
        }
      }),
      { global: true }
    );
  },
});
