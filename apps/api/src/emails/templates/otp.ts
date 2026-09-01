import { renderBaseEmailLayout } from "../base";

interface OtpEmailProps {
  code: string;
  type: "login" | "register";
  name?: string;
}

export function renderOtpEmail({ code, type, name }: OtpEmailProps): { subject: string; html: string } {
  const isRegister = type === "register";
  const formattedCode = `${code.slice(0, 3)} ${code.slice(3)}`;

  const subject = isRegister
    ? `Welcome to Analytika! Your verification code is ${code}`
    : `Your Analytika Login Code: ${code}`;

  const bodyContent = `
    <!-- Title -->
    <h1 style="margin:0 0 10px 0;font-size:22px;font-weight:700;color:#ffffff;text-align:center;">
      ${isRegister ? `Welcome ${name ? name : "to Analytika"}!` : "Your Login Verification Code"}
    </h1>

    <!-- Subtitle -->
    <p style="margin:0 0 28px 0;font-size:14px;color:#a1a1aa;line-height:1.6;text-align:center;">
      ${
        isRegister
          ? "Enter this 6-digit confirmation code to verify your email and activate your <strong>14-day full Pro trial</strong>."
          : "Enter this 6-digit code to securely sign in to your Analytika dashboard."
      }
    </p>

    <!-- Code Block -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background-color:#09090b;border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:18px 28px;box-shadow:inset 0 2px 4px rgba(0,0,0,0.6);">
        <span style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:34px;font-weight:800;letter-spacing:8px;color:#ffffff;">
          ${formattedCode}
        </span>
      </div>
    </div>

    <!-- Expiration Warning -->
    <div style="background-color:rgba(128,14,19,0.08);border:1px solid rgba(128,14,19,0.25);border-radius:10px;padding:12px 16px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#fca5a5;line-height:1.4;">
        ⏱ This code expires in <strong>10 minutes</strong>. If you did not request this, you can safely ignore this email.
      </p>
    </div>
  `;

  return {
    subject,
    html: renderBaseEmailLayout({
      title: subject,
      previewText: `Your verification code is ${formattedCode}`,
      children: bodyContent,
    }),
  };
}
