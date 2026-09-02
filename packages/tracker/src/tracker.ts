import {
  TrackerConfig,
  AnalytikaEventOptions,
  CustomProperties,
  IngestionEventPayload,
} from "./types";

let currentConfig: TrackerConfig | null = null;
let lastTrackedPath: string = "";
let isInitialized = false;

/**
 * Checks if current hostname is a local development environment
 */
function isLocalhost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.endsWith(".local") ||
    host.endsWith(".localhost") ||
    host.endsWith(".test")
  );
}

/**
 * Checks if user has enabled Do-Not-Track in browser
 */
function isDNT(): boolean {
  if (typeof window === "undefined") return false;
  return (
    navigator.doNotTrack === "1" ||
    (window as any).doNotTrack === "1" ||
    (navigator as any).msDoNotTrack === "1"
  );
}

/**
 * Parses UTM campaign parameters from URL
 */
function getUtmParams(): {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
} {
  if (typeof window === "undefined") return {};
  try {
    const params = new URLSearchParams(window.location.search);
    const utms: Record<string, string> = {};

    const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
    for (const key of keys) {
      const val = params.get(key);
      if (val) utms[key] = val;
    }
    return utms;
  } catch {
    return {};
  }
}

/**
 * Normalizes custom properties to a string dictionary for ClickHouse Map(String, String)
 */
function normalizeProps(
  input?: CustomProperties | AnalytikaEventOptions
): {
  event_value?: number;
  event_currency?: string;
  props?: Record<string, string>;
} {
  if (!input) return {};

  let event_value: number | undefined;
  let event_currency: string | undefined;
  const props: Record<string, string> = {};

  const source = (input.props && typeof input.props === "object" ? input.props : input) as Record<string, any>;

  for (const [key, val] of Object.entries(source)) {
    if (val === undefined || val === null) continue;

    if (key === "value" && typeof val === "number") {
      event_value = val;
      continue;
    }
    if (key === "currency" && typeof val === "string") {
      event_currency = val.toUpperCase().slice(0, 5);
      continue;
    }
    if (key === "props" && typeof val === "object") {
      continue;
    }

    if (typeof val === "object") {
      try {
        props[key] = JSON.stringify(val);
      } catch {
        props[key] = String(val);
      }
    } else {
      props[key] = String(val);
    }
  }

  // Check top-level value / currency if provided on options
  if (typeof (input as any).value === "number") event_value = (input as any).value;
  if (typeof (input as any).currency === "string") event_currency = (input as any).currency.toUpperCase().slice(0, 5);

  return {
    event_value,
    event_currency,
    props: Object.keys(props).length > 0 ? props : undefined,
  };
}

/**
 * Sends event payload to Analytika Ingestion API
 */
function sendEvent(payload: IngestionEventPayload): void {
  if (!currentConfig) return;

  // 1. Dev & Privacy Safeguards
  if (!currentConfig.allowLocalhost && isLocalhost()) {
    console.debug("[Analytika] Event ignored (localhost dev environment):", payload);
    return;
  }

  // Check if visitor has set own visits exclusion cookie or localStorage
  try {
    if (
      typeof window !== "undefined" &&
      (window.localStorage?.getItem("analytika_ignore") === "true" ||
        document.cookie?.includes("analytika_ignore=true"))
    ) {
      console.debug("[Analytika] Event ignored (Exclude My Own Visits enabled)");
      return;
    }
  } catch {}

  if (currentConfig.respectDNT && isDNT()) {
    return;
  }

  const endpoint = currentConfig.endpoint || "https://api.analytika.me/api/v1/events";
  const jsonString = JSON.stringify(payload);

  // 2. High-speed delivery: navigator.sendBeacon
  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    try {
      const blob = new Blob([jsonString], { type: "application/json" });
      const sent = navigator.sendBeacon(endpoint, blob);
      if (sent) return;
    } catch {
      // fallback to fetch
    }
  }

  // 3. Fallback: fetch with keepalive
  if (typeof fetch === "function") {
    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: jsonString,
      keepalive: true,
      credentials: "omit",
      mode: "cors",
    }).catch(() => {
      // fail silently
    });
  }
}

/**
 * Tracks a pageview event
 */
