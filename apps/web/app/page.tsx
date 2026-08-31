import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { InteractivePreview } from "@/components/interactive-preview";
import { Features } from "@/components/features";
import { McpDemo } from "@/components/mcp-demo";
import { HowItWorks } from "@/components/how-it-works";
import { Testimonials } from "@/components/testimonials";
import { Pricing } from "@/components/pricing";
import { FAQ } from "@/components/faq";
import { Footer } from "@/components/footer";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#1F1F1F] text-zinc-100 selection:bg-[#800E13]/40 selection:text-rose-200">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <InteractivePreview />
        <Features />
        <McpDemo />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
