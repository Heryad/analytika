export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 4000),
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3001",

  // PostgreSQL Database
  DATABASE_URL:
    process.env.DATABASE_URL || "postgres://postgres:postgrespassword@localhost:5432/analytika",

  // ClickHouse Analytics Database
  CLICKHOUSE_HOST: process.env.CLICKHOUSE_HOST || "http://localhost:8123",
  CLICKHOUSE_USER: process.env.CLICKHOUSE_USER || "default",
  CLICKHOUSE_PASSWORD: process.env.CLICKHOUSE_PASSWORD || "clickhousepassword",
  CLICKHOUSE_DB: process.env.CLICKHOUSE_DB || "analytika",

  // JWT Secret for sessions
  JWT_SECRET: process.env.JWT_SECRET || "analytika_super_secure_jwt_secret_key_2026_x99",

  // Master Encryption Key (32-character hex/string for AES-256-GCM of revenue keys)
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || "analytika_aes256_master_key_99x",

  // Resend Transactional Email Service
  RESEND_API_KEY: process.env.RESEND_API_KEY || "",
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || "Analytika <auth@analytika.me>",

  // Polar.sh Integration
  POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN || "",
  POLAR_WEBHOOK_SECRET: process.env.POLAR_WEBHOOK_SECRET || "",

  // Google OAuth 2.0
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "null",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "null",
};
