import { renderBaseEmailLayout } from "../base";

export interface SubscriptionSuccessEmailProps {
  name?: string;
  email: string;
  planName: string;
  billingInterval: "month" | "year";
  eventQuota: number;
  currentPeriodEnd?: Date | null;
  dashboardUrl?: string;
}

export function renderSubscriptionSuccessEmail({
  name,
  email,
  planName,
  billingInterval,
  eventQuota,
  currentPeriodEnd,
  dashboardUrl = "https://analytika.me/dashboard/settings?tab=billing",
}: SubscriptionSuccessEmailProps): { subject: string; html: string } {
  const formattedInterval = billingInterval === "year" ? "Annual" : "Monthly";
  const renewsDateStr = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Next billing cycle";

  const subject = `Your Analytika ${planName} is Active 🚀`;

  const bodyContent = `
    <!-- Header Badge -->
    <div style="text-align:center;margin-bottom:16px;">
      <span style="display:inline-block;padding:4px 12px;border-radius:20px;background-color:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);color:#34d399;font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">
        Subscription Confirmed
      </span>
    </div>

    <!-- Title -->
    <h1 style="margin:0 0 12px 0;font-size:24px;font-weight:800;color:#ffffff;text-align:center;letter-spacing:-0.5px;">
      ${name ? `Thank you, ${name}!` : "Thank you for subscribing!"}
    </h1>

    <p style="margin:0 0 28px 0;font-size:14px;color:#a1a1aa;line-height:1.6;text-align:center;">
      Your payment has been processed and your <strong>${planName}</strong> is fully active with uninterrupted tracking and dedicated analytics capacity.
    </p>

    <!-- Plan Summary Card -->
    <div style="background-color:#121214;border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:20px;margin-bottom:28px;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding-bottom:10px;font-size:13px;color:#71717a;">Plan:</td>
          <td align="right" style="padding-bottom:10px;font-size:13px;font-weight:700;color:#ffffff;">
            ${planName}
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:10px;font-size:13px;color:#71717a;">Billing Cycle:</td>
          <td align="right" style="padding-bottom:10px;font-size:13px;font-weight:700;color:#ffffff;">
            ${formattedInterval}
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:10px;font-size:13px;color:#71717a;">Monthly Event Quota:</td>
          <td align="right" style="padding-bottom:10px;font-size:13px;font-weight:700;color:#34d399;font-family:monospace;">
            ${eventQuota.toLocaleString()} events / mo
          </td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#71717a;">Renews On:</td>
          <td align="right" style="font-size:13px;font-weight:700;color:#ffffff;">
            ${renewsDateStr}
          </td>
        </tr>
      </table>
    </div>

    <!-- CTA Button -->
    <div style="text-align:center;margin-bottom:16px;">
      <a href="${dashboardUrl}" target="_blank" style="display:inline-block;background-color:#800E13;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;box-shadow:0 4px 14px rgba(128,14,19,0.4);letter-spacing:0.2px;">
        Go to Billing & Dashboard &rarr;
      </a>
    </div>
  `;

  return {
    subject,
    html: renderBaseEmailLayout({
      title: subject,
      previewText: `Your ${planName} (${eventQuota.toLocaleString()} events/mo) is active.`,
      children: bodyContent,
    }),
  };
}
