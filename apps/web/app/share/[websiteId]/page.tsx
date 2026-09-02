import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/api";
import {
  PublicShareClient,
  PublicSiteMeta,
  InitialAnalyticsData,
} from "./share-client";

interface PageProps {
  params: Promise<{ websiteId: string }>;
}

/**
 * Dynamic SEO Metadata for Public Shared Analytics
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { websiteId } = await params;
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/websites/${websiteId}/public`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.website) {
        return {
          title: `${data.website.name} — Public Web Analytics | Analytika`,
          description: `Live privacy-friendly website analytics and traffic statistics for ${data.website.domain}`,
          openGraph: {
            title: `${data.website.name} — Public Analytics`,
            description: `Live privacy-friendly website analytics and traffic statistics for ${data.website.domain}`,
            images: ["/logo.svg"],
          },
        };
      }
    }
  } catch {}

  return {
    title: "Public Analytics Dashboard | Analytika",
    description: "Real-time privacy-friendly analytics and statistics.",
  };
}

/**
 * Server Component for Public Shared Dashboard
 * Pre-fetches site metadata & initial analytics for 0ms loading state
 */
export default async function PublicSharePage({ params }: PageProps) {
  const { websiteId } = await params;

  let siteMeta: PublicSiteMeta | null = null;
  let initialAnalytics: InitialAnalyticsData | null = null;

  try {
    const siteRes = await fetch(`${API_BASE_URL}/api/v1/websites/${websiteId}/public`, {
      next: { revalidate: 30 },
    });

    if (siteRes.ok) {
      const data = await siteRes.json();
      if (data.success && data.website) {
        siteMeta = data.website;
      }
    }
  } catch (err) {
    console.error("Failed to pre-fetch public website meta:", err);
  }

  // 1. If site not found or public sharing is disabled
  if (!siteMeta || !siteMeta.isPublic) {
    return (
      <main className="min-h-screen bg-[#1F1F1F] text-zinc-100 flex flex-col items-center justify-center p-4 select-none font-sans">
        <div className="w-full max-w-md rounded-2xl bg-[#262626] border border-white/[0.08] p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-[#800E13]/20 border border-[#800E13]/30 text-rose-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-white">This Dashboard is Private</h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Public access for{" "}
              <strong className="text-white">{siteMeta?.domain || websiteId}</strong> is
              currently disabled by the site owner.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/dashboard">
              <Button className="w-full bg-[#800E13] hover:bg-[#9e1218] text-white text-xs font-semibold h-9 rounded-xl cursor-pointer shadow-md">
                Return to Analytika
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 2. Pre-fetch initial analytics data in parallel on the server (30 Days default)
  try {
    const [liveRes, overviewRes, timeseriesRes, sourcesRes, geoRes, devicesRes, pagesRes, eventsRes] =
      await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/analytics/${websiteId}/live`, { next: { revalidate: 10 } }),
        fetch(`${API_BASE_URL}/api/v1/analytics/${websiteId}/overview?range=30d`, { next: { revalidate: 30 } }),
        fetch(`${API_BASE_URL}/api/v1/analytics/${websiteId}/timeseries?range=30d`, { next: { revalidate: 30 } }),
        fetch(`${API_BASE_URL}/api/v1/analytics/${websiteId}/sources?range=30d`, { next: { revalidate: 30 } }),
        fetch(`${API_BASE_URL}/api/v1/analytics/${websiteId}/geo?range=30d`, { next: { revalidate: 30 } }),
        fetch(`${API_BASE_URL}/api/v1/analytics/${websiteId}/devices?range=30d`, { next: { revalidate: 30 } }),
        fetch(`${API_BASE_URL}/api/v1/analytics/${websiteId}/pages?range=30d`, { next: { revalidate: 30 } }),
        fetch(`${API_BASE_URL}/api/v1/analytics/${websiteId}/events?range=30d`, { next: { revalidate: 30 } }),
      ]);

    const [liveData, overviewData, timeseriesData, sourcesData, geoData, devicesData, pagesData, eventsData] =
      await Promise.all([
        liveRes.ok ? liveRes.json() : null,
        overviewRes.ok ? overviewRes.json() : null,
        timeseriesRes.ok ? timeseriesRes.json() : null,
        sourcesRes.ok ? sourcesRes.json() : null,
        geoRes.ok ? geoRes.json() : null,
        devicesRes.ok ? devicesRes.json() : null,
        pagesRes.ok ? pagesRes.json() : null,
        eventsRes.ok ? eventsRes.json() : null,
      ]);

    initialAnalytics = {
      onlineCount: liveData?.onlineVisitors || 0,
      overview: overviewData?.metrics || null,
      timeseries: timeseriesData?.timeseries || [],
      sources: {
        channels: sourcesData?.channels || [],
        referrers: sourcesData?.referrers || [],
        campaigns: sourcesData?.campaigns || [],
      },
      geo: {
        countries: geoData?.countries || [],
        regions: geoData?.regions || [],
        cities: geoData?.cities || [],
        languages: geoData?.languages || [],
      },
      devices: {
        devices: devicesData?.devices || [],
        os: devicesData?.os || [],
        browsers: devicesData?.browsers || [],
        screens: devicesData?.screens || [],
        loyalty: devicesData?.loyalty || null,
      },
      pages: pagesData?.pages || [],
      events: eventsData?.events || [],
    };
  } catch (err) {
    console.error("Failed to pre-fetch server analytics:", err);
  }

  return (
    <PublicShareClient
      siteMeta={siteMeta}
      initialAnalytics={initialAnalytics}
    />
  );
}
