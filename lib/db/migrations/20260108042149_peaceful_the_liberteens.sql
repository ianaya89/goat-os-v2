CREATE TABLE "athlete" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid,
	"sport" text NOT NULL,
	"birth_date" timestamp with time zone,
	"level" text DEFAULT 'beginner' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "athlete" ADD CONSTRAINT "athlete_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete" ADD CONSTRAINT "athlete_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "athlete_organization_id_idx" ON "athlete" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "athlete_user_id_idx" ON "athlete" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "athlete_sport_idx" ON "athlete" USING btree ("sport");--> statement-breakpoint
CREATE INDEX "athlete_level_idx" ON "athlete" USING btree ("level");--> statement-breakpoint
CREATE INDEX "athlete_status_idx" ON "athlete" USING btree ("status");--> statement-breakpoint
CREATE INDEX "athlete_created_at_idx" ON "athlete" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "athlete_org_status_idx" ON "athlete" USING btree ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "athlete_org_user_unique" ON "athlete" USING btree ("organization_id","user_id");