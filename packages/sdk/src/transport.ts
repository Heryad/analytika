export interface BatchPayload {
  apiKey: string;
  sentAt: string;
  batch: Array<{
    eventId: string;
    type: "pageview" | "track" | "identify";
    name: string;
    timestamp: string;
    anonymousId: string;
    userId?: string | null;
    sessionId: string;
    context: any;
    properties?: Record<string, any>;
    userTraits?: Record<string, any>;
  }>;
}

export function sendBatch(endpoint: string, payload: BatchPayload): Promise<boolean> {
  const json = JSON.stringify(payload);

  // 1. Try Beacon API first (best for unload and background delivery)
  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    try {
      const blob = new Blob([json], { type: "application/json" });
      const queued = navigator.sendBeacon(endpoint, blob);
      if (queued) return Promise.resolve(true);
    } catch {}
  }

  // 2. Fallback to fetch with keepalive: true
  if (typeof fetch === "function") {
    return fetch(endpoint, {
      method: "POST",
      body: json,
      headers: {
        "Content-Type": "application/json",
      },
      keepalive: true,
      mode: "cors",
    })
      .then((res) => res.ok)
      .catch(() => false);
  }

  // 3. Fallback to standard XMLHttpRequest
  return new Promise((resolve) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", endpoint, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
      xhr.onerror = () => resolve(false);
      xhr.send(json);
    } catch {
      resolve(false);
    }
  });
}
