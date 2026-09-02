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
      <span style="display:inline-block;padding:4px 12px;border-radius:20px;background-color:rgba(113,113,122,0.2);border:1px solid rgba(113,113,122,0.3);color:#a1a1aa;font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">
        Cancellation Confirmed
      </span>
    </div>

    <!-- Title -->
    <h1 style="margin:0 0 12px 0;font-size:24px;font-weight:800;color:#ffffff;text-align:center;letter-spacing:-0.5px;">
      Subscription Canceled
    </h1>

    <p style="margin:0 0 24px 0;font-size:14px;color:#a1a1aa;line-height:1.6;text-align:center;">
      ${name ? `Hi ${name}, ` : ""}Your <strong>${planName}</strong> subscription has been set to cancel. You will not be charged again.
    </p>

    <!-- Grace Period Card -->
    <div style="background-color:#121214;border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:20px;margin-bottom:28px;">
      <p style="margin:0;font-size:13px;color:#d4d4d8;line-height:1.6;">
        Your analytics, tracking scripts, and MCP servers will remain <strong>fully active until ${periodEndStr}</strong>.
      </p>
    </div>

    <!-- Resume CTA Button -->
    <div style="text-align:center;margin-bottom:16px;">
      <a href="${resumeUrl}" target="_blank" style="display:inline-block;background-color:#27272a;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);letter-spacing:0.2px;">
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
