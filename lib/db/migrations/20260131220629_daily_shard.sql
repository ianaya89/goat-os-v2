CREATE TABLE "club" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"short_name" text,
	"country" text,
	"city" text,
	"logo_key" text,
	"website" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "national_team" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"country" text NOT NULL,
	"category" text,
	"logo_key" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "athlete_career_history" ADD COLUMN "club_id" uuid;--> statement-breakpoint
ALTER TABLE "athlete_career_history" ADD COLUMN "national_team_id" uuid;--> statement-breakpoint
ALTER TABLE "athlete_group" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "current_club_id" uuid;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "current_national_team_id" uuid;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "coach_sports_experience" ADD COLUMN "club_id" uuid;--> statement-breakpoint
ALTER TABLE "coach_sports_experience" ADD COLUMN "national_team_id" uuid;--> statement-breakpoint
ALTER TABLE "coach" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "club" ADD CONSTRAINT "club_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "national_team" ADD CONSTRAINT "national_team_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "club_organization_id_idx" ON "club" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "club_country_idx" ON "club" USING btree ("country");--> statement-breakpoint
CREATE INDEX "club_name_idx" ON "club" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "club_org_name_unique" ON "club" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "national_team_organization_id_idx" ON "national_team" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "national_team_country_idx" ON "national_team" USING btree ("country");--> statement-breakpoint
CREATE UNIQUE INDEX "national_team_org_country_category_unique" ON "national_team" USING btree ("organization_id","country","category");--> statement-breakpoint
ALTER TABLE "athlete_career_history" ADD CONSTRAINT "athlete_career_history_club_id_club_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."club"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_career_history" ADD CONSTRAINT "athlete_career_history_national_team_id_national_team_id_fk" FOREIGN KEY ("national_team_id") REFERENCES "public"."national_team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete" ADD CONSTRAINT "athlete_current_club_id_club_id_fk" FOREIGN KEY ("current_club_id") REFERENCES "public"."club"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete" ADD CONSTRAINT "athlete_current_national_team_id_national_team_id_fk" FOREIGN KEY ("current_national_team_id") REFERENCES "public"."national_team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_sports_experience" ADD CONSTRAINT "coach_sports_experience_club_id_club_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."club"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_sports_experience" ADD CONSTRAINT "coach_sports_experience_national_team_id_national_team_id_fk" FOREIGN KEY ("national_team_id") REFERENCES "public"."national_team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "athlete_career_history_club_id_idx" ON "athlete_career_history" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "athlete_career_history_national_team_id_idx" ON "athlete_career_history" USING btree ("national_team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "athlete_group_archived_at_idx" ON "athlete_group" USING btree ("archived_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "athlete_archived_at_idx" ON "athlete" USING btree ("archived_at");--> statement-breakpoint
CREATE INDEX "athlete_current_club_id_idx" ON "athlete" USING btree ("current_club_id");--> statement-breakpoint
CREATE INDEX "athlete_current_national_team_id_idx" ON "athlete" USING btree ("current_national_team_id");--> statement-breakpoint
CREATE INDEX "coach_sports_experience_club_id_idx" ON "coach_sports_experience" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "coach_sports_experience_national_team_id_idx" ON "coach_sports_experience" USING btree ("national_team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "coach_archived_at_idx" ON "coach" USING btree ("archived_at");--> statement-breakpoint
ALTER TABLE "athlete_career_history" DROP COLUMN "club_name";--> statement-breakpoint
ALTER TABLE "athlete_career_history" DROP COLUMN "was_national_team";--> statement-breakpoint
ALTER TABLE "athlete_career_history" DROP COLUMN "national_team_level";--> statement-breakpoint
ALTER TABLE "athlete" DROP COLUMN "current_club";--> statement-breakpoint
ALTER TABLE "coach_sports_experience" DROP COLUMN "institution_name";