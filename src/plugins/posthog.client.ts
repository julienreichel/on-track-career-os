import { defineNuxtPlugin } from '#app';
import posthog from 'posthog-js';
import { useBreadcrumbMapping } from '@/composables/useBreadcrumbMapping';

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
  const { resolveSegment, isUUID } = useBreadcrumbMapping({});

  // Map route segments to their translated labels (using static mapping to avoid i18n composable issues)
  const getSegmentLabel = (segment: string): string => {
    const segmentMap: Record<string, string> = {
      profile: 'Profile',
      'cv-upload': 'CV Upload',
      experiences: 'Experiences',
      settings: 'Settings',
      jobs: 'Jobs',
      companies: 'Companies',
      applications: 'Applications',
      'cover-letters': 'Cover Letters',
      speech: 'Speech',
      interview: 'Interview',
      cv: 'CV',
      stories: 'Stories',
      canvas: 'Canvas',
      match: 'Matching',
      new: 'New',
      edit: 'Edit',
      print: 'Print',
    };
    return segmentMap[segment] || segment;
  };

  // Generate page name from breadcrumb-style path
  const generatePageName = async (path: string, meta: Record<string, unknown>): Promise<string> => {
    const pathSegments = path.split('/').filter(Boolean);
    const labels: string[] = [];

    // Build breadcrumb labels from path segments
    const parentSegmentOffset = 2;
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      const previousSegment = i > 0 ? pathSegments[i - 1] : undefined;
      const previousParentSegment = i > 1 ? pathSegments[i - parentSegmentOffset] : undefined;

      // Try to resolve ID segments to names first
      if (segment && isUUID(segment)) {
        const resolvedName = await resolveSegment(segment, previousSegment, previousParentSegment);
        if (resolvedName) {
          labels.push(resolvedName);
          continue;
        }
      }

      // Check if this is the last segment and we have a custom breadcrumb label from page meta
      if (i === pathSegments.length - 1 && meta.breadcrumbLabel) {
        labels.push(String(meta.breadcrumbLabel));
        continue;
      }

      // Use the mapped label for the segment
      const label = getSegmentLabel(segment ?? '');
      labels.push(label);
    }

    // Return breadcrumb-style page name, or Home for root
    return labels.length > 0 ? labels.join(' > ') : 'Home';
  };

  const capturePageview = async (path: string, meta: Record<string, unknown>) => {
    const pageName = await generatePageName(path, meta);
    posthog.capture('$pageview', {
      $current_url: window.location.origin + path,
      $pathname: path,
      $page_name: pageName,
    });
  };

  // initial page load
  void capturePageview(router.currentRoute.value.fullPath, router.currentRoute.value.meta);

  // subsequent SPA navigations
  router.afterEach((to) => {
    void capturePageview(to.fullPath, to.meta);
  });

  return {
    provide: {
      posthog: () => posthogClient,
    },
  };
});
