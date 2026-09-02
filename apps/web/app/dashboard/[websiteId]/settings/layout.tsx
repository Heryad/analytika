import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Website Settings",
  description: "Configure website domains, custom proxy tracking CNAME, revenue tracking integrations, and privacy filters.",
};

export default function WebsiteSettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
