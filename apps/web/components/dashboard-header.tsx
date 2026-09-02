import Link from "next/link";
import Image from "next/image";
import { getServerUser } from "@/lib/server-auth";
import { UserMenuDropdown } from "@/components/user-menu-dropdown";
import { NotificationBanner } from "@/components/notification-banner";

/**
 * Server Component Header
 * Pre-renders user profile on the server with zero layout shifts or client flashes
 */
export async function DashboardHeader() {
  const user = await getServerUser();
  const isTrialing = user?.subscriptionStatus === "trialing" || (user && !user.currentPeriodEnd);
  const trialDays = user?.trialDaysRemaining ?? 14;

  return (
    <header className="sticky top-0 z-50 w-full flex flex-col bg-[#1F1F1F] border-b border-white/[0.06]">
      {/* Top Notification Banner for Active Trial */}
      {isTrialing && (
        <NotificationBanner
          message={`You have ${trialDays} ${trialDays === 1 ? "day" : "days"} left in your Solo Plan trial.`}
          linkText="Subscribe now"
          href="/dashboard/settings?tab=billing"
          type="accent"
        />
      )}

      {/* Main Navigation Bar */}
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 transition-opacity hover:opacity-90">
          <Image
            src="/logo.svg"
            alt="Analytika Logo"
            width={36}
            height={36}
            className="w-9 h-9 object-contain"
            priority
          />
          <span className="text-xl font-bold tracking-tight text-white">Analytika</span>
        </Link>

        {/* Right: User Profile Menu (Server hydrated to Client Island) */}
        <UserMenuDropdown initialUser={user} />
      </div>
    </header>
  );
}
