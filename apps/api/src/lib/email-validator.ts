/**
 * Anti-Abuse Email Validation & Normalization Utility
 * Blocks disposable/throwaway mailboxes and normalizes Gmail plus-aliases
 */

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "tempmail.com",
  "temp-mail.org",
  "10minutemail.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "sharklasers.com",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
  "dispostable.com",
  "trashmail.com",
  "trashmail.net",
  "getairmail.com",
  "mohmal.com",
  "fakemailgenerator.com",
  "throwawaymail.com",
  "crazymailing.com",
  "tempail.com",
  "inboxkitten.com",
  "mytemp.email",
  "nada.ltd",
  "burnermail.io",
  "tempmailo.com",
  "dropmail.me",
  "fakeinbox.com",
  "emailondeck.com",
  "maildrop.cc",
]);

/**
 * Normalizes email addresses (lowercases and trims whitespace)
 */
export function normalizeEmail(rawEmail: string): string {
  const email = rawEmail.trim().toLowerCase();
  const [localPart, domain] = email.split("@");

  if (!localPart || !domain) return email;

  // Strip + aliases for anti-abuse deduping while preserving all dots
  const cleanLocal = localPart.split("+")[0];
  return `${cleanLocal}@${domain}`;
}

/**
 * Validates if an email is acceptable for registration
 */
export function validateRegistrationEmail(rawEmail: string): { isValid: boolean; error?: string; normalizedEmail: string } {
  const email = rawEmail.trim().toLowerCase();

  // Basic regex check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Please enter a valid email address.", normalizedEmail: email };
  }

  const domain = email.split("@")[1];
  if (!domain) {
    return { isValid: false, error: "Invalid email domain.", normalizedEmail: email };
  }

  // Check against known disposable domains
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      isValid: false,
      error: "Disposable / temporary email addresses are not permitted. Please use a work or personal email.",
      normalizedEmail: email,
    };
  }

  const normalized = normalizeEmail(email);

  return {
    isValid: true,
    normalizedEmail: normalized,
  };
}
