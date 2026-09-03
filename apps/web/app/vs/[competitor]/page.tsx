import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Check, X, ArrowRight, Zap, Shield, DollarSign, Brain } from "lucide-react";

// ─── Competitor Data ─────────────────────────────────────────────────────────

const competitors: Record<string, {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  founded: string;
  pricing: string;
  metaTitle: string;
  metaDescription: string;
  pros: string[];
  cons: string[];
  keywords: string[];
}> = {
  "plausible": {
    name: "Plausible",
    slug: "plausible",
    tagline: "Simple, privacy-friendly analytics",
    description: "Plausible is a lightweight, open-source Google Analytics alternative focused on simplicity and privacy. It tracks pageviews and basic events without cookies.",
    founded: "2019",
    pricing: "From $9/mo",
    metaTitle: "Analytika vs Plausible — Which Analytics Tool Is Right for You?",
    metaDescription: "Compare Analytika vs Plausible. Both are cookieless and GDPR-compliant, but Analytika adds revenue attribution, social radar, and an AI-native MCP server.",
    keywords: ["plausible alternative", "plausible vs analytika", "plausible analytics alternative", "cookieless analytics"],
    pros: ["Very simple UI", "Open source", "Lightweight script", "Great privacy defaults"],
    cons: [
      "No revenue attribution",
      "No payment provider integrations",
      "No social mention tracking",
      "No AI/MCP integration",
      "No real-time revenue data",
      "Limited funnel analytics",
    ],
  },
  "google-analytics": {
    name: "Google Analytics (GA4)",
    slug: "google-analytics",
    tagline: "The world's most used analytics platform",
    description: "Google Analytics 4 is the default analytics choice for most websites. It's free but complex, requires cookie consent banners, and sends all your user data to Google.",
    founded: "2005",
    pricing: "Free (paid 360 from $50k/yr)",
    metaTitle: "Analytika vs Google Analytics — GDPR-Compliant GA4 Alternative",
    metaDescription: "Switch from Google Analytics to Analytika. Cookieless, no consent banners, real-time revenue attribution, and privacy-first — without sending data to Google.",
    keywords: ["google analytics alternative", "ga4 alternative", "gdpr analytics", "cookieless google analytics alternative", "privacy-friendly analytics"],
    pros: ["Free tier", "Huge ecosystem", "Google Ads integration", "Very detailed data"],
    cons: [
      "Requires cookie consent banners (GDPR)",
      "Sends data to Google",
      "GA4 is notoriously complex",
      "45KB+ script slows your site",
      "No direct revenue attribution",
      "Sampling on high-traffic sites",
      "No social mention tracking",
      "No MCP/AI integration",
    ],
  },
  "datafast": {
    name: "DataFast",
    slug: "datafast",
    tagline: "Revenue-focused analytics for founders",
    description: "DataFast is a privacy-friendly analytics tool focused on revenue attribution and funnel analysis for SaaS founders and indie hackers.",
    founded: "2022",
    pricing: "From $9/mo",
    metaTitle: "Analytika vs DataFast — The Better Revenue Analytics Alternative",
    metaDescription: "Compare Analytika vs DataFast. Analytika offers the same revenue attribution with the addition of social mention radar, AI-native MCP server, and a lower starting price.",
    keywords: ["datafast alternative", "datafast vs analytika", "revenue analytics tool", "mrr attribution analytics"],
    pros: ["Revenue attribution", "Clean UI", "Good funnel support", "Privacy-friendly"],
    cons: [
      "No social mention tracking",
      "No AI/MCP server integration",
      "No X (Twitter) mention radar",
      "Smaller feature set",
      "No self-hosting option",
    ],
  },
  "fathom": {
    name: "Fathom Analytics",
    slug: "fathom",
    tagline: "Simple, privacy-focused website analytics",
    description: "Fathom is a privacy-first Google Analytics alternative with a clean, simple interface. It's cookieless, GDPR compliant, and focused on simplicity over depth.",
    founded: "2018",
    pricing: "From $14/mo",
    metaTitle: "Analytika vs Fathom Analytics — More Insights, Lower Price",
    metaDescription: "Compare Analytika vs Fathom Analytics. Both are cookieless and GDPR-compliant, but Analytika adds revenue attribution, social radar, and AI integration at a lower price.",
    keywords: ["fathom analytics alternative", "fathom vs analytika", "privacy analytics alternative", "cookieless analytics tool"],
    pros: ["Very simple", "Privacy-first", "Good uptime SLA", "EU hosting option"],
    cons: [
      "No revenue attribution",
      "No payment integrations",
      "No social mention tracking",
      "No AI/MCP integration",
      "More expensive than competitors",
      "Limited event tracking",
    ],
  },
};

