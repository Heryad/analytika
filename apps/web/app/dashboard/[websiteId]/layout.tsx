import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Website Analytics",
  description: "Live real-time telemetry, revenue attribution, conversion funnels, and social mention radar.",
};

export default function WebsiteAnalyticsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
