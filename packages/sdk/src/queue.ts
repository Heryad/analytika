import { sendBatch, type BatchPayload } from "./transport";

export interface QueuedEvent {
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
}

export interface QueueConfig {
  apiKey: string;
  endpoint: string;
  batchSize?: number;
  flushIntervalMs?: number;
  debug?: boolean;
}

export class EventQueue {
  private queue: QueuedEvent[] = [];
  private timer: any = null;
  private apiKey: string;
  private endpoint: string;
  private batchSize: number;
  private flushIntervalMs: number;
  private debug: boolean;

  constructor(config: QueueConfig) {
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint.replace(/\/$/, "") + "/v1/batch";
    this.batchSize = config.batchSize || 10;
    this.flushIntervalMs = config.flushIntervalMs || 3000;
    this.debug = !!config.debug;

    this.setupUnloadListeners();
    this.startTimer();
  }

  public enqueue(event: QueuedEvent): void {
    this.queue.push(event);

    if (this.debug) {
      console.log(`[Analytika] Queued event "${event.name}" (${this.queue.length} in queue)`, event);
    }

    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }

  public flush(): void {
    if (this.queue.length === 0) return;

    const eventsToSend = [...this.queue];
    this.queue = [];

    const payload: BatchPayload = {
      apiKey: this.apiKey,
      sentAt: new Date().toISOString(),
      batch: eventsToSend,
    };

    if (this.debug) {
      console.log(`[Analytika] Flushing batch of ${eventsToSend.length} events to ${this.endpoint}`);
    }

    sendBatch(this.endpoint, payload).catch((err) => {
      if (this.debug) {
        console.error("[Analytika] Batch flush failed:", err);
      }
    });
  }

  private startTimer(): void {
    if (typeof window === "undefined") return;
    this.timer = setInterval(() => {
      this.flush();
    }, this.flushIntervalMs);
  }

  private setupUnloadListeners(): void {
    if (typeof window === "undefined") return;

    // Trigger flush on page hide or tab switch (visibility change)
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
          this.flush();
        }
      });
    }

    window.addEventListener("pagehide", () => this.flush());
    window.addEventListener("beforeunload", () => this.flush());
  }

  public destroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.flush();
  }
}
