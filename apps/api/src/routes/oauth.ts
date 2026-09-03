import { Elysia, t } from "elysia";
import { eq, and, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import {
  oauthAccessTokens,
  oauthAuthorizationCodes,
  oauthAuthorizationRequests,
  oauthClients,
} from "@/db/schema";import { env } from "@/config/env";
import { logger } from "@/lib/logger";
import { authMiddleware } from "@/middleware/auth";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  AUTH_CODE_TTL_MS,
  AUTH_REQUEST_TTL_MS,
  MCP_SCOPE,
  REFRESH_TOKEN_TTL_SECONDS,
  authorizationServerMetadata,
  clientAllowsRedirect,
  generateAccessToken,
  generateAuthorizationCode,
  generateClientSecret,
  generateRefreshToken,
  getIssuer,
  hashToken,
  isValidRedirectUri,
  parseBasicAuth,
  protectedResourceMetadata,
  randomRequestId,
  resolveOAuthClient,
  verifyClientSecret,
  verifyPkceS256,
} from "@/lib/oauth";

function oauthErrorRedirect(redirectUri: string, error: string, description: string, state?: string | null) {
  const url = new URL(redirectUri);
  url.searchParams.set("error", error);
  url.searchParams.set("error_description", description);
  if (state) url.searchParams.set("state", state);
  url.searchParams.set("iss", getIssuer());
  return url.toString();
}

function frontendErrorRedirect(error: string, description: string) {
  const url = new URL(`${env.FRONTEND_URL.replace(/\/$/, "")}/oauth/authorize`);
  url.searchParams.set("error", error);
  url.searchParams.set("error_description", description);
  return url.toString();
}

async function parseFormOrJson(request: Request): Promise<Record<string, string>> {
  const contentType = request.headers.get("content-type") || "";
  const out: Record<string, string> = {};

  try {
    if (contentType.includes("application/json")) {
      const json = await request.json();
      if (json && typeof json === "object" && !Array.isArray(json)) {
        for (const [key, value] of Object.entries(json as Record<string, unknown>)) {
          if (value === undefined || value === null) continue;
          if (Array.isArray(value)) {
            out[key] = JSON.stringify(value);
          } else if (typeof value === "object") {
            out[key] = JSON.stringify(value);
          } else {
            out[key] = String(value);
          }
        }
      }
      return out;
    }

    const text = await request.text();
    const params = new URLSearchParams(text);
    for (const [key, value] of params.entries()) {
      out[key] = value;
    }
    return out;
  } catch {
    return out;
  }
}

