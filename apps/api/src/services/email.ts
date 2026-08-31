import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM_EMAIL || "auth@analytika.dev";
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendOtpEmail(email: string, code: string): Promise<boolean> {
  // If no API key configured (e.g. in local development), log to console for instant testing
  if (!resend || !resendApiKey) {
    console.log("--------------------------------------------------");
    console.log(`🔑 [DEVELOPMENT OTP] To: ${email} | Code: ${code}`);
    console.log("--------------------------------------------------");
    return true;
  }

  try {
    const { error } = await resend.emails.send({
      from: `Analytika <${resendFrom}>`,
      to: [email],
      subject: `Your Analytika Login Code: ${code}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb;">
          <div style="margin-bottom: 24px; text-align: center;">
            <h2 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0;">Analytika</h2>
            <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Next-Generation Web Analytics</p>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 24px;">Use the following one-time verification code to sign in to your dashboard:</p>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #4f46e5;">${code}</span>
          </div>
          <p style="color: #6b7280; font-size: 13px; line-height: 20px;">This code will expire in 10 minutes. If you did not request this login code, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error("❌ Resend error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("❌ Failed to send OTP email via Resend:", err);
    return false;
  }
}
