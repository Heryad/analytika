import { initAnalytics, trackEvent, trackPageView } from "./tracker";
import { AnalytikaEventOptions, CustomProperties } from "./types";

(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  // 1. Locate current executing script tag to extract data attributes
  const currentScript =
    (document.currentScript as HTMLScriptElement) ||
    (document.querySelector("script[data-website-id]") as HTMLScriptElement) ||
    (document.querySelector("script[data-site-id]") as HTMLScriptElement);

  const websiteId =
    currentScript?.getAttribute("data-website-id") ||
    currentScript?.getAttribute("data-site-id") ||
    window.analytika?.config?.websiteId ||
    window.ana?.config?.websiteId ||
    "";

  if (!websiteId) {
    console.warn("[Analytika] Missing data-website-id attribute on tracking script.");
    return;
  }

  // Derive endpoint URL from script src if on custom proxy domain
  let endpoint = currentScript?.getAttribute("data-endpoint") || "";
  if (!endpoint && currentScript?.src) {
    try {
      const scriptUrl = new URL(currentScript.src);
      endpoint = `${scriptUrl.origin}/api/v1/events`;
    } catch {
      endpoint = "https://api.analytika.me/api/v1/events";
    }
  }

  const allowLocalhost =
    currentScript?.getAttribute("data-allow-localhost") === "true" ||
    currentScript?.getAttribute("data-dev") === "true";

  const respectDNT = currentScript?.getAttribute("data-ignore-dnt") !== "true";

  // 2. Initialize tracking engine
  initAnalytics({
    websiteId,
    endpoint: endpoint || "https://api.analytika.me/api/v1/events",
    autoTrack: true,
    allowLocalhost,
    respectDNT,
  });

  // 3. Global Tracker Dispatcher Function: window.analytika('event_name', { ...props })
  const globalAnalytika = function (
    eventName: string,
    options?: AnalytikaEventOptions | CustomProperties
  ) {
    if (eventName === "pageview") {
      trackPageView();
    } else {
      trackEvent(eventName, options);
    }
  };

  // 4. Replay pre-existing queue if user invoked window.analytika before script finished downloading
  const previousQueue = window.analytika?.q || window.ana?.q || [];
  if (Array.isArray(previousQueue)) {
    for (const item of previousQueue) {
      if (Array.isArray(item)) {
        globalAnalytika(item[0], item[1]);
      }
    }
  }

  // 5. Expose global handles
  (globalAnalytika as any).track = trackEvent;
  (globalAnalytika as any).page = trackPageView;
  window.analytika = globalAnalytika as any;
  window.ana = globalAnalytika as any;
})();
