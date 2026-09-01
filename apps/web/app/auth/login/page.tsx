"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Mail, ArrowLeft, Loader2, User, AlertCircle, Sparkles } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  const prefillDomain = searchParams.get("domain") || "";

  // Form State
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [step, setStep] = useState<"email" | "register" | "otp-login" | "otp-register">("email");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Resend Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if ((step === "otp-login" || step === "otp-register") && resendCountdown > 0) {
      timer = setTimeout(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    } else if (resendCountdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [step, resendCountdown]);

  // Step 1: Check Email
  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await authApi.checkEmail(email.trim());

      if (!res.success) {
        setErrorMessage(res.error || "Failed to check email.");
        setIsLoading(false);
        return;
      }

      if (res.isRegistered) {
        // User already registered -> OTP sent via Resend
        setStep("otp-login");
        setResendCountdown(30);
        setCanResend(false);
        setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
      } else {
        // User NOT registered -> Show Registration Form
        setStep("register");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Request Registration OTP
  const handleRegisterRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Please enter your name.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await authApi.registerRequest(email.trim(), name.trim());
      if (res.success) {
        setStep("otp-register");
        setResendCountdown(30);
        setCanResend(false);
        setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
      } else {
        setErrorMessage(res.error || "Failed to send confirmation code.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to request confirmation code.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP Input Change with Auto-Advance & Paste
  const handleOtpChange = (index: number, value: string) => {
    setErrorMessage(null);
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, 6);
      if (pasted.length > 0) {
        const newOtp = [...otp];
        for (let i = 0; i < 6; i++) {
          newOtp[i] = pasted[i] || "";
        }
        setOtp(newOtp);
        const nextFocusIndex = Math.min(pasted.length, 5);
        otpInputsRef.current[nextFocusIndex]?.focus();
      }
      return;
    }

    const digit = value.replace(/\D/g, "");
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  // Handle Backspace
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Handle OTP Verification (Login or Register Confirm)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (step === "otp-login") {
        // Verify Login
        const res = await authApi.verifyOtp(email.trim(), code);
        if (res.success && res.token && res.user) {
          login(res.token, res.user);
          if (prefillDomain) {
            router.push(`/dashboard?domain=${encodeURIComponent(prefillDomain)}`);
          } else {
            router.push("/dashboard");
          }
        } else {
          setErrorMessage(res.error || "Invalid or expired verification code.");
        }
      } else {
        // Confirm Registration
        const res = await authApi.registerConfirm(email.trim(), code, name.trim());
        if (res.success && res.token && res.user) {
          login(res.token, res.user);
          if (prefillDomain) {
            router.push(`/dashboard?domain=${encodeURIComponent(prefillDomain)}`);
          } else {
            router.push("/dashboard");
          }
        } else {
          setErrorMessage(res.error || "Invalid or expired confirmation code.");
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to verify code.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Resend Code
  const handleResendCode = async () => {
    if (!canResend || isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (step === "otp-login") {
        await authApi.checkEmail(email.trim());
      } else {
        await authApi.registerRequest(email.trim(), name.trim());
      }
      setCanResend(false);
      setResendCountdown(30);
    } catch (err: any) {
      setErrorMessage("Failed to resend code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Sync error from query param if redirected back with error
  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError) {
      setErrorMessage(decodeURIComponent(urlError));
    }
  }, [searchParams]);

  // Google 1-Click Login (OAuth 2.0)
  const handleGoogleLogin = () => {
    setIsLoading(true);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    window.location.href = `${apiBase}/api/v1/auth/oauth/google`;
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#1F1F1F] text-zinc-100 selection:bg-[#800E13]/50 overflow-hidden">
      {/* Background Red Accent Dot Grid with Radial Mask */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(#800E13_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-40"
        style={{
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 85%)",
        }}
        aria-hidden="true"
      />

      {/* Ambient Crimson Center Glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#800E13]/15 blur-[130px] rounded-full"
        aria-hidden="true"
      />

      {/* All-in-One Unified Login Card Container */}
      <div className="relative z-10 w-full max-w-[430px] rounded-2xl bg-[#262626]/95 backdrop-blur-md border border-white/[0.08] p-8 sm:p-9 shadow-2xl space-y-6">
        {/* Brand Header Inside Card */}
        <div className="flex flex-col items-center text-center space-y-3">
          <Link href="/" className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <Image
              src="/logo.svg"
              alt="Analytika Logo"
              width={48}
              height={48}
              className="w-12 h-12 object-contain"
              priority
            />
            <span className="text-2xl font-bold tracking-tight text-white">Analytika</span>
          </Link>

          <div className="space-y-1 pt-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {step === "email" && "Welcome to Analytika"}
              {step === "register" && "Create your account"}
              {(step === "otp-login" || step === "otp-register") && "Check your email"}
            </h1>

            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xs mx-auto">
              {step === "email" &&
                (prefillDomain
                  ? `Start your 14-day free trial for ${prefillDomain}`
                  : "Sign in or start your 14-day full Pro trial with zero cookies.")}

              {step === "register" && "New account detected. Enter your name to activate your 14-day Pro trial."}

              {(step === "otp-login" || step === "otp-register") &&
                `We sent a 6-digit verification code to ${email}`}
            </p>
          </div>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <p className="leading-tight">{errorMessage}</p>
          </div>
        )}

        {/* STEP 1: EMAIL INPUT */}
        {step === "email" && (
          <div className="space-y-4">
            <form onSubmit={handleCheckEmail} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-medium text-zinc-300 block">Email address</label>

                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 h-4 w-4 text-zinc-500 pointer-events-none" />
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="pl-10 h-11 bg-[#1F1F1F] border-white/[0.08] text-white placeholder:text-zinc-500 rounded-xl focus-visible:ring-1 focus-visible:ring-[#800E13] focus-visible:border-[#800E13] text-sm"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full h-11 bg-[#800E13] hover:bg-[#9e1218] text-white font-medium text-sm rounded-xl transition-all border border-[#800E13] shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    Continue with Email
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Minimal Divider */}
            <div className="relative flex items-center justify-center pt-1">
              <div className="border-t border-white/[0.06] w-full" />
              <span className="bg-[#262626] px-3 text-[10px] uppercase font-mono tracking-widest text-zinc-500">
                or
              </span>
              <div className="border-t border-white/[0.06] w-full" />
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full h-11 bg-[#1F1F1F] hover:bg-[#2d2d2d] text-zinc-200 hover:text-white border border-white/[0.08] hover:border-white/15 font-medium text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.2-2 .4-2.7L1.6 6.4C.6 8.3 0 10.3 0 12.5s.6 4.2 1.6 6.1l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 17c1.9 3.8 5.8 7 10.4 7z"
                />
              </svg>
              Continue with Google
            </button>
          </div>
        )}

        {/* STEP 2: REGISTRATION FORM FOR NEW USERS */}
        {step === "register" && (
          <form onSubmit={handleRegisterRequest} className="space-y-4">
            <div className="p-3 rounded-xl bg-[#800E13]/10 border border-[#800E13]/25 text-xs text-rose-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Includes 14-day full Pro trial with MRR & Live Maps.</span>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-medium text-zinc-300 block">Your Name</label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 h-4 w-4 text-zinc-500 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  className="pl-10 h-11 bg-[#1F1F1F] border-white/[0.08] text-white placeholder:text-zinc-500 rounded-xl focus-visible:ring-1 focus-visible:ring-[#800E13] focus-visible:border-[#800E13] text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-medium text-zinc-300 block">Email</label>
              <Input
                type="email"
                value={email}
                disabled
                className="h-11 bg-[#181818] border-white/[0.05] text-zinc-400 rounded-xl text-sm"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="w-full h-11 bg-[#800E13] hover:bg-[#9e1218] text-white font-medium text-sm rounded-xl transition-all border border-[#800E13] shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending confirmation code...
                </>
              ) : (
                <>
                  Send Confirmation Code
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            <button
              type="button"
              onClick={() => {
                setStep("email");
                setErrorMessage(null);
              }}
              className="w-full text-center text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer pt-1"
            >
              &larr; Use a different email
            </button>
          </form>
        )}

        {/* STEP 3: 6-DIGIT OTP INPUT (LOGIN OR REGISTRATION) */}
        {(step === "otp-login" || step === "otp-register") && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-medium text-zinc-300 block">Verification code</label>

              {/* 6 Digit Input Grid */}
              <div className="flex items-center justify-between gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otpInputsRef.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-11 h-11 sm:w-12 sm:h-12 text-center font-mono text-lg sm:text-xl font-bold bg-[#181818] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-[#800E13] focus:ring-1 focus:ring-[#800E13] transition-all"
                  />
                ))}
              </div>
            </div>

            {/* Verify Action Button */}
            <Button
              type="submit"
              disabled={isLoading || otp.join("").length < 6}
              className="w-full h-11 bg-[#800E13] hover:bg-[#9e1218] text-white font-medium text-sm rounded-xl transition-all border border-[#800E13] shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  {step === "otp-login" ? "Verify & Sign In" : "Confirm & Activate Trial"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            {/* Back / Resend Actions */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp(["", "", "", "", "", ""]);
                  setErrorMessage(null);
                }}
                className="text-zinc-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer text-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Change email
              </button>

              <button
                type="button"
                disabled={!canResend || isLoading}
                onClick={handleResendCode}
                className={`${
                  canResend
                    ? "text-rose-400 hover:text-rose-300 cursor-pointer font-medium"
                    : "text-zinc-600 cursor-not-allowed font-mono"
                } transition-colors text-xs`}
              >
                {canResend ? "Resend code" : `Resend in ${resendCountdown}s`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#171717] text-zinc-400">
          <Loader2 className="h-5 w-5 animate-spin text-[#800E13]" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
