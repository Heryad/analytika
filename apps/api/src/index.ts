import path from "path";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { env } from "@/config/env";
import { testDbConnection } from "@/db";
import { logger } from "@/lib/logger";
import { authRoutes } from "@/routes/auth";
import { websitesRoutes } from "@/routes/websites";
import { plansRoutes } from "@/routes/plans";
import { eventsRoutes } from "@/routes/events";
import { analyticsRoutes } from "@/routes/analytics";
import { milestonesRoutes } from "@/routes/milestones";
import { funnelsRoutes } from "@/routes/funnels";
import { alertsRoutes } from "@/routes/alerts";
import { paymentsRoutes } from "@/routes/payments";
import { billingRoutes } from "@/routes/billing";
import { mcpRoutes } from "@/routes/mcp";
import { initClickHouseSchema, testClickHouseConnection } from "@/db/clickhouse";
import { startLifecycleCron } from "@/services/lifecycle-cron";

const app = new Elysia()
  // 1. CORS Middleware (Public event ingestion from any domain + dashboard sessions)
  .use(
    cors({
      origin: true,
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "X-Website-ID"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    })
  )

  // 2. Interactive Swagger / OpenAPI Documentation
  .use(
    swagger({
      path: "/swagger",
      documentation: {
        info: {
          title: "Analytika API Engine",
          description: "High-performance Privacy-First Web Analytics & Revenue Attribution Backend",
          version: "1.0.0",
        },
        tags: [
          { name: "Auth", description: "Email OTP & OAuth Authentication" },
          { name: "Websites", description: "Website management and tracking configurations" },
          { name: "Events", description: "High-throughput event ingestion" },
          { name: "Revenue", description: "Payment platforms and MRR attribution" },
        ],
      },
    })
  )

  // 3. Request Logging Middleware
  .onRequest(({ request }) => {
    (request as any)._startTime = performance.now();
  })
  .onAfterResponse(({ request, set }) => {
    const start = (request as any)._startTime || performance.now();
    const duration = performance.now() - start;
    const url = new URL(request.url);
    const statusCode = typeof set.status === "number" ? set.status : 200;
    logger.http(request.method, url.pathname, statusCode, duration);
  })

  // 4. Global Error Handling
  .onError(({ code, error, set }) => {
    logger.error(`Unhandled Exception (${code}):`, error);

    if (code === "VALIDATION") {
      set.status = 400;
      return {
        success: false,
        error: "Validation failed. Please check your request parameters.",
        details: error.message,
      };
    }

    if (code === "NOT_FOUND") {
      set.status = 404;
      return {
        success: false,
        error: "Endpoint or resource not found.",
      };
    }

    set.status = 500;
    return {
      success: false,
      error: "Internal server error. Please try again shortly.",
    };
  })

  // 5. Serve Standalone Tracking Script (/a.js & /script.js)
  .get("/a.js", async ({ set }) => {
    try {
      const scriptPath = path.resolve(__dirname, "../../../packages/tracker/dist/a.js");
      const file = Bun.file(scriptPath);
      if (await file.exists()) {
        set.headers["Content-Type"] = "application/javascript; charset=utf-8";
        set.headers["Cache-Control"] = "public, max-age=86400, stale-while-revalidate=604800";
        set.headers["Access-Control-Allow-Origin"] = "*";
        return file;
      }
    } catch { }
    set.status = 404;
    return "// tracker script not found";
  })
  .get("/script.js", async ({ set }) => {
    try {
      const scriptPath = path.resolve(__dirname, "../../../packages/tracker/dist/a.js");
      const file = Bun.file(scriptPath);
      if (await file.exists()) {
        set.headers["Content-Type"] = "application/javascript; charset=utf-8";
        set.headers["Cache-Control"] = "public, max-age=86400, stale-while-revalidate=604800";
        set.headers["Access-Control-Allow-Origin"] = "*";
        return file;
      }
    } catch { }
    set.status = 404;
    return "// tracker script not found";
  })

  // 6. System Health Check Endpoint
  .get("/api/v1/health", async () => {
    const isDbConnected = await testDbConnection();
    const isClickHouseConnected = await testClickHouseConnection();
    return {
      status: isDbConnected && isClickHouseConnected ? "ok" : "degraded",
      service: "analytika-api",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      databases: {
        postgres: isDbConnected ? "connected" : "disconnected",
        clickhouse: isClickHouseConnected ? "connected" : "disconnected",
      },
    };
  })

  // 7. Mount Sub-Routes
  .use(authRoutes)
  .use(websitesRoutes)
  .use(plansRoutes)
  .use(eventsRoutes)
  .use(analyticsRoutes)
  .use(milestonesRoutes)
  .use(funnelsRoutes)
  .use(alertsRoutes)
  .use(paymentsRoutes)
  .use(billingRoutes)
  .use(mcpRoutes)

  // 8. Start Server Listener
  .listen(env.PORT, async ({ hostname, port }) => {
    console.log(`\n=================================================`);
    console.log(`🚀 ANALYTIKA API ENGINE STARTED`);
    console.log(`📍 URL:        http://${hostname}:${port}`);
    console.log(`📚 Swagger:    http://${hostname}:${port}/swagger`);
    console.log(`🏥 Health:     http://${hostname}:${port}/api/v1/health`);
    console.log(`=================================================\n`);

    // Verify DB & ClickHouse on boot
    await testDbConnection();
    await initClickHouseSchema();

    // Start Automated Background Lifecycle Cron Worker
    startLifecycleCron();
  });

export type App = typeof app;
export default app;
