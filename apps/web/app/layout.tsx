import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

import { JsonLd } from "@/components/seo/structured-data";

export const metadata: Metadata = {
  metadataBase: new URL("https://analytika.me"),
  title: {
    default: "Analytika — Privacy-First Web Analytics",
    template: "%s | Analytika",
  },
  description:
    "Cookieless web analytics with revenue attribution, social mention radar, and AI-native MCP server. No cookie banners.",
  applicationName: "Analytika",
  keywords: [
    "web analytics",
    "cookieless analytics",
    "revenue attribution",
    "social radar",
    "model context protocol",
    "mcp server",
    "privacy analytics",
    "saas analytics",
    "clickhouse telemetry",
  ],
  authors: [{ name: "Analytika Team", url: "https://analytika.me" }],
  creator: "Analytika",
  publisher: "Analytika",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://analytika.me",
    siteName: "Analytika",
    title: "Analytika — Privacy-First Web Analytics",
    description:
      "Cookieless analytics with revenue attribution & social radar. No cookie banners.",
    images: [
      {
        url: "https://analytika.me/og.png",
        width: 1200,
        height: 630,
        alt: "Analytika Dashboard Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Analytika — Privacy-First Web Analytics",
    description:
      "Cookieless analytics with revenue attribution & social radar. No cookie banners.",
    creator: "@analytika_me",
    images: ["https://analytika.me/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://analytika.me",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

import Script from "next/script";
import { AuthProvider } from "@/lib/auth-context";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("analytika_theme")?.value;
  const isLight = themeCookie === "light";
  const initialClass = isLight ? "light scroll-smooth" : "dark scroll-smooth";

  return (
    <html lang="en" className={initialClass} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans bg-[#1F1F1F] text-zinc-100 min-h-screen antialiased selection:bg-[#800E13]/40 selection:text-rose-200`}>
        <JsonLd />
        <Script
          id="theme-initializer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('analytika_theme');
                  var isDark = stored === 'dark' || (!stored && document.documentElement.classList.contains('dark')) || (stored === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (stored === 'light' || (!isDark && stored === 'system')) {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  } else {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
