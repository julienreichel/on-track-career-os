import { defineNuxtRouteMiddleware, navigateTo } from '#app';
import { useAuthState } from '@/composables/useAuthState';
import { AUTHENTICATED_HOME } from '@/utils/authRouting';

export default defineNuxtRouteMiddleware(async (to) => {
  // Only redirect if we're actually on the landing page
  if (to?.path && to.path !== '/') {
    return;
  }

  const auth = useAuthState();
  await auth.refresh();

  if (auth.isAuthenticated.value) {
    return navigateTo(AUTHENTICATED_HOME);
  }
});
