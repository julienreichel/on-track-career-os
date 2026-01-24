import { defineNuxtPlugin } from '#app';
import posthog from 'posthog-js';

export default defineNuxtPlugin((_nuxtApp) => {
  const runtimeConfig = useRuntimeConfig();
  const cfg = useRuntimeConfig().public;

  if (!cfg.posthogPublicKey) return;

  const posthogClient = posthog.init(cfg.posthogPublicKey, {
    api_host: runtimeConfig.public.posthogHost || 'https://app.posthog.com',
    capture_pageview: false, // we do SPA routing ourselves
    loaded: (posthogInstance) => {
      if (import.meta.env.MODE === 'development') posthogInstance.debug();
    },
  });

  const router = useRouter();

  const capturePageview = (path: string) => {
    posthog.capture('$pageview', {
      $current_url: window.location.origin + path,
    });
  };

  // initial page load
  capturePageview(router.currentRoute.value.fullPath);

  // subsequent SPA navigations
  router.afterEach((to) => {
    capturePageview(to.fullPath);
  });

  return {
    provide: {
      posthog: () => posthogClient,
    },
  };
});
