import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in or create your Analytika account to access your privacy-friendly revenue analytics, social mention radar, and live telemetry.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
