CREATE TABLE IF NOT EXISTS "oauth_clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar(1024) NOT NULL,
	"client_secret_hash" varchar(255),
	"client_name" varchar(255) NOT NULL,
	"client_uri" text,
	"logo_uri" text,
	"redirect_uris" jsonb NOT NULL,
	"grant_types" jsonb NOT NULL,
	"token_endpoint_auth_method" varchar(50) DEFAULT 'none' NOT NULL,
	"is_cimd" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "oauth_clients_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "oauth_authorization_requests" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"client_id" varchar(1024) NOT NULL,
	"client_name" varchar(255) NOT NULL,
	"client_uri" text,
	"logo_uri" text,
	"redirect_uri" text NOT NULL,
	"state" text,
	"scope" text,
	"resource" text,
	"code_challenge" varchar(255) NOT NULL,
	"code_challenge_method" varchar(20) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "oauth_authorization_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code_hash" varchar(255) NOT NULL,
	"client_id" varchar(1024) NOT NULL,
	"user_id" uuid NOT NULL,
	"redirect_uri" text NOT NULL,
	"scope" text,
	"resource" text,
	"code_challenge" varchar(255) NOT NULL,
	"code_challenge_method" varchar(20) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "oauth_authorization_codes_code_hash_unique" UNIQUE("code_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "oauth_access_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"refresh_token_hash" varchar(255),
	"client_id" varchar(1024) NOT NULL,
	"user_id" uuid NOT NULL,
	"scope" text,
	"resource" text,
	"expires_at" timestamp with time zone NOT NULL,
	"refresh_expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "oauth_access_tokens_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "oauth_access_tokens_refresh_token_hash_unique" UNIQUE("refresh_token_hash")
);
--> statement-breakpoint
ALTER TABLE "oauth_authorization_codes" ADD CONSTRAINT "oauth_authorization_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "oauth_access_tokens" ADD CONSTRAINT "oauth_access_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
