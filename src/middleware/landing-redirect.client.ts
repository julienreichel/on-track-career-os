import { defineNuxtRouteMiddleware, navigateTo } from '#app';
import { useAuthState } from '@/composables/useAuthState';
import { AUTHENTICATED_HOME } from '@/utils/authRouting';

export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuthState();
  await auth.refresh();

  if (auth.isAuthenticated.value) {
    return navigateTo(AUTHENTICATED_HOME);
  }
});