export const oauthRoutes = new Elysia({ name: "oauth-mcp" })
  /**
   * RFC 8414 Authorization Server Metadata
   */
  .get("/.well-known/oauth-authorization-server", ({ set }) => {
    set.headers["Cache-Control"] = "public, max-age=60";
    set.headers["Content-Type"] = "application/json";
    return authorizationServerMetadata();
  })
  .get("/.well-known/openid-configuration", ({ set }) => {
    set.headers["Cache-Control"] = "public, max-age=60";
    set.headers["Content-Type"] = "application/json";
    return authorizationServerMetadata();
  })

  /**
   * RFC 9728 Protected Resource Metadata
   */
  .get("/.well-known/oauth-protected-resource", ({ set }) => {
    set.headers["Cache-Control"] = "public, max-age=60";
    set.headers["Content-Type"] = "application/json";
    return protectedResourceMetadata("/mcp");
  })
  .get("/.well-known/oauth-protected-resource/mcp", ({ set }) => {
    set.headers["Cache-Control"] = "public, max-age=60";
    set.headers["Content-Type"] = "application/json";
    return protectedResourceMetadata("/mcp");
  })
  .get("/.well-known/oauth-protected-resource/api/v1/mcp", ({ set }) => {
    set.headers["Cache-Control"] = "public, max-age=60";
    set.headers["Content-Type"] = "application/json";
    return protectedResourceMetadata("/api/v1/mcp");
  })
  .get("/.well-known/oauth-protected-resource/*", ({ params, set }) => {
    set.headers["Cache-Control"] = "public, max-age=60";
    set.headers["Content-Type"] = "application/json";
    const suffix = (params as Record<string, string>)["*"] || "mcp";
    const path = suffix.startsWith("/") ? suffix : `/${suffix}`;
    return protectedResourceMetadata(path);
  })

  /**
   * RFC 7591 Dynamic Client Registration
   */
  .post("/oauth/register", async ({ request, body, set }) => {
    try {
      let json: any = body;
      if (!json || typeof json !== "object" || Array.isArray(json)) {
        json = await request.json();
      }
      const redirectUris: string[] = Array.isArray(json?.redirect_uris) ? json.redirect_uris : [];
      const validRedirects = redirectUris.filter((uri) => typeof uri === "string" && isValidRedirectUri(uri));

      if (validRedirects.length === 0) {
        set.status = 400;
        return {
          error: "invalid_redirect_uri",
          error_description: "At least one valid redirect_uri is required (https or loopback http).",
        };
      }

      const authMethod =
        typeof json.token_endpoint_auth_method === "string" ? json.token_endpoint_auth_method : "none";
      const clientId = `ana_oauth_${nanoid(24)}`;
      const wantsSecret = authMethod === "client_secret_post" || authMethod === "client_secret_basic";
      const clientSecret = wantsSecret ? generateClientSecret() : null;

      await db.insert(oauthClients).values({
        clientId,
        clientSecretHash: clientSecret ? hashToken(clientSecret) : null,
        clientName:
          typeof json.client_name === "string" && json.client_name.trim()
            ? json.client_name.trim().slice(0, 255)
            : "MCP Client",
        clientUri: typeof json.client_uri === "string" ? json.client_uri : null,
        logoUri: typeof json.logo_uri === "string" ? json.logo_uri : null,
        redirectUris: validRedirects,
        grantTypes: Array.isArray(json.grant_types)
          ? json.grant_types
          : ["authorization_code", "refresh_token"],
        tokenEndpointAuthMethod: wantsSecret ? authMethod : "none",
        isCimd: false,
      });

      set.status = 201;
      const issuedAt = Math.floor(Date.now() / 1000);
      return {
        client_id: clientId,
        client_id_issued_at: issuedAt,
        client_name:
          typeof json.client_name === "string" && json.client_name.trim()
            ? json.client_name.trim()
            : "MCP Client",
        redirect_uris: validRedirects,
        grant_types: Array.isArray(json.grant_types)
          ? json.grant_types
          : ["authorization_code", "refresh_token"],
        response_types: ["code"],
        token_endpoint_auth_method: wantsSecret ? authMethod : "none",
        ...(clientSecret
          ? {
              client_secret: clientSecret,
              client_secret_expires_at: 0,
            }
          : {}),
      };
    } catch (err: any) {
      logger.error("OAuth DCR failed:", err);
      set.status = 400;
      return {
        error: "invalid_client_metadata",
        error_description: err?.message || "Invalid client metadata",
      };
    }
  })

  /**
   * Authorization endpoint — validates the client then sends the user to the consent UI
   */
  .get("/oauth/authorize", async ({ query, redirect, set }) => {
    const clientId = String(query.client_id || "");
    const redirectUri = String(query.redirect_uri || "");
    const responseType = String(query.response_type || "");
    const state = query.state ? String(query.state) : null;
    const scope = query.scope ? String(query.scope) : MCP_SCOPE;
    const resource = query.resource ? String(query.resource) : `${getIssuer()}/mcp`;
    const codeChallenge = String(query.code_challenge || "");
    const codeChallengeMethod = String(query.code_challenge_method || "");

    if (!clientId) {
      return redirect(frontendErrorRedirect("invalid_request", "Missing client_id"));
    }

    const client = await resolveOAuthClient(clientId);
    if (!client) {
      return redirect(frontendErrorRedirect("invalid_client", "Unknown OAuth client"));
    }

    if (!redirectUri || !isValidRedirectUri(redirectUri) || !clientAllowsRedirect(client, redirectUri)) {
      return redirect(frontendErrorRedirect("invalid_request", "redirect_uri is not registered for this client"));
    }

    if (responseType !== "code") {
      return redirect(oauthErrorRedirect(redirectUri, "unsupported_response_type", "Only response_type=code is supported", state));
    }

    if (!codeChallenge || codeChallengeMethod.toUpperCase() !== "S256") {
      return redirect(
        oauthErrorRedirect(
          redirectUri,
          "invalid_request",
          "PKCE S256 is required (code_challenge + code_challenge_method=S256)",
          state
        )
      );
    }

    const requestId = randomRequestId();
    await db.insert(oauthAuthorizationRequests).values({
      id: requestId,
      clientId: client.clientId,
      clientName: client.clientName,
      clientUri: client.clientUri,
      logoUri: client.logoUri,
      redirectUri,
      state,
      scope,
      resource,
      codeChallenge,
      codeChallengeMethod: "S256",
      expiresAt: new Date(Date.now() + AUTH_REQUEST_TTL_MS),
    });

    const consentUrl = new URL(`${env.FRONTEND_URL.replace(/\/$/, "")}/oauth/authorize`);
    consentUrl.searchParams.set("request", requestId);
    return redirect(consentUrl.toString());
  })

  .use(authMiddleware)

  /**
   * Consent UI loads this to render client name / scopes
   */
  .get("/oauth/requests/:id", async ({ params, user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }

    const [requestRow] = await db
      .select()
      .from(oauthAuthorizationRequests)
      .where(eq(oauthAuthorizationRequests.id, params.id))
      .limit(1);

    if (!requestRow || requestRow.expiresAt <= new Date()) {
      set.status = 404;
      return { success: false, error: "This authorization request has expired. Please reconnect from Claude or ChatGPT." };
    }

    return {
      success: true,
      request: {
        id: requestRow.id,
        clientName: requestRow.clientName,
        clientUri: requestRow.clientUri,
        logoUri: requestRow.logoUri,
        redirectUri: requestRow.redirectUri,
        scope: requestRow.scope || MCP_SCOPE,
        resource: requestRow.resource,
      },
      user: {
        email: user.email,
        name: user.name,
      },
    };
  })

  /**
   * User Allow / Deny
   */
  .post(
    "/oauth/consent",
    async ({ body, user, set }) => {
      if (!user) {
        set.status = 401;
        return { success: false, error: "Unauthorized" };
      }

      const [requestRow] = await db
        .select()
        .from(oauthAuthorizationRequests)
        .where(eq(oauthAuthorizationRequests.id, body.requestId))
        .limit(1);

      if (!requestRow || requestRow.expiresAt <= new Date()) {
        set.status = 400;
        return { success: false, error: "Authorization request expired. Restart the connection from your AI client." };
      }

      if (!body.allow) {
        const denyUrl = oauthErrorRedirect(
          requestRow.redirectUri,
          "access_denied",
          "The user denied the request",
          requestRow.state
        );
        await db.delete(oauthAuthorizationRequests).where(eq(oauthAuthorizationRequests.id, requestRow.id));
        return { success: true, redirectUrl: denyUrl };
      }

      const code = generateAuthorizationCode();
      await db.insert(oauthAuthorizationCodes).values({
        codeHash: hashToken(code),
        clientId: requestRow.clientId,
        userId: user.id,
        redirectUri: requestRow.redirectUri,
        scope: requestRow.scope || MCP_SCOPE,
        resource: requestRow.resource,
        codeChallenge: requestRow.codeChallenge,
        codeChallengeMethod: requestRow.codeChallengeMethod,
        expiresAt: new Date(Date.now() + AUTH_CODE_TTL_MS),
      });

      await db.delete(oauthAuthorizationRequests).where(eq(oauthAuthorizationRequests.id, requestRow.id));

      const redirectUrl = new URL(requestRow.redirectUri);
      redirectUrl.searchParams.set("code", code);
      if (requestRow.state) redirectUrl.searchParams.set("state", requestRow.state);
      redirectUrl.searchParams.set("iss", getIssuer());

      logger.info("MCP OAuth consent granted", {
        userId: user.id,
        clientId: requestRow.clientId,
        clientName: requestRow.clientName,
      });

      return { success: true, redirectUrl: redirectUrl.toString() };
    },
    {
      body: t.Object({
        requestId: t.String(),
        allow: t.Boolean(),
      }),
    }
  )

  /**
   * Token endpoint — authorization_code + refresh_token
   */
  .post("/oauth/token", async ({ request, headers, body, set }) => {
    let params: Record<string, string> = {};
    if (body && typeof body === "object" && !Array.isArray(body)) {
      for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
        if (value === undefined || value === null || typeof value === "object") continue;
        params[key] = String(value);
      }
    }
    if (!params.grant_type) {
      params = { ...params, ...(await parseFormOrJson(request)) };
    }
    const basic = parseBasicAuth(headers["authorization"]);
    const grantType = params.grant_type || "";
    const clientId = params.client_id || basic?.clientId || "";
    const clientSecret = params.client_secret || basic?.clientSecret || "";

    const fail = (status: number, error: string, description: string) => {
      set.status = status;
      set.headers["Cache-Control"] = "no-store";
      set.headers["Pragma"] = "no-cache";
      return { error, error_description: description };
    };

    if (!grantType) {
      return fail(400, "invalid_request", "grant_type is required");
    }

    const client = clientId ? await resolveOAuthClient(clientId) : null;
    if (!client) {
      return fail(401, "invalid_client", "Unknown client_id");
    }

    const secretOk = await verifyClientSecret(client, clientSecret);
    if (!secretOk) {
      return fail(401, "invalid_client", "Client authentication failed");
    }

    if (grantType === "authorization_code") {
      const code = params.code || "";
      const redirectUri = params.redirect_uri || "";
      const codeVerifier = params.code_verifier || "";

      if (!code || !codeVerifier) {
        return fail(400, "invalid_request", "code and code_verifier are required");
      }

      const [codeRow] = await db
        .select()
        .from(oauthAuthorizationCodes)
        .where(eq(oauthAuthorizationCodes.codeHash, hashToken(code)))
        .limit(1);

      if (!codeRow || codeRow.consumedAt || codeRow.expiresAt <= new Date()) {
        return fail(400, "invalid_grant", "Authorization code is invalid or expired");
      }

      if (codeRow.clientId !== client.clientId) {
        return fail(400, "invalid_grant", "Authorization code was issued to a different client");
      }

      if (redirectUri && codeRow.redirectUri !== redirectUri) {
        return fail(400, "invalid_grant", "redirect_uri does not match the authorization request");
      }

      if (!verifyPkceS256(codeVerifier, codeRow.codeChallenge)) {
        return fail(400, "invalid_grant", "PKCE verification failed");
      }

      await db
        .update(oauthAuthorizationCodes)
        .set({ consumedAt: new Date() })
        .where(eq(oauthAuthorizationCodes.id, codeRow.id));

      const accessToken = generateAccessToken();
      const refreshToken = generateRefreshToken();
      const now = Date.now();

      await db.insert(oauthAccessTokens).values({
        tokenHash: hashToken(accessToken),
        refreshTokenHash: hashToken(refreshToken),
        clientId: client.clientId,
        userId: codeRow.userId,
        scope: codeRow.scope || MCP_SCOPE,
        resource: params.resource || codeRow.resource,
        expiresAt: new Date(now + ACCESS_TOKEN_TTL_SECONDS * 1000),
        refreshExpiresAt: new Date(now + REFRESH_TOKEN_TTL_SECONDS * 1000),
      });

      set.headers["Cache-Control"] = "no-store";
      set.headers["Pragma"] = "no-cache";
      return {
        access_token: accessToken,
        token_type: "bearer",
        expires_in: ACCESS_TOKEN_TTL_SECONDS,
        refresh_token: refreshToken,
        scope: codeRow.scope || MCP_SCOPE,
      };
    }

    if (grantType === "refresh_token") {
      const presented = params.refresh_token || "";
      if (!presented) {
        return fail(400, "invalid_request", "refresh_token is required");
      }

      const [existing] = await db
        .select()
        .from(oauthAccessTokens)
        .where(
          and(
            eq(oauthAccessTokens.refreshTokenHash, hashToken(presented)),
            eq(oauthAccessTokens.clientId, client.clientId),
            isNull(oauthAccessTokens.revokedAt)
          )
        )
        .limit(1);

      if (!existing || !existing.refreshExpiresAt || existing.refreshExpiresAt <= new Date()) {
        return fail(400, "invalid_grant", "Refresh token is invalid or expired");
      }

      // Rotate refresh tokens for public clients
      await db
        .update(oauthAccessTokens)
        .set({ revokedAt: new Date() })
        .where(eq(oauthAccessTokens.id, existing.id));

      const accessToken = generateAccessToken();
      const refreshToken = generateRefreshToken();
      const now = Date.now();

      await db.insert(oauthAccessTokens).values({
        tokenHash: hashToken(accessToken),
        refreshTokenHash: hashToken(refreshToken),
        clientId: existing.clientId,
        userId: existing.userId,
        scope: existing.scope,
        resource: existing.resource,
        expiresAt: new Date(now + ACCESS_TOKEN_TTL_SECONDS * 1000),
        refreshExpiresAt: new Date(now + REFRESH_TOKEN_TTL_SECONDS * 1000),
      });

      set.headers["Cache-Control"] = "no-store";
      set.headers["Pragma"] = "no-cache";
      return {
        access_token: accessToken,
        token_type: "bearer",
        expires_in: ACCESS_TOKEN_TTL_SECONDS,
        refresh_token: refreshToken,
        scope: existing.scope || MCP_SCOPE,
      };
    }

    return fail(400, "unsupported_grant_type", "Supported grants: authorization_code, refresh_token");
  })

  /**
   * Optional token revocation — RFC 7009
   * Requires client_id to match the token's issuing client.
   */
  .post("/oauth/revoke", async ({ request, set }) => {
    const params = await parseFormOrJson(request);
    const token = params.token || "";
    const clientId = params.client_id || "";

    if (!token) {
      set.status = 400;
      return { error: "invalid_request", error_description: "token is required" };
    }

    if (!clientId) {
      set.status = 400;
      return { error: "invalid_request", error_description: "client_id is required" };
    }

    const hashed = hashToken(token);

    // Try as access token — only revoke if client_id matches issuing client
    const [byAccess] = await db
      .select({ id: oauthAccessTokens.id, clientId: oauthAccessTokens.clientId })
      .from(oauthAccessTokens)
      .where(eq(oauthAccessTokens.tokenHash, hashed))
      .limit(1);

    if (byAccess) {
      if (byAccess.clientId !== clientId) {
        // RFC 7009: respond 200 but do NOT revoke (don't leak info about token ownership)
        set.status = 200;
        return {};
      }
      await db
        .update(oauthAccessTokens)
        .set({ revokedAt: new Date() })
        .where(eq(oauthAccessTokens.id, byAccess.id));
      set.status = 200;
      return {};
    }

    // Try as refresh token
    const [byRefresh] = await db
      .select({ id: oauthAccessTokens.id, clientId: oauthAccessTokens.clientId })
      .from(oauthAccessTokens)
      .where(eq(oauthAccessTokens.refreshTokenHash, hashed))
      .limit(1);

    if (byRefresh) {
      if (byRefresh.clientId !== clientId) {
        set.status = 200;
        return {};
      }
      await db
        .update(oauthAccessTokens)
        .set({ revokedAt: new Date() })
        .where(eq(oauthAccessTokens.id, byRefresh.id));
    }

    // RFC 7009: always 200 even if token not found
    set.status = 200;
    return {};
  });
