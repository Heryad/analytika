import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  bigint,
  timestamp,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Users (Holds Profile + Polar Subscription & Pricing Limits)
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  avatarUrl: text("avatar_url"),

  // Account Preferences (matching /dashboard/settings General tab)
  theme: varchar("theme", { length: 20 }).default("dark").notNull(), // 'dark' | 'light' | 'system'
  emailDigest: boolean("email_digest").default(true).notNull(),
  productAnnouncements: boolean("product_announcements").default(true).notNull(),

  // MCP AI Access Key (matching /dashboard/settings MCP tab)
  mcpApiKey: varchar("mcp_api_key", { length: 255 }).unique(),

  // Plan & Pricing Limits (matching PRICING.md Solo vs Growth)
  plan: varchar("plan", { length: 50 }).default("solo").notNull(), // 'solo' | 'growth'
  billingInterval: varchar("billing_interval", { length: 20 }).default("month").notNull(), // 'month' | 'year'
  eventQuota: bigint("event_quota", { mode: "number" }).default(10000).notNull(),
  maxWebsites: integer("max_websites").default(3).notNull(), // 3 (Solo), 25 (Growth)
  maxFunnels: integer("max_funnels").default(3).notNull(), // 3 (Solo), -1 unlimited (Growth)
  maxAlerts: integer("max_alerts").default(3).notNull(), // 3 (Solo), -1 unlimited (Growth)
  hasSocialRadar: boolean("has_social_radar").default(false).notNull(),
  retentionDays: integer("retention_days").default(365).notNull(),

  // Polar.sh Subscription Integration
  polarCustomerId: varchar("polar_customer_id", { length: 255 }),
  polarSubscriptionId: varchar("polar_subscription_id", { length: 255 }),
  subscriptionStatus: varchar("subscription_status", { length: 50 }).default("trialing").notNull(),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 2. OAuth Accounts (Google & GitHub logins)
export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    provider: varchar("provider", { length: 50 }).notNull(), // 'google' | 'github'
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    providerAccountIdx: uniqueIndex("provider_account_idx").on(table.provider, table.providerAccountId),
  })
);

// 3. Email OTP Codes (Two-Step Email Login & Registration)
export const otpCodes = pgTable("otp_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  codeHash: varchar("code_hash", { length: 255 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'login' | 'register'
  name: varchar("name", { length: 255 }), // stored for pending new registrations
  attempts: integer("attempts").default(0).notNull(), // max 5 attempts before expiration
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), // 10 min TTL
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 4. User Sessions
export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 5. Websites (Directly owned by User)
export const websites = pgTable("websites", {
  id: varchar("id", { length: 64 }).primaryKey(), // 'site_9x8a7b...'
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  domain: varchar("domain", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),

  // General Settings
  timezone: varchar("timezone", { length: 100 }).default("UTC").notNull(),
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),

  // Public Sharing
  isPublic: boolean("is_public").default(false).notNull(),
  sharePasswordHash: varchar("share_password_hash", { length: 255 }),

  // Custom Proxy Domain & Dev Options
  customProxyDomain: varchar("custom_proxy_domain", { length: 255 }),
  proxyVerified: boolean("proxy_verified").default(false).notNull(),
  allowLocalhost: boolean("allow_localhost").default(true).notNull(),

  // Filters (Filters Tab)
  ignoreMyVisits: boolean("ignore_my_visits").default(true).notNull(),
  blockedIps: jsonb("blocked_ips").$type<string[]>().default([]).notNull(),
  excludedPaths: jsonb("excluded_paths").$type<string[]>().default([]).notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 6. Payment Integrations (Revenue Tab: Stripe, Polar, Dodo, Paddle, LemonSqueezy)
export const paymentIntegrations = pgTable(
  "payment_integrations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    websiteId: varchar("website_id", { length: 64 })
      .references(() => websites.id, { onDelete: "cascade" })
      .notNull(),
    platform: varchar("platform", { length: 50 }).notNull(), // 'stripe' | 'polar' | 'dodo' | 'paddle' | 'lemonsqueezy'

    // Encrypted API credentials (AES-256-GCM)
    apiKeyEncrypted: text("api_key_encrypted"),
    apiKeyMasked: varchar("api_key_masked", { length: 100 }), // e.g. "rk_live_...93xL"
    storeId: varchar("store_id", { length: 255 }), // Lemon Squeezy Store ID or Paddle Vendor ID
    webhookSecretEncrypted: text("webhook_secret_encrypted"),

    // State & Configuration
    isConnected: boolean("is_connected").default(false).notNull(),
    autoAttribution: boolean("auto_attribution").default(true).notNull(),
    connectedAt: timestamp("connected_at", { withTimezone: true }),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    websitePlatformIdx: uniqueIndex("website_platform_idx").on(table.websiteId, table.platform),
  })
);

// 7. Custom Event Alerts (Alerts Tab: Real-time Email Dispatch)
export const alerts = pgTable("alerts", {
  id: varchar("id", { length: 64 }).primaryKey(), // 'alert_...'
  websiteId: varchar("website_id", { length: 64 })
    .references(() => websites.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  eventId: varchar("event_id", { length: 255 }).notNull(),
  icon: varchar("icon", { length: 50 }).default("zap").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  subjectTemplate: text("subject_template").notNull(),
  bodyTemplate: text("body_template").notNull(),
  lastTriggeredAt: timestamp("last_triggered_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 8. Funnels & Step Sequences (Analytics Funnel Visualizer)
export const funnels = pgTable("funnels", {
  id: varchar("id", { length: 64 }).primaryKey(), // 'f_...'
  websiteId: varchar("website_id", { length: 64 })
    .references(() => websites.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  steps: jsonb("steps").notNull(), // Array of step definitions
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 9. Domain Trial History (Anti-Abuse: Prevents duplicate free trials on the same domain)
export const domainTrialHistory = pgTable(
  "domain_trial_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    domain: varchar("domain", { length: 255 }).notNull().unique(),
    firstUserId: uuid("first_user_id").references(() => users.id, { onDelete: "set null" }),
    trialStartedAt: timestamp("trial_started_at", { withTimezone: true }).defaultNow().notNull(),
    trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }).notNull(),
    isSubscribed: boolean("is_subscribed").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    domainIdx: uniqueIndex("domain_trial_history_domain_idx").on(table.domain),
  })
);

// Relational Definitions
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  websites: many(websites),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const websitesRelations = relations(websites, ({ one, many }) => ({
  user: one(users, { fields: [websites.userId], references: [users.id] }),
  paymentIntegrations: many(paymentIntegrations),
  alerts: many(alerts),
  funnels: many(funnels),
}));

export const paymentIntegrationsRelations = relations(paymentIntegrations, ({ one }) => ({
  website: one(websites, { fields: [paymentIntegrations.websiteId], references: [websites.id] }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  website: one(websites, { fields: [alerts.websiteId], references: [websites.id] }),
}));

export const funnelsRelations = relations(funnels, ({ one }) => ({
  website: one(websites, { fields: [funnels.websiteId], references: [websites.id] }),
}));
