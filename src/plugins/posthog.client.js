import { defineNuxtPlugin } from '#app';
import posthog from 'posthog-js';

export default defineNuxtPlugin((nuxtApp) => {
  const runtimeConfig = useRuntimeConfig();
  const cfg = useRuntimeConfig().public;

  if (!cfg.posthogPublicKey) return;

  const posthogClient = posthog.init(cfg.posthogPublicKey, {
    api_host: runtimeConfig.public.posthogHost,
    defaults: runtimeConfig.public.posthogDefaults,
    loaded: (posthog) => {
      if (import.meta.env.MODE === 'development') posthog.debug();
    },
  });

  return {
    provide: {
      posthog: () => posthogClient,
    },
  };
});
