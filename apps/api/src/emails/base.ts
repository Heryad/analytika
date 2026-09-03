/**
 * Base Clean Light-Theme Layout for all Analytika Transactional Emails
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
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;-webkit-font-smoothing:antialiased;">
  <!-- Preheader Text (Hidden in email view, visible in inbox preview) -->
  ${
    previewText
      ? `<div style="display:none;font-size:1px;color:#f9fafb;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
          ${previewText}
        </div>`
      : ""
  }

  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f9fafb;padding:48px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:520px;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:36px 32px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05),0 2px 4px -2px rgba(0,0,0,0.05);">
          
          <!-- Top Header Brand Logo -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <a href="https://analytika.me" target="_blank" style="text-decoration:none;display:inline-block;">
                <table border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <img src="${logoUrl}" alt="Analytika" width="34" height="34" style="display:block;width:34px;height:34px;border:0;outline:none;" />
                    </td>
                    <td style="vertical-align:middle;padding-left:10px;">
                      <span style="font-size:20px;font-weight:700;color:#111827;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
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
              <div style="border-top:1px solid #f3f4f6;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center">
              <p style="margin:0 0 6px 0;font-size:12px;color:#9ca3af;line-height:1.5;">
                Privacy-First Analytics &bull; Revenue Attribution &bull; Remote MCP AI
              </p>
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                &copy; ${new Date().getFullYear()} Analytika Inc. &bull; <a href="https://analytika.me" style="color:#800E13;text-decoration:none;font-weight:600;">analytika.me</a>
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
