-- Event zone staff table - staff assigned to specific zones
CREATE TABLE IF NOT EXISTS "event_zone_staff" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "zone_id" uuid NOT NULL REFERENCES "event_zone"("id") ON DELETE CASCADE,
    "staff_id" uuid NOT NULL REFERENCES "event_staff"("id") ON DELETE CASCADE,
    "role_at_zone" text,
    "is_primary" boolean NOT NULL DEFAULT false,
    "notes" text,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS "event_zone_staff_zone_id_idx" ON "event_zone_staff" ("zone_id");
CREATE INDEX IF NOT EXISTS "event_zone_staff_staff_id_idx" ON "event_zone_staff" ("staff_id");
CREATE UNIQUE INDEX IF NOT EXISTS "event_zone_staff_unique" ON "event_zone_staff" ("zone_id", "staff_id");
