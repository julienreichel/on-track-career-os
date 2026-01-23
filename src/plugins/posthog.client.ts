import { defineNuxtPlugin } from '#app';
import posthog from 'posthog-js';

export default defineNuxtPlugin((_nuxtApp) => {
  const runtimeConfig = useRuntimeConfig();
  const cfg = useRuntimeConfig().public;

  if (!cfg.posthogPublicKey) return;

  const posthogClient = posthog.init(cfg.posthogPublicKey, {
    api_host: runtimeConfig.public.posthogHost || 'https://app.posthog.com',
    loaded: (posthogInstance) => {
      if (import.meta.env.MODE === 'development') posthogInstance.debug();
    },
  });

  return {
    provide: {
      posthog: () => posthogClient,
    },
  };
});
