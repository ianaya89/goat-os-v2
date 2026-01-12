ALTER TABLE "athlete_group" ADD COLUMN "age_category_id" uuid;--> statement-breakpoint
ALTER TABLE "athlete_group" ADD COLUMN "max_capacity" integer;--> statement-breakpoint
CREATE INDEX "athlete_group_age_category_id_idx" ON "athlete_group" USING btree ("age_category_id");