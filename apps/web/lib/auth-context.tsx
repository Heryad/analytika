"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authApi, tokenStorage, UserProfile } from "./api";
import { applyTheme, initThemeWatcher } from "./theme";

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (partial: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Synchronous initial hydration from localStorage to prevent auth layout flashes
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const cached = localStorage.getItem("analytika_user");
      const parsed = cached ? JSON.parse(cached) : null;
      if (parsed?.theme) {
        applyTheme(parsed.theme);
      }
      return parsed;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(!user);
  const router = useRouter();

  // Watch system preference changes
  useEffect(() => {
    return initThemeWatcher();
  }, []);

  // Load initial session on mount with network error protection
  const refreshUser = useCallback(async () => {
    const token = tokenStorage.get();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await authApi.getMe();
      if (res.success && res.user) {
        setUser(res.user);
        if (res.user.theme) {
          applyTheme(res.user.theme);
        }
        if (typeof window !== "undefined") {
          localStorage.setItem("analytika_user", JSON.stringify(res.user));
        }
      } else if (res.error?.toLowerCase().includes("unauthorized") || (res as any).status === 401) {
        // ONLY clear session if the server explicitly rejects the token as unauthorized
        tokenStorage.clear();
        setUser(null);
      }
    } catch {
      // Do NOT clear token on transient network hiccups or server restarts!
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Set session on login / register confirm
  const login = (token: string, userProfile: UserProfile) => {
    tokenStorage.set(token);
    setUser(userProfile);
    if (userProfile.theme) {
      applyTheme(userProfile.theme);
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("analytika_user", JSON.stringify(userProfile));
    }
  };

  // Optimistically update local user fields
  const updateUser = useCallback((partial: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...partial };
      if (typeof window !== "undefined") {
        localStorage.setItem("analytika_user", JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  // Logout
  const logout = async () => {
    try {
      await authApi.logout();
    } catch {}
    tokenStorage.clear();
    setUser(null);
    router.push("/auth/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
