import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connect Analytika",
  description: "Authorize an AI assistant to access your Analytika analytics.",
  robots: { index: false, follow: false },
};

export default function OAuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
