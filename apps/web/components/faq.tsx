"use client";

import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FAQ() {
  const faqs = [
    {
      q: "Why is Analytika better than Google Analytics (GA4)?",
      a: "GA4 is notoriously complex, slow (over 45KB payload), and requires intrusive cookie consent banners to comply with GDPR. Analytika is under 2.5KB, 100% cookieless, sub-second fast with ClickHouse, and directly ties your traffic to actual dollars made.",
    },
    {
      q: "Do I need to show a cookie consent banner?",
      a: "No! Analytika does not set any cookies, does not store raw IP addresses, and does not track users across different websites. It is 100% compliant with GDPR, CCPA, and PECR out of the box without requiring annoying consent banners.",
    },
    {
      q: "How does revenue attribution work?",
      a: "When a visitor arrives on your site via a specific UTM campaign, tweet, or Google search, we associate their session with that channel. When they make a purchase through Polar, Stripe, or a custom goal, we attribute the dollar amount directly to that channel so you know your exact marketing ROI.",
    },
    {
      q: "Will Analytika slow down my website?",
      a: "Not at all. Our script is less than 2.5KB gzipped and loads with the `defer` attribute. Events are transmitted in background batches using `navigator.sendBeacon` without blocking page rendering or degrading your Google Lighthouse score.",
    },
    {
      q: "Can I use Analytika with Single Page Applications (Next.js, React, Vue)?",
      a: "Yes! The SDK automatically hooks into browser history (`pushState` and `popstate`) to record virtual page transitions as visitors navigate your SPA, without requiring any manual router configuration.",
    },
    {
      q: "How do declarative HTML goals work?",
      a: "Instead of writing complex event listeners in JavaScript, you can simply add `data-goal=\"upgrade_button\"` and `data-goal-value=\"49\"` to any HTML `<button>`, `<a>`, or `<form>`. The SDK captures the action automatically upon user interaction.",
    },
  ];

  return (
    <section id="faq" className="py-24 relative scroll-mt-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-16">
          <Badge className="bg-[#800E13]/10 border-[#800E13]/35 text-rose-300 mb-4 px-3.5 py-1">
            Frequently Asked Questions
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Everything You Need to Know
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base">
            Have questions about privacy, implementation, or pricing? We have answers.
          </p>
        </div>

        {/* Accordion Component */}
        <Accordion type="single" collapsible className="w-full space-y-3">
          {faqs.map((faq, idx) => (
            <AccordionItem
              key={idx}
              value={`item-${idx}`}
              className="rounded-xl border border-white/[0.08] bg-[#262626] px-6 hover:border-[#800E13]/50 transition-colors"
            >
              <AccordionTrigger className="text-left text-sm sm:text-base font-semibold text-white hover:text-rose-300 transition-colors py-4">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-zinc-400 text-xs sm:text-sm leading-relaxed pb-4">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

      </div>
    </section>
  );
}
