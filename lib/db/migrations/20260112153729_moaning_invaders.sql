ALTER TABLE "athlete_group" ADD COLUMN "sport" text;--> statement-breakpoint
CREATE INDEX "athlete_group_sport_idx" ON "athlete_group" USING btree ("sport");