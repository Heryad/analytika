import { renderBaseEmailLayout } from "../base";

interface QuotaNoticeEmailProps {
  userName?: string;
  currentUsage: number;
  eventQuota: number;
  planName: string;
  upgradeUrl?: string;
}

export function renderQuotaNoticeEmail({
  userName,
  currentUsage,
  eventQuota,
  planName,
  upgradeUrl = "https://analytika.me/dashboard/settings?tab=billing",
}: QuotaNoticeEmailProps): { subject: string; html: string } {
  const percentage = Math.round((currentUsage / eventQuota) * 100);
  const subject = `⚠️ Monthly Event Quota Alert: ${percentage}% reached (${planName} Plan)`;

  const bodyContent = `
    <!-- Top Warning Badge -->
    <div style="text-align:center;margin-bottom:16px;">
      <span style="display:inline-block;padding:4px 12px;border-radius:20px;background-color:#fff1f2;border:1px solid #fecdd3;color:#9f1239;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">
        Soft Quota Threshold Reached
      </span>
    </div>

    <!-- Title -->
    <h1 style="margin:0 0 10px 0;font-size:22px;font-weight:700;color:#111827;text-align:center;letter-spacing:-0.4px;">
      You've Reached Your Event Limit
    </h1>

    <p style="margin:0 0 24px 0;font-size:14px;color:#4b5563;line-height:1.6;text-align:center;">
      ${userName ? `Hi ${userName}, ` : ""}Your websites have generated <strong style="color:#111827;">${currentUsage.toLocaleString()} events</strong> this month, reaching 100% of your <strong>${planName}</strong> plan limit.
    </p>

    <!-- Usage Progress Box -->
    <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:24px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:10px;font-size:13px;color:#4b5563;">
        <span>Usage This Period:</span>
        <strong style="color:#991b1b;">${percentage}% (${currentUsage.toLocaleString()} / ${eventQuota.toLocaleString()})</strong>
      </div>
      
      <!-- Progress Bar -->
      <div style="width:100%;height:8px;background-color:#e5e7eb;border-radius:4px;overflow:hidden;">
        <div style="width:100%;height:100%;background-color:#800E13;border-radius:4px;"></div>
      </div>
    </div>

    <!-- Soft Limit Guarantee Box -->
    <div style="background-color:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:14px 18px;margin-bottom:28px;">
      <p style="margin:0;font-size:13px;color:#065f46;line-height:1.5;">
        🛡 <strong>Analytika Soft Limit Policy:</strong> We never drop or discard your visitor tracking data during traffic spikes. Your analytics remain 100% live. Please upgrade your volume tier to maintain uninterrupted service.
      </p>
    </div>

    <!-- Upgrade CTA -->
    <div style="text-align:center;">
      <a href="${upgradeUrl}" target="_blank" style="display:inline-block;background-color:#800E13;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 30px;border-radius:8px;letter-spacing:0.2px;">
        Upgrade Event Tier &rarr;
      </a>
    </div>
  `;

  return {
    subject,
    html: renderBaseEmailLayout({
      title: subject,
      previewText: "You have reached your monthly tracked event quota.",
      children: bodyContent,
    }),
  };
}
