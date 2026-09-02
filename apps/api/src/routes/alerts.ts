import { Elysia, t } from "elysia";
import { db } from "@/db";
import { alerts, websites } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "@/middleware/auth";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";
import { sendAlertEmail } from "@/services/resend";

export const alertsRoutes = new Elysia({ prefix: "/api/v1" })
  .use(authMiddleware)

  /**
   * 1. List All Alerts for a Website
   */
  .get("/websites/:id/alerts", async ({ params: { id: websiteId }, user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }

    try {
      const [site] = await db
        .select()
        .from(websites)
        .where(and(eq(websites.id, websiteId), eq(websites.userId, user.id)))
        .limit(1);

      if (!site) {
        set.status = 404;
        return { success: false, error: "Website not found" };
      }

      const websiteAlerts = await db
        .select()
        .from(alerts)
        .where(eq(alerts.websiteId, websiteId));

      return {
        success: true,
        alerts: websiteAlerts.map((a) => ({
          id: a.id,
          websiteId: a.websiteId,
          name: a.name,
          eventId: a.eventId,
          icon: a.icon,
          enabled: a.enabled,
          subject: a.subjectTemplate,
          body: a.bodyTemplate,
          lastTriggered: a.lastTriggeredAt
            ? new Date(a.lastTriggeredAt).toLocaleString()
            : undefined,
          createdAt: a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "Recently",
        })),
      };
    } catch (error: any) {
      logger.error("Error fetching alerts:", error);
      set.status = 500;
      return { success: false, error: "Failed to fetch alerts." };
    }
  })

  /**
   * 2. Create a New Alert for a Website
   */
  .post(
    "/websites/:id/alerts",
    async ({ params: { id: websiteId }, body, user, set }) => {
      if (!user) {
        set.status = 401;
        return { success: false, error: "Unauthorized" };
      }

      try {
        const [site] = await db
          .select()
          .from(websites)
          .where(and(eq(websites.id, websiteId), eq(websites.userId, user.id)))
          .limit(1);

        if (!site) {
          set.status = 404;
          return { success: false, error: "Website not found" };
        }

        const alertId = `alert_${nanoid(16)}`;

        const [createdAlert] = await db
          .insert(alerts)
          .values({
            id: alertId,
            websiteId,
            name: body.name.trim(),
            eventId: body.eventId.trim(),
            icon: body.icon || "zap",
            enabled: body.enabled !== undefined ? body.enabled : true,
            subjectTemplate: body.subject.trim(),
            bodyTemplate: body.body.trim(),
          })
          .returning();

        logger.success(`Alert created: "${createdAlert.name}" (${alertId}) for site: ${websiteId}`);

        return {
          success: true,
          alert: {
            id: createdAlert.id,
            websiteId: createdAlert.websiteId,
            name: createdAlert.name,
            eventId: createdAlert.eventId,
            icon: createdAlert.icon,
            enabled: createdAlert.enabled,
            subject: createdAlert.subjectTemplate,
            body: createdAlert.bodyTemplate,
            createdAt: "Just now",
          },
        };
      } catch (error: any) {
        logger.error("Error creating alert:", error);
        set.status = 500;
        return { success: false, error: "Failed to create alert." };
      }
    },
    {
      body: t.Object({
        name: t.String(),
        eventId: t.String(),
        icon: t.Optional(t.String()),
        enabled: t.Optional(t.Boolean()),
        subject: t.String(),
        body: t.String(),
      }),
    }
  )

  /**
   * 3. Update / Toggle an Alert
   */
  .patch(
    "/alerts/:id",
    async ({ params: { id: alertId }, body, user, set }) => {
      if (!user) {
        set.status = 401;
        return { success: false, error: "Unauthorized" };
      }

      try {
        // Verify user owns the website associated with the alert
        const [existing] = await db
          .select({
            alert: alerts,
            site: websites,
          })
          .from(alerts)
          .innerJoin(websites, eq(alerts.websiteId, websites.id))
          .where(and(eq(alerts.id, alertId), eq(websites.userId, user.id)))
          .limit(1);

        if (!existing) {
          set.status = 404;
          return { success: false, error: "Alert not found or unauthorized" };
        }

        const updates: Partial<typeof alerts.$inferInsert> = {
          updatedAt: new Date(),
        };

        if (body.name !== undefined) updates.name = body.name.trim();
        if (body.eventId !== undefined) updates.eventId = body.eventId.trim();
        if (body.icon !== undefined) updates.icon = body.icon;
        if (body.enabled !== undefined) updates.enabled = body.enabled;
        if (body.subject !== undefined) updates.subjectTemplate = body.subject.trim();
        if (body.body !== undefined) updates.bodyTemplate = body.body.trim();

        const [updatedAlert] = await db
          .update(alerts)
          .set(updates)
          .where(eq(alerts.id, alertId))
          .returning();

        return {
          success: true,
          alert: {
            id: updatedAlert.id,
            websiteId: updatedAlert.websiteId,
            name: updatedAlert.name,
            eventId: updatedAlert.eventId,
            icon: updatedAlert.icon,
            enabled: updatedAlert.enabled,
            subject: updatedAlert.subjectTemplate,
            body: updatedAlert.bodyTemplate,
            lastTriggered: updatedAlert.lastTriggeredAt
              ? new Date(updatedAlert.lastTriggeredAt).toLocaleString()
              : undefined,
            createdAt: updatedAlert.createdAt
              ? new Date(updatedAlert.createdAt).toLocaleDateString()
              : "Recently",
          },
        };
      } catch (error: any) {
        logger.error("Error updating alert:", error);
        set.status = 500;
        return { success: false, error: "Failed to update alert." };
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        eventId: t.Optional(t.String()),
        icon: t.Optional(t.String()),
        enabled: t.Optional(t.Boolean()),
        subject: t.Optional(t.String()),
        body: t.Optional(t.String()),
      }),
    }
  )

  /**
   * 4. Delete an Alert
   */
  .delete("/alerts/:id", async ({ params: { id: alertId }, user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }

    try {
      const [existing] = await db
        .select({
          alert: alerts,
          site: websites,
        })
        .from(alerts)
        .innerJoin(websites, eq(alerts.websiteId, websites.id))
        .where(and(eq(alerts.id, alertId), eq(websites.userId, user.id)))
        .limit(1);

      if (!existing) {
        set.status = 404;
        return { success: false, error: "Alert not found or unauthorized" };
      }

      await db.delete(alerts).where(eq(alerts.id, alertId));

      logger.success(`Alert deleted: ${alertId}`);

      return {
        success: true,
        message: "Alert deleted successfully",
      };
    } catch (error: any) {
      logger.error("Error deleting alert:", error);
      set.status = 500;
      return { success: false, error: "Failed to delete alert." };
    }
  })

  /**
   * 5. Send Test Alert Email
   */
  .post(
    "/alerts/test",
    async ({ body, user, set }) => {
      if (!user) {
        set.status = 401;
        return { success: false, error: "Unauthorized" };
      }

      try {
        const subject = body.subject || "Test Custom Event Alert";
        const emailBody = body.body || "This is a test notification from your custom event alert rule.";
        const alertName = body.name || "Test Alert";
        const eventName = body.eventId || "custom_event";
        const websiteDomain = body.domain || "yourdomain.com";

        logger.info(`Dispatching test alert email via Resend to ${user.email}: "${subject}"`);

        const emailRes = await sendAlertEmail(user.email, {
          alertName,
          eventName,
          websiteDomain,
          subject,
          customBody: emailBody,
          metadata: {
            visitorName: "Alex Morgan",
            visitorEmail: "alex.morgan@acme.com",
            location: "San Francisco, United States",
            source: "google / cpc (summer_launch_2026)",
            device: "Chrome 128.0 on macOS Sequoia",
            timestamp: new Date().toUTCString(),
          },
          dashboardUrl: `https://analytika.me/dashboard`,
        });

        if (!emailRes.success) {
          logger.error(`Resend dispatch error: ${emailRes.error}`);
          set.status = 500;
          return {
            success: false,
            error: emailRes.error || "Failed to send test email via Resend.",
          };
        }

        return {
          success: true,
          message: `Test alert email sent to ${user.email}`,
        };
      } catch (err: any) {
        logger.error("Error sending test alert:", err);
        set.status = 500;
        return { success: false, error: "Failed to send test alert." };
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        eventId: t.Optional(t.String()),
        domain: t.Optional(t.String()),
        subject: t.String(),
        body: t.String(),
      }),
    }
  );
