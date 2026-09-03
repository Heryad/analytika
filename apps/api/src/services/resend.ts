import { Resend } from "resend";
import { env } from "@/config/env";
import { logger } from "@/lib/logger";
import {
  renderOtpEmail,
  renderWelcomeEmail,
  renderAlertEmail,
  renderQuotaNoticeEmail,
  renderSubscriptionSuccessEmail,
  renderTrialExpiringEmail,
  renderSubscriptionCanceledEmail,
  renderAccountDeletedEmail,
  AlertEmailProps,
  SubscriptionSuccessEmailProps,
  TrialExpiringEmailProps,
  SubscriptionCanceledEmailProps,
  AccountDeletedEmailProps,
} from "@/emails";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
const FROM_EMAIL = env.RESEND_FROM_EMAIL || "Analytika <noreply@analytika.me>";

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
 * 5. Send Subscription Activated / Tier Upgraded Email
 */
export async function sendSubscriptionSuccessEmail(
  props: SubscriptionSuccessEmailProps
): Promise<BaseEmailResult> {
  const { subject, html } = renderSubscriptionSuccessEmail(props);
  return sendMail(props.email, subject, html);
}

/**
 * 6. Send Trial Expiring Notice Email (3 Days Remaining)
 */
export async function sendTrialExpiringEmail(
  props: TrialExpiringEmailProps
): Promise<BaseEmailResult> {
  const { subject, html } = renderTrialExpiringEmail(props);
  return sendMail(props.email, subject, html);
}

/**
 * 7. Send Subscription Canceled Email
 */
export async function sendSubscriptionCanceledEmail(
  props: SubscriptionCanceledEmailProps
): Promise<BaseEmailResult> {
  const { subject, html } = renderSubscriptionCanceledEmail(props);
  return sendMail(props.email, subject, html);
}

/**
 * 8. Send Account Deleted Confirmation Email
 */
export async function sendAccountDeletedEmail(
  props: AccountDeletedEmailProps
): Promise<BaseEmailResult> {
  const { subject, html } = renderAccountDeletedEmail(props);
  return sendMail(props.email, subject, html);
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
