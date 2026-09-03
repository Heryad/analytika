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
      <span style="display:inline-block;padding:4px 12px;border-radius:20px;background-color:#ecfdf5;border:1px solid #a7f3d0;color:#065f46;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">
        Subscription Active
      </span>
    </div>

    <!-- Title -->
    <h1 style="margin:0 0 10px 0;font-size:22px;font-weight:700;color:#111827;text-align:center;letter-spacing:-0.4px;">
      ${name ? `Thank you, ${name}!` : "Thank you for subscribing!"}
    </h1>

    <p style="margin:0 0 24px 0;font-size:14px;color:#4b5563;line-height:1.6;text-align:center;">
      Your payment has been processed and your <strong>${planName}</strong> is fully active with uninterrupted tracking and dedicated analytics capacity.
    </p>

    <!-- Plan Summary / Receipt Card -->
    <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:28px;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding-bottom:10px;font-size:13px;color:#6b7280;">Plan:</td>
          <td align="right" style="padding-bottom:10px;font-size:13px;font-weight:600;color:#111827;">
            ${planName}
          </td>
        </tr>
        <tr>
          <td style="padding-top:10px;padding-bottom:10px;border-top:1px solid #f3f4f6;font-size:13px;color:#6b7280;">Billing Cycle:</td>
          <td align="right" style="padding-top:10px;padding-bottom:10px;border-top:1px solid #f3f4f6;font-size:13px;font-weight:600;color:#111827;">
            ${formattedInterval}
          </td>
        </tr>
        <tr>
          <td style="padding-top:10px;padding-bottom:10px;border-top:1px solid #f3f4f6;font-size:13px;color:#6b7280;">Monthly Event Quota:</td>
          <td align="right" style="padding-top:10px;padding-bottom:10px;border-top:1px solid #f3f4f6;font-size:13px;font-weight:700;color:#059669;font-family:monospace;">
            ${eventQuota.toLocaleString()} events / mo
          </td>
        </tr>
        <tr>
          <td style="padding-top:10px;border-top:1px solid #f3f4f6;font-size:13px;color:#6b7280;">Renews On:</td>
          <td align="right" style="padding-top:10px;border-top:1px solid #f3f4f6;font-size:13px;font-weight:600;color:#111827;">
            ${renewsDateStr}
          </td>
        </tr>
      </table>
    </div>

    <!-- CTA Button -->
    <div style="text-align:center;">
      <a href="${dashboardUrl}" target="_blank" style="display:inline-block;background-color:#800E13;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 30px;border-radius:8px;letter-spacing:0.2px;">
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
