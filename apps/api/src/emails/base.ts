/**
 * Base Dark-Theme Layout for all Analytika Transactional Emails
 */

interface BaseEmailLayoutProps {
  title: string;
  previewText?: string;
  children: string;
  logoUrl?: string;
}

export function renderBaseEmailLayout({
  title,
  previewText,
  children,
  logoUrl = "https://analytika.me/logo.png",
}: BaseEmailLayoutProps): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${previewText ? `<meta name="description" content="${previewText}">` : ""}
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f4f4f5;-webkit-font-smoothing:antialiased;">
  <!-- Preview Text Hack -->
  ${
    previewText
      ? `<div style="display:none;font-size:1px;color:#09090b;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
          ${previewText}
        </div>`
      : ""
  }

  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#09090b;padding:40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:540px;background-color:#18181b;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:40px 32px;box-shadow:0 24px 48px -12px rgba(0,0,0,0.7);">
          
          <!-- Top Header Brand Logo -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <a href="https://analytika.me" target="_blank" style="text-decoration:none;display:inline-flex;align-items:center;gap:10px;">
                <table border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <!-- Crimson Logo Badge -->
                      <div style="width:36px;height:36px;line-height:36px;border-radius:10px;background-color:#800E13;color:#ffffff;font-weight:800;font-size:18px;text-align:center;border:1px solid rgba(255,255,255,0.15);box-shadow:0 4px 12px rgba(128,14,19,0.5);">
                        A
                      </div>
                    </td>
                    <td style="vertical-align:middle;padding-left:10px;">
                      <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                        Analytika
                      </span>
                    </td>
                  </tr>
                </table>
              </a>
            </td>
          </tr>

          <!-- Injected Content Body -->
          <tr>
            <td>
              ${children}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding-top:32px;padding-bottom:24px;">
              <div style="border-top:1px solid rgba(255,255,255,0.06);"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center">
              <p style="margin:0 0 8px 0;font-size:12px;color:#71717a;line-height:1.5;">
                Privacy-First Analytics &bull; Real-time MRR Attribution &bull; MCP AI
              </p>
              <p style="margin:0;font-size:11px;color:#52525b;font-family:monospace;">
                &copy; ${new Date().getFullYear()} Analytika &bull; <a href="https://analytika.me" style="color:#800E13;text-decoration:none;font-weight:600;">analytika.me</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
