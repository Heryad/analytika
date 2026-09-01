import { Resend } from "resend";
import { env } from "@/config/env";
import { logger } from "@/lib/logger";
import {
  renderOtpEmail,
  renderWelcomeEmail,
  renderAlertEmail,
  renderQuotaNoticeEmail,
  AlertEmailProps,
} from "@/emails";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
const FROM_EMAIL = env.RESEND_FROM_EMAIL || "Analytika <auth@analytika.me>";

interface BaseEmailResult {
  success: boolean;
  error?: string;
  id?: string;
}

/**
 * 1. Send 6-Digit OTP Verification Email (Login / Register)
 */
export async function sendOtpEmail({
  email,
  code,
  type,
  name,
}: {
  email: string;
  code: string;
  type: "login" | "register";
  name?: string;
}): Promise<BaseEmailResult> {
  const { subject, html } = renderOtpEmail({ code, type, name });
  return sendMail(email, subject, html);
}

/**
 * 2. Send Welcome & 14-Day Trial Activation Email
 */
export async function sendWelcomeEmail({
  email,
  name,
  dashboardUrl,
}: {
  email: string;
  name?: string;
  dashboardUrl?: string;
}): Promise<BaseEmailResult> {
  const { subject, html } = renderWelcomeEmail({ email, name, dashboardUrl });
  return sendMail(email, subject, html);
}

/**
 * 3. Send Real-Time Custom Event Alert Email
 */
export async function sendAlertEmail(
  recipientEmail: string,
  props: AlertEmailProps
): Promise<BaseEmailResult> {
  const { subject, html } = renderAlertEmail(props);
  return sendMail(recipientEmail, subject, html);
}

/**
 * 4. Send Soft Quota Notice Email (100% Volume Reached)
 */
export async function sendQuotaNoticeEmail({
  email,
  userName,
  currentUsage,
  eventQuota,
  planName,
}: {
  email: string;
  userName?: string;
  currentUsage: number;
  eventQuota: number;
  planName: string;
}): Promise<BaseEmailResult> {
  const { subject, html } = renderQuotaNoticeEmail({
    userName,
    currentUsage,
    eventQuota,
    planName,
  });
  return sendMail(email, subject, html);
}

/**
 * Internal helper to dispatch via Resend
 */
async function sendMail(to: string, subject: string, html: string): Promise<BaseEmailResult> {
  if (!resend) {
    logger.warn(`[DEV MODE] Resend API key not set. Email to: ${to} | Subject: "${subject}"`);
    return { success: true };
  }

  try {
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (response.error) {
      logger.error(`Resend API Error sending to ${to}:`, response.error);
      return { success: false, error: response.error.message };
    }

    logger.success(`Email sent to ${to} (ID: ${response.data?.id})`);
    return { success: true, id: response.data?.id };
  } catch (error: any) {
    logger.error(`Exception while sending email to ${to}:`, error);
    return { success: false, error: error.message || "Failed to dispatch email" };
  }
}
