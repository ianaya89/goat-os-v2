-- Add zone_id to event_time_block table for breaks to specify location
ALTER TABLE "event_time_block" ADD COLUMN IF NOT EXISTS "zone_id" uuid REFERENCES "event_zone"("id") ON DELETE SET NULL;

-- Add index for zone lookups
CREATE INDEX IF NOT EXISTS "event_time_block_zone_id_idx" ON "event_time_block"("zone_id");
