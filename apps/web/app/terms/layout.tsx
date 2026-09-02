import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service and Refund Policy for Analytika web analytics, social mention radar, and Remote MCP services.",
  alternates: {
    canonical: "https://analytika.me/terms",
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
