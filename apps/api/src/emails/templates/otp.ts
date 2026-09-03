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
    <h1 style="margin:0 0 10px 0;font-size:22px;font-weight:700;color:#111827;text-align:center;letter-spacing:-0.4px;">
      ${isRegister ? `Welcome ${name ? name : "to Analytika"}!` : "Your Verification Code"}
    </h1>

    <!-- Subtitle -->
    <p style="margin:0 0 28px 0;font-size:14px;color:#4b5563;line-height:1.6;text-align:center;">
      ${
        isRegister
          ? "Enter this 6-digit confirmation code to verify your email and activate your account."
          : "Enter this 6-digit code to securely sign in to your Analytika dashboard."
      }
    </p>

    <!-- Code Block -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px 28px;">
        <span style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:32px;font-weight:700;letter-spacing:6px;color:#111827;">
          ${formattedCode}
        </span>
      </div>
    </div>

    <!-- Expiration Notice -->
    <div style="background-color:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;text-align:center;">
      <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5;">
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
