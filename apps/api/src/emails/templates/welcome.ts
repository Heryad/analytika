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
      <span style="display:inline-block;padding:4px 12px;border-radius:20px;background-color:rgba(128,14,19,0.2);border:1px solid rgba(128,14,19,0.4);color:#f87171;font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">
        14-Day Pro Trial Active
      </span>
    </div>

    <!-- Title -->
    <h1 style="margin:0 0 12px 0;font-size:24px;font-weight:800;color:#ffffff;text-align:center;letter-spacing:-0.5px;">
      ${greeting}
    </h1>

    <p style="margin:0 0 28px 0;font-size:14px;color:#a1a1aa;line-height:1.6;text-align:center;">
      You now have complete access to privacy-friendly analytics, real-time live pulse maps, multi-step conversion funnels, and MRR revenue attribution.
    </p>

    <!-- 3 Step Quick Start Card -->
    <div style="background-color:#121214;border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:20px;margin-bottom:28px;">
      <h3 style="margin:0 0 14px 0;font-size:13px;font-weight:700;color:#e4e4e7;text-transform:uppercase;letter-spacing:0.5px;">
        3 Steps to Get Started:
      </h3>

      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td style="vertical-align:top;width:28px;padding-bottom:12px;">
            <div style="width:20px;height:20px;line-height:20px;border-radius:50%;background-color:#800E13;color:#ffffff;font-size:11px;font-weight:bold;text-align:center;">1</div>
          </td>
          <td style="vertical-align:top;padding-bottom:12px;">
            <strong style="color:#ffffff;font-size:13px;">Add Your Website Domain</strong>
            <p style="margin:2px 0 0 0;font-size:12px;color:#71717a;">Create your tracking site in less than 10 seconds.</p>
          </td>
        </tr>

        <tr>
          <td style="vertical-align:top;width:28px;padding-bottom:12px;">
            <div style="width:20px;height:20px;line-height:20px;border-radius:50%;background-color:#800E13;color:#ffffff;font-size:11px;font-weight:bold;text-align:center;">2</div>
          </td>
          <td style="vertical-align:top;padding-bottom:12px;">
            <strong style="color:#ffffff;font-size:13px;">Embed the &lt; 1KB Script</strong>
            <p style="margin:2px 0 0 0;font-size:12px;color:#71717a;">Paste our lightweight snippet or use the React/Next.js package.</p>
          </td>
        </tr>

        <tr>
          <td style="vertical-align:top;width:28px;">
            <div style="width:20px;height:20px;line-height:20px;border-radius:50%;background-color:#800E13;color:#ffffff;font-size:11px;font-weight:bold;text-align:center;">3</div>
          </td>
          <td style="vertical-align:top;">
            <strong style="color:#ffffff;font-size:13px;">Watch Real-Time Visitors</strong>
            <p style="margin:2px 0 0 0;font-size:12px;color:#71717a;">Watch live pageviews, UTM channels, and MRR conversions stream in.</p>
          </td>
        </tr>
      </table>
    </div>

    <!-- CTA Button -->
    <div style="text-align:center;margin-bottom:16px;">
      <a href="${dashboardUrl}" target="_blank" style="display:inline-block;background-color:#800E13;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;box-shadow:0 4px 14px rgba(128,14,19,0.4);letter-spacing:0.2px;">
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
