import { Suspense } from "react";
import { getServerUser, getServerBillingStatus, getServerPlans } from "@/lib/server-auth";
import { SettingsClient } from "./settings-client";

/**
 * Server-Side Rendered (SSR) Settings Page
 * Pre-fetches user session, billing status, and plan packages in 0ms before initial render
 */
export default async function SettingsPage() {
  const [initialUser, initialSubscription, initialPlansData] = await Promise.all([
    getServerUser(),
    getServerBillingStatus(),
    getServerPlans(),
  ]);

  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500 text-xs">Loading settings...</div>}>
      <SettingsClient 
        initialUser={initialUser} 
        initialSubscription={initialSubscription}
        initialPlans={initialPlansData?.plans || null}
        initialTiers={initialPlansData?.tiers || []}
      />
    </Suspense>
  );
}
