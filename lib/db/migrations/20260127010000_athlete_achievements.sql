-- Athlete achievements table for palmarés and sports accomplishments
CREATE TABLE "athlete_achievement" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "athlete_id" uuid NOT NULL REFERENCES "athlete"("id") ON DELETE CASCADE,
  -- Achievement info
  "title" text NOT NULL, -- e.g., "Campeón Liga Nacional"
  "type" text NOT NULL, -- championship, award, selection, record, etc.
  "scope" text NOT NULL, -- individual, collective
  -- Context
  "year" integer NOT NULL, -- Year of the achievement
  "organization" text, -- e.g., "Liga Nacional de Fútbol"
  "team" text, -- Team/club if collective achievement
  "competition" text, -- e.g., "Copa América Sub-20"
  "position" text, -- e.g., "1er lugar", "Medalla de Oro"
  -- Additional details
  "description" text, -- Longer description of the achievement
  -- Display settings
  "is_public" boolean NOT NULL DEFAULT true,
  "display_order" integer NOT NULL DEFAULT 0,
  -- Timestamps
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX "athlete_achievement_athlete_id_idx" ON "athlete_achievement" ("athlete_id");
CREATE INDEX "athlete_achievement_year_idx" ON "athlete_achievement" ("year");
CREATE INDEX "athlete_achievement_type_idx" ON "athlete_achievement" ("type");
CREATE INDEX "athlete_achievement_is_public_idx" ON "athlete_achievement" ("is_public");
CREATE INDEX "athlete_achievement_athlete_year_idx" ON "athlete_achievement" ("athlete_id", "year");
