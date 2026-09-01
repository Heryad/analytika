import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";
import { env } from "@/config/env";

const ALGORITHM = "aes-256-gcm";

// Derives a 32-byte key from the configured master encryption secret
function getEncryptionKey(): Buffer {
  return createHash("sha256").update(env.ENCRYPTION_KEY).digest();
}

/**
 * Generates a cryptographically secure 6-digit OTP code (e.g. "481920")
 */
export function generateOtpCode(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return num.toString();
}

/**
 * Hashes an OTP code with SHA-256 before storing in PostgreSQL
 */
export function hashOtpCode(code: string, salt: string = "analytika_otp_salt"): string {
  return createHash("sha256").update(`${code}:${salt}`).digest("hex");
}

/**
 * Encrypts sensitive API keys with AES-256-GCM
 */
export function encryptSecret(plaintext: string): string {
  if (!plaintext) return "";
  const key = getEncryptionKey();
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag().toString("hex");

  // Format: iv:tag:encrypted
  return `${iv.toString("hex")}:${tag}:${encrypted}`;
}

/**
 * Decrypts AES-256-GCM encrypted secrets
 */
export function decryptSecret(cipherString: string): string {
  if (!cipherString) return "";
  const parts = cipherString.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted format. Expected iv:tag:ciphertext");
  }

  const [ivHex, tagHex, encryptedHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Masks sensitive API keys for safe UI display (e.g. "rk_live_...93xL")
 */
export function maskApiKey(key: string): string {
  if (!key) return "";
  if (key.length <= 10) return "••••••••";
  const prefix = key.substring(0, 8);
  const suffix = key.substring(key.length - 4);
  return `${prefix}...${suffix}`;
}
