import { SessionManager } from "./session";
import { extractContext } from "./context";
import { EventQueue, type QueuedEvent } from "./queue";
import { initSpaRouter, initHtmlAutoCapture } from "./auto-capture";

export interface AnalytikaConfig {
  apiKey: string;
  endpoint?: string;
  autoPageview?: boolean;
  autoCaptureGoals?: boolean;
  batchSize?: number;
  flushIntervalMs?: number;
  debug?: boolean;
}

export class AnalytikaSDK {
  private config: AnalytikaConfig | null = null;
  private session: SessionManager;
  private queue: EventQueue | null = null;
  private isInitialized = false;
  private optedOut = false;
  private cleanupSpa: (() => void) | null = null;
  private cleanupGoals: (() => void) | null = null;

  constructor() {
    this.session = new SessionManager();
  }

  public init(config: AnalytikaConfig): AnalytikaSDK {
    if (this.isInitialized) {
      if (config.debug) console.warn("[Analytika] Already initialized");
      return this;
    }

    this.config = {
      endpoint: "http://localhost:3000",
      autoPageview: true,
      autoCaptureGoals: true,
      batchSize: 10,
      flushIntervalMs: 3000,
      debug: false,
      ...config,
    };

    this.queue = new EventQueue({
      apiKey: this.config.apiKey,
      endpoint: this.config.endpoint!,
      batchSize: this.config.batchSize,
      flushIntervalMs: this.config.flushIntervalMs,
      debug: this.config.debug,
    });

    this.isInitialized = true;

    if (this.config.debug) {
      console.log(`[Analytika] Initialized for API key: ${this.config.apiKey} -> Endpoint: ${this.config.endpoint}`);
    }

    // Auto Pageview on initialization
    if (this.config.autoPageview && typeof window !== "undefined") {
      this.page();

      // Hook SPA Navigation
      this.cleanupSpa = initSpaRouter(() => {
        this.page();
      });
    }

    // Auto Goal Capture for [data-goal]
    if (this.config.autoCaptureGoals && typeof document !== "undefined") {
      this.cleanupGoals = initHtmlAutoCapture((goalName, props) => {
        this.track(goalName, props);
      });
    }

    return this;
  }

  public track(eventName: string, properties: Record<string, any> = {}): void {
    if (!this.canSend()) return;

    const event: QueuedEvent = {
      eventId: crypto.randomUUID(),
      type: "track",
      name: eventName,
      timestamp: new Date().toISOString(),
      anonymousId: this.session.getAnonymousId(),
      userId: this.session.getUserId(),
      sessionId: this.session.getSessionId(),
      context: extractContext(),
      properties,
      userTraits: this.session.getUserTraits(),
    };

    this.queue?.enqueue(event);
  }

  public page(path?: string, properties: Record<string, any> = {}): void {
    if (!this.canSend()) return;

    const context = extractContext();
    if (path) {
      context.path = path;
    }

    const event: QueuedEvent = {
      eventId: crypto.randomUUID(),
      type: "pageview",
      name: "pageview",
      timestamp: new Date().toISOString(),
      anonymousId: this.session.getAnonymousId(),
      userId: this.session.getUserId(),
      sessionId: this.session.getSessionId(),
      context,
      properties,
      userTraits: this.session.getUserTraits(),
    };

    this.queue?.enqueue(event);
  }

  public identify(userId: string, traits: Record<string, any> = {}): void {
    this.session.identify(userId, traits);

    if (!this.canSend()) return;

    const event: QueuedEvent = {
      eventId: crypto.randomUUID(),
      type: "identify",
      name: "identify",
      timestamp: new Date().toISOString(),
      anonymousId: this.session.getAnonymousId(),
      userId: userId,
      sessionId: this.session.getSessionId(),
      context: extractContext(),
      properties: {},
      userTraits: this.session.getUserTraits(),
    };

    this.queue?.enqueue(event);
  }

  public reset(): void {
    this.session.reset();
  }

  public flush(): void {
    this.queue?.flush();
  }

  public optOut(): void {
    this.optedOut = true;
  }

  public optIn(): void {
    this.optedOut = false;
  }

  public hasOptedOut(): boolean {
    return this.optedOut;
  }

  private canSend(): boolean {
    if (this.optedOut) return false;
    if (!this.isInitialized || !this.queue) {
      console.warn("[Analytika] SDK called before init(). Call analytika.init({ apiKey: '...' }) first.");
      return false;
    }
    return true;
  }
}

// Singleton Instance
export const analytika = new AnalytikaSDK();

// Standalone Helper functions
export const init = (config: AnalytikaConfig) => analytika.init(config);
export const track = (name: string, properties?: Record<string, any>) => analytika.track(name, properties);
export const page = (path?: string, properties?: Record<string, any>) => analytika.page(path, properties);
export const identify = (userId: string, traits?: Record<string, any>) => analytika.identify(userId, traits);
export const reset = () => analytika.reset();
export const flush = () => analytika.flush();

export default analytika;
