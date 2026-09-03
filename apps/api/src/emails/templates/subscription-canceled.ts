import { renderBaseEmailLayout } from "../base";

export interface SubscriptionCanceledEmailProps {
  name?: string;
  email: string;
  planName: string;
  currentPeriodEnd?: Date | null;
  resumeUrl?: string;
}

export function renderSubscriptionCanceledEmail({
  name,
  email,
  planName,
  currentPeriodEnd,
  resumeUrl = "https://analytika.me/dashboard/settings?tab=billing",
}: SubscriptionCanceledEmailProps): { subject: string; html: string } {
  const periodEndStr = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "the end of your billing period";

  const subject = "Analytika Subscription Cancellation Notice";

  const bodyContent = `
    <!-- Header Badge -->
    <div style="text-align:center;margin-bottom:16px;">
      <span style="display:inline-block;padding:4px 12px;border-radius:20px;background-color:#f3f4f6;border:1px solid #e5e7eb;color:#4b5563;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">
        Cancellation Confirmed
      </span>
    </div>

    <!-- Title -->
    <h1 style="margin:0 0 10px 0;font-size:22px;font-weight:700;color:#111827;text-align:center;letter-spacing:-0.4px;">
      Subscription Canceled
    </h1>

    <p style="margin:0 0 24px 0;font-size:14px;color:#4b5563;line-height:1.6;text-align:center;">
      ${name ? `Hi ${name}, ` : ""}Your <strong>${planName}</strong> subscription has been set to cancel. You will not be charged again.
    </p>

    <!-- Grace Period Card -->
    <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:28px;text-align:center;">
      <p style="margin:0;font-size:13px;color:#374151;line-height:1.6;">
        Your analytics, tracking scripts, and MCP servers will remain <strong>fully active until ${periodEndStr}</strong>.
      </p>
    </div>

    <!-- Resume CTA Button -->
    <div style="text-align:center;">
      <a href="${resumeUrl}" target="_blank" style="display:inline-block;background-color:#111827;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 30px;border-radius:8px;letter-spacing:0.2px;">
        Resume Subscription &rarr;
      </a>
    </div>
  `;

  return {
    subject,
    html: renderBaseEmailLayout({
      title: subject,
      previewText: `Your subscription will remain active until ${periodEndStr}.`,
      children: bodyContent,
    }),
  };
}
