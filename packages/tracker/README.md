# @analytika-me/tracker 🚀

High-performance, cookieless, privacy-friendly web analytics & revenue attribution SDK for modern web applications.

---

## Installation

```bash
npm install @analytika-me/tracker
# or
bun add @analytika-me/tracker
# or
pnpm add @analytika-me/tracker
```

---

## 1. Quickstart with NPM / Next.js / React / Vue / Svelte

Initialize the analytics tracker in your root component or client-side layout:

```typescript
import { initAnalytics, trackEvent, trackPageView } from "@analytika-me/tracker";

// Initialize once
initAnalytics({
  websiteId: "site_your_website_id",
  autoTrack: true,        // Automatically tracks page views on route changes (SPA support)
  allowLocalhost: false,  // Set to true to test tracking in localhost development
  respectDNT: true,       // Respect Do-Not-Track browser header
});
```

---

## 2. Tracking Custom Events & Dynamic Metadata

You can track arbitrary events with dynamic key-value properties:

```typescript
// Button clicks & interactions
trackEvent("brown_button_clicked", {
  color: "brown",
  position: "hero_cta",
  experiment_group: "variant_B",
});

// E-commerce & MRR Revenue Conversions
trackEvent("purchase", {
  value: 49.99,
  currency: "USD",
  tier: "growth",
  billing: "annual",
});
```

---

## 3. Standalone Script Usage (`a.js`)

For static HTML, WordPress, Webflow, Shopify, or simple landing pages:

```html
<!-- Paste this in your <head> or <body> -->
<script 
  defer 
  src="https://analytika.me/a.js" 
  data-website-id="site_your_website_id"
></script>
```

### Declarative Zero-Code HTML Tracking:
Add `data-analytika-event` to any HTML element to track clicks automatically without writing JavaScript:

```html
<button 
  data-analytika-event="brown_button_clicked"
  data-analytika-prop-color="brown"
  data-analytika-prop-section="hero"
>
  Claim Deal
</button>
```

### Manual Triggering via Global Window:
```javascript
window.analytika("purchase", {
  value: 99.00,
  currency: "USD",
  plan: "pro",
});
```
