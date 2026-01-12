ALTER TABLE "location" ADD COLUMN "color" text;--> statement-breakpoint
ALTER TABLE "training_session" ADD COLUMN "attachment_key" text;--> statement-breakpoint
ALTER TABLE "training_session" ADD COLUMN "attachment_uploaded_at" timestamp with time zone;