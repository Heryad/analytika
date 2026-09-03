import { createHash, timingSafeEqual } from "crypto";
import { eq, and, isNull, gt } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { oauthAccessTokens, oauthClients, users } from "@/db/schema";
import { env } from "@/config/env";
import { logger } from "@/lib/logger";

export const MCP_SCOPE = "analytika:read";
export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60; // 1 hour
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days
export const AUTH_CODE_TTL_MS = 10 * 60 * 1000;
export const AUTH_REQUEST_TTL_MS = 15 * 60 * 1000;

export type OAuthUser = typeof users.$inferSelect;

export interface ResolvedOAuthClient {
  clientId: string;
  clientName: string;
  clientUri: string | null;
  logoUri: string | null;
  redirectUris: string[];
  grantTypes: string[];
  tokenEndpointAuthMethod: string;
  clientSecretHash: string | null;
  isCimd: boolean;
}

export function getIssuer(): string {
  return env.API_URL.replace(/\/$/, "");
}

export function mcpResourceUrls(): string[] {
  const issuer = getIssuer();
  return [`${issuer}/mcp`, `${issuer}/api/v1/mcp`];
}

export function isOurMcpResource(resource: string | null | undefined): boolean {
  if (!resource) return true;
  const normalized = resource.replace(/\/$/, "");
  return mcpResourceUrls().some((url) => url === normalized);
}

export function resourceMetadataUrl(mcpPath: string = "/mcp"): string {
  const path = mcpPath.replace(/^\//, "");
  return `${getIssuer()}/.well-known/oauth-protected-resource/${path}`;
}

export function wwwAuthenticateHeader(mcpPath: string = "/mcp", error?: string): string {
  const metadata = resourceMetadataUrl(mcpPath);
  const parts = [
    `Bearer realm="Analytika"`,
    `resource_metadata="${metadata}"`,
    `scope="${MCP_SCOPE}"`,
  ];
  if (error) parts.splice(1, 0, `error="${error}"`);
  return parts.join(", ");
}

export function mcpPathFromRequestUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/$/, "") || "/mcp";
    if (path.endsWith("/api/v1/mcp")) return "/api/v1/mcp";
    return "/mcp";
  } catch {
    return "/mcp";
  }
}

export function hashToken(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function generateAccessToken(): string {
  return `ana_atk_${nanoid(40)}`;
}

export function generateRefreshToken(): string {
  return `ana_rtk_${nanoid(40)}`;
}

export function generateAuthorizationCode(): string {
  return `ana_ac_${nanoid(32)}`;
}

export function generateClientSecret(): string {
  return `ana_ocs_${nanoid(32)}`;
}

export function verifyPkceS256(verifier: string, challenge: string): boolean {
  if (!verifier || !challenge) return false;
  const computed = createHash("sha256").update(verifier).digest("base64url");
  const a = Buffer.from(computed);
  const b = Buffer.from(challenge);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function safeCompare(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function isLoopbackHostname(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

export function isValidRedirectUri(uri: string): boolean {
  try {
    const url = new URL(uri);
    if (url.hash) return false;
    if (url.protocol === "https:") return true;
    if (url.protocol === "http:" && isLoopbackHostname(url.hostname)) return true;
    return false;
  } catch {
    return false;
  }
}

export function redirectUrisMatch(registered: string, requested: string): boolean {
  if (registered === requested) return true;
  try {
    const a = new URL(registered);
    const b = new URL(requested);
    if (a.protocol !== b.protocol) return false;
    if (a.pathname !== b.pathname) return false;
    if (a.search !== b.search) return false;
    if (isLoopbackHostname(a.hostname) && isLoopbackHostname(b.hostname) && a.hostname === b.hostname) {
      return true;
    }
    return a.host === b.host;
  } catch {
    return false;
  }
}

export function clientAllowsRedirect(client: ResolvedOAuthClient, requested: string): boolean {
  return client.redirectUris.some((uri) => redirectUrisMatch(uri, requested));
}

function isPrivateHostname(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();

  // Explicit cloud metadata hostnames (SSRF protection)
  const blockedHostnames = [
    "metadata.google.internal",
    "metadata.goog",
    "metadata.aws.internal",
    "169.254.169.254",       // AWS/Azure/GCP metadata IP
    "fd00:ec2::254",          // AWS IPv6 metadata
    "metadata.azure.internal",
    "metadata.oraclecloud.com",
  ];
  if (blockedHostnames.includes(host)) return true;

  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".lan")
  ) {
    return true;
  }

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 10 || a === 127 || a === 0 || (a === 169 && b === 254)) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }

  if (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80")) {
    return true;
  }
  return false;
}

export function isHttpsClientId(clientId: string): boolean {
  try {
    const url = new URL(clientId);
    return url.protocol === "https:" && Boolean(url.pathname && url.pathname !== "/");
  } catch {
    return false;
  }
}

async function fetchCimdDocument(clientId: string): Promise<ResolvedOAuthClient | null> {
  try {
    const url = new URL(clientId);
    if (url.protocol !== "https:") return null;
    if (isPrivateHostname(url.hostname)) return null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(clientId, {
      method: "GET",
      redirect: "manual",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) return null;
      const next = new URL(location, clientId);
      // Re-validate the redirect target — blocks redirects to metadata endpoints
      if (next.protocol !== "https:") return null;
      if (isPrivateHostname(next.hostname)) return null;
      // Ensure the redirect stays on the same origin (CIMD spec requirement)
      if (next.origin !== url.origin) return null;
      const redirectRes = await fetch(next.toString(), {
        method: "GET",
        redirect: "error",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(4000),
      });
      if (!redirectRes.ok) return null;
      return parseCimdJson(clientId, await redirectRes.json());
    }

    if (!res.ok) return null;
    const json = await res.json();
    return parseCimdJson(clientId, json);
  } catch (err: any) {
    logger.warn("CIMD fetch failed", { clientId, error: err?.message || err });
    return null;
  }
}

function parseCimdJson(clientId: string, json: any): ResolvedOAuthClient | null {
  if (!json || typeof json !== "object") return null;
  if (typeof json.client_id === "string" && json.client_id !== clientId) return null;
  if (!Array.isArray(json.redirect_uris) || json.redirect_uris.length === 0) return null;

  const redirectUris = json.redirect_uris.filter((uri: unknown) => typeof uri === "string" && isValidRedirectUri(uri));
  if (redirectUris.length === 0) return null;

  return {
    clientId,
    clientName: typeof json.client_name === "string" && json.client_name.trim() ? json.client_name.trim() : "MCP Client",
    clientUri: typeof json.client_uri === "string" ? json.client_uri : null,
    logoUri: typeof json.logo_uri === "string" ? json.logo_uri : null,
    redirectUris,
    grantTypes: Array.isArray(json.grant_types) ? json.grant_types : ["authorization_code", "refresh_token"],
    tokenEndpointAuthMethod: typeof json.token_endpoint_auth_method === "string" ? json.token_endpoint_auth_method : "none",
    clientSecretHash: null,
    isCimd: true,
  };
}

export async function resolveOAuthClient(clientId: string): Promise<ResolvedOAuthClient | null> {
  if (!clientId) return null;

  const existing = await db.query.oauthClients.findFirst({
    where: eq(oauthClients.clientId, clientId),
  });
  if (existing) {
    return {
      clientId: existing.clientId,
      clientName: existing.clientName,
      clientUri: existing.clientUri,
      logoUri: existing.logoUri,
      redirectUris: existing.redirectUris || [],
      grantTypes: existing.grantTypes || ["authorization_code"],
      tokenEndpointAuthMethod: existing.tokenEndpointAuthMethod || "none",
      clientSecretHash: existing.clientSecretHash,
      isCimd: existing.isCimd,
    };
  }

  if (isHttpsClientId(clientId)) {
    const cimd = await fetchCimdDocument(clientId);
    if (!cimd) return null;

    try {
      await db
        .insert(oauthClients)
        .values({
          clientId: cimd.clientId,
          clientName: cimd.clientName,
          clientUri: cimd.clientUri,
          logoUri: cimd.logoUri,
          redirectUris: cimd.redirectUris,
          grantTypes: cimd.grantTypes,
          tokenEndpointAuthMethod: "none",
          isCimd: true,
        })
        .onConflictDoNothing({ target: oauthClients.clientId });
    } catch {
      // cache is best-effort
    }
    return cimd;
  }

  return null;
}

