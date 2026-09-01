import { cookies } from "next/headers";
import { UserProfile, API_BASE_URL } from "./api";

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
