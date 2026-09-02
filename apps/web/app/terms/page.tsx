import Link from "next/link";
import { ArrowLeft, FileText, CreditCard, RefreshCw, AlertCircle, ShieldAlert, CheckCircle, HelpCircle } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function TermsPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono mb-4">
            <FileText className="w-3.5 h-3.5" />
            Legal Terms & Refund Policy
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-2 font-mono">
            Last Updated: {lastUpdated}
          </p>
        </div>

        {/* Terms Content */}
        <div className="space-y-10 text-xs sm:text-sm text-zinc-300 leading-relaxed">

          {/* Section 1: Agreement */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-rose-400" />
              1. Agreement to Terms
            </h2>
            <p>
              These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;Customer&quot;, &quot;User&quot;, &quot;you&quot;) and <strong>Analytika Inc.</strong> (&quot;Analytika&quot;, &quot;we&quot;, &quot;us&quot;). By creating an account, accessing our dashboard, embedding our analytics tracker, or using our Model Context Protocol (MCP) server, you acknowledge that you have read, understood, and agreed to be bound by these Terms.
            </p>
          </section>

          {/* Section 2: 14-Day Free Trial */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              2. 14-Day Free Trial & Risk-Free Evaluation
            </h2>
            <p>
              We want every customer to be 100% confident in Analytika before making any financial commitment:
            </p>
            <div className="bg-[#262626] border border-white/[0.08] rounded-xl p-4 space-y-2">
              <ul className="list-disc list-inside space-y-1.5 text-zinc-400 text-xs">
                <li>Every new account receives full, unrestricted access to the <strong>14-day Solo Trial</strong> upon registration.</li>
                <li><strong>No Credit Card Required:</strong> You are not asked for payment credentials to begin evaluating our real-time telemetry, revenue attribution, and MCP tools.</li>
                <li>At the conclusion of the 14-day trial period, tracking will pause unless you choose an active paid subscription tier. You will never be charged unexpectedly.</li>
              </ul>
            </div>
          </section>

          {/* Section 3: Subscriptions, Billing & Refund Policy */}
          <section className="space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-rose-400" />
              3. Subscription Billing, Cancellation & Refund Policy
            </h2>
            
            {/* Refund Policy Box */}
            <div className="bg-[#262626] border border-rose-500/20 rounded-xl p-5 space-y-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider font-mono text-[11px] text-rose-400">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                Refund Policy Details
              </div>
              <p className="text-zinc-300">
                Because Analytika provides a comprehensive <strong>14-day free trial</strong> allowing customers to fully test tracking accuracy, telemetry performance, and integrations before purchasing:
              </p>
              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li><strong>Standard Policy:</strong> Payments for monthly and annual subscription plans are <strong>non-refundable</strong> once successfully processed. We do not issue partial refunds or credits for unused event volume or mid-period cancellations.</li>
                <li><strong>Annual Plan Renewal Grace Period:</strong> If your annual subscription auto-renews and you did not intend to renew, you may request a full refund within <strong>7 calendar days</strong> of the renewal charge date, provided your websites have not actively utilized the renewed service during that timeframe.</li>
                <li><strong>Exceptional Circumstances:</strong> If you experience technical service disruptions attributable directly to our infrastructure that prevent tracking for extended durations, our support team will review your case for discretionary credit or refund.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider font-mono">
                A. Merchant of Record (Polar.sh)
              </h3>
              <p className="text-xs text-zinc-400">
                Our order process is conducted by our online Merchant of Record, <strong>Polar.sh</strong>, who handles payment processing, invoicing, global currency conversions, and applicable VAT/sales taxes. When you make a purchase, your billing statement will reflect Polar as the merchant.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider font-mono">
                B. Cancellation Policy
              </h3>
              <p className="text-xs text-zinc-400">
                You can cancel your subscription at any time with 1-click via <strong>Settings &rarr; Billing &rarr; Manage Subscription</strong>. Upon cancellation:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-zinc-400">
                <li>Your subscription will remain active and continue collecting events until the end of your prepaid billing period.</li>
                <li>No further charges will be made to your payment method.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider font-mono">
                C. Soft Quotas & Upgrades
              </h3>
              <p className="text-xs text-zinc-400">
                Each tier includes a designated monthly event volume (e.g. 10k, 100k, 500k, 2M+ events). If your website exceeds its monthly event quota, tracking is not abruptly shut down; we provide a generous soft grace period and notify you via email so you can seamlessly adjust your tier slider.
              </p>
            </div>
          </section>

          {/* Section 4: Acceptable Use */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              4. Acceptable Use Policy
            </h2>
            <p>You agree NOT to use Analytika to:</p>
            <ul className="list-disc list-inside space-y-1 text-xs text-zinc-400">
              <li>Track websites containing malware, phishing, unauthorized spyware, or illegal content.</li>
              <li>Attempt to reverse-engineer, decompile, or overload our ingestion endpoints via automated denial-of-service (DDoS) traffic.</li>
              <li>Attempt to collect personally identifiable information (such as credit card numbers, passwords, or government IDs) through custom event payloads.</li>
              <li>Circumvent plan limits, user seats, or domain restrictions.</li>
            </ul>
          </section>

          {/* Section 5: Intellectual Property & Data Ownership */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-rose-400" />
              5. Intellectual Property & Your Data
            </h2>
            <p>
              <strong>Your Data:</strong> You retain full, exclusive ownership of all analytics data, domain configurations, and revenue metrics stored in your account. We claim zero ownership over your proprietary business numbers.
            </p>
            <p>
              <strong>Analytika IP:</strong> All code, user interfaces, branding, algorithms, and documentation associated with Analytika remain the exclusive intellectual property of Analytika Inc.
            </p>
          </section>

          {/* Section 6: Limitation of Liability */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              6. Limitation of Liability & Warranty Disclaimer
            </h2>
            <p className="text-zinc-400 text-xs">
              Analytika is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, whether express or implied. While we strive for 99.9% platform availability, we do not guarantee uninterrupted or error-free service. To the maximum extent permitted by applicable law, in no event shall Analytika Inc. be liable for any indirect, incidental, punitive, or consequential damages resulting from lost revenue, lost profits, or data loss.
            </p>
          </section>

          {/* Section 7: Support & Inquiries */}
          <section className="space-y-3 bg-[#262626] border border-white/[0.08] rounded-2xl p-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-rose-400" />
              7. Billing & Legal Support
            </h2>
            <p className="text-xs text-zinc-400">
              For any billing inquiries, cancellation assistance, or legal questions regarding our terms, please email our support team directly:
            </p>
            <p className="font-mono text-xs text-rose-300">
              billing@analytika.me or support@analytika.me
            </p>
          </section>

        </div>

      </main>

      <Footer />
    </div>
  );
}
