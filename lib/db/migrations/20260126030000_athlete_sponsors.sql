-- Athlete sponsors table for personal sponsorships/partnerships
CREATE TABLE "athlete_sponsor" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "athlete_id" uuid NOT NULL REFERENCES "athlete"("id") ON DELETE CASCADE,
  -- Sponsor/Brand info
  "name" text NOT NULL,
  "logo_key" text, -- S3 key for logo
  "website" text, -- Brand website URL
  "description" text, -- Brief description of the partnership
  -- Partnership details
  "partnership_type" text, -- e.g., "equipment", "apparel", "nutrition", "financial"
  "start_date" timestamp with time zone,
  "end_date" timestamp with time zone, -- NULL if ongoing
  -- Display settings
  "is_public" boolean NOT NULL DEFAULT true,
  "display_order" integer NOT NULL DEFAULT 0,
  -- Timestamps
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX "athlete_sponsor_athlete_id_idx" ON "athlete_sponsor" ("athlete_id");
CREATE INDEX "athlete_sponsor_is_public_idx" ON "athlete_sponsor" ("is_public");
