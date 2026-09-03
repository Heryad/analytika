/**
 * JSON-LD Schema.org Structured Data Component
 * Provides rich snippets for Google Search, Bing, and AI search engines (ChatGPT Search, Perplexity)
 */
export function JsonLd() {
  const faqItems = [
    {
      q: "Why is Analytika better than Google Analytics (GA4)?",
      a: "GA4 is notoriously complex, slow (over 45KB payload), and requires intrusive cookie consent banners to comply with GDPR. Analytika is under 2.5KB, 100% cookieless, sub-second fast, and directly ties your traffic to actual revenue.",
    },
    {
      q: "Do I need to show a cookie consent banner?",
      a: "No. Analytika does not set any cookies, does not store raw IP addresses, and does not track users across different websites. It is 100% compliant with GDPR, CCPA, and PECR out of the box.",
    },
    {
      q: "How does revenue attribution work?",
      a: "When a visitor arrives via a UTM campaign, tweet, or Google search, we associate their session with that channel. When they purchase through Polar, Stripe, or a custom goal, we attribute the revenue directly to that channel so you know your exact marketing ROI.",
    },
    {
      q: "Will Analytika slow down my website?",
      a: "Not at all. The script is under 2.5KB gzipped and loads with the defer attribute. Events are transmitted using navigator.sendBeacon without blocking page rendering.",
    },
    {
      q: "Can I use Analytika with Next.js, React, or Vue?",
      a: "Yes. The SDK automatically hooks into browser history (pushState and popstate) to record virtual page transitions in SPAs without any manual router configuration.",
    },
    {
      q: "What is the MCP server?",
      a: "Analytika includes a Model Context Protocol (MCP) server at api.analytika.me/mcp. This lets AI assistants like Claude and ChatGPT query your live analytics data — ask your AI how many visitors you got today and it will answer from your real dashboard.",
    },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://analytika.me/#organization",
        "name": "Analytika",
        "url": "https://analytika.me",
        "logo": {
          "@type": "ImageObject",
          "url": "https://analytika.me/logo.svg",
          "width": 200,
          "height": 200,
        },
        "sameAs": [
          "https://twitter.com/analytika_me",
          "https://github.com/analytika",
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer support",
          "url": "https://analytika.me/dashboard",
        },
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://analytika.me/#webapp",
        "url": "https://analytika.me",
        "name": "Analytika",
        "alternateName": ["Analytika Analytics", "Analytika Web Analytics"],
        "applicationCategory": "BusinessApplication",
        "applicationSubCategory": "Web Analytics",
        "operatingSystem": "All",
        "browserRequirements": "Requires JavaScript.",
        "description": "Privacy-first, cookieless web analytics with real-time revenue attribution, social mention radar for X and Reddit, and an AI-native MCP server for Claude and ChatGPT.",
        "publisher": { "@id": "https://analytika.me/#organization" },
        "offers": {
          "@type": "AggregateOffer",
          "lowPrice": "7.00",
          "highPrice": "549.00",
          "priceCurrency": "USD",
          "offerCount": 12,
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.9",
          "reviewCount": "247",
          "bestRating": "5",
          "worstRating": "1",
        },
        "featureList": [
          "Cookieless tracking",
          "GDPR, CCPA, and PECR compliant",
          "Real-time revenue attribution",
          "Stripe, Polar, Paddle, LemonSqueezy integrations",
          "X (Twitter) and Reddit social mention radar",
          "AI-native Model Context Protocol (MCP) server",
          "Claude and ChatGPT integration",
          "Conversion funnels",
          "Custom proxy domains",
          "Sub-2.5KB tracking script",
        ],
        "screenshot": "https://analytika.me/og.png",
        "softwareVersion": "1.0.0",
        "releaseNotes": "https://analytika.me/changelog",
      },
      {
        "@type": "FAQPage",
        "@id": "https://analytika.me/#faq",
        "mainEntity": faqItems.map((item) => ({
          "@type": "Question",
          "name": item.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": item.a,
          },
        })),
      },
      {
        "@type": "WebSite",
        "@id": "https://analytika.me/#website",
        "url": "https://analytika.me",
        "name": "Analytika",
        "description": "Privacy-first web analytics with revenue attribution and AI integration.",
        "publisher": { "@id": "https://analytika.me/#organization" },
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://docs.analytika.me?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
