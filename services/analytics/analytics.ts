/**
 * Analytics abstraction prepared for PostHog (NEXT_PUBLIC_POSTHOG_KEY).
 * Without a key, events are logged to the console in development only.
 */
export type AnalyticsEvent =
  | "search_performed"
  | "provider_viewed"
  | "booking_started"
  | "booking_submitted"
  | "request_submitted"
  | "onboarding_completed"
  | "pricing_plan_selected";

export interface AnalyticsService {
  track(event: AnalyticsEvent, properties?: Record<string, string | number | boolean | null>): void;
}

class ConsoleAnalytics implements AnalyticsService {
  track(event: AnalyticsEvent, properties?: Record<string, string | number | boolean | null>) {
    if (process.env.NODE_ENV === "development") {
      console.debug("[analytics]", event, properties ?? {});
    }
  }
}

let instance: AnalyticsService | null = null;
export function getAnalytics(): AnalyticsService {
  // Integration point: initialise posthog-js with NEXT_PUBLIC_POSTHOG_KEY and wrap posthog.capture here.
  instance ??= new ConsoleAnalytics();
  return instance;
}
