ALTER TABLE "event_payment" ADD COLUMN "receipt_image_key" text;--> statement-breakpoint
ALTER TABLE "event_payment" ADD COLUMN "receipt_image_uploaded_at" timestamp with time zone;