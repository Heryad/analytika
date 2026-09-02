import { cookies } from "next/headers";
import { UserProfile, Website, WebsiteSnippets, API_BASE_URL } from "./api";

/**
 * Server-Side Authentication Helper for Next.js Server Components
 * Reads cookie directly during SSR to eliminate flash-of-unauthenticated-state
 */
export async function getServerUser(): Promise<UserProfile | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("analytika_token")?.value;

    if (!token) {
      return null;
    }

    const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 0 }, // always fresh SSR
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (data.success && data.user) {
      return data.user as UserProfile;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Server-Side Website Fetcher for Next.js Server Components (SSR)
 * Pre-fetches website settings before initial page render
 */
export async function getServerWebsite(
  websiteId: string
): Promise<{ website: Website; snippets: WebsiteSnippets } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("analytika_token")?.value;

    if (!token) {
      return null;
    }

    const res = await fetch(`${API_BASE_URL}/api/v1/websites/${websiteId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (data.success && data.website) {
      return {
        website: data.website as Website,
        snippets: data.snippets as WebsiteSnippets,
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Server-Side Billing Status Fetcher for SSR
 */
export async function getServerBillingStatus() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("analytika_token")?.value;

    if (!token) return null;

    const res = await fetch(`${API_BASE_URL}/api/v1/billing/status`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.success && data.subscription) {
      return data.subscription;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Server-Side Plans Fetcher for SSR
 */
export async function getServerPlans() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/plans`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.success) {
      return {
        plans: data.plans,
        tiers: data.tiers,
      };
    }

    return null;
  } catch {
    return null;
  }
}
