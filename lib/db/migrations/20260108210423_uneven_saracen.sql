CREATE TABLE "athlete_session_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"athlete_id" uuid NOT NULL,
	"rpe_rating" integer,
	"satisfaction_rating" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "athlete_session_feedback_rpe_rating_check" CHECK ("athlete_session_feedback"."rpe_rating" IS NULL OR ("athlete_session_feedback"."rpe_rating" >= 1 AND "athlete_session_feedback"."rpe_rating" <= 10)),
	CONSTRAINT "athlete_session_feedback_satisfaction_rating_check" CHECK ("athlete_session_feedback"."satisfaction_rating" IS NULL OR ("athlete_session_feedback"."satisfaction_rating" >= 1 AND "athlete_session_feedback"."satisfaction_rating" <= 10))
);
--> statement-breakpoint
ALTER TABLE "athlete_session_feedback" ADD CONSTRAINT "athlete_session_feedback_session_id_training_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."training_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_session_feedback" ADD CONSTRAINT "athlete_session_feedback_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "athlete_session_feedback_session_id_idx" ON "athlete_session_feedback" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "athlete_session_feedback_athlete_id_idx" ON "athlete_session_feedback" USING btree ("athlete_id");--> statement-breakpoint
CREATE UNIQUE INDEX "athlete_session_feedback_session_athlete_unique" ON "athlete_session_feedback" USING btree ("session_id","athlete_id");