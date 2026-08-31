import { describe, expect, it, beforeEach } from "bun:test";
import { SessionManager } from "../src/session";
import { AnalytikaSDK } from "../src/index";

describe("Analytika Client SDK", () => {
  describe("SessionManager", () => {
    let session: SessionManager;

    beforeEach(() => {
      session = new SessionManager();
    });

    it("should generate a valid anonymous UUID", () => {
      const anonId = session.getAnonymousId();
      expect(anonId).toBeDefined();
      expect(anonId.length).toBeGreaterThan(10);
    });

    it("should generate a valid session UUID", () => {
      const sessId = session.getSessionId();
      expect(sessId).toBeDefined();
      expect(sessId.length).toBeGreaterThan(10);
    });

    it("should update userId and traits on identify()", () => {
      expect(session.getUserId()).toBeNull();
      session.identify("user_123", { name: "Alice", plan: "pro" });
      expect(session.getUserId()).toBe("user_123");
      expect(session.getUserTraits()).toEqual({ name: "Alice", plan: "pro" });
    });

    it("should reset user identifiers on reset()", () => {
      session.identify("user_123", { plan: "pro" });
      const oldAnonId = session.getAnonymousId();

      session.reset();
      expect(session.getUserId()).toBeNull();
      expect(session.getUserTraits()).toEqual({});
      expect(session.getAnonymousId()).not.toBe(oldAnonId);
    });
  });

  describe("SDK Singleton & Initialization", () => {
    it("should initialize with custom configuration", () => {
      const sdk = new AnalytikaSDK();
      expect(sdk.hasOptedOut()).toBe(false);

      sdk.optOut();
      expect(sdk.hasOptedOut()).toBe(true);

      sdk.optIn();
      expect(sdk.hasOptedOut()).toBe(false);
    });

    it("should gracefully queue events after init", () => {
      const sdk = new AnalytikaSDK();
      sdk.init({
        apiKey: "ana_live_test_key_12345",
        endpoint: "http://localhost:3000",
        autoPageview: false,
        autoCaptureGoals: false,
      });

      expect(() => {
        sdk.track("button_clicked", { buttonId: "hero_cta" });
        sdk.page("/pricing");
        sdk.identify("usr_456");
        sdk.flush();
      }).not.toThrow();
    });
  });
});
