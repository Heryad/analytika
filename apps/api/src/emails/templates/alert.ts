import { renderBaseEmailLayout } from "../base";

export interface AlertEmailProps {
  alertName: string;
  eventName: string;
  websiteDomain: string;
  subject?: string;
  customBody?: string;
  metadata?: {
    visitorName?: string;
    visitorEmail?: string;
    location?: string;
    source?: string;
    device?: string;
    revenue?: string;
    timestamp?: string;
  };
  dashboardUrl?: string;
}

export function renderAlertEmail({
  alertName,
  eventName,
  websiteDomain,
  subject: customSubject,
  customBody,
  metadata = {},
  dashboardUrl = "https://analytika.me/dashboard",
}: AlertEmailProps): { subject: string; html: string } {
  const subject =
    customSubject ||
    `[Alert] ${alertName} on ${websiteDomain} (${metadata.location || "Global"})`;

  const bodyContent = `
    <!-- Top Alert Badge -->
    <div style="text-align:center;margin-bottom:16px;">
      <span style="display:inline-block;padding:4px 12px;border-radius:20px;background-color:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.3);color:#fbbf24;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">
        ⚡ Real-Time Trigger: ${eventName}
      </span>
    </div>

    <!-- Title -->
    <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:800;color:#ffffff;text-align:center;">
      ${alertName}
    </h1>

    <p style="margin:0 0 24px 0;font-size:13px;color:#a1a1aa;text-align:center;">
      Detected on <strong style="color:#ffffff;">${websiteDomain}</strong> &bull; ${metadata.timestamp || new Date().toUTCString()}
    </p>

    <!-- Custom Body if provided -->
    ${
      customBody
        ? `<div style="background-color:#121214;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px 20px;margin-bottom:24px;font-size:13px;color:#d4d4d8;line-height:1.6;white-space:pre-wrap;">${customBody}</div>`
        : ""
    }

    <!-- Metadata Key-Value Table -->
    <div style="background-color:#121214;border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:18px 20px;margin-bottom:28px;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        ${
          metadata.visitorName || metadata.visitorEmail
            ? `
        <tr>
          <td style="padding:6px 0;font-size:12px;color:#71717a;width:120px;">Customer</td>
          <td style="padding:6px 0;font-size:13px;color:#ffffff;font-weight:600;">
            ${metadata.visitorName || "Anonymous"} ${metadata.visitorEmail ? `(${metadata.visitorEmail})` : ""}
          </td>
        </tr>`
            : ""
        }

        ${
          metadata.revenue
            ? `
        <tr>
          <td style="padding:6px 0;font-size:12px;color:#71717a;">Revenue Amount</td>
          <td style="padding:6px 0;font-size:14px;color:#34d399;font-weight:800;font-family:monospace;">
            ${metadata.revenue}
          </td>
        </tr>`
            : ""
        }

        ${
          metadata.location
            ? `
        <tr>
          <td style="padding:6px 0;font-size:12px;color:#71717a;">Location</td>
          <td style="padding:6px 0;font-size:13px;color:#ffffff;">
            📍 ${metadata.location}
          </td>
        </tr>`
            : ""
        }

        ${
          metadata.source
            ? `
        <tr>
          <td style="padding:6px 0;font-size:12px;color:#71717a;">Traffic Source</td>
          <td style="padding:6px 0;font-size:13px;color:#ffffff;font-family:monospace;">
            🌐 ${metadata.source}
          </td>
        </tr>`
            : ""
        }

        ${
          metadata.device
            ? `
        <tr>
          <td style="padding:6px 0;font-size:12px;color:#71717a;">Device / OS</td>
          <td style="padding:6px 0;font-size:13px;color:#ffffff;">
            💻 ${metadata.device}
          </td>
        </tr>`
            : ""
        }
      </table>
    </div>

    <!-- CTA Button -->
    <div style="text-align:center;">
      <a href="${dashboardUrl}" target="_blank" style="display:inline-block;background-color:#800E13;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:10px;box-shadow:0 4px 14px rgba(128,14,19,0.4);">
        View Event in Dashboard &rarr;
      </a>
    </div>
  `;

  return {
    subject,
    html: renderBaseEmailLayout({
      title: subject,
      previewText: `New event detected: ${alertName} on ${websiteDomain}`,
      children: bodyContent,
    }),
  };
}
