import { analytika } from "./index";

declare global {
  interface Window {
    analytika?: any;
  }
}

(function autoInit() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  // Find the current script tag
  const currentScript =
    document.currentScript ||
    document.querySelector("script[data-api-key]") ||
    document.querySelector("script[src*='script.js']");

  if (currentScript) {
    const apiKey = currentScript.getAttribute("data-api-key");
    const endpoint = currentScript.getAttribute("data-endpoint") || currentScript.getAttribute("data-api-endpoint");
    const autoPageviewAttr = currentScript.getAttribute("data-auto-pageview");
    const autoGoalsAttr = currentScript.getAttribute("data-auto-goals");
    const debugAttr = currentScript.getAttribute("data-debug");

    if (apiKey) {
      // Derive default endpoint from script src if not explicitly set
      let derivedEndpoint = endpoint;
      if (!derivedEndpoint && (currentScript as HTMLScriptElement).src) {
        try {
          const srcUrl = new URL((currentScript as HTMLScriptElement).src);
          derivedEndpoint = srcUrl.origin;
        } catch {}
      }

      analytika.init({
        apiKey,
        endpoint: derivedEndpoint || undefined,
        autoPageview: autoPageviewAttr !== "false",
        autoCaptureGoals: autoGoalsAttr !== "false",
        debug: debugAttr === "true",
      });
    } else {
      console.warn("[Analytika] Found script tag without data-api-key attribute.");
    }
  }

  // Process any pre-init queued function calls from window.analytika stub
  const previousInstance = window.analytika;
  if (previousInstance && Array.isArray(previousInstance.q)) {
    for (const item of previousInstance.q) {
      if (Array.isArray(item)) {
        const [method, ...args] = item;
        if (typeof (analytika as any)[method] === "function") {
          (analytika as any)[method](...args);
        }
      }
    }
  }

  // Assign global object
  window.analytika = analytika;
})();
