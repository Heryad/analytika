import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Analytika - Revenue-First Web Analytics",
  description:
    "Discover which marketing channels, posts, and campaigns actually bring paying customers so you can scale what works.",
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
      <head>
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
      </head>
      <body className={`${inter.variable} font-sans bg-[#1F1F1F] text-zinc-100 min-h-screen antialiased selection:bg-[#800E13]/40 selection:text-rose-200`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
