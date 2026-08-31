export interface EventContext {
  url: string;
  path: string;
  entryPage?: string;
  referrer: string | null;
  pageTitle: string;
  screen: string;
  userAgent: string;
  utm: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
}

let initialEntryPage: string | undefined = undefined;

export function extractContext(): EventContext {
  if (typeof window === "undefined") {
    return {
      url: "",
      path: "",
      referrer: null,
      pageTitle: "",
      screen: "",
      userAgent: "",
      utm: {},
    };
  }

  const url = window.location.href;
  const path = window.location.pathname || "/";
  const referrer = document.referrer ? document.referrer : null;
  const pageTitle = document.title || "";
  const screen = `${window.screen?.width || 0}x${window.screen?.height || 0}`;
  const userAgent = navigator.userAgent || "";

  if (!initialEntryPage) {
    initialEntryPage = path;
  }

  // Parse UTM parameters from query string
  const utm: EventContext["utm"] = {};
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has("utm_source")) utm.source = params.get("utm_source")!;
    if (params.has("utm_medium")) utm.medium = params.get("utm_medium")!;
    if (params.has("utm_campaign")) utm.campaign = params.get("utm_campaign")!;
    if (params.has("utm_term")) utm.term = params.get("utm_term")!;
    if (params.has("utm_content")) utm.content = params.get("utm_content")!;
  } catch {}

  return {
    url,
    path,
    entryPage: initialEntryPage,
    referrer,
    pageTitle,
    screen,
    userAgent,
    utm,
  };
}
