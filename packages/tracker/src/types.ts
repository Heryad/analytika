/**
 * Analytika Tracker Type Definitions
 */

export interface CustomProperties {
  [key: string]: string | number | boolean | null | undefined;
}

export interface AnalytikaEventOptions {
  value?: number;
  currency?: string;
  props?: CustomProperties;
  [key: string]: any;
}

export interface TrackerConfig {
  websiteId: string;
  endpoint?: string;
  autoTrack?: boolean;
  allowLocalhost?: boolean;
  respectDNT?: boolean;
}

export interface IngestionEventPayload {
  website_id: string;
  event_name: string;
  event_value?: number;
  event_currency?: string;
  hostname: string;
  pathname: string;
  search: string;
  hash: string;
  referrer: string;
  screen_width: number;
  screen_height: number;
  user_language: string;
  page_title: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  props?: Record<string, string>;
}

declare global {
  interface Window {
    analytika?: ((eventName: string, options?: AnalytikaEventOptions | CustomProperties) => void) & {
      q?: any[];
      config?: TrackerConfig;
    };
    ana?: ((eventName: string, options?: AnalytikaEventOptions | CustomProperties) => void) & {
      q?: any[];
      config?: TrackerConfig;
    };
  }
}
