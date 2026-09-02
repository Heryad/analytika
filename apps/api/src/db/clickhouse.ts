import { createClient, type ClickHouseClient, ClickHouseLogLevel } from "@clickhouse/client";
import { env } from "@/config/env";
import { logger } from "@/lib/logger";

/**
 * ClickHouse Client Instance
 */
export const clickhouse: ClickHouseClient = createClient({
  url: env.CLICKHOUSE_HOST,
  username: env.CLICKHOUSE_USER,
  password: env.CLICKHOUSE_PASSWORD,
  database: env.CLICKHOUSE_DB,
  request_timeout: 30000,
  max_open_connections: 50,
  keep_alive: {
    enabled: true,
    idle_socket_ttl: 10000,
  },
  log: {
    level: ClickHouseLogLevel.OFF,
  },
});

/**
 * ClickHouse Event Schema Definition
 */
export interface ClickHouseEventRecord {
  website_id: string;
  event_name: string;
  event_value: number | null;
  event_currency: string | null;
  timestamp: string; // ISO UTC or YYYY-MM-DD HH:mm:ss.SSS
  session_id: string;
  visitor_id: string;
  hostname: string;
  pathname: string;
  search: string;
  hash: string;
  referrer: string;
  referrer_domain: string;
  channel: string;
  country_code: string;
  city: string;
  region: string;
  browser: string;
  browser_version: string;
  os: string;
  device_type: string;
  screen_width: number;
  screen_height: number;
  user_language: string;
  page_title: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
  properties: Record<string, string>;
}

/**
 * Ensures the `events` table exists with high-performance ClickHouse engine
 */
export async function initClickHouseSchema(): Promise<boolean> {
  try {
    // 1. Ensure database exists
    await clickhouse.query({
      query: `CREATE DATABASE IF NOT EXISTS ${env.CLICKHOUSE_DB}`,
    });

    // 2. Create high-throughput events table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${env.CLICKHOUSE_DB}.events (
        website_id LowCardinality(String),
        event_name LowCardinality(String),
        event_value Nullable(Float64),
        event_currency Nullable(String),
        timestamp DateTime64(3, 'UTC') DEFAULT now64(3),
        session_id String,
        visitor_id String,
        hostname String,
        pathname String,
        search String,
        hash String,
        referrer String,
        referrer_domain LowCardinality(String),
        channel LowCardinality(String),
        country_code LowCardinality(String),
        city String,
        region String,
        browser LowCardinality(String),
        browser_version String,
        os LowCardinality(String),
        device_type LowCardinality(String),
        screen_width UInt16,
        screen_height UInt16,
        user_language LowCardinality(String),
        page_title String,
        utm_source LowCardinality(String),
        utm_medium LowCardinality(String),
        utm_campaign LowCardinality(String),
        utm_term String,
        utm_content String,
        properties Map(String, String)
      )
      ENGINE = MergeTree()
      PARTITION BY toYYYYMM(timestamp)
      ORDER BY (website_id, toDate(timestamp), event_name, visitor_id, timestamp)
      SETTINGS index_granularity = 8192;
    `;

    await clickhouse.query({
      query: createTableQuery,
    });

    logger.info("ClickHouse schema initialized successfully", {
      db: env.CLICKHOUSE_DB,
      table: "events",
    });

    return true;
  } catch (err: any) {
    logger.error("Failed to initialize ClickHouse schema", {
      error: err?.message || err,
    });
    return false;
  }
}

/**
 * Tests ClickHouse connectivity on boot
 */
export async function testClickHouseConnection(): Promise<boolean> {
  try {
    const res = await clickhouse.query({
      query: "SELECT 1",
    });
    await res.json();
    return true;
  } catch (err: any) {
    logger.error("ClickHouse connection test failed", {
      error: err?.message || err,
    });
    return false;
  }
}
