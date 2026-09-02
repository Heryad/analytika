import { Elysia, t } from "elysia";
import { ingestEvent, RawIncomingEvent } from "@/services/ingestion";
import { logger } from "@/lib/logger";

const EventPayloadSchema = t.Object({
  website_id: t.String({ minLength: 1 }),
  event_name: t.Optional(t.String()),
  event_value: t.Optional(t.Nullable(t.Number())),
  event_currency: t.Optional(t.Nullable(t.String())),
  hostname: t.Optional(t.String()),
  pathname: t.Optional(t.String()),
  search: t.Optional(t.String()),
  hash: t.Optional(t.String()),
  referrer: t.Optional(t.String()),
  screen_width: t.Optional(t.Number()),
  screen_height: t.Optional(t.Number()),
  user_language: t.Optional(t.String()),
  page_title: t.Optional(t.String()),
  utm_source: t.Optional(t.String()),
  utm_medium: t.Optional(t.String()),
  utm_campaign: t.Optional(t.String()),
  utm_term: t.Optional(t.String()),
  utm_content: t.Optional(t.String()),
  props: t.Optional(t.Record(t.String(), t.Any())),
  properties: t.Optional(t.Record(t.String(), t.Any())),
});

export const eventsRoutes = new Elysia({ prefix: "/api/v1/events" })
  /**
   * High-Throughput Event Ingestion Endpoint
   */
  .post(
    "/",
    async ({ body, headers, request, set }) => {
      try {
        const remoteIp =
          (request as any)?.ip ||
          (request as any)?.socket?.remoteAddress ||
          "127.0.0.1";

        // Handle single event or batch array
        if (Array.isArray(body)) {
          let processed = 0;
          for (const item of body) {
            const res = await ingestEvent(item as RawIncomingEvent, headers, remoteIp);
            if (res.success) processed++;
          }
          return { success: true, processed };
        } else {
          const res = await ingestEvent(body as RawIncomingEvent, headers, remoteIp);
          if (!res.success) {
            set.status = 400;
            return { success: false, error: res.error || "Failed to process event" };
          }
          return { success: true };
        }
      } catch (err: any) {
        logger.error("Event ingestion handler error", { error: err?.message || err });
        set.status = 500;
        return { success: false, error: "Ingestion internal error" };
      }
    },
    {
      body: t.Union([EventPayloadSchema, t.Array(EventPayloadSchema)]),
    }
  );
