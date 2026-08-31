import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { bearer } from "@elysiajs/bearer";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "../db/client";
import { websites, subscriptions } from "../db/schema";

const JWT_SECRET = process.env.JWT_SECRET || "analytika_super_secret_jwt_key_development_only";

export const websiteRoutes = new Elysia({ prefix: "/v1/websites" })
  .use(
    jwt({
      name: "jwt",
      secret: JWT_SECRET,
    })
  )
  .use(bearer())

  // Authentication Middleware Hook
  .derive(async ({ bearer, jwt, set }) => {
    if (!bearer) {
      set.status = 401;
      throw new Error("Missing authorization header");
    }
    const payload = await jwt.verify(bearer);
    if (!payload || !payload.id) {
      set.status = 401;
      throw new Error("Invalid or expired session token");
    }
    return { userId: payload.id as string };
  })

  // 1. List all websites for authenticated user
  .get("/", async ({ userId }) => {
    const userWebsites = await db.query.websites.findMany({
      where: eq(websites.userId, userId),
      with: {
        goals: true,
        funnels: true,
      },
    });

    return {
      success: true,
      websites: userWebsites,
    };
  })

  // 2. Create a new website
  .post(
    "/",
    async ({ userId, body, set }) => {
      // Check user's website limits
      const sub = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, userId),
      });
      const currentSites = await db.query.websites.findMany({
        where: eq(websites.userId, userId),
      });

      const maxLimit = sub?.websiteLimit ?? 1;
      if (currentSites.length >= maxLimit) {
        set.status = 403;
        return {
          success: false,
          error: `Your current plan allows up to ${maxLimit} website(s). Please upgrade to add more.`,
        };
      }

      // Generate unique live API key
      const apiKey = `ana_live_${nanoid(24)}`;
      const cleanDomain = body.domain.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/.*$/, "").toLowerCase();

      const [newWebsite] = await db
        .insert(websites)
        .values({
          userId,
          name: body.name.trim(),
          domain: cleanDomain,
          apiKey,
          allowedOrigins: body.allowedOrigins || [cleanDomain],
          timezone: body.timezone || "UTC",
          isPublic: body.isPublic || false,
        })
        .returning();

      return {
        success: true,
        website: newWebsite,
      };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        domain: t.String({ minLength: 3 }),
        allowedOrigins: t.Optional(t.Array(t.String())),
        timezone: t.Optional(t.String()),
        isPublic: t.Optional(t.Boolean()),
      }),
    }
  )

  // 3. Get single website by ID
  .get("/:id", async ({ userId, params, set }) => {
    const site = await db.query.websites.findFirst({
      where: and(eq(websites.id, params.id), eq(websites.userId, userId)),
      with: {
        goals: true,
        funnels: true,
      },
    });

    if (!site) {
      set.status = 404;
      return { success: false, error: "Website not found" };
    }

    return { success: true, website: site };
  })

  // 4. Update website settings
  .patch(
    "/:id",
    async ({ userId, params, body, set }) => {
      const site = await db.query.websites.findFirst({
        where: and(eq(websites.id, params.id), eq(websites.userId, userId)),
      });

      if (!site) {
        set.status = 404;
        return { success: false, error: "Website not found" };
      }

      const [updated] = await db
        .update(websites)
        .set({
          ...(body.name && { name: body.name }),
          ...(body.domain && { domain: body.domain }),
          ...(body.allowedOrigins && { allowedOrigins: body.allowedOrigins }),
          ...(body.timezone && { timezone: body.timezone }),
          ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
          updatedAt: new Date(),
        })
        .where(eq(websites.id, site.id))
        .returning();

      return { success: true, website: updated };
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        domain: t.Optional(t.String()),
        allowedOrigins: t.Optional(t.Array(t.String())),
        timezone: t.Optional(t.String()),
        isPublic: t.Optional(t.Boolean()),
      }),
    }
  )

  // 5. Delete website
  .delete("/:id", async ({ userId, params, set }) => {
    const site = await db.query.websites.findFirst({
      where: and(eq(websites.id, params.id), eq(websites.userId, userId)),
    });

    if (!site) {
      set.status = 404;
      return { success: false, error: "Website not found" };
    }

    await db.delete(websites).where(eq(websites.id, site.id));

    return { success: true, message: "Website deleted successfully" };
  });
