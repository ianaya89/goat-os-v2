-- Add public profile settings to athlete table
ALTER TABLE "athlete" ADD COLUMN "is_public_profile" boolean NOT NULL DEFAULT false;
ALTER TABLE "athlete" ADD COLUMN "opportunity_types" jsonb DEFAULT '[]';
ALTER TABLE "athlete" ADD COLUMN "public_profile_enabled_at" timestamp with time zone;

-- Create indexes for public profile queries
CREATE INDEX "athlete_is_public_profile_idx" ON "athlete" ("is_public_profile");
CREATE INDEX "athlete_public_profile_enabled_at_idx" ON "athlete" ("public_profile_enabled_at");
