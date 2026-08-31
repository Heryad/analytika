import { createClient, type ClickHouseClient } from "@clickhouse/client";

const url = process.env.CLICKHOUSE_URL || "http://localhost:8123";
const username = process.env.CLICKHOUSE_USER || "default";
const password = process.env.CLICKHOUSE_PASSWORD || "";
const database = process.env.CLICKHOUSE_DATABASE || "analytika";

let client: ClickHouseClient | null = null;

export function getClickHouseClient(): ClickHouseClient {
  if (!client) {
    client = createClient({
      url,
      username,
      password,
      database,
      request_timeout: 10_000,
      clickhouse_settings: {
        async_insert: 1,
        wait_for_async_insert: 0,
      },
    });
  }
  return client;
}

export interface AnalyticsEventRow {
  id: string;
  website_id: string;
  event_type: "pageview" | "track" | "identify";
  event_name: string;
  anonymous_id: string;
  user_id?: string | null;
  session_id: string;
  timestamp: string; // ISO String formatted or YYYY-MM-DD HH:MM:SS.mmm
  hostname: string;
  url: string;
  path: string;
  entry_page?: string | null;
  referrer?: string | null;
  referrer_domain?: string | null;
  channel: string; // organic_search, direct, social, paid, referral
  page_title?: string | null;
  screen_resolution?: string | null;
  user_agent?: string | null;
  browser?: string | null;
  os?: string | null;
  device_type?: string | null; // desktop, mobile, tablet
  country?: string | null;
  region?: string | null;
  city?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  revenue?: number | null;
  currency?: string | null;
  properties: string; // JSON stringified
  user_traits: string; // JSON stringified
  created_at?: string;
}

export async function initClickHouse(): Promise<void> {
  const ch = getClickHouseClient();

  try {
    // 1. Create database if it does not exist
    await ch.command({
      query: `CREATE DATABASE IF NOT EXISTS ${database}`,
    });

    // 2. Create the high-speed analytics events table
    await ch.command({
      query: `
        CREATE TABLE IF NOT EXISTS ${database}.events (
          id UUID,
          website_id UUID,
          event_type LowCardinality(String),
          event_name LowCardinality(String),
          anonymous_id String,
          user_id Nullable(String),
          session_id String,
          timestamp DateTime64(3, 'UTC'),

          hostname LowCardinality(String),
          url String,
          path LowCardinality(String),
          entry_page LowCardinality(Nullable(String)),
          referrer Nullable(String),
          referrer_domain LowCardinality(Nullable(String)),
          channel LowCardinality(String),
          page_title Nullable(String),

          screen_resolution Nullable(String),
          user_agent Nullable(String),
          browser LowCardinality(Nullable(String)),
          os LowCardinality(Nullable(String)),
          device_type LowCardinality(Nullable(String)),

          country LowCardinality(Nullable(String)),
          region LowCardinality(Nullable(String)),
          city Nullable(String),

          utm_source LowCardinality(Nullable(String)),
          utm_medium LowCardinality(Nullable(String)),
          utm_campaign LowCardinality(Nullable(String)),
          utm_term Nullable(String),
          utm_content Nullable(String),

          revenue Nullable(Float64),
          currency LowCardinality(Nullable(String)),

          properties String,
          user_traits String,
          created_at DateTime64(3, 'UTC') DEFAULT now64(3)
        )
        ENGINE = MergeTree()
        PARTITION BY toYYYYMM(timestamp)
        ORDER BY (website_id, timestamp, event_name, session_id);
      `,
    });

    console.log("✅ ClickHouse events table verified and ready");
  } catch (error) {
    console.warn("⚠️ ClickHouse init warning (will retry on next request if offline):", error);
  }
}

export async function insertEvents(rows: AnalyticsEventRow[]): Promise<void> {
  if (rows.length === 0) return;
  const ch = getClickHouseClient();

  await ch.insert({
    table: "events",
    values: rows,
    format: "JSONEachRow",
  });
}
