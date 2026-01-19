import { computed, getCurrentInstance, onMounted, unref } from 'vue';
import { useUserProgress } from '@/composables/useUserProgress';
import { getGuidance } from '@/domain/onboarding';
import type { GuidanceContext, GuidanceModel, GuidanceRouteKey } from '@/domain/onboarding';

type GuidanceContextSource = GuidanceContext | (() => GuidanceContext);

const isTestEnvironment =
  (typeof process !== 'undefined' && process.env.VITEST === 'true') ||
  (typeof import.meta !== 'undefined' && (import.meta as { vitest?: boolean }).vitest === true);

export function useGuidance(routeKey: GuidanceRouteKey, context: GuidanceContextSource = {}) {
  const progress = useUserProgress();

  if (getCurrentInstance()) {
    onMounted(() => {
      if (!isTestEnvironment) {
        void progress.load();
      }
    });
  } else if (!isTestEnvironment) {
    void progress.load();
  }

  const resolvedContext = computed(() =>
    typeof context === 'function' ? context() : unref(context)
  );

  const guidance = computed<GuidanceModel>(() =>
    getGuidance(routeKey, progress.state.value, resolvedContext.value)
  );

  return {
    guidance,
    loading: progress.loading,
    error: progress.error,
  };
}
