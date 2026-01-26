-- Event zones table - areas/locations within the event venue
CREATE TABLE IF NOT EXISTS "event_zone" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "event_id" uuid NOT NULL,
    "organization_id" uuid NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "zone_type" text,
    "capacity" integer,
    "location_description" text,
    "map_x" integer,
    "map_y" integer,
    "map_width" integer,
    "map_height" integer,
    "color" text,
    "is_active" boolean NOT NULL DEFAULT true,
    "notes" text,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "event_zone_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "sports_event"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "event_zone_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- Indexes for event_zone
CREATE INDEX IF NOT EXISTS "event_zone_event_id_idx" ON "event_zone" ("event_id");
CREATE INDEX IF NOT EXISTS "event_zone_org_id_idx" ON "event_zone" ("organization_id");
CREATE INDEX IF NOT EXISTS "event_zone_zone_type_idx" ON "event_zone" ("zone_type");
CREATE INDEX IF NOT EXISTS "event_zone_is_active_idx" ON "event_zone" ("is_active");
CREATE UNIQUE INDEX IF NOT EXISTS "event_zone_event_name_unique" ON "event_zone" ("event_id", "name");

-- Event staff table - staff/volunteers assigned to events
CREATE TABLE IF NOT EXISTS "event_staff" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "event_id" uuid NOT NULL,
    "organization_id" uuid NOT NULL,
    "staff_type" text NOT NULL,
    "user_id" uuid,
    "external_name" text,
    "external_email" text,
    "external_phone" text,
    "role" text NOT NULL DEFAULT 'volunteer',
    "role_title" text,
    "is_confirmed" boolean NOT NULL DEFAULT false,
    "confirmed_at" timestamp with time zone,
    "notes" text,
    "special_skills" text,
    "emergency_contact_name" text,
    "emergency_contact_phone" text,
    "created_by" uuid,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "event_staff_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "sports_event"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "event_staff_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "event_staff_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "event_staff_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION
);

-- Indexes for event_staff
CREATE INDEX IF NOT EXISTS "event_staff_event_id_idx" ON "event_staff" ("event_id");
CREATE INDEX IF NOT EXISTS "event_staff_org_id_idx" ON "event_staff" ("organization_id");
CREATE INDEX IF NOT EXISTS "event_staff_staff_type_idx" ON "event_staff" ("staff_type");
CREATE INDEX IF NOT EXISTS "event_staff_user_id_idx" ON "event_staff" ("user_id");
CREATE INDEX IF NOT EXISTS "event_staff_role_idx" ON "event_staff" ("role");
CREATE INDEX IF NOT EXISTS "event_staff_is_confirmed_idx" ON "event_staff" ("is_confirmed");
CREATE INDEX IF NOT EXISTS "event_staff_event_role_idx" ON "event_staff" ("event_id", "role");

-- Event staff shifts table
CREATE TABLE IF NOT EXISTS "event_staff_shift" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "staff_id" uuid NOT NULL,
    "event_id" uuid NOT NULL,
    "shift_date" timestamp with time zone NOT NULL,
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "zone_id" uuid,
    "checked_in_at" timestamp with time zone,
    "checked_out_at" timestamp with time zone,
    "notes" text,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "event_staff_shift_staff_id_event_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "event_staff"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "event_staff_shift_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "sports_event"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "event_staff_shift_zone_id_event_zone_id_fk" FOREIGN KEY ("zone_id") REFERENCES "event_zone"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "event_staff_shift_valid_time" CHECK ("end_time" > "start_time")
);

-- Indexes for event_staff_shift
CREATE INDEX IF NOT EXISTS "event_staff_shift_staff_id_idx" ON "event_staff_shift" ("staff_id");
CREATE INDEX IF NOT EXISTS "event_staff_shift_event_id_idx" ON "event_staff_shift" ("event_id");
CREATE INDEX IF NOT EXISTS "event_staff_shift_shift_date_idx" ON "event_staff_shift" ("shift_date");
CREATE INDEX IF NOT EXISTS "event_staff_shift_zone_id_idx" ON "event_staff_shift" ("zone_id");
CREATE INDEX IF NOT EXISTS "event_staff_shift_event_date_idx" ON "event_staff_shift" ("event_id", "shift_date");
