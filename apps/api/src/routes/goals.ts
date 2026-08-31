import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { bearer } from "@elysiajs/bearer";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client";
import { websites, goals } from "../db/schema";

const JWT_SECRET = process.env.JWT_SECRET || "analytika_super_secret_jwt_key_development_only";

export const goalRoutes = new Elysia({ prefix: "/v1/websites/:id/goals" })
  .use(
    jwt({
      name: "jwt",
      secret: JWT_SECRET,
    })
  )
  .use(bearer())
  .derive(async ({ bearer, jwt, set, params }) => {
    if (!bearer) {
      set.status = 401;
      throw new Error("Missing authorization header");
    }
    const payload = await jwt.verify(bearer);
    if (!payload || !payload.id) {
      set.status = 401;
      throw new Error("Invalid session token");
    }

    // Verify ownership of the website
    const site = await db.query.websites.findFirst({
      where: and(eq(websites.id, params.id), eq(websites.userId, payload.id as string)),
    });
    if (!site) {
      set.status = 404;
      throw new Error("Website not found");
    }

    return { userId: payload.id as string, website: site };
  })

  // 1. List goals
  .get("/", async ({ website }) => {
    const siteGoals = await db.query.goals.findMany({
      where: eq(goals.websiteId, website.id),
    });

    return { success: true, goals: siteGoals };
  })

  // 2. Create goal
  .post(
    "/",
    async ({ website, body }) => {
      const [newGoal] = await db
        .insert(goals)
        .values({
          websiteId: website.id,
          name: body.name.trim(),
          type: body.type,
          eventName: body.eventName?.trim(),
          targetPath: body.targetPath?.trim(),
          value: body.value ? String(body.value) : null,
        })
        .returning();

      return { success: true, goal: newGoal };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        type: t.Union([t.Literal("event"), t.Literal("pageview"), t.Literal("revenue")]),
        eventName: t.Optional(t.String()),
        targetPath: t.Optional(t.String()),
        value: t.Optional(t.Number()),
      }),
    }
  )

  // 3. Delete goal
  .delete("/:goalId", async ({ website, params, set }) => {
    const goal = await db.query.goals.findFirst({
      where: and(eq(goals.id, params.goalId), eq(goals.websiteId, website.id)),
    });

    if (!goal) {
      set.status = 404;
      return { success: false, error: "Goal not found" };
    }

    await db.delete(goals).where(eq(goals.id, goal.id));
    return { success: true, message: "Goal deleted" };
  });
