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
      <span style="display:inline-block;padding:4px 12px;border-radius:20px;background-color:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);color:#f87171;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">
        Soft Quota Threshold Reached
      </span>
    </div>

    <!-- Title -->
    <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:800;color:#ffffff;text-align:center;">
      You've Reached Your Event Limit
    </h1>

    <p style="margin:0 0 24px 0;font-size:14px;color:#a1a1aa;line-height:1.6;text-align:center;">
      ${userName ? `Hi ${userName}, ` : ""}Your websites have generated <strong style="color:#ffffff;">${currentUsage.toLocaleString()} events</strong> this month, reaching 100% of your <strong>${planName}</strong> plan limit.
    </p>

    <!-- Usage Progress Box -->
    <div style="background-color:#121214;border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:20px;margin-bottom:24px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:12px;color:#a1a1aa;">
        <span>Usage This Billing Period</span>
        <strong style="color:#f87171;">${percentage}% (${currentUsage.toLocaleString()} / ${eventQuota.toLocaleString()})</strong>
      </div>
      
      <!-- Progress Bar -->
      <div style="width:100%;height:8px;background-color:#27272a;border-radius:4px;overflow:hidden;">
        <div style="width:100%;height:100%;background-color:#800E13;border-radius:4px;"></div>
      </div>
    </div>

    <!-- Soft Limit Guarantee Box -->
    <div style="background-color:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);border-radius:12px;padding:14px 18px;margin-bottom:28px;">
      <p style="margin:0;font-size:13px;color:#6ee7b7;line-height:1.5;">
        🛡 <strong>Analytika Soft Limit Policy:</strong> We never drop or discard your visitor tracking data during traffic spikes. Your analytics remain 100% live. Please upgrade your volume tier to maintain uninterrupted service.
      </p>
    </div>

    <!-- Upgrade CTA -->
    <div style="text-align:center;">
      <a href="${upgradeUrl}" target="_blank" style="display:inline-block;background-color:#800E13;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;box-shadow:0 4px 14px rgba(128,14,19,0.4);">
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
