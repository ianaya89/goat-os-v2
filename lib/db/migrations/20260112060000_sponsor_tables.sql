CREATE TABLE IF NOT EXISTS "sponsor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
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
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_sponsor_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"sponsor_id" uuid NOT NULL,
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
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "sponsor" ADD CONSTRAINT "sponsor_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "sponsor" ADD CONSTRAINT "sponsor_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "event_sponsor_assignment" ADD CONSTRAINT "event_sponsor_assignment_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sports_event"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "event_sponsor_assignment" ADD CONSTRAINT "event_sponsor_assignment_sponsor_id_sponsor_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsor"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sponsor_organization_id_idx" ON "sponsor" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sponsor_status_idx" ON "sponsor" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_sponsor_assignment_event_id_idx" ON "event_sponsor_assignment" USING btree ("event_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_sponsor_assignment_sponsor_id_idx" ON "event_sponsor_assignment" USING btree ("sponsor_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_sponsor_assignment_sort_order_idx" ON "event_sponsor_assignment" USING btree ("sort_order");
