"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, ShieldCheck, BarChart2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { oauthApi, tokenStorage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

function hostnameOf(uri: string | null) {
  if (!uri) return null;
  try {
    return new URL(uri).hostname;
  } catch {
    return uri;
  }
}

function AuthorizeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const requestId = searchParams.get("request") || "";
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const [clientName, setClientName] = useState("AI assistant");
  const [clientUri, setClientUri] = useState<string | null>(null);
  const [redirectHost, setRedirectHost] = useState<string | null>(null);
  const [scope, setScope] = useState("analytika:read");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<"allow" | "deny" | null>(null);
  const [error, setError] = useState<string | null>(errorDescription || errorParam);

  useEffect(() => {
    if (authLoading) return;

    if (!requestId) {
      setLoading(false);
      if (!errorParam) setError("Missing authorization request. Restart the connection from Claude or ChatGPT.");
      return;
    }

    if (!tokenStorage.get() || !isAuthenticated) {
      const returnTo = `/oauth/authorize?request=${encodeURIComponent(requestId)}`;
      router.replace(`/auth/login?redirect=${encodeURIComponent(returnTo)}`);
      return;
    }

    let cancelled = false;
    oauthApi.getRequest(requestId).then((res) => {
      if (cancelled) return;
      if (!res.success || !res.request) {
        setError(res.error || "This authorization request expired. Please reconnect from your AI client.");
        setLoading(false);
        return;
      }
      setClientName(res.request.clientName || "AI assistant");
      setClientUri(res.request.clientUri);
      setRedirectHost(hostnameOf(res.request.redirectUri));
      setScope(res.request.scope || "analytika:read");
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, requestId, router, errorParam]);

  const decide = async (allow: boolean) => {
    if (!requestId || submitting) return;
    setSubmitting(allow ? "allow" : "deny");
    setError(null);
    try {
      const res = await oauthApi.consent(requestId, allow);
      if (res.success && res.redirectUrl) {
        window.location.href = res.redirectUrl;
        return;
      }
      setError(res.error || "Could not complete authorization.");
      setSubmitting(null);
    } catch (err: any) {
      setError(err?.message || "Could not complete authorization.");
      setSubmitting(null);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#1F1F1F] text-zinc-100">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(#800E13_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-30"
        style={{
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 85%)",
        }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md rounded-2xl bg-[#262626] border border-white/[0.08] p-6 space-y-5">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt="Analytika" width={32} height={32} />
          <div>
            <div className="text-sm font-semibold text-white">Connect Analytika</div>
            <div className="text-[11px] text-zinc-500 font-mono">
              {user?.email || "MCP OAuth"}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-zinc-400 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-[#800E13]" />
            Preparing authorization…
          </div>
        ) : error && !requestId ? (
          <div className="rounded-xl bg-[#1F1F1F] border border-rose-500/20 p-4 text-sm text-rose-300 flex gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            {error}
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <h1 className="text-lg font-bold text-white leading-snug">
                {clientName} wants to access your analytics
              </h1>
              <p className="text-xs text-zinc-400">
                This lets the assistant read live visitors, traffic sources, revenue, and page stats for websites on this account. It cannot change settings or delete data.
              </p>
            </div>

            <div className="rounded-xl bg-[#1F1F1F] border border-white/[0.06] p-3.5 space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5 text-zinc-300">
                <BarChart2 className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
                <span>Read analytics, funnels, and revenue attribution</span>
              </div>
              <div className="flex items-start gap-2.5 text-zinc-300">
                <ShieldCheck className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
                <span>Scope: <span className="font-mono text-zinc-200">{scope}</span></span>
              </div>
              {redirectHost && (
                <div className="text-[11px] text-zinc-500 font-mono pt-1 border-t border-white/[0.04]">
                  Redirects back to {redirectHost}
                  {clientUri ? ` · ${hostnameOf(clientUri)}` : ""}
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-300">
                {error}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                disabled={!!submitting}
                onClick={() => decide(false)}
                className="flex-1 border-white/[0.08] hover:bg-[#2d2d2d] text-zinc-300 h-10 rounded-xl text-xs cursor-pointer"
              >
                {submitting === "deny" ? "Denying…" : "Deny"}
              </Button>
              <Button
                type="button"
                disabled={!!submitting}
                onClick={() => decide(true)}
                className="flex-1 bg-[#800E13] hover:bg-[#9e1218] text-white h-10 rounded-xl text-xs cursor-pointer"
              >
                {submitting === "allow" ? "Connecting…" : "Allow access"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function OAuthAuthorizePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#1F1F1F] text-zinc-400">
          <Loader2 className="h-6 w-6 animate-spin text-[#800E13]" />
        </div>
      }
    >
      <AuthorizeContent />
    </Suspense>
  );
}
