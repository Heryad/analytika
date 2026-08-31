import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { bearer } from "@elysiajs/bearer";
import { eq, and, gt } from "drizzle-orm";
import { db } from "../db/client";
import { users, otps, subscriptions } from "../db/schema";
import { sendOtpEmail } from "../services/email";

const JWT_SECRET = process.env.JWT_SECRET || "analytika_super_secret_jwt_key_development_only";

export const authRoutes = new Elysia({ prefix: "/v1/auth" })
  .use(
    jwt({
      name: "jwt",
      secret: JWT_SECRET,
      exp: "30d",
    })
  )
  .use(bearer())

  // 1. Send OTP to user's email
  .post(
    "/otp/send",
    async ({ body, set }) => {
      const email = body.email.toLowerCase().trim();

      // Generate 6-digit cryptographically secure numeric code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

      // Save OTP in database
      await db.insert(otps).values({
        email,
        code,
        expiresAt,
        attempts: 0,
      });

      // Send email via Resend
      const sent = await sendOtpEmail(email, code);
      if (!sent) {
        set.status = 500;
        return { success: false, error: "Failed to send verification code email" };
      }

      return {
        success: true,
        message: "Verification code sent to your email",
      };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
      }),
    }
  )

  // 2. Verify OTP & Log In / Sign Up
  .post(
    "/otp/verify",
    async ({ body, jwt, set }) => {
      const email = body.email.toLowerCase().trim();
      const code = body.code.trim();

      // Find valid unexpired OTP
      const validOtp = await db.query.otps.findFirst({
        where: and(
          eq(otps.email, email),
          eq(otps.code, code),
          gt(otps.expiresAt, new Date())
        ),
      });

      if (!validOtp) {
        set.status = 400;
        return { success: false, error: "Invalid or expired verification code" };
      }

      // Remove / consume the OTP
      await db.delete(otps).where(eq(otps.id, validOtp.id));

      // Find or create User
      let user = await db.query.users.findFirst({
        where: eq(users.email, email),
        with: {
          subscription: true,
        },
      });

      if (!user) {
        // Auto-create user on first successful OTP verification
        const [newUser] = await db
          .insert(users)
          .values({
            email,
            name: email.split("@")[0],
            authProvider: "email",
          })
          .returning();

        // Create default Free subscription
        await db.insert(subscriptions).values({
          userId: newUser.id,
          plan: "free",
          status: "active",
          monthlyEventLimit: 10_000,
          websiteLimit: 1,
        });

        user = await db.query.users.findFirst({
          where: eq(users.id, newUser.id),
          with: {
            subscription: true,
          },
        });
      }

      if (!user) {
        set.status = 500;
        return { success: false, error: "Could not create user account" };
      }

      // Generate JWT Token
      const token = await jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          role: user.role,
          subscription: user.subscription,
        },
      };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        code: t.String({ minLength: 6, maxLength: 6 }),
      }),
    }
  )

  // 3. Get Current User Profile
  .get("/me", async ({ bearer, jwt, set }) => {
    if (!bearer) {
      set.status = 401;
      return { success: false, error: "Missing authorization token" };
    }

    const payload = await jwt.verify(bearer);
    if (!payload || !payload.id) {
      set.status = 401;
      return { success: false, error: "Invalid authorization token" };
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.id as string),
      with: {
        subscription: true,
        websites: true,
      },
    });

    if (!user) {
      set.status = 404;
      return { success: false, error: "User not found" };
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        subscription: user.subscription,
        websitesCount: user.websites.length,
      },
    };
  });
