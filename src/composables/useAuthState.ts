import { computed, watch } from 'vue';
import type { ComputedRef, Ref } from 'vue';
import { logError } from '@/utils/logError';

type AuthStatus = 'unknown' | 'authenticated' | 'anonymous';

type AuthState = {
  status: Ref<AuthStatus>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  refresh: () => Promise<void>;
  isAuthenticated: ComputedRef<boolean>;
};

const resolveError = (err: unknown) => (err instanceof Error ? err : new Error('Auth session failed'));

export const useAuthState = (): AuthState => {
  const status = useState<AuthStatus>('auth-status', () => 'unknown');
  const loading = useState('auth-loading', () => false);
  const error = useState<Error | null>('auth-error', () => null);

  const waitForRefresh = () =>
    new Promise<void>((resolve) => {
      const stop = watch(loading, (value) => {
        if (!value) {
          stop();
          resolve();
        }
      });
    });

  const refresh = async () => {
    if (!import.meta.client) {
      return;
    }

    if (loading.value) {
      await waitForRefresh();
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const session = await useNuxtApp().$Amplify.Auth.fetchAuthSession();
      status.value = session?.tokens ? 'authenticated' : 'anonymous';
    } catch (err) {
      const resolved = resolveError(err);
      logError('[auth] Failed to resolve auth session', resolved);
      error.value = resolved;
      status.value = 'anonymous';
    } finally {
      loading.value = false;
    }
  };

  if (import.meta.client && status.value === 'unknown' && !loading.value) {
    void refresh();
  }

  const isAuthenticated = computed(() => status.value === 'authenticated');

  return {
    status,
    loading,
    error,
    refresh,
    isAuthenticated,
  };
};
