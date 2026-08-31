// In-memory or localStorage based session & anonymous ID management

const ANON_ID_STORAGE_KEY = "ana_anon_id";
const USER_ID_STORAGE_KEY = "ana_user_id";
const USER_TRAITS_STORAGE_KEY = "ana_user_traits";
const SESSION_ID_STORAGE_KEY = "ana_sess_id";
const SESSION_TIMESTAMP_KEY = "ana_sess_ts";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function safeGetStorage(key: string): string | null {
  try {
    return typeof window !== "undefined" && window.localStorage ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function safeSetStorage(key: string, value: string): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Storage access restricted (e.g. private iframe)
  }
}

function safeRemoveStorage(key: string): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {}
}

export class SessionManager {
  private anonymousId: string;
  private userId: string | null = null;
  private userTraits: Record<string, any> = {};
  private sessionId: string;

  constructor() {
    this.anonymousId = this.getOrInitAnonymousId();
    this.userId = safeGetStorage(USER_ID_STORAGE_KEY);
    const storedTraits = safeGetStorage(USER_TRAITS_STORAGE_KEY);
    if (storedTraits) {
      try {
        this.userTraits = JSON.parse(storedTraits);
      } catch {}
    }
    this.sessionId = this.getOrInitSessionId();
  }

  public getAnonymousId(): string {
    return this.anonymousId;
  }

  public getUserId(): string | null {
    return this.userId;
  }

  public getUserTraits(): Record<string, any> {
    return this.userTraits;
  }

  public getSessionId(): string {
    const now = Date.now();
    const lastActiveStr = safeGetStorage(SESSION_TIMESTAMP_KEY);
    const lastActive = lastActiveStr ? parseInt(lastActiveStr, 10) : 0;

    // If 30 minutes of inactivity has passed, start a new session
    if (now - lastActive > SESSION_TIMEOUT_MS) {
      this.sessionId = generateUUID();
      safeSetStorage(SESSION_ID_STORAGE_KEY, this.sessionId);
    }

    safeSetStorage(SESSION_TIMESTAMP_KEY, now.toString());
    return this.sessionId;
  }

  public identify(userId: string, traits?: Record<string, any>): void {
    this.userId = userId;
    safeSetStorage(USER_ID_STORAGE_KEY, userId);

    if (traits) {
      this.userTraits = { ...this.userTraits, ...traits };
      safeSetStorage(USER_TRAITS_STORAGE_KEY, JSON.stringify(this.userTraits));
    }
  }

  public reset(): void {
    this.userId = null;
    this.userTraits = {};
    safeRemoveStorage(USER_ID_STORAGE_KEY);
    safeRemoveStorage(USER_TRAITS_STORAGE_KEY);
    this.anonymousId = generateUUID();
    safeSetStorage(ANON_ID_STORAGE_KEY, this.anonymousId);
    this.sessionId = generateUUID();
    safeSetStorage(SESSION_ID_STORAGE_KEY, this.sessionId);
  }

  private getOrInitAnonymousId(): string {
    let id = safeGetStorage(ANON_ID_STORAGE_KEY);
    if (!id) {
      id = generateUUID();
      safeSetStorage(ANON_ID_STORAGE_KEY, id);
    }
    return id;
  }

  private getOrInitSessionId(): string {
    let id = safeGetStorage(SESSION_ID_STORAGE_KEY);
    if (!id) {
      id = generateUUID();
      safeSetStorage(SESSION_ID_STORAGE_KEY, id);
    }
    safeSetStorage(SESSION_TIMESTAMP_KEY, Date.now().toString());
    return id;
  }
}