export async function verifyClientSecret(client: ResolvedOAuthClient, presentedSecret?: string | null): Promise<boolean> {
  if (client.tokenEndpointAuthMethod === "none" || !client.clientSecretHash) {
    return true;
  }
  if (!presentedSecret) return false;
  return safeCompare(client.clientSecretHash, hashToken(presentedSecret));
}

export function parseBasicAuth(header?: string | null): { clientId: string; clientSecret: string } | null {
  if (!header || !header.startsWith("Basic ")) return null;
  try {
    const decoded = Buffer.from(header.slice(6).trim(), "base64").toString("utf8");
    const idx = decoded.indexOf(":");
    if (idx < 0) return null;
    return {
      clientId: decoded.slice(0, idx),
      clientSecret: decoded.slice(idx + 1),
    };
  } catch {
    return null;
  }
}

export async function authenticateMcpBearer(token: string): Promise<OAuthUser | null> {
  if (!token) return null;

  // Legacy personal MCP API keys still work for Cursor / local clients
  if (token.startsWith("ana_mcp_live_")) {
    const [user] = await db.select().from(users).where(eq(users.mcpApiKey, token)).limit(1);
    return user || null;
  }

  const [row] = await db
    .select({ user: users, token: oauthAccessTokens })
    .from(oauthAccessTokens)
    .innerJoin(users, eq(oauthAccessTokens.userId, users.id))
    .where(
      and(
        eq(oauthAccessTokens.tokenHash, hashToken(token)),
        isNull(oauthAccessTokens.revokedAt),
        gt(oauthAccessTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!row) {
    // Also accept a raw mcpApiKey that does not use the prefix
    const [user] = await db.select().from(users).where(eq(users.mcpApiKey, token)).limit(1);
    return user || null;
  }

  if (!isOurMcpResource(row.token.resource)) {
    return null;
  }

  return row.user;
}

export function authorizationServerMetadata() {
  const issuer = getIssuer();
  return {
    issuer,
    authorization_endpoint: `${issuer}/oauth/authorize`,
    token_endpoint: `${issuer}/oauth/token`,
    registration_endpoint: `${issuer}/oauth/register`,
    revocation_endpoint: `${issuer}/oauth/revoke`,
    scopes_supported: [MCP_SCOPE, "offline_access"],
    response_types_supported: ["code"],
    response_modes_supported: ["query"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["none", "client_secret_post", "client_secret_basic"],
    code_challenge_methods_supported: ["S256"],
    client_id_metadata_document_supported: true,
    authorization_response_iss_parameter_supported: true,
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["none"],
  };
}

export function protectedResourceMetadata(resourcePath: string = "/mcp") {
  const issuer = getIssuer();
  const path = resourcePath.startsWith("/") ? resourcePath : `/${resourcePath}`;
  const resource = `${issuer}${path.replace(/\/$/, "")}`;
  return {
    resource,
    authorization_servers: [issuer],
    bearer_methods_supported: ["header"],
    scopes_supported: [MCP_SCOPE, "offline_access"],
    resource_documentation: `${env.FRONTEND_URL.replace(/\/$/, "")}/dashboard/settings?tab=mcp`,
  };
}

export function randomRequestId(): string {
  return `oreq_${nanoid(24)}`;
}
