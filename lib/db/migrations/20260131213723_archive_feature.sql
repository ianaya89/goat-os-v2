-- Add archivedAt column to athlete table
ALTER TABLE "athlete" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "athlete_archived_at_idx" ON "athlete" USING btree ("archived_at");--> statement-breakpoint

-- Add archivedAt column to coach table
ALTER TABLE "coach" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "coach_archived_at_idx" ON "coach" USING btree ("archived_at");--> statement-breakpoint

-- Add archivedAt column to athlete_group table
ALTER TABLE "athlete_group" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "athlete_group_archived_at_idx" ON "athlete_group" USING btree ("archived_at");
