import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { env } from "@/config/env";
import { testDbConnection } from "@/db";
import { logger } from "@/lib/logger";
import { authRoutes } from "@/routes/auth";

const app = new Elysia()
  // 1. CORS Middleware
  .use(
    cors({
      origin: [
        env.FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:3001",
        "https://analytika.app",
        "https://analytika.dev",
      ],
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

  // 5. System Health Check Endpoint
  .get("/api/v1/health", async () => {
    const isDbConnected = await testDbConnection();
    return {
      status: isDbConnected ? "ok" : "degraded",
      service: "analytika-api",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      databases: {
        postgres: isDbConnected ? "connected" : "disconnected",
      },
    };
  })

  // 6. Mount Sub-Routes
  .use(authRoutes)

  // 7. Start Server Listener
  .listen(env.PORT, async ({ hostname, port }) => {
    console.log(`\n=================================================`);
    console.log(`🚀 ANALYTIKA API ENGINE STARTED`);
    console.log(`📍 URL:        http://${hostname}:${port}`);
    console.log(`📚 Swagger:    http://${hostname}:${port}/swagger`);
    console.log(`🏥 Health:     http://${hostname}:${port}/api/v1/health`);
    console.log(`=================================================\n`);

    // Verify DB on boot
    await testDbConnection();
  });

export type App = typeof app;
export default app;
