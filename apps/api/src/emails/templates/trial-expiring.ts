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
      <span style="display:inline-block;padding:4px 12px;border-radius:20px;background-color:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.3);color:#fbbf24;font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">
        Trial Ending Soon
      </span>
    </div>

    <!-- Title -->
    <h1 style="margin:0 0 12px 0;font-size:24px;font-weight:800;color:#ffffff;text-align:center;letter-spacing:-0.5px;">
      ${name ? `Hi ${name},` : "Hello,"} your trial ends in ${daysText}
    </h1>

    <p style="margin:0 0 24px 0;font-size:14px;color:#a1a1aa;line-height:1.6;text-align:center;">
      Your 14-day free trial on Analytika will be ending shortly. Subscribe now to ensure your website tracking, revenue attribution, and MCP AI servers continue streaming uninterrupted.
    </p>

    <!-- Features Retained Card -->
    <div style="background-color:#121214;border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:20px;margin-bottom:28px;">
      <h3 style="margin:0 0 12px 0;font-size:13px;font-weight:700;color:#e4e4e7;text-transform:uppercase;letter-spacing:0.5px;">
        What you keep on Solo Plan ($6/mo):
      </h3>
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding-bottom:8px;font-size:13px;color:#d4d4d8;">
            &check; Up to 3 Tracked Websites & Custom Proxy Domains
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:8px;font-size:13px;color:#d4d4d8;">
            &check; Real-time ClickHouse OLAP Analytics & Live Visitors
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:8px;font-size:13px;color:#d4d4d8;">
            &check; Stripe, Polar & Lemon Squeezy MRR Attribution
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:8px;font-size:13px;color:#d4d4d8;">
            &check; Model Context Protocol (MCP) AI Server Access
          </td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#d4d4d8;">
            &check; 1-Year Historical Retention & Conversion Funnels
          </td>
        </tr>
      </table>
    </div>

    <!-- CTA Button -->
    <div style="text-align:center;margin-bottom:16px;">
      <a href="${subscribeUrl}" target="_blank" style="display:inline-block;background-color:#800E13;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;box-shadow:0 4px 14px rgba(128,14,19,0.4);letter-spacing:0.2px;">
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
