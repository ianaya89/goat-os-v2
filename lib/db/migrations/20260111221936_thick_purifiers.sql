ALTER TABLE "organization" ADD COLUMN "timezone" text DEFAULT 'America/Argentina/Buenos_Aires' NOT NULL;--> statement-breakpoint
CREATE INDEX "athlete_evaluation_evaluated_by_idx" ON "athlete_evaluation" USING btree ("evaluated_by");--> statement-breakpoint
CREATE INDEX "athlete_evaluation_evaluator_created_idx" ON "athlete_evaluation" USING btree ("evaluated_by","created_at");--> statement-breakpoint
CREATE INDEX "athlete_evaluation_athlete_created_idx" ON "athlete_evaluation" USING btree ("athlete_id","created_at");--> statement-breakpoint
CREATE INDEX "training_payment_org_athlete_date_idx" ON "training_payment" USING btree ("organization_id","athlete_id","payment_date");--> statement-breakpoint
CREATE UNIQUE INDEX "training_payment_session_athlete_unique" ON "training_payment" USING btree ("session_id","athlete_id") WHERE "training_payment"."session_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "training_session_org_created_by_idx" ON "training_session" USING btree ("organization_id","created_by");