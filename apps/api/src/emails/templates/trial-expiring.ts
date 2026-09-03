import { renderBaseEmailLayout } from "../base";

export interface TrialExpiringEmailProps {
  name?: string;
  email: string;
  daysRemaining: number;
  subscribeUrl?: string;
}

export function renderTrialExpiringEmail({
  name,
  email,
  daysRemaining,
  subscribeUrl = "https://analytika.me/dashboard/settings?tab=billing",
}: TrialExpiringEmailProps): { subject: string; html: string } {
  const daysText = daysRemaining === 1 ? "1 day" : `${daysRemaining} days`;
  const subject = `Your Analytika Trial Ends in ${daysText} ⏳`;

  const bodyContent = `
    <!-- Header Badge -->
    <div style="text-align:center;margin-bottom:16px;">
      <span style="display:inline-block;padding:4px 12px;border-radius:20px;background-color:#fffbeb;border:1px solid #fde68a;color:#92400e;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">
        Trial Ending Soon
      </span>
    </div>

    <!-- Title -->
    <h1 style="margin:0 0 10px 0;font-size:22px;font-weight:700;color:#111827;text-align:center;letter-spacing:-0.4px;">
      ${name ? `Hi ${name},` : "Hello,"} your trial ends in ${daysText}
    </h1>

    <p style="margin:0 0 24px 0;font-size:14px;color:#4b5563;line-height:1.6;text-align:center;">
      Your 14-day free trial on Analytika will be ending shortly. Subscribe now to ensure your website tracking, revenue attribution, and MCP AI servers continue streaming uninterrupted.
    </p>

    <!-- Features Retained Card -->
    <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:28px;">
      <h3 style="margin:0 0 14px 0;font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">
        Included in Solo Plan ($6/mo):
      </h3>
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding-bottom:10px;font-size:13px;color:#374151;">
            <span style="color:#059669;font-weight:bold;margin-right:8px;">✓</span> Up to 3 Tracked Websites & Custom Proxy Domains
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:10px;font-size:13px;color:#374151;">
            <span style="color:#059669;font-weight:bold;margin-right:8px;">✓</span> Real-time High-Speed Analytics & Live Visitors
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:10px;font-size:13px;color:#374151;">
            <span style="color:#059669;font-weight:bold;margin-right:8px;">✓</span> Stripe, Polar & Lemon Squeezy MRR Attribution
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:10px;font-size:13px;color:#374151;">
            <span style="color:#059669;font-weight:bold;margin-right:8px;">✓</span> Model Context Protocol (MCP) AI Server Access
          </td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#374151;">
            <span style="color:#059669;font-weight:bold;margin-right:8px;">✓</span> 1-Year Historical Retention & Conversion Funnels
          </td>
        </tr>
      </table>
    </div>

    <!-- CTA Button -->
    <div style="text-align:center;">
      <a href="${subscribeUrl}" target="_blank" style="display:inline-block;background-color:#800E13;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 30px;border-radius:8px;letter-spacing:0.2px;">
        Subscribe to Solo Plan &rarr;
      </a>
    </div>
  `;

  return {
    subject,
    html: renderBaseEmailLayout({
      title: subject,
      previewText: `Your trial ends in ${daysText}. Subscribe to keep uninterrupted tracking.`,
      children: bodyContent,
    }),
  };
}
