import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add New Website",
  description: "Connect a new domain to Analytika for cookieless tracking, revenue attribution, and social mention radar.",
};

export default function NewWebsiteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
