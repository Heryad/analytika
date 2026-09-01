/**
 * Type-Safe Frontend API Client for Analytika Backend
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  theme: "dark" | "light" | "system";
  emailDigest?: boolean;
  productAnnouncements?: boolean;
  plan: string;
  eventQuota: number;
  maxWebsites: number;
  maxFunnels: number;
  maxAlerts: number;
  hasSocialRadar: boolean;
  mcpApiKey: string | null;
  subscriptionStatus: string;
  trialEndsAt?: string | null;
  websitesCount?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  details?: any;
  data?: T;
  token?: string;
  user?: UserProfile;
  isRegistered?: boolean;
  status?: string;
}

// Session Token Storage
export const tokenStorage = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("analytika_token");
  },
  set(token: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem("analytika_token", token);
    // Also set cookie for SSR / middleware
    document.cookie = `analytika_token=${token}; path=/; max-age=2592000; SameSite=Lax`;
  },
  clear() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("analytika_token");
    localStorage.removeItem("analytika_user");
    document.cookie = "analytika_token=; path=/; max-age=0";
  },
};

/**
 * Base fetch wrapper with automatic token injection
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = tokenStorage.get();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401 && endpoint !== "/api/v1/auth/me") {
        tokenStorage.clear();
      }
      return {
        success: false,
        error: data.error || data.message || `Request failed with status ${res.status}`,
        details: data.details,
      };
    }

    return data;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to connect to Analytika API server.",
    };
  }
}

/**
 * Auth API Endpoints
 */
export const authApi = {
  // Step 1: Check if email exists
  async checkEmail(email: string) {
    return apiFetch<{ isRegistered: boolean }>("/api/v1/auth/check-email", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  // Step 2A: Verify login code for existing user
  async verifyOtp(email: string, code: string) {
    return apiFetch<{ token: string; user: UserProfile }>("/api/v1/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    });
  },

  // Step 2B-1: Request registration code for new user
  async registerRequest(email: string, name?: string) {
    return apiFetch("/api/v1/auth/register-request", {
      method: "POST",
      body: JSON.stringify({ email, name }),
    });
  },

  // Step 2B-2: Confirm registration and activate 14-day Solo trial
  async registerConfirm(email: string, code: string, name?: string) {
    return apiFetch<{ token: string; user: UserProfile }>("/api/v1/auth/register-confirm", {
      method: "POST",
      body: JSON.stringify({ email, code, name }),
    });
  },

  // OAuth Login (Google / GitHub)
  async oauthLogin(params: {
    provider: "google" | "github";
    providerAccountId: string;
    email: string;
    name?: string;
    avatarUrl?: string;
  }) {
    return apiFetch<{ token: string; user: UserProfile }>("/api/v1/auth/oauth", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  // Get current authenticated user
  async getMe() {
    return apiFetch<{ user: UserProfile }>("/api/v1/auth/me", {
      method: "GET",
    });
  },

  // Update profile and preferences
  async updateProfile(data: {
    name?: string;
    theme?: "dark" | "light" | "system";
    emailDigest?: boolean;
    productAnnouncements?: boolean;
  }) {
    return apiFetch<{ user: UserProfile }>("/api/v1/auth/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  // Permanently delete account
  async deleteAccount() {
    return apiFetch<{ message: string }>("/api/v1/auth/me", {
      method: "DELETE",
    });
  },

  // Logout
  async logout() {
    return apiFetch("/api/v1/auth/logout", {
      method: "POST",
    });
  },
};
