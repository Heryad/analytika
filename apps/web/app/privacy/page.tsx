import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, EyeOff, Server, Database, UserCheck, HelpCircle } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function PrivacyPage() {
  const lastUpdated = "September 3, 2026";

  return (
    <div className="flex min-h-screen flex-col bg-[#1F1F1F] text-zinc-100 selection:bg-[#800E13]/40 selection:text-rose-200">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        
        {/* Back navigation */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="border-b border-white/[0.08] pb-8 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            100% GDPR, CCPA & PECR Compliant
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-2 font-mono">
            Last Updated: {lastUpdated}
          </p>
        </div>

        {/* Policy Content */}
        <div className="space-y-10 text-xs sm:text-sm text-zinc-300 leading-relaxed">

          {/* Section 1: Philosophy */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-400" />
              1. Our Privacy Philosophy
            </h2>
            <p>
              Analytika (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) was founded on a simple principle: <strong>you shouldn&apos;t have to sacrifice user privacy to get accurate business intelligence</strong>. Traditional web analytics platforms track users across the internet, harvest personally identifiable information (PII), and rely on intrusive tracking cookies.
            </p>
            <p>
              Analytika operates completely differently. Our telemetry is <strong>100% cookieless</strong>, stores zero personal information from your website visitors, and requires no cookie consent banners under GDPR, CCPA, or PECR.
            </p>
          </section>

          {/* Section 2: How Visitor Analytics Work */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-rose-400" />
              2. How We Anonymize Website Visitor Data
            </h2>
            <p>
              When a visitor loads a website tracked by Analytika, our lightweight script generates aggregated statistical measurements without identifying individuals.
            </p>
            <div className="bg-[#262626] border border-white/[0.08] rounded-xl p-4 space-y-2 font-mono text-xs text-zinc-300">
              <div className="font-semibold text-white">Cryptographic Anonymization:</div>
              <ul className="list-disc list-inside space-y-1 text-zinc-400">
                <li><strong>No Raw IP Storage:</strong> Visitor IP addresses are immediately combined with a daily rotating salt and hashed via SHA-256 in volatile memory. Raw IP addresses are never written to disk or database tables.</li>
                <li><strong>Zero Tracking Cookies:</strong> We do not place cookies, local storage identifiers, or canvas fingerprints on website visitors.</li>
                <li><strong>Daily Reset:</strong> Because salts rotate daily, a visitor cannot be tracked across different days or different websites.</li>
              </ul>
            </div>
          </section>

          {/* Section 3: Data Collected */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-rose-400" />
              3. Information We Collect
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#262626] border border-white/[0.08] rounded-xl p-4 space-y-2">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider font-mono">
                  A. Website Visitors (Aggregated Telemetry)
                </h3>
                <ul className="list-disc list-inside space-y-1 text-xs text-zinc-400">
                  <li>Page URL & Entry / Exit Paths</li>
                  <li>HTTP Referrer domain & UTM tags</li>
                  <li>Country & City (anonymized geographic lookup)</li>
                  <li>Device Category, Operating System & Browser Name</li>
                  <li>Custom telemetry event names & values (e.g. revenue amounts)</li>
                </ul>
              </div>

              <div className="bg-[#262626] border border-white/[0.08] rounded-xl p-4 space-y-2">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider font-mono">
                  B. Account Holders (Analytika Customers)
                </h3>
                <ul className="list-disc list-inside space-y-1 text-xs text-zinc-400">
                  <li>Account email address (for passwordless OTP authentication)</li>
                  <li>Full Name or Organization Name (optional)</li>
                  <li>Tracked domain names and site configuration settings</li>
                  <li>Subscription status and billing interval (managed via Polar.sh)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4: What We Never Collect */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              4. What We Never Collect or Sell
            </h2>
            <p>
              We believe your business data belongs solely to you. We strictly guarantee:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-400">
              <li>We <strong>never sell, rent, or monetize</strong> your analytics or telemetry data to third parties, advertisers, or data brokers.</li>
              <li>We <strong>never track individuals across different websites</strong>.</li>
              <li>We <strong>never store credit card numbers</strong> on our servers (all billing is securely handled by our authorized Merchant of Record, Polar.sh).</li>
            </ul>
          </section>

          {/* Section 5: Security & Infrastructure */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-rose-400" />
              5. Security & Cloud Infrastructure
            </h2>
            <p>
              We adhere to the highest security standards to ensure your analytics are protected:
            </p>
            <div className="bg-[#262626] border border-white/[0.08] rounded-xl p-4 space-y-2 text-xs text-zinc-300">
              <ul className="list-disc list-inside space-y-1.5 text-zinc-400">
                <li><strong>Encryption:</strong> All telemetry in transit is encrypted using modern TLS 1.3, and all persistent data is encrypted at rest using AES-256.</li>
                <li><strong>Enterprise Data Centers:</strong> Infrastructure is hosted in SOC-2 Type II and ISO-27001 certified cloud environments with 24/7 monitoring.</li>
                <li><strong>PCI-DSS Compliance:</strong> Payment processing is handled by Polar.sh, maintaining Level 1 PCI-DSS compliance.</li>
              </ul>
            </div>
          </section>

          {/* Section 6: Data Ownership & Retention */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-rose-400" />
              6. Data Ownership, Retention & Deletion
            </h2>
            <p>
              <strong>You own 100% of your data</strong>. We retain website analytics events according to your plan retention policy (up to 365 days).
            </p>
            <p>
              When you delete a website or delete your account in <strong>Settings &rarr; Account &rarr; Delete Account</strong>, our system immediately executes a permanent hard purge across all databases, permanently expunging all associated records with zero recovery window.
            </p>
          </section>

          {/* Section 7: Contact */}
          <section className="space-y-3 bg-[#262626] border border-white/[0.08] rounded-2xl p-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-rose-400" />
              7. Contact Our Privacy Team
            </h2>
            <p className="text-xs text-zinc-400">
              If you have any questions regarding this Privacy Policy or wish to exercise your GDPR/CCPA data rights, please contact us at:
            </p>
            <p className="font-mono text-xs text-rose-300">
              privacy@analytika.me or support@analytika.me
            </p>
          </section>

        </div>

      </main>

      <Footer />
    </div>
  );
}
