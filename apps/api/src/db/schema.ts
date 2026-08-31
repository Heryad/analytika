import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ============================================================================
// 1. Users Table (User Profile & Social OAuth / Passwordless)
// ============================================================================
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  authProvider: text("auth_provider", { enum: ["email", "google", "github"] }).default("email").notNull(),
  providerId: text("provider_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// 2. OTPs Table (Passwordless Email Auth via Resend)
// ============================================================================
export const otps = pgTable("otps", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  code: text("code").notNull(), // 6-digit numeric OTP
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), // Valid for 10 minutes
  attempts: integer("attempts").default(0).notNull(), // Max 3-5 failed attempts
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("otps_email_idx").on(table.email),
}));

// ============================================================================
// 3. Subscriptions Table (Polar.sh Subscriptions & Plan Quotas)
// ============================================================================
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  plan: text("plan", { enum: ["free", "pro", "business", "enterprise"] }).default("free").notNull(),
  status: text("status", { enum: ["active", "trialing", "past_due", "canceled", "incomplete"] }).default("active").notNull(),
  monthlyEventLimit: integer("monthly_event_limit").default(10000).notNull(), // Free = 10k, Pro = 250k, Business = 1.5M
  websiteLimit: integer("website_limit").default(1).notNull(),               // Free = 1, Pro = 10, Business = unlimited
  polarCustomerId: text("polar_customer_id"),
  polarSubscriptionId: text("polar_subscription_id"),
  polarProductId: text("polar_product_id"),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// 4. Websites Table (Tracked Properties & Client API Keys)
// ============================================================================
export const websites = pgTable("websites", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),                       // e.g. "My SaaS App"
  domain: text("domain").notNull(),                   // e.g. "app.example.com"
  apiKey: text("api_key").notNull().unique(),         // e.g. "ana_live_c1f9..."
  allowedOrigins: text("allowed_origins").array(),    // Domain whitelist for CORS
  isPublic: boolean("is_public").default(false).notNull(), // Shareable dashboard link
  timezone: text("timezone").default("UTC").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  apiKeyIdx: uniqueIndex("websites_api_key_idx").on(table.apiKey),
  userIdIdx: index("websites_user_id_idx").on(table.userId),
}));

// ============================================================================
// 5. Goals Table (Custom Conversion Actions: Signups, Checkouts, Clicks)
// ============================================================================
export const goals = pgTable("goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  websiteId: uuid("website_id").references(() => websites.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),                       // e.g. "Pro Plan Signup"
  type: text("type", { enum: ["event", "pageview", "revenue"] }).notNull(),
  eventName: text("event_name"),                     // e.g. "signup_completed"
  targetPath: text("target_path"),                   // e.g. "/thank-you"
  value: numeric("value"),                           // Optional default monetary value
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  websiteIdx: index("goals_website_idx").on(table.websiteId),
}));

// ============================================================================
// 6. Funnels Table (Conversion Funnel Pipelines)
// ============================================================================
export const funnels = pgTable("funnels", {
  id: uuid("id").primaryKey().defaultRandom(),
  websiteId: uuid("website_id").references(() => websites.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),                       // e.g. "Checkout Drop-off Funnel"
  steps: jsonb("steps").notNull(),                   // Array of [{ name: "Landing", type: "pageview", path: "/" }, ...]
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  websiteIdx: index("funnels_website_idx").on(table.websiteId),
}));

// ============================================================================
// 7. Monthly Usage Table (Quota Enforcement & Fast Billing Counters)
// ============================================================================
export const monthlyUsage = pgTable("monthly_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  websiteId: uuid("website_id").references(() => websites.id, { onDelete: "cascade" }).notNull(),
  yearMonth: text("year_month").notNull(),            // e.g. "2026-08"
  eventCount: integer("event_count").default(0).notNull(),
  pageviewCount: integer("pageview_count").default(0).notNull(),
  customEventCount: integer("custom_event_count").default(0).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userMonthIdx: index("monthly_usage_user_month_idx").on(table.userId, table.yearMonth),
  websiteMonthIdx: uniqueIndex("monthly_usage_website_month_idx").on(table.websiteId, table.yearMonth),
}));
