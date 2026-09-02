/**
 * JSON-LD Schema.org Structured Data Component
 * Provides rich snippets for Google Search, Bing, and AI search engines (ChatGPT Search, Perplexity)
 */
export function JsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://analytika.me/#organization",
        "name": "Analytika",
        "url": "https://analytika.me",
        "logo": "https://analytika.me/logo.svg",
        "sameAs": [
          "https://twitter.com/analytika_me",
          "https://github.com/analytika"
        ]
      },
      {
        "@type": "WebApplication",
        "@id": "https://analytika.me/#webapp",
        "url": "https://analytika.me",
        "name": "Analytika Web Analytics",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "All",
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "description": "Privacy-first, cookieless web analytics platform with real-time revenue attribution, social mention radar, and Model Context Protocol (MCP) server.",
        "publisher": {
          "@id": "https://analytika.me/#organization"
        },
        "offers": {
          "@type": "Offer",
          "price": "7.00",
          "priceCurrency": "USD",
          "priceValidUntil": "2027-12-31",
          "availability": "https://schema.org/InStock"
        },
        "featureList": [
          "Cookieless tracking",
          "High-speed real-time telemetry",
          "Revenue attribution",
          "Social mention radar for X and Reddit",
          "Remote Model Context Protocol (MCP)",
          "Custom proxy tracking domains"
        ]
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
