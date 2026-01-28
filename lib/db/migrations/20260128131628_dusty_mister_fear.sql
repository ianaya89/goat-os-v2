CREATE TABLE "coach_sports_experience" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid NOT NULL,
	"institution_name" text NOT NULL,
	"role" text NOT NULL,
	"sport" text,
	"level" text,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"achievements" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "coach_sports_experience" ADD CONSTRAINT "coach_sports_experience_coach_id_coach_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coach_sports_experience_coach_id_idx" ON "coach_sports_experience" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "coach_sports_experience_start_date_idx" ON "coach_sports_experience" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "coach_sports_experience_coach_dates_idx" ON "coach_sports_experience" USING btree ("coach_id","start_date","end_date");