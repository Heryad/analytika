import { renderBaseEmailLayout } from "../base";

export interface AccountDeletedEmailProps {
  name?: string;
  email: string;
}

export function renderAccountDeletedEmail({
  name,
  email,
}: AccountDeletedEmailProps): { subject: string; html: string } {
  const subject = "Your Analytika Account Has Been Deleted";

  const bodyContent = `
    <!-- Header Badge -->
    <div style="text-align:center;margin-bottom:16px;">
      <span style="display:inline-block;padding:4px 12px;border-radius:20px;background-color:#fef2f2;border:1px solid #fecaca;color:#991b1b;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">
        Account Closed
      </span>
    </div>

    <!-- Title -->
    <h1 style="margin:0 0 10px 0;font-size:22px;font-weight:700;color:#111827;text-align:center;letter-spacing:-0.4px;">
      Account & Data Removed
    </h1>

    <p style="margin:0 0 24px 0;font-size:14px;color:#4b5563;line-height:1.6;text-align:center;">
      ${name ? `Hi ${name}, ` : ""}This is confirmation that your Analytika account (<strong>${email}</strong>) and all associated website data, tracking configurations, and payment keys have been permanently removed.
    </p>

    <!-- Confirmation Notice -->
    <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:18px 20px;margin-bottom:24px;text-align:center;">
      <p style="margin:0;font-size:13px;color:#4b5563;line-height:1.6;">
        If you didn't request this or have questions, please reply directly to this email to reach our support team.
      </p>
    </div>
  `;

  return {
    subject,
    html: renderBaseEmailLayout({
      title: subject,
      previewText: "Your Analytika account and data have been permanently removed.",
      children: bodyContent,
    }),
  };
}
