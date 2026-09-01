CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(50) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"website_id" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"event_id" varchar(255) NOT NULL,
	"icon" varchar(50) DEFAULT 'zap' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"subject_template" text NOT NULL,
	"body_template" text NOT NULL,
	"last_triggered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "funnels" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"website_id" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"steps" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"code_hash" varchar(255) NOT NULL,
	"type" varchar(20) NOT NULL,
	"name" varchar(255),
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"website_id" varchar(64) NOT NULL,
	"platform" varchar(50) NOT NULL,
	"api_key_encrypted" text,
	"api_key_masked" varchar(100),
	"store_id" varchar(255),
	"webhook_secret_encrypted" text,
	"is_connected" boolean DEFAULT false NOT NULL,
	"auto_attribution" boolean DEFAULT true NOT NULL,
	"connected_at" timestamp with time zone,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"avatar_url" text,
	"theme" varchar(20) DEFAULT 'dark' NOT NULL,
	"email_digest" boolean DEFAULT true NOT NULL,
	"product_announcements" boolean DEFAULT true NOT NULL,
	"mcp_api_key" varchar(255),
	"plan" varchar(50) DEFAULT 'solo' NOT NULL,
	"billing_interval" varchar(20) DEFAULT 'month' NOT NULL,
	"event_quota" bigint DEFAULT 10000 NOT NULL,
	"max_websites" integer DEFAULT 3 NOT NULL,
	"max_funnels" integer DEFAULT 3 NOT NULL,
	"max_alerts" integer DEFAULT 3 NOT NULL,
	"has_social_radar" boolean DEFAULT false NOT NULL,
	"retention_days" integer DEFAULT 365 NOT NULL,
	"polar_customer_id" varchar(255),
	"polar_subscription_id" varchar(255),
	"subscription_status" varchar(50) DEFAULT 'trialing' NOT NULL,
	"trial_ends_at" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_mcp_api_key_unique" UNIQUE("mcp_api_key")
);
--> statement-breakpoint
CREATE TABLE "websites" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"domain" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"timezone" varchar(100) DEFAULT 'UTC' NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"share_password_hash" varchar(255),
	"custom_proxy_domain" varchar(255),
	"proxy_verified" boolean DEFAULT false NOT NULL,
	"allow_localhost" boolean DEFAULT true NOT NULL,
	"ignore_my_visits" boolean DEFAULT true NOT NULL,
	"blocked_ips" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"excluded_paths" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_website_id_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funnels" ADD CONSTRAINT "funnels_website_id_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_integrations" ADD CONSTRAINT "payment_integrations_website_id_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "websites" ADD CONSTRAINT "websites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "provider_account_idx" ON "accounts" USING btree ("provider","provider_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "website_platform_idx" ON "payment_integrations" USING btree ("website_id","platform");