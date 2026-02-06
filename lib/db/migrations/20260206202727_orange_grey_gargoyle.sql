CREATE TABLE "athlete_signup_link" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"token" text NOT NULL,
	"name" text NOT NULL,
	"athlete_group_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "athlete_signup_link_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "athlete_signup_link" ADD CONSTRAINT "athlete_signup_link_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_signup_link" ADD CONSTRAINT "athlete_signup_link_athlete_group_id_athlete_group_id_fk" FOREIGN KEY ("athlete_group_id") REFERENCES "public"."athlete_group"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_signup_link" ADD CONSTRAINT "athlete_signup_link_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "athlete_signup_link_organization_id_idx" ON "athlete_signup_link" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "athlete_signup_link_is_active_idx" ON "athlete_signup_link" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "athlete_signup_link_athlete_group_id_idx" ON "athlete_signup_link" USING btree ("athlete_group_id");