import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how Analytika protects your privacy with cookieless, zero-PII web analytics engineered for 100% GDPR, CCPA, and PECR compliance.",
  alternates: {
    canonical: "https://analytika.me/privacy",
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
