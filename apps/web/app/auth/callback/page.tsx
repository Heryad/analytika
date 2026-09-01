"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { tokenStorage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error) {
      router.push(`/auth/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (token) {
      tokenStorage.set(token);
      refreshUser().then(() => {
        router.push("/dashboard");
      });
    } else {
      router.push("/auth/login");
    }
  }, [searchParams, router, refreshUser]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1F1F1F] text-zinc-100 space-y-4">
      <div className="flex items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-[#800E13]" />
        <span className="text-sm font-medium text-zinc-300">
          Authenticating with Google...
        </span>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#1F1F1F] text-zinc-400">
          <Loader2 className="h-6 w-6 animate-spin text-[#800E13]" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