// ─── Feature comparison table data ───────────────────────────────────────────

const FEATURES = [
  { label: "Cookieless tracking",              analytika: true,  other: true  },
  { label: "GDPR / CCPA compliant",            analytika: true,  other: true  },
  { label: "No cookie consent banner needed",  analytika: true,  other: true  },
  { label: "Real-time visitors",               analytika: true,  other: true  },
  { label: "Revenue attribution",              analytika: true,  other: false, exceptions: ["datafast"] },
  { label: "Payment provider integrations",    analytika: true,  other: false, exceptions: ["datafast"] },
  { label: "Conversion funnels",               analytika: true,  other: false, exceptions: ["datafast", "plausible"] },
  { label: "X (Twitter) social radar",         analytika: true,  other: false },
  { label: "Reddit mention tracking",          analytika: true,  other: false },
  { label: "AI-native MCP server",             analytika: true,  other: false },
  { label: "Claude / ChatGPT integration",     analytika: true,  other: false },
  { label: "Custom proxy domain (CNAME)",      analytika: true,  other: false, exceptions: ["fathom"] },
  { label: "Public shareable dashboard",       analytika: true,  other: false, exceptions: ["plausible"] },
  { label: "Script under 3KB",                 analytika: true,  other: false, exceptions: ["plausible", "fathom", "datafast"] },
];

// ─── Generate static params ───────────────────────────────────────────────────

