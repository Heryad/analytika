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
      <span style="display:inline-block;padding:4px 12px;border-radius:20px;background-color:#fffbeb;border:1px solid #fde68a;color:#92400e;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">
        ⚡ Trigger: ${eventName}
      </span>
    </div>

    <!-- Title -->
    <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#111827;text-align:center;letter-spacing:-0.4px;">
      ${alertName}
    </h1>

    <p style="margin:0 0 24px 0;font-size:13px;color:#6b7280;text-align:center;">
      Detected on <strong style="color:#111827;">${websiteDomain}</strong> &bull; ${metadata.timestamp || new Date().toUTCString()}
    </p>

    <!-- Custom Body if provided -->
    ${
      customBody
        ? `<div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px 20px;margin-bottom:24px;font-size:13px;color:#374151;line-height:1.6;white-space:pre-wrap;">${customBody}</div>`
        : ""
    }

    <!-- Metadata Key-Value Table -->
    <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px 20px;margin-bottom:28px;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        ${
          metadata.visitorName || metadata.visitorEmail
            ? `
        <tr>
          <td style="padding:6px 0;font-size:12px;color:#6b7280;width:120px;">Customer</td>
          <td style="padding:6px 0;font-size:13px;color:#111827;font-weight:600;">
            ${metadata.visitorName || "Anonymous"} ${metadata.visitorEmail ? `(${metadata.visitorEmail})` : ""}
          </td>
        </tr>`
            : ""
        }

        ${
          metadata.revenue
            ? `
        <tr>
          <td style="padding:6px 0;font-size:12px;color:#6b7280;">Revenue Amount</td>
          <td style="padding:6px 0;font-size:14px;color:#059669;font-weight:700;font-family:monospace;">
            ${metadata.revenue}
          </td>
        </tr>`
            : ""
        }

        ${
          metadata.location
            ? `
        <tr>
          <td style="padding:6px 0;font-size:12px;color:#6b7280;">Location</td>
          <td style="padding:6px 0;font-size:13px;color:#111827;">
            📍 ${metadata.location}
          </td>
        </tr>`
            : ""
        }

        ${
          metadata.source
            ? `
        <tr>
          <td style="padding:6px 0;font-size:12px;color:#6b7280;">Traffic Source</td>
          <td style="padding:6px 0;font-size:13px;color:#111827;font-family:monospace;">
            🌐 ${metadata.source}
          </td>
        </tr>`
            : ""
        }

        ${
          metadata.device
            ? `
        <tr>
          <td style="padding:6px 0;font-size:12px;color:#6b7280;">Device / OS</td>
          <td style="padding:6px 0;font-size:13px;color:#111827;">
            💻 ${metadata.device}
          </td>
        </tr>`
            : ""
        }
      </table>
    </div>

    <!-- CTA Button -->
    <div style="text-align:center;">
      <a href="${dashboardUrl}" target="_blank" style="display:inline-block;background-color:#800E13;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;letter-spacing:0.2px;">
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
