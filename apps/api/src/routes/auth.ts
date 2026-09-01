import { Elysia, t } from "elysia";
import { db } from "@/db";
import { users, otpCodes, sessions, accounts, websites } from "@/db/schema";
import { eq, and, desc, gt } from "drizzle-orm";
import { generateOtpCode, hashOtpCode } from "@/lib/crypto";
import { validateRegistrationEmail } from "@/lib/email-validator";
import { sendOtpEmail, sendWelcomeEmail } from "@/services/resend";
import { authMiddleware, requireAuth } from "@/middleware/auth";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";
import { env } from "@/config/env";

export const authRoutes = new Elysia({ prefix: "/api/v1/auth" })
  .use(authMiddleware)

  /**
   * 1. Check Email (Step 1 of Login / Register flow)
   * If registered: sends 6-digit OTP code to email.
   * If not registered: returns isRegistered = false so frontend displays name/register form.
   */
  .post(
    "/check-email",
    async ({ body, set }) => {
      const emailValidation = validateRegistrationEmail(body.email);
      if (!emailValidation.isValid) {
        set.status = 400;
        return { success: false, error: emailValidation.error };
      }

      const email = emailValidation.normalizedEmail;

      try {
        // Look up user in PostgreSQL
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existingUser) {
          // User is registered -> Generate and dispatch login OTP
          const otp = generateOtpCode();
          const codeHash = hashOtpCode(otp);
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

          // Save OTP in database
          await db.insert(otpCodes).values({
            email,
            codeHash,
            type: "login",
            expiresAt,
          });

          // Dispatch email via Resend
          await sendOtpEmail({
            email,
            code: otp,
            type: "login",
            name: existingUser.name || undefined,
          });

          return {
            success: true,
            isRegistered: true,
            message: "A 6-digit verification code has been sent to your email.",
          };
        } else {
          // User is NOT registered
          return {
            success: true,
            isRegistered: false,
            message: "Email is not registered. Please complete your registration.",
          };
        }
      } catch (error: any) {
        logger.error("Error in /check-email:", error);
        set.status = 500;
        return { success: false, error: "Failed to process email check." };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
      }),
    }
  )

  /**
   * 2. Verify Login OTP (Step 2 for Registered Users)
   */
  .post(
    "/verify-otp",
    async ({ body, set, headers }) => {
      const email = body.email.trim().toLowerCase();
      const code = body.code.trim();
      const codeHash = hashOtpCode(code);
      const now = new Date();

      try {
        // Find user
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user) {
          set.status = 404;
          return { success: false, error: "User account not found." };
        }

        // Find latest active OTP for this email
        const [latestOtp] = await db
          .select()
          .from(otpCodes)
          .where(
            and(
              eq(otpCodes.email, email),
              eq(otpCodes.type, "login"),
              gt(otpCodes.expiresAt, now)
            )
          )
          .orderBy(desc(otpCodes.createdAt))
          .limit(1);

        if (!latestOtp) {
          set.status = 400;
          return {
            success: false,
            error: "Verification code has expired or was not requested. Please request a new code.",
          };
        }

        // Check max attempts
        if (latestOtp.attempts >= 5) {
          set.status = 429;
          return {
            success: false,
            error: "Too many failed attempts. Please request a fresh code.",
          };
        }

        // Validate code hash
        if (latestOtp.codeHash !== codeHash) {
          // Increment attempt count
          await db
            .update(otpCodes)
            .set({ attempts: latestOtp.attempts + 1 })
            .where(eq(otpCodes.id, latestOtp.id));

          set.status = 400;
          return { success: false, error: "Invalid verification code. Please check and try again." };
        }

        // Mark OTP as verified
        await db
          .update(otpCodes)
          .set({ verifiedAt: now })
          .where(eq(otpCodes.id, latestOtp.id));

        // Create new session token (30-day expiration)
        const sessionToken = `ana_sess_${nanoid(32)}`;
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        const ipAddress =
          (headers["x-forwarded-for"] as string) || (headers["x-real-ip"] as string) || "127.0.0.1";
        const userAgent = (headers["user-agent"] as string) || "Unknown";

        await db.insert(sessions).values({
          userId: user.id,
          token: sessionToken,
          ipAddress,
          userAgent,
          expiresAt,
        });

        logger.success(`User logged in via OTP: ${user.email}`);

        return {
          success: true,
          token: sessionToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
            theme: user.theme,
            plan: user.plan,
            eventQuota: user.eventQuota,
            maxWebsites: user.maxWebsites,
            maxFunnels: user.maxFunnels,
            maxAlerts: user.maxAlerts,
            hasSocialRadar: user.hasSocialRadar,
            mcpApiKey: user.mcpApiKey,
            subscriptionStatus: user.subscriptionStatus,
            trialEndsAt: user.trialEndsAt,
          },
        };
      } catch (error: any) {
        logger.error("Error in /verify-otp:", error);
        set.status = 500;
        return { success: false, error: "Failed to verify code." };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        code: t.String({ minLength: 6, maxLength: 6 }),
      }),
    }
  )

  /**
   * 3. Request Registration OTP (Step 1 for New Users)
   */
  .post(
    "/register-request",
    async ({ body, set }) => {
      const emailValidation = validateRegistrationEmail(body.email);
      if (!emailValidation.isValid) {
        set.status = 400;
        return { success: false, error: emailValidation.error };
      }

      const email = emailValidation.normalizedEmail;
      const name = body.name?.trim() || "";

      try {
        // Ensure user doesn't already exist
        const [existing] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existing) {
          set.status = 400;
          return {
            success: false,
            error: "An account with this email already exists. Please log in instead.",
          };
        }

        // Generate 6-digit confirmation code
        const otp = generateOtpCode();
        const codeHash = hashOtpCode(otp);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await db.insert(otpCodes).values({
          email,
          name,
          codeHash,
          type: "register",
          expiresAt,
        });

        // Send welcome email via Resend
        await sendOtpEmail({
          email,
          code: otp,
          type: "register",
          name,
        });

        return {
          success: true,
          status: "pending_verification",
          message: "Confirmation code sent to your email.",
        };
      } catch (error: any) {
        logger.error("Error in /register-request:", error);
        set.status = 500;
        return { success: false, error: "Failed to process registration request." };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        name: t.Optional(t.String({ minLength: 1 })),
      }),
    }
  )

  /**
   * 4. Confirm Registration & Create Account (Step 2 for New Users)
   */
  .post(
    "/register-confirm",
    async ({ body, set, headers }) => {
      const email = body.email.trim().toLowerCase();
      const code = body.code.trim();
      const name = body.name?.trim() || "";
      const codeHash = hashOtpCode(code);
      const now = new Date();

      try {
        // Find latest active registration OTP
        const [latestOtp] = await db
          .select()
          .from(otpCodes)
          .where(
            and(
              eq(otpCodes.email, email),
              eq(otpCodes.type, "register"),
              gt(otpCodes.expiresAt, now)
            )
          )
          .orderBy(desc(otpCodes.createdAt))
          .limit(1);

        if (!latestOtp) {
          set.status = 400;
          return {
            success: false,
            error: "Confirmation code has expired or was not requested. Please try again.",
          };
        }

        if (latestOtp.codeHash !== codeHash) {
          set.status = 400;
          return { success: false, error: "Invalid confirmation code." };
        }

        // Mark OTP as verified
        await db
          .update(otpCodes)
          .set({ verifiedAt: now })
          .where(eq(otpCodes.id, latestOtp.id));

        // Create new user in PostgreSQL with 14-day Solo Trial & initial MCP key
        const mcpApiKey = `ana_mcp_live_${nanoid(24)}`;
        const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days trial

        const [newUser] = await db
          .insert(users)
          .values({
            email,
            name: name || latestOtp.name || "Founder",
            plan: "solo",
            billingInterval: "month",
            eventQuota: 10000, // 10k events
            maxWebsites: 3,
            maxFunnels: 3,
            maxAlerts: 3,
            hasSocialRadar: false,
            retentionDays: 365,
            mcpApiKey,
            subscriptionStatus: "trialing",
            trialEndsAt,
          })
          .returning();

        // Create active session
        const sessionToken = `ana_sess_${nanoid(32)}`;
        const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        const ipAddress =
          (headers["x-forwarded-for"] as string) || (headers["x-real-ip"] as string) || "127.0.0.1";
        const userAgent = (headers["user-agent"] as string) || "Unknown";

        await db.insert(sessions).values({
          userId: newUser.id,
          token: sessionToken,
          ipAddress,
          userAgent,
          expiresAt: sessionExpiresAt,
        });

        logger.success(`New user registered & confirmed: ${newUser.email} (Solo 14-Day Trial)`);

        // Send welcome email in background
        sendWelcomeEmail({
          email: newUser.email,
          name: newUser.name || undefined,
        }).catch((err) => logger.error("Failed to send welcome email:", err));

        return {
          success: true,
          token: sessionToken,
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            avatarUrl: newUser.avatarUrl,
            theme: newUser.theme,
            plan: newUser.plan,
            eventQuota: newUser.eventQuota,
            maxWebsites: newUser.maxWebsites,
            maxFunnels: newUser.maxFunnels,
            maxAlerts: newUser.maxAlerts,
            hasSocialRadar: newUser.hasSocialRadar,
            mcpApiKey: newUser.mcpApiKey,
            subscriptionStatus: newUser.subscriptionStatus,
            trialEndsAt: newUser.trialEndsAt,
          },
        };
      } catch (error: any) {
        logger.error("Error in /register-confirm:", error);
        set.status = 500;
        return { success: false, error: "Failed to confirm registration." };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        code: t.String({ minLength: 6, maxLength: 6 }),
        name: t.Optional(t.String()),
      }),
    }
  )

  /**
   * 5. OAuth Login (Google & GitHub)
   */
  .post(
    "/oauth",
    async ({ body, set, headers }) => {
      const email = body.email.trim().toLowerCase();
      const { provider, providerAccountId, name, avatarUrl } = body;

      try {
        // Check if OAuth link already exists
        const [existingAccount] = await db
          .select({
            userId: accounts.userId,
            user: users,
          })
          .from(accounts)
          .innerJoin(users, eq(accounts.userId, users.id))
          .where(
            and(
              eq(accounts.provider, provider),
              eq(accounts.providerAccountId, providerAccountId)
            )
          )
          .limit(1);

        let userRecord = existingAccount?.user;

        if (!userRecord) {
          // Check if user with this email already exists
          const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (existingUser) {
            userRecord = existingUser;
          } else {
            // Create new user with 14-day Solo trial
            const mcpApiKey = `ana_mcp_live_${nanoid(24)}`;
            const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

            const [created] = await db
              .insert(users)
              .values({
                email,
                name: name || "Founder",
                avatarUrl: avatarUrl || null,
                plan: "solo",
                billingInterval: "month",
                eventQuota: 10000,
                maxWebsites: 3,
                maxFunnels: 3,
                maxAlerts: 3,
                hasSocialRadar: false,
                retentionDays: 365,
                mcpApiKey,
                subscriptionStatus: "trialing",
                trialEndsAt,
              })
              .returning();

            userRecord = created;
          }

          // Link OAuth account
          await db.insert(accounts).values({
            userId: userRecord.id,
            provider,
            providerAccountId,
          });
        }

        // Create session
        const sessionToken = `ana_sess_${nanoid(32)}`;
        const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        const ipAddress =
          (headers["x-forwarded-for"] as string) || (headers["x-real-ip"] as string) || "127.0.0.1";
        const userAgent = (headers["user-agent"] as string) || "Unknown";

        await db.insert(sessions).values({
          userId: userRecord.id,
          token: sessionToken,
          ipAddress,
          userAgent,
          expiresAt: sessionExpiresAt,
        });

        logger.success(`User authenticated via ${provider} OAuth: ${userRecord.email}`);

        return {
          success: true,
          token: sessionToken,
          user: {
            id: userRecord.id,
            email: userRecord.email,
            name: userRecord.name,
            avatarUrl: userRecord.avatarUrl,
            theme: userRecord.theme,
            plan: userRecord.plan,
            eventQuota: userRecord.eventQuota,
            maxWebsites: userRecord.maxWebsites,
            maxFunnels: userRecord.maxFunnels,
            maxAlerts: userRecord.maxAlerts,
            hasSocialRadar: userRecord.hasSocialRadar,
            mcpApiKey: userRecord.mcpApiKey,
            subscriptionStatus: userRecord.subscriptionStatus,
            trialEndsAt: userRecord.trialEndsAt,
          },
        };
      } catch (error: any) {
        logger.error("Error in /oauth:", error);
        set.status = 500;
        return { success: false, error: "Failed to authenticate with OAuth provider." };
      }
    },
    {
      body: t.Object({
        provider: t.Union([t.Literal("google"), t.Literal("github")]),
        providerAccountId: t.String(),
        email: t.String({ format: "email" }),
        name: t.Optional(t.String()),
        avatarUrl: t.Optional(t.String()),
      }),
    }
  )

  /**
   * 6. Google OAuth - Redirect to Consent Screen
   */
  .get("/oauth/google", ({ redirect }) => {
    const redirectUri = `http://localhost:${env.PORT}/api/v1/auth/oauth/google/callback`;
    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
    googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("scope", "openid email profile");
    googleAuthUrl.searchParams.set("access_type", "offline");
    googleAuthUrl.searchParams.set("prompt", "select_account");

    return redirect(googleAuthUrl.toString());
  })

  /**
   * 7. Google OAuth - Callback
   */
  .get(
    "/oauth/google/callback",
    async ({ query, redirect, headers }) => {
      const { code } = query;
      if (!code) {
        return redirect(`${env.FRONTEND_URL}/auth/login?error=Google authentication was cancelled.`);
      }

      try {
        const redirectUri = `http://localhost:${env.PORT}/api/v1/auth/oauth/google/callback`;

        // 1. Exchange code for tokens
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
          }),
        });

        const tokenData = (await tokenRes.json()) as any;
        if (!tokenData.access_token) {
          logger.error("Failed to exchange Google OAuth code:", tokenData);
          return redirect(`${env.FRONTEND_URL}/auth/login?error=Failed to authenticate with Google.`);
        }

        // 2. Fetch Google User Profile
        const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        const googleProfile = (await userinfoRes.json()) as any;
        const email = googleProfile.email.trim().toLowerCase();
        const providerAccountId = googleProfile.id;
        const name = googleProfile.name || "Founder";
        const avatarUrl = googleProfile.picture || null;

        logger.info(`Google Profile data received for ${email}:`, {
          name,
          hasPicture: !!avatarUrl,
          pictureUrl: avatarUrl,
        });

        // 3. Find or create user
        const [existingAccount] = await db
          .select({
            userId: accounts.userId,
            user: users,
          })
          .from(accounts)
          .innerJoin(users, eq(accounts.userId, users.id))
          .where(
            and(
              eq(accounts.provider, "google"),
              eq(accounts.providerAccountId, providerAccountId)
            )
          )
          .limit(1);

        let userRecord = existingAccount?.user;

        if (!userRecord) {
          // Check by email
          const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (existingUser) {
            userRecord = existingUser;
          } else {
            // New user registration with 14-day Solo Trial
            const mcpApiKey = `ana_mcp_live_${nanoid(24)}`;
            const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

            const [created] = await db
              .insert(users)
              .values({
                email,
                name,
                avatarUrl,
                plan: "solo",
                billingInterval: "month",
                eventQuota: 10000,
                maxWebsites: 3,
                maxFunnels: 3,
                maxAlerts: 3,
                hasSocialRadar: false,
                retentionDays: 365,
                mcpApiKey,
                subscriptionStatus: "trialing",
                trialEndsAt,
              })
              .returning();

            userRecord = created;

            // Welcome email in background
            sendWelcomeEmail({
              email: userRecord.email,
              name: userRecord.name || undefined,
            }).catch((err) => logger.error("Welcome email error:", err));
          }

          // Link Google Account
          await db.insert(accounts).values({
            userId: userRecord.id,
            provider: "google",
            providerAccountId,
          });
        }

        // Always sync avatar & name if Google provides a newer picture or name
        const updates: { avatarUrl?: string; name?: string } = {};
        if (avatarUrl && userRecord.avatarUrl !== avatarUrl) {
          updates.avatarUrl = avatarUrl;
        }
        if (name && (!userRecord.name || userRecord.name === "Founder") && name !== "Founder") {
          updates.name = name;
        }

        if (Object.keys(updates).length > 0) {
          logger.info(`Syncing Google profile updates for ${userRecord.email}:`, updates);
          const [updated] = await db
            .update(users)
            .set(updates)
            .where(eq(users.id, userRecord.id))
            .returning();
          if (updated) {
            userRecord = updated;
            logger.success(`User avatar & profile successfully updated from Google: ${userRecord.email}`);
          }
        }

        // 4. Create session
        const sessionToken = `ana_sess_${nanoid(32)}`;
        const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const ipAddress =
          (headers["x-forwarded-for"] as string) || (headers["x-real-ip"] as string) || "127.0.0.1";
        const userAgent = (headers["user-agent"] as string) || "Unknown";

        await db.insert(sessions).values({
          userId: userRecord.id,
          token: sessionToken,
          ipAddress,
          userAgent,
          expiresAt: sessionExpiresAt,
        });

        logger.success(`Google OAuth login successful for: ${userRecord.email}`);

        // Redirect to Frontend Callback
        return redirect(`${env.FRONTEND_URL}/auth/callback?token=${sessionToken}`);
      } catch (error: any) {
        logger.error("Error during Google OAuth callback:", error);
        return redirect(`${env.FRONTEND_URL}/auth/login?error=Google authentication failed.`);
      }
    },
    {
      query: t.Object({
        code: t.Optional(t.String()),
        error: t.Optional(t.String()),
      }),
    }
  )

  /**
   * 8. Get Current Authenticated User (Protected)
   */
  .get("/me", async ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }

    // Fetch total websites count for this user
    const userWebsites = await db
      .select({ id: websites.id })
      .from(websites)
      .where(eq(websites.userId, user.id));

    return {
      success: true,
      user: {
        ...user,
        websitesCount: userWebsites.length,
      },
    };
  })

  /**
   * 9. Update User Profile Preferences (Protected)
   */
  .patch(
    "/me",
    async ({ user, body, set }) => {
      if (!user) {
        set.status = 401;
        return { success: false, error: "Unauthorized" };
      }

      const updates: {
        name?: string | null;
        theme?: string;
        emailDigest?: boolean;
        productAnnouncements?: boolean;
        updatedAt: Date;
      } = {
        updatedAt: new Date(),
      };

      if (body.name !== undefined) {
        updates.name = body.name.trim() || null;
      }
      if (body.theme !== undefined) {
        updates.theme = body.theme;
      }
      if (body.emailDigest !== undefined) {
        updates.emailDigest = body.emailDigest;
      }
      if (body.productAnnouncements !== undefined) {
        updates.productAnnouncements = body.productAnnouncements;
      }

      const [updatedUser] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, user.id))
        .returning();

      logger.success(`Profile updated for user: ${user.email}`);

      return {
        success: true,
        user: updatedUser,
      };
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        theme: t.Optional(t.Union([t.Literal("dark"), t.Literal("light"), t.Literal("system")])),
        emailDigest: t.Optional(t.Boolean()),
        productAnnouncements: t.Optional(t.Boolean()),
      }),
    }
  )

  /**
   * 10. Delete Account (Protected)
   */
  .delete("/me", async ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }

    // Cascade delete in PostgreSQL deletes all user records (sessions, accounts, websites, alerts, funnels)
    await db.delete(users).where(eq(users.id, user.id));
    logger.success(`User account permanently deleted: ${user.email}`);

    return {
      success: true,
      message: "Account and associated data deleted permanently.",
    };
  })

  /**
   * 11. Logout (Protected)
   */
  .post("/logout", async ({ headers, set }) => {
    const authHeader = headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim();
      await db.delete(sessions).where(eq(sessions.token, token));
    }
    return { success: true, message: "Logged out successfully." };
  });
