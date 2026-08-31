import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { authRoutes } from "./routes/auth";
import { websiteRoutes } from "./routes/websites";
import { goalRoutes } from "./routes/goals";
import { funnelRoutes } from "./routes/funnels";
import { ingestRoutes } from "./routes/ingest";
import { statsRoutes } from "./routes/stats";
import { billingRoutes } from "./routes/billing";
import { scriptRoute } from "./routes/script";
import { initClickHouse } from "./db/clickhouse";

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";

// Initialize ClickHouse schema asynchronously on startup
initClickHouse().catch((err) => {
  console.warn("⚠️ ClickHouse initial connect skipped (will connect when ready):", err.message);
});

export const app = new Elysia()
  // Global CORS Plugin
  .use(
    cors({
      origin: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
    })
  )

  // Interactive OpenAPI / Swagger Documentation at /swagger
  .use(
    swagger({
      path: "/swagger",
      documentation: {
        info: {
          title: "Analytika API Engine",
          version: "1.0.0",
          description: "High-throughput analytics ingestion, ClickHouse aggregations, Resend OTP auth, and Polar.sh billing",
        },
        tags: [
          { name: "Auth", description: "Passwordless Resend OTP authentication" },
          { name: "Websites", description: "Website & API key management" },
          { name: "Ingest", description: "High-speed event ingestion (SDK batch & Server API)" },
          { name: "Stats", description: "ClickHouse analytics query engine" },
          { name: "Goals", description: "Custom conversion goal tracking" },
          { name: "Funnels", description: "Multi-step conversion funnels" },
          { name: "Billing", description: "Polar.sh checkout and subscription webhooks" },
        ],
      },
    })
  )

  // Health check & Root Info
  .get("/", () => ({
    name: "Analytika API Engine",
    status: "healthy",
    version: "1.0.0",
    docs: "/swagger",
    timestamp: new Date().toISOString(),
  }))
  .get("/health", () => ({ status: "ok" }))

  // Mount Feature Routes
  .use(scriptRoute)
  .use(authRoutes)
  .use(websiteRoutes)
  .use(goalRoutes)
  .use(funnelRoutes)
  .use(ingestRoutes)
  .use(statsRoutes)
  .use(billingRoutes)

  // Start HTTP Server
  .listen({ port: PORT, hostname: HOST }, ({ hostname, port }) => {
    console.log(`
  🚀 Analytika API Engine running at http://${hostname}:${port}
  📖 Interactive Swagger UI: http://${hostname}:${port}/swagger
  📜 CDN Tracking Script:    http://${hostname}:${port}/script.js
    `);
  });
