import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Settings & MCP Connectors",
  description: "Manage your Analytika account preferences, theme, billing subscription, and Remote Model Context Protocol (MCP) access keys.",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
