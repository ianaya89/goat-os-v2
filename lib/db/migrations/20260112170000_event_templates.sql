-- Event Templates table
CREATE TABLE IF NOT EXISTS "event_template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"event_type" text DEFAULT 'campus' NOT NULL,
	"default_title" text,
	"default_description" text,
	"default_duration_days" integer DEFAULT 1,
	"max_capacity" integer,
	"enable_waitlist" boolean DEFAULT true NOT NULL,
	"max_waitlist_size" integer,
	"allow_public_registration" boolean DEFAULT true NOT NULL,
	"allow_early_access_for_members" boolean DEFAULT false NOT NULL,
	"member_early_access_days" integer DEFAULT 7,
	"requires_approval" boolean DEFAULT false NOT NULL,
	"currency" text DEFAULT 'ARS' NOT NULL,
	"accepted_payment_methods" text,
	"contact_email" text,
	"contact_phone" text,
	"cover_image_url" text,
	"template_data" text,
	"source_event_id" uuid,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Foreign keys
DO $$ BEGIN
 ALTER TABLE "event_template" ADD CONSTRAINT "event_template_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "event_template" ADD CONSTRAINT "event_template_source_event_id_sports_event_id_fk" FOREIGN KEY ("source_event_id") REFERENCES "public"."sports_event"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "event_template" ADD CONSTRAINT "event_template_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "event_template_org_id_idx" ON "event_template" USING btree ("organization_id");
CREATE INDEX IF NOT EXISTS "event_template_category_idx" ON "event_template" USING btree ("category");
CREATE INDEX IF NOT EXISTS "event_template_event_type_idx" ON "event_template" USING btree ("event_type");
CREATE INDEX IF NOT EXISTS "event_template_is_active_idx" ON "event_template" USING btree ("is_active");
CREATE UNIQUE INDEX IF NOT EXISTS "event_template_org_name_unique" ON "event_template" USING btree ("organization_id","name");
