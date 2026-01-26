-- Event Discount Tables
-- Supports both code-based discounts and automatic discounts for events

-- Create table for event discounts
CREATE TABLE IF NOT EXISTS "event_discount" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"discount_mode" text NOT NULL,
	"code" text,
	"discount_value_type" text NOT NULL,
	"discount_value" integer NOT NULL,
	"max_uses" integer,
	"max_uses_per_user" integer,
	"current_uses" integer DEFAULT 0 NOT NULL,
	"valid_from" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"min_purchase_amount" integer,
	"priority" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create table for discount usage tracking
CREATE TABLE IF NOT EXISTS "event_discount_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"discount_id" uuid NOT NULL,
	"registration_id" uuid NOT NULL,
	"user_email" text NOT NULL,
	"discount_amount" integer NOT NULL,
	"used_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Add discount tracking columns to event_registration
ALTER TABLE "event_registration" ADD COLUMN IF NOT EXISTS "applied_discount_id" uuid;
ALTER TABLE "event_registration" ADD COLUMN IF NOT EXISTS "discount_amount" integer DEFAULT 0 NOT NULL;

-- Add foreign key constraints
DO $$ BEGIN
	ALTER TABLE "event_discount" ADD CONSTRAINT "event_discount_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sports_event"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
	ALTER TABLE "event_discount" ADD CONSTRAINT "event_discount_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
	ALTER TABLE "event_discount_usage" ADD CONSTRAINT "event_discount_usage_discount_id_event_discount_id_fk" FOREIGN KEY ("discount_id") REFERENCES "public"."event_discount"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
	ALTER TABLE "event_discount_usage" ADD CONSTRAINT "event_discount_usage_registration_id_event_registration_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."event_registration"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
	ALTER TABLE "event_registration" ADD CONSTRAINT "event_registration_applied_discount_id_event_discount_id_fk" FOREIGN KEY ("applied_discount_id") REFERENCES "public"."event_discount"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

-- Create indexes for event_discount
CREATE INDEX IF NOT EXISTS "event_discount_event_id_idx" ON "event_discount" USING btree ("event_id");
CREATE INDEX IF NOT EXISTS "event_discount_organization_id_idx" ON "event_discount" USING btree ("organization_id");
CREATE INDEX IF NOT EXISTS "event_discount_mode_idx" ON "event_discount" USING btree ("discount_mode");
CREATE INDEX IF NOT EXISTS "event_discount_code_idx" ON "event_discount" USING btree ("code");
CREATE UNIQUE INDEX IF NOT EXISTS "event_discount_event_code_unique" ON "event_discount" USING btree ("event_id","code") WHERE code IS NOT NULL;

-- Create indexes for event_discount_usage
CREATE INDEX IF NOT EXISTS "event_discount_usage_discount_id_idx" ON "event_discount_usage" USING btree ("discount_id");
CREATE INDEX IF NOT EXISTS "event_discount_usage_registration_id_idx" ON "event_discount_usage" USING btree ("registration_id");
CREATE INDEX IF NOT EXISTS "event_discount_usage_user_email_idx" ON "event_discount_usage" USING btree ("user_email");
