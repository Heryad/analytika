import { relations } from "drizzle-orm";
import { users, subscriptions, websites, goals, funnels, monthlyUsage } from "./schema";

export const usersRelations = relations(users, ({ one, many }) => ({
  subscription: one(subscriptions, {
    fields: [users.id],
    references: [subscriptions.userId],
  }),
  websites: many(websites),
  monthlyUsages: many(monthlyUsage),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const websitesRelations = relations(websites, ({ one, many }) => ({
  user: one(users, {
    fields: [websites.userId],
    references: [users.id],
  }),
  goals: many(goals),
  funnels: many(funnels),
  monthlyUsages: many(monthlyUsage),
}));

export const goalsRelations = relations(goals, ({ one }) => ({
  website: one(websites, {
    fields: [goals.websiteId],
    references: [websites.id],
  }),
}));

export const funnelsRelations = relations(funnels, ({ one }) => ({
  website: one(websites, {
    fields: [funnels.websiteId],
    references: [websites.id],
  }),
}));

export const monthlyUsageRelations = relations(monthlyUsage, ({ one }) => ({
  user: one(users, {
    fields: [monthlyUsage.userId],
    references: [users.id],
  }),
  website: one(websites, {
    fields: [monthlyUsage.websiteId],
    references: [websites.id],
  }),
}));
