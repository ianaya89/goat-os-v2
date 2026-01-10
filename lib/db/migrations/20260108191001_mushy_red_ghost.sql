CREATE TABLE "athlete_wellness_survey" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"survey_date" timestamp with time zone DEFAULT now() NOT NULL,
	"sleep_hours" integer NOT NULL,
	"sleep_quality" integer NOT NULL,
	"fatigue" integer NOT NULL,
	"muscle_soreness" integer NOT NULL,
	"energy" integer NOT NULL,
	"mood" integer NOT NULL,
	"stress_level" integer NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "lead" CASCADE;--> statement-breakpoint
ALTER TABLE "athlete_wellness_survey" ADD CONSTRAINT "athlete_wellness_survey_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_wellness_survey" ADD CONSTRAINT "athlete_wellness_survey_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "athlete_wellness_athlete_id_idx" ON "athlete_wellness_survey" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX "athlete_wellness_survey_date_idx" ON "athlete_wellness_survey" USING btree ("survey_date");--> statement-breakpoint
CREATE INDEX "athlete_wellness_org_date_idx" ON "athlete_wellness_survey" USING btree ("organization_id","survey_date");--> statement-breakpoint
CREATE INDEX "athlete_wellness_athlete_date_idx" ON "athlete_wellness_survey" USING btree ("athlete_id","survey_date");