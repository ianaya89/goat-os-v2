CREATE TABLE "waitlist_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"athlete_id" uuid NOT NULL,
	"reference_type" text NOT NULL,
	"training_session_id" uuid,
	"athlete_group_id" uuid,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'waiting' NOT NULL,
	"reason" text,
	"notes" text,
	"position" integer,
	"assigned_at" timestamp with time zone,
	"assigned_by" uuid,
	"expires_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "waitlist_entry_valid_reference" CHECK (
				("waitlist_entry"."reference_type" = 'training_session' AND "waitlist_entry"."training_session_id" IS NOT NULL AND "waitlist_entry"."athlete_group_id" IS NULL) OR
				("waitlist_entry"."reference_type" = 'athlete_group' AND "waitlist_entry"."athlete_group_id" IS NOT NULL AND "waitlist_entry"."training_session_id" IS NULL)
			)
);
--> statement-breakpoint
ALTER TABLE "waitlist_entry" ADD CONSTRAINT "waitlist_entry_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist_entry" ADD CONSTRAINT "waitlist_entry_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist_entry" ADD CONSTRAINT "waitlist_entry_training_session_id_training_session_id_fk" FOREIGN KEY ("training_session_id") REFERENCES "public"."training_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist_entry" ADD CONSTRAINT "waitlist_entry_athlete_group_id_athlete_group_id_fk" FOREIGN KEY ("athlete_group_id") REFERENCES "public"."athlete_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist_entry" ADD CONSTRAINT "waitlist_entry_assigned_by_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist_entry" ADD CONSTRAINT "waitlist_entry_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "waitlist_entry_org_idx" ON "waitlist_entry" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "waitlist_entry_athlete_idx" ON "waitlist_entry" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX "waitlist_entry_status_idx" ON "waitlist_entry" USING btree ("status");--> statement-breakpoint
CREATE INDEX "waitlist_entry_priority_idx" ON "waitlist_entry" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "waitlist_entry_reference_type_idx" ON "waitlist_entry" USING btree ("reference_type");--> statement-breakpoint
CREATE INDEX "waitlist_entry_training_session_idx" ON "waitlist_entry" USING btree ("training_session_id");--> statement-breakpoint
CREATE INDEX "waitlist_entry_athlete_group_idx" ON "waitlist_entry" USING btree ("athlete_group_id");--> statement-breakpoint
CREATE INDEX "waitlist_entry_position_idx" ON "waitlist_entry" USING btree ("position");--> statement-breakpoint
CREATE INDEX "waitlist_entry_org_status_idx" ON "waitlist_entry" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "waitlist_entry_org_type_status_idx" ON "waitlist_entry" USING btree ("organization_id","reference_type","status");