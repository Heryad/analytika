import { Elysia } from "elysia";
import { PLANS, VOLUME_TIERS } from "@/config/plans";

export const plansRoutes = new Elysia({ prefix: "/api/v1/plans" })
  /**
   * 1. Get All Plans & Volume Pricing Tiers (Public)
   */
  .get("/", () => {
    return {
      success: true,
      plans: PLANS,
      tiers: VOLUME_TIERS,
    };
  });
