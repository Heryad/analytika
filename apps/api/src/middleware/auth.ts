import { Elysia } from "elysia";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { eq, gt } from "drizzle-orm";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  theme: "dark" | "light" | "system";
  emailDigest: boolean;
  productAnnouncements: boolean;
  plan: string;
  eventQuota: number;
  maxWebsites: number;
  maxFunnels: number;
  maxAlerts: number;
  hasSocialRadar: boolean;
  mcpApiKey: string | null;
  subscriptionStatus: string;
  trialEndsAt: Date | null;
}

export const authMiddleware = new Elysia({ name: "auth-middleware" })
  .derive({ as: "global" }, async ({ headers }) => {
    const authHeader = headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { user: null as AuthenticatedUser | null };
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      return { user: null };
    }

    try {
      const now = new Date();
      // Query valid active session in PostgreSQL
      const [session] = await db
        .select({
          sessionId: sessions.id,
          userId: sessions.userId,
          expiresAt: sessions.expiresAt,
          user: users,
        })
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(eq(sessions.token, token))
        .limit(1);

      if (!session || session.expiresAt <= now) {
        return { user: null };
      }

      return {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          avatarUrl: session.user.avatarUrl,
          theme: (session.user.theme as any) || "dark",
          emailDigest: session.user.emailDigest ?? true,
          productAnnouncements: session.user.productAnnouncements ?? true,
          plan: session.user.plan,
          eventQuota: session.user.eventQuota,
          maxWebsites: session.user.maxWebsites,
          maxFunnels: session.user.maxFunnels,
          maxAlerts: session.user.maxAlerts,
          hasSocialRadar: session.user.hasSocialRadar,
          mcpApiKey: session.user.mcpApiKey,
          subscriptionStatus: session.user.subscriptionStatus,
          trialEndsAt: session.user.trialEndsAt,
        } as AuthenticatedUser,
      };
    } catch {
      return { user: null };
    }
  });

export const requireAuth = (app: Elysia) =>
  app.use(authMiddleware).onBeforeHandle(({ user, set }) => {
    if (!user) {
      set.status = 401;
      return {
        success: false,
        error: "Unauthorized. Please provide a valid Bearer session token.",
      };
    }
  });