export function trackPageView(customPath?: string): void {
  if (typeof window === "undefined" || !currentConfig) return;

  const pathname = customPath || window.location.pathname || "/";
  const search = window.location.search || "";
  const currentFull = pathname + search;

  // Avoid duplicate rapid triggers
  if (currentFull === lastTrackedPath) return;
  lastTrackedPath = currentFull;

  const utms = getUtmParams();

  const payload: IngestionEventPayload = {
    website_id: currentConfig.websiteId,
    event_name: "pageview",
    hostname: window.location.hostname,
    pathname,
    search,
    hash: window.location.hash || "",
    referrer: document.referrer || "",
    screen_width: window.screen?.width || window.innerWidth || 0,
    screen_height: window.screen?.height || window.innerHeight || 0,
    user_language: navigator.language || "en",
    page_title: document.title || "",
    ...utms,
  };

  sendEvent(payload);
}

/**
 * Tracks a custom event with arbitrary metadata
 */
export function trackEvent(
  eventName: string,
  options?: AnalytikaEventOptions | CustomProperties
): void {
  if (typeof window === "undefined" || !currentConfig || !eventName) return;

  const utms = getUtmParams();
  const { event_value, event_currency, props } = normalizeProps(options);

  const payload: IngestionEventPayload = {
    website_id: currentConfig.websiteId,
    event_name: eventName.trim(),
    event_value,
    event_currency,
    hostname: window.location.hostname,
    pathname: window.location.pathname || "/",
    search: window.location.search || "",
    hash: window.location.hash || "",
    referrer: document.referrer || "",
    screen_width: window.screen?.width || window.innerWidth || 0,
    screen_height: window.screen?.height || window.innerHeight || 0,
    user_language: navigator.language || "en",
    page_title: document.title || "",
    ...utms,
    props,
  };

  sendEvent(payload);
}

/**
 * Declarative DOM Click Listener for data-analytika-event
 */
function initDeclarativeClicks(): void {
  if (typeof document === "undefined") return;

  document.addEventListener(
    "click",
    (e: MouseEvent) => {
      let target = e.target as HTMLElement | null;

      // Check up to 5 levels of parent elements
      let depth = 0;
      while (target && target !== document.body && depth < 5) {
        const eventName =
          target.getAttribute("data-analytika-event") ||
          target.getAttribute("data-ana-event");

        if (eventName) {
          const props: Record<string, string> = {};
          let value: number | undefined;
          let currency: string | undefined;

          // Read all data-analytika-prop-* or data-prop-* attributes
          for (const attr of Array.from(target.attributes)) {
            if (attr.name.startsWith("data-analytika-prop-")) {
              const propKey = attr.name.replace("data-analytika-prop-", "");
              props[propKey] = attr.value;
            } else if (attr.name.startsWith("data-prop-")) {
              const propKey = attr.name.replace("data-prop-", "");
              props[propKey] = attr.value;
            } else if (attr.name === "data-analytika-value" || attr.name === "data-value") {
              const parsedVal = parseFloat(attr.value);
              if (!isNaN(parsedVal)) value = parsedVal;
            } else if (attr.name === "data-analytika-currency" || attr.name === "data-currency") {
              currency = attr.value;
            }
          }

          trackEvent(eventName, {
            value,
            currency,
            props: Object.keys(props).length > 0 ? props : undefined,
          });
          break;
        }

        target = target.parentElement;
        depth++;
      }
    },
    { passive: true }
  );
}

/**
 * Initializes Single Page Application (SPA) navigation listeners
 */
function initAutoTracking(): void {
  if (typeof window === "undefined" || isInitialized) return;
  isInitialized = true;

  // 1. Initial Pageview
  if (document.readyState === "complete" || document.readyState === "interactive") {
    trackPageView();
  } else {
    window.addEventListener("DOMContentLoaded", () => trackPageView(), { once: true });
  }

  // 2. Intercept History API (pushState & replaceState for Next.js, React, Vue, Svelte)
  const originalPushState = history.pushState;
  if (originalPushState) {
    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      setTimeout(() => trackPageView(), 20);
    };
  }

  const originalReplaceState = history.replaceState;
  if (originalReplaceState) {
    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      setTimeout(() => trackPageView(), 20);
    };
  }

  // 3. Listen to browser Back/Forward (popstate) & Hash changes
  window.addEventListener("popstate", () => setTimeout(() => trackPageView(), 20), { passive: true });
  window.addEventListener("hashchange", () => setTimeout(() => trackPageView(), 20), { passive: true });

  // 4. Declarative HTML clicks
  initDeclarativeClicks();
}

/**
 * Initializes the Analytika Tracking Engine
 */
export function initAnalytics(config: TrackerConfig): void {
  if (!config || !config.websiteId) {
    console.warn("[Analytika] websiteId is required to initialize analytics.");
    return;
  }

  currentConfig = {
    autoTrack: true,
    allowLocalhost: false,
    respectDNT: true,
    ...config,
  };

  if (currentConfig.autoTrack) {
    initAutoTracking();
  }
}
