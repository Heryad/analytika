# Analytika — Pricing Architecture & Subscription Model

> **Version**: 1.0.0  
> **Status**: Approved & Locked  
> **Payment Provider**: [Polar.sh](https://polar.sh)

---

## 1. Executive Summary

Analytika operates on a **2-Plan, Volume-Based Subscription Model** with no perpetual free tier. All users receive a **14-day full trial** upon registration.

* **Solo Plan**: Tailored for solo developers, indie hackers, and small SaaS builders. Includes full MRR revenue tracking, MCP AI integration, and up to 3 websites.
* **Growth Plan**: Designed for scaling startups, agencies, and high-growth businesses. Includes 25 websites, X (Twitter) Viral Radar, unlimited funnels, unlimited email alerts, and priority ingestion.
* **Billing Cycles**: Monthly and Annual (Annual plans include a **20% discount**).
* **Quota Policy**: **Soft limits** (traffic spikes and quota exceedances are never dropped; customers receive email prompts and dashboard banners to upgrade).

---

## 2. Event-Based Pricing Matrix (Option B)

| Monthly Events | **Solo (Monthly)** | **Solo (Annual - 20% off)** | **Growth (Monthly)** | **Growth (Annual - 20% off)** |
| :--- | :---: | :---: | :---: | :---: |
| **10k events** | **$7** /mo | **$5.50** /mo <span style="color:#71717a">($66/yr)</span> | **$15** /mo | **$12** /mo <span style="color:#71717a">($144/yr)</span> |
| **100k events** | **$16** /mo | **$13** /mo <span style="color:#71717a">($156/yr)</span> | **$34** /mo | **$27** /mo <span style="color:#71717a">($324/yr)</span> |
| **500k events** | **$39** /mo | **$31** /mo <span style="color:#71717a">($372/yr)</span> | **$79** /mo | **$63** /mo <span style="color:#71717a">($756/yr)</span> |
| **2M events** | **$89** /mo | **$71** /mo <span style="color:#71717a">($852/yr)</span> | **$159** /mo | **$127** /mo <span style="color:#71717a">($1,524/yr)</span> |
| **5M events** | **$169** /mo | **$135** /mo <span style="color:#71717a">($1,620/yr)</span> | **$289** /mo | **$231** /mo <span style="color:#71717a">($2,772/yr)</span> |
| **20M events** | **$349** /mo | **$279** /mo <span style="color:#71717a">($3,348/yr)</span> | **$549** /mo | **$439** /mo <span style="color:#71717a">($5,268/yr)</span> |

---

## 3. Plan Feature Comparison & Gating Rules

| Feature / Limit | **Solo Plan** | **Growth Plan** |
| :--- | :---: | :---: |
| **Tracked Websites** | **3 Websites** | **25 Websites** |
| **MRR & Revenue Attribution** <br/>*(Stripe, Polar & Lemon Squeezy)* | **✅ Included (Full MRR Tracking)** | **✅ Included (Full MRR Tracking)** |
| **MCP (Model Context Protocol) AI** <br/>*(Cursor, Claude Desktop, Windsurf)* | **✅ Included (Full AI Access)** | **✅ Included (Full AI Access)** |
| **Multi-Step Conversion Funnels** | **✅ Up to 3 Funnels** | **✅ Unlimited Funnels & Drop-offs** |
| **Automated Email Alerts** <br/>*(Real-time Gmail / SMTP event dispatch)* | **✅ Up to 3 Active Alerts** | **✅ Unlimited Real-time Email Alerts** |
| **X (Twitter) Posts & Viral Radar** <br/>*(Viral surge detection & tweet attribution)* | ❌ Not included | **✅ Real-time Social Radar** |
| **Real-time Live Pulse & World Map** | ✅ Real-time visitor map | ✅ Real-time visitor map |
| **Custom Event Goals** | ✅ Unlimited custom events | ✅ Unlimited custom events |
| **Embeddable Share Widgets** | ✅ Snapshot Card & Live Pill | ✅ Snapshot Card & Live Pill (8 Colors) |
| **Data Retention** | **1 Year** | **5 Years / Extended** |
| **Ingestion Pipeline** | Standard Ingestion | **Priority High-Throughput Ingestion** |
| **Trial Duration** | 14-Day Free Trial | 14-Day Free Trial |

---

## 4. Soft Quota & Overuse Architecture

To maintain exceptional customer trust, Analytika **never drops analytics events** during sudden traffic spikes or quota overages.

```
Incoming Event --> Fast Redis Ingestion Counter --> Under Quota?
                        |
       +----------------+----------------+
       |                                 |
 [<= 100% Limit]                 [100% - 120% Overuse]
 Normal Operation               1. Preserve 100% of event data
                                2. Trigger automated email warning
                                3. Display non-intrusive banner
                                4. Provide 14-day upgrade grace window
```

1. **Redis Counter**: `usage:org_{id}:{year}_{month}` increments on each track payload.
2. **First Threshold (100%)**:
   * Automated background dispatch: *"You've reached your monthly event limit. Your analytics remain live, but please upgrade your plan."*
3. **Grace Period**: 14 days of continued logging without disruption.
4. **Persistent Overuse (> 14 days or > 150%)**:
   * Dashboard displays upgrade prompt modal.

---

## 5. Polar.sh Product Mapping & Webhooks

### A. Product Structure in Polar
Products are mapped by `[Plan] + [Event Tier] + [Interval]`:
* `prod_solo_10k_monthly` / `prod_solo_10k_annual`
* `prod_solo_100k_monthly` / `prod_solo_100k_annual`
* `prod_growth_10k_monthly` / `prod_growth_10k_annual`
* ...and corresponding variants up to `20M`.

### B. Webhook Handlers (`/api/v1/webhooks/polar`)
* **`subscription.created`**:
  * Sets `plan = 'solo' | 'growth'`
  * Sets `event_quota = 100000` (e.g. 100k)
  * Sets `billing_interval = 'month' | 'year'`
  * Sets `subscription_status = 'active'`
* **`subscription.updated`**:
  * Syncs upgraded/downgraded volume tiers or interval changes.
* **`subscription.canceled` / `subscription.revoked`**:
  * Sets `subscription_status = 'canceled'` (grace period until end of period).

---

## 6. Database Schema Reference (PostgreSQL / Drizzle / Prisma)

```sql
-- Organization / Subscription Table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  plan VARCHAR(50) NOT NULL DEFAULT 'solo', -- 'solo' | 'growth'
  billing_interval VARCHAR(20) NOT NULL DEFAULT 'month', -- 'month' | 'year'
  event_quota BIGINT NOT NULL DEFAULT 10000, -- 10k, 100k, 500k, 2M, 5M, 20M
  max_websites INT NOT NULL DEFAULT 3, -- 3 for solo, 25 for growth
  max_funnels INT NOT NULL DEFAULT 3, -- 3 for solo, -1 (unlimited) for growth
  max_alerts INT NOT NULL DEFAULT 3, -- 3 for solo, -1 (unlimited) for growth
  has_social_radar BOOLEAN NOT NULL DEFAULT false, -- false for solo, true for growth
  retention_days INT NOT NULL DEFAULT 365, -- 365 for solo, 1825 for growth
  
  -- Polar Integration
  polar_customer_id VARCHAR(255),
  polar_subscription_id VARCHAR(255),
  subscription_status VARCHAR(50) DEFAULT 'trialing', -- 'trialing' | 'active' | 'past_due' | 'canceled'
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
  current_period_end TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
