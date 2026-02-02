ALTER TABLE "coach" ADD COLUMN "cover_photo_key" text;--> statement-breakpoint
ALTER TABLE "coach" ADD COLUMN "is_public_profile" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "coach" ADD COLUMN "opportunity_types" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
CREATE INDEX "coach_is_public_profile_idx" ON "coach" USING btree ("is_public_profile");