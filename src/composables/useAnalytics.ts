/**
 * Analytics composable for tracking user events
 * Provides a type-safe wrapper around PostHog (or any analytics provider)
 */

export type AnalyticsEvent =
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'cv_upload_completed'
  | 'experience_created'
  | 'story_created_from_experience'
  | 'story_created_from_free_text'
  | 'profile_updated'
  | 'canvas_created'
  | 'job_uploaded'
  | 'job_match_computed'
  | 'cv_created'
  | 'cover_letter_created'
  | 'speech_created'
  | 'cv_template_created';

export interface AnalyticsEventProperties {
  [key: string]: string | number | boolean | undefined;
}

export function useAnalytics() {
  const { $posthog } = useNuxtApp();

  /**
   * Capture an analytics event
   * @param event - The event name (typed)
   * @param properties - Optional event properties
   */
  const captureEvent = (event: AnalyticsEvent, properties?: AnalyticsEventProperties) => {
    try {
      const posthogClient = $posthog?.();
      if (posthogClient) {
        posthogClient.capture(event, properties);
      }
    } catch (error) {
      // Silently fail - analytics should never break the app
      console.warn('Analytics capture failed:', error);
    }
  };

  return {
    captureEvent,
  };
}
