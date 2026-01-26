-- Run this manually if db:migrate fails
-- psql $DATABASE_URL -f create_sponsor_tables.sql

CREATE TABLE IF NOT EXISTS "sponsor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
	"name" text NOT NULL,
	"description" text,
	"logo_url" text,
	"website_url" text,
	"contact_name" text,
	"contact_email" text,
	"contact_phone" text,
	"tier" text DEFAULT 'partner' NOT NULL,
	"contract_start_date" timestamp with time zone,
	"contract_end_date" timestamp with time zone,
	"contract_value" integer,
	"currency" text DEFAULT 'ARS' NOT NULL,
	"contract_notes" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid REFERENCES "user"("id") ON DELETE SET NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "event_sponsor_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL REFERENCES "sports_event"("id") ON DELETE CASCADE,
	"sponsor_id" uuid NOT NULL REFERENCES "sponsor"("id") ON DELETE CASCADE,
	"tier" text,
	"sponsorship_value" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'ARS' NOT NULL,
	"in_kind_description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_confirmed" boolean DEFAULT false NOT NULL,
	"confirmed_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "sponsor_organization_id_idx" ON "sponsor" ("organization_id");
CREATE INDEX IF NOT EXISTS "sponsor_status_idx" ON "sponsor" ("status");
CREATE INDEX IF NOT EXISTS "event_sponsor_assignment_event_id_idx" ON "event_sponsor_assignment" ("event_id");
CREATE INDEX IF NOT EXISTS "event_sponsor_assignment_sponsor_id_idx" ON "event_sponsor_assignment" ("sponsor_id");
CREATE INDEX IF NOT EXISTS "event_sponsor_assignment_sort_order_idx" ON "event_sponsor_assignment" ("sort_order");

-- Confirm tables created
SELECT 'sponsor' as table_name, count(*) as exists FROM information_schema.tables WHERE table_name = 'sponsor'
UNION ALL
SELECT 'event_sponsor_assignment', count(*) FROM information_schema.tables WHERE table_name = 'event_sponsor_assignment';
