-- Drop the training_session foreign key constraint
ALTER TABLE "waitlist_entry" DROP CONSTRAINT IF EXISTS "waitlist_entry_training_session_id_training_session_id_fk";--> statement-breakpoint

-- Drop the training_session index
DROP INDEX IF EXISTS "waitlist_entry_training_session_idx";--> statement-breakpoint

-- Drop the old check constraint
ALTER TABLE "waitlist_entry" DROP CONSTRAINT IF EXISTS "waitlist_entry_valid_reference";--> statement-breakpoint

-- Drop the training_session_id column
ALTER TABLE "waitlist_entry" DROP COLUMN IF EXISTS "training_session_id";--> statement-breakpoint

-- Add new schedule preference columns
ALTER TABLE "waitlist_entry" ADD COLUMN "preferred_days" text[];--> statement-breakpoint
ALTER TABLE "waitlist_entry" ADD COLUMN "preferred_start_time" text;--> statement-breakpoint
ALTER TABLE "waitlist_entry" ADD COLUMN "preferred_end_time" text;--> statement-breakpoint

-- Add the new check constraint with updated logic
ALTER TABLE "waitlist_entry" ADD CONSTRAINT "waitlist_entry_valid_reference" CHECK (
	("waitlist_entry"."reference_type" = 'schedule' AND "waitlist_entry"."preferred_days" IS NOT NULL AND "waitlist_entry"."athlete_group_id" IS NULL) OR
	("waitlist_entry"."reference_type" = 'athlete_group' AND "waitlist_entry"."athlete_group_id" IS NOT NULL AND "waitlist_entry"."preferred_days" IS NULL)
);
