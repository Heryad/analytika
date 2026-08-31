"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Mail, ArrowLeft, Loader2 } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const prefillDomain = searchParams.get("domain") || "";

  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Resend Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "otp" && resendCountdown > 0) {
      timer = setTimeout(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    } else if (resendCountdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [step, resendCountdown]);

  // Handle Send Code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep("otp");
      setResendCountdown(30);
      setCanResend(false);
      setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
    }, 600);
  };

  // Handle OTP Input Change with Auto-Advance & Paste
  const handleOtpChange = (index: number, value: string) => {
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

  // Handle OTP Verification
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (typeof window !== "undefined") {
        localStorage.setItem("analytika_user", JSON.stringify({ email }));
      }
      if (prefillDomain) {
        router.push(`/dashboard?domain=${encodeURIComponent(prefillDomain)}`);
      } else {
        router.push("/dashboard");
      }
    }, 700);
  };

  // Google 1-Click Login
  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      if (typeof window !== "undefined") {
        localStorage.setItem("analytika_user", JSON.stringify({ email: "founder@example.com", provider: "google" }));
      }
      if (prefillDomain) {
        router.push(`/dashboard?domain=${encodeURIComponent(prefillDomain)}`);
      } else {
        router.push("/dashboard");
      }
    }, 500);
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
            <span className="text-2xl font-bold tracking-tight text-white">
              Analytika
            </span>
          </Link>

          <div className="space-y-1 pt-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {step === "email" ? "Welcome to Analytika" : "Check your email"}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xs mx-auto">
              {step === "email" 
                ? (prefillDomain 
                    ? `Start your 14-day free trial for ${prefillDomain}` 
                    : "Start your 14-day free trial. Cookieless analytics & revenue tracking, no credit card required.")
                : `We sent a 6-digit verification code to ${email}`}
            </p>
          </div>
        </div>

        {/* Card Body with Unified Spacing */}
        {step === "email" ? (
          <div className="space-y-4">
            
            {/* 1. Email Form */}
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-medium text-zinc-300 block">
                  Email address
                </label>
                
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
                    Sending code...
                  </>
                ) : (
                  <>
                    Continue
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

            {/* 2. Google OAuth at Bottom */}
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
        ) : (
          /* STEP 2: 6-DIGIT OTP WITH MATCHING SPACING */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-medium text-zinc-300 block">
                Verification code
              </label>

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
                  Continue
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
                }}
                className="text-zinc-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer text-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Change email
              </button>

              <button
                type="button"
                disabled={!canResend || isLoading}
                onClick={() => {
                  setCanResend(false);
                  setResendCountdown(30);
                }}
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#171717] text-zinc-400">
        <Loader2 className="h-5 w-5 animate-spin text-[#800E13]" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
