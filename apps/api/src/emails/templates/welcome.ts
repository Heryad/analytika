import { renderBaseEmailLayout } from "../base";

interface WelcomeEmailProps {
  name?: string;
  email: string;
  dashboardUrl?: string;
}

export function renderWelcomeEmail({
  name,
  email,
  dashboardUrl = "https://analytika.me/dashboard",
}: WelcomeEmailProps): { subject: string; html: string } {
  const greeting = name ? `Welcome aboard, ${name}!` : "Welcome to Analytika!";
  const subject = "Welcome to Analytika — Your 14-Day Pro Trial is Active 🚀";

  const bodyContent = `
    <!-- Header Badge -->
    <div style="text-align:center;margin-bottom:16px;">
      <span style="display:inline-block;padding:4px 12px;border-radius:20px;background-color:#fff1f2;border:1px solid #fecdd3;color:#9f1239;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">
        14-Day Pro Trial Active
      </span>
    </div>

    <!-- Title -->
    <h1 style="margin:0 0 10px 0;font-size:22px;font-weight:700;color:#111827;text-align:center;letter-spacing:-0.4px;">
      ${greeting}
    </h1>

    <p style="margin:0 0 24px 0;font-size:14px;color:#4b5563;line-height:1.6;text-align:center;">
      You now have complete access to privacy-friendly analytics, real-time live visitor maps, multi-step conversion funnels, and MRR revenue attribution.
    </p>

    <!-- 3 Step Quick Start Card -->
    <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:28px;">
      <h3 style="margin:0 0 16px 0;font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">
        3 Steps to Get Started:
      </h3>

      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td style="vertical-align:top;width:28px;padding-bottom:14px;">
            <div style="width:22px;height:22px;line-height:22px;border-radius:50%;background-color:#800E13;color:#ffffff;font-size:11px;font-weight:bold;text-align:center;">1</div>
          </td>
          <td style="vertical-align:top;padding-bottom:14px;padding-left:8px;">
            <strong style="color:#111827;font-size:13px;">Add Your Website Domain</strong>
            <p style="margin:2px 0 0 0;font-size:12px;color:#6b7280;line-height:1.5;">Create your tracking site in your dashboard in less than 10 seconds.</p>
          </td>
        </tr>

        <tr>
          <td style="vertical-align:top;width:28px;padding-bottom:14px;">
            <div style="width:22px;height:22px;line-height:22px;border-radius:50%;background-color:#800E13;color:#ffffff;font-size:11px;font-weight:bold;text-align:center;">2</div>
          </td>
          <td style="vertical-align:top;padding-bottom:14px;padding-left:8px;">
            <strong style="color:#111827;font-size:13px;">Embed the Tracking Script</strong>
            <p style="margin:2px 0 0 0;font-size:12px;color:#6b7280;line-height:1.5;">Add our lightweight script or install the <code>@analytika-me/tracker</code> package.</p>
          </td>
        </tr>

        <tr>
          <td style="vertical-align:top;width:28px;">
            <div style="width:22px;height:22px;line-height:22px;border-radius:50%;background-color:#800E13;color:#ffffff;font-size:11px;font-weight:bold;text-align:center;">3</div>
          </td>
          <td style="vertical-align:top;padding-left:8px;">
            <strong style="color:#111827;font-size:13px;">Watch Real-Time Visitors</strong>
            <p style="margin:2px 0 0 0;font-size:12px;color:#6b7280;line-height:1.5;">Watch live pageviews, traffic sources, and revenue conversions stream in.</p>
          </td>
        </tr>
      </table>
    </div>

    <!-- CTA Button -->
    <div style="text-align:center;">
      <a href="${dashboardUrl}" target="_blank" style="display:inline-block;background-color:#800E13;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 30px;border-radius:8px;letter-spacing:0.2px;">
        Open Your Dashboard &rarr;
      </a>
    </div>
  `;

  return {
    subject,
    html: renderBaseEmailLayout({
      title: subject,
      previewText: "Your 14-day full Pro trial is active. Let's get tracking!",
      children: bodyContent,
    }),
  };
}
