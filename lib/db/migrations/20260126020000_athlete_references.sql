-- Athlete references table for professional/personal references
CREATE TABLE "athlete_reference" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "athlete_id" uuid NOT NULL REFERENCES "athlete"("id") ON DELETE CASCADE,
  -- Reference person info
  "name" text NOT NULL,
  "relationship" text NOT NULL, -- e.g., "Coach", "Manager", "Teacher", "Former Teammate"
  "organization" text, -- Where they work/worked together
  "position" text, -- Their current position/title
  -- Contact info (optional, only shown if athlete approves)
  "email" text,
  "phone" text,
  -- Reference content
  "testimonial" text, -- Quote/testimonial from the reference
  "skills_highlighted" jsonb DEFAULT '[]', -- Array of skills they can vouch for
  -- Verification
  "is_verified" boolean NOT NULL DEFAULT false,
  "verified_at" timestamp with time zone,
  -- Display settings
  "is_public" boolean NOT NULL DEFAULT true,
  "display_order" integer NOT NULL DEFAULT 0,
  -- Timestamps
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX "athlete_reference_athlete_id_idx" ON "athlete_reference" ("athlete_id");
CREATE INDEX "athlete_reference_is_public_idx" ON "athlete_reference" ("is_public");