export function generateStaticParams() {
  return Object.keys(competitors).map((slug) => ({ competitor: slug }));
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ competitor: string }>;
}): Promise<Metadata> {
  const { competitor } = await params;
  const data = competitors[competitor];
  if (!data) return {};

  return {
    title: data.metaTitle,
    description: data.metaDescription,
    keywords: data.keywords,
    alternates: {
      canonical: `https://analytika.me/vs/${competitor}`,
    },
    openGraph: {
      title: data.metaTitle,
      description: data.metaDescription,
      url: `https://analytika.me/vs/${competitor}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: data.metaTitle,
      description: data.metaDescription,
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CompetitorPage({
  params,
}: {
  params: Promise<{ competitor: string }>;
}) {
  const { competitor } = await params;
  const data = competitors[competitor];
  if (!data) notFound();

  const competitorHasFeature = (feature: typeof FEATURES[0]) => {
    if (feature.exceptions?.includes(data.slug)) return true;
    return feature.other;
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#1F1F1F] text-zinc-100">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 border-b border-white/[0.06]">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 font-mono">
              <Link href="/" className="hover:text-zinc-300 transition-colors">analytika.me</Link>
              <span>/</span>
              <span>vs</span>
              <span>/</span>
              <span className="text-zinc-300">{data.name}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              Analytika vs {data.name}
            </h1>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              {data.metaDescription}
            </p>

            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 bg-[#800E13] hover:bg-[#9e1218] text-white font-semibold text-sm px-6 h-11 rounded-xl border border-[#800E13] transition-all shadow-lg shadow-[#800E13]/20"
            >
              Try Analytika Free
              <ArrowRight className="h-4 w-4" />
            </Link>

            <p className="text-xs text-zinc-500">14-day free trial · No credit card required</p>
          </div>
        </section>

        {/* Quick summary cards */}
        <section className="py-16 border-b border-white/[0.06]">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Analytika card */}
              <div className="bg-[#262626] border border-[#800E13]/30 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Image src="/logo.svg" alt="Analytika" width={32} height={32} className="w-8 h-8" />
                  <div>
                    <div className="font-bold text-white">Analytika</div>
                    <div className="text-xs text-zinc-500 font-mono">From $7/mo</div>
                  </div>
                  <span className="ml-auto text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#800E13]/20 text-rose-300 border border-[#800E13]/30">
                    Recommended
                  </span>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Privacy-first analytics with revenue attribution, social mention radar, and an AI-native MCP server that connects directly to Claude and ChatGPT.
                </p>
                <div className="space-y-2">
                  {["Cookieless & GDPR compliant", "Revenue attribution built-in", "X & Reddit social radar", "AI/MCP server for Claude & ChatGPT"].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              {/* Competitor card */}
              <div className="bg-[#1F1F1F] border border-white/[0.08] rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#2A2A2A] border border-white/[0.08] flex items-center justify-center text-sm font-bold text-zinc-400">
                    {data.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-white">{data.name}</div>
                    <div className="text-xs text-zinc-500 font-mono">{data.pricing}</div>
                  </div>
                  <span className="ml-auto text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-white/[0.08]">
                    Founded {data.founded}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">{data.description}</p>
                <div className="space-y-2">
                  {data.pros.slice(0, 4).map((p) => (
                    <div key={p} className="flex items-center gap-2 text-sm text-zinc-300">
                      <Check className="w-4 h-4 text-zinc-500 shrink-0" />
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature comparison table */}
        <section className="py-16 border-b border-white/[0.06]">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-10">
              Feature Comparison
            </h2>

            <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-3 bg-[#1F1F1F] border-b border-white/[0.08]">
                <div className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Feature</div>
                <div className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-rose-300 text-center">Analytika</div>
                <div className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 text-center">{data.name}</div>
              </div>

              {FEATURES.map((feature, i) => (
                <div
                  key={feature.label}
                  className={`grid grid-cols-3 border-b border-white/[0.04] ${i % 2 === 0 ? "bg-[#1A1A1A]" : "bg-[#1F1F1F]"}`}
                >
                  <div className="px-5 py-3.5 text-sm text-zinc-300">{feature.label}</div>
                  <div className="px-5 py-3.5 flex justify-center">
                    <Check className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="px-5 py-3.5 flex justify-center">
                    {competitorHasFeature(feature)
                      ? <Check className="w-5 h-5 text-zinc-500" />
                      : <X className="w-5 h-5 text-zinc-700" />
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why switch section */}
        <section className="py-16 border-b border-white/[0.06]">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-10">
              Why founders switch from {data.name} to Analytika
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: <DollarSign className="w-5 h-5 text-emerald-400" />,
                  title: "Revenue attribution",
                  desc: "Connect Stripe, Polar, Paddle, or LemonSqueezy and see exactly which campaigns, tweets, and pages generate paying customers.",
                },
                {
                  icon: <Zap className="w-5 h-5 text-amber-400" />,
                  title: "Social Mention Radar",
                  desc: "Automatically discover when people talk about your product on X (Twitter) and Reddit and attribute traffic to those specific posts.",
                },
                {
                  icon: <Brain className="w-5 h-5 text-rose-400" />,
                  title: "AI-native MCP server",
                  desc: "Ask Claude or ChatGPT \"how many visitors did I get today?\" and get live answers from your dashboard directly in your AI assistant.",
                },
                {
                  icon: <Shield className="w-5 h-5 text-blue-400" />,
                  title: "100% cookieless",
                  desc: "No cookies, no consent banners, no personal data stored. Fully compliant with GDPR, CCPA, and PECR out of the box.",
                },
              ].map((item) => (
                <div key={item.title} className="bg-[#262626] border border-white/[0.08] rounded-2xl p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span className="font-semibold text-white text-sm">{item.title}</span>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What users say about competitor */}
        <section className="py-16 border-b border-white/[0.06]">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              Common complaints about {data.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.cons.map((con) => (
                <div key={con} className="flex items-start gap-3 bg-[#1F1F1F] border border-white/[0.06] rounded-xl p-4">
                  <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-zinc-300">{con}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Ready to switch from {data.name}?
            </h2>
            <p className="text-zinc-400">
              Set up Analytika in under 2 minutes. No credit card required. 14-day free trial.
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 bg-[#800E13] hover:bg-[#9e1218] text-white font-semibold text-sm px-8 h-12 rounded-xl border border-[#800E13] transition-all shadow-xl shadow-[#800E13]/20"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>

            {/* Other comparisons */}
            <div className="pt-6 border-t border-white/[0.06]">
              <p className="text-xs text-zinc-500 mb-3">Compare with other tools</p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {Object.values(competitors)
                  .filter((c) => c.slug !== data.slug)
                  .map((c) => (
                    <Link
                      key={c.slug}
                      href={`/vs/${c.slug}`}
                      className="text-xs font-mono text-zinc-400 hover:text-white bg-[#262626] border border-white/[0.08] px-3 py-1.5 rounded-lg transition-colors"
                    >
                      vs {c.name}
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
