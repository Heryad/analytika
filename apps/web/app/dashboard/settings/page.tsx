import { Suspense } from "react";
import { getServerUser } from "@/lib/server-auth";
import { SettingsClient } from "./settings-client";

/**
 * Server-Side Rendered (SSR) Settings Page
 * Pre-fetches user session before initial page render
 */
export default async function SettingsPage() {
  const initialUser = await getServerUser();

  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500 text-xs">Loading settings...</div>}>
      <SettingsClient initialUser={initialUser} />
    </Suspense>
  );
}
