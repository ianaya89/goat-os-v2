-- Event rotation schedule tables
-- For organizing sports event rotations with groups, stations, and time blocks

-- Event groups - groups of athletes specific to an event
CREATE TABLE IF NOT EXISTS "event_group" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#6366f1' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"leader_id" uuid,
	"max_capacity" integer,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_group_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "sports_event"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "event_group_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "event_group_leader_id_event_staff_id_fk" FOREIGN KEY ("leader_id") REFERENCES "event_staff"("id") ON DELETE set null ON UPDATE no action,
	CONSTRAINT "event_group_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE set null ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "event_group_event_id_idx" ON "event_group" USING btree ("event_id");
CREATE INDEX IF NOT EXISTS "event_group_organization_id_idx" ON "event_group" USING btree ("organization_id");
CREATE UNIQUE INDEX IF NOT EXISTS "event_group_event_name_unique" ON "event_group" USING btree ("event_id", "name");

-- Event group members - athletes assigned to event groups
CREATE TABLE IF NOT EXISTS "event_group_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"registration_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"assigned_by" uuid,
	CONSTRAINT "event_group_member_group_id_event_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "event_group"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "event_group_member_registration_id_event_registration_id_fk" FOREIGN KEY ("registration_id") REFERENCES "event_registration"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "event_group_member_assigned_by_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "user"("id") ON DELETE set null ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "event_group_member_group_id_idx" ON "event_group_member" USING btree ("group_id");
CREATE INDEX IF NOT EXISTS "event_group_member_registration_id_idx" ON "event_group_member" USING btree ("registration_id");
CREATE UNIQUE INDEX IF NOT EXISTS "event_group_member_unique" ON "event_group_member" USING btree ("group_id", "registration_id");

-- Event stations - workstations/activity stations for event rotations
CREATE TABLE IF NOT EXISTS "event_station" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#10b981' NOT NULL,
	"content" jsonb,
	"capacity" integer,
	"zone_id" uuid,
	"location_notes" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_station_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "sports_event"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "event_station_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "event_station_zone_id_event_zone_id_fk" FOREIGN KEY ("zone_id") REFERENCES "event_zone"("id") ON DELETE set null ON UPDATE no action,
	CONSTRAINT "event_station_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE set null ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "event_station_event_id_idx" ON "event_station" USING btree ("event_id");
CREATE INDEX IF NOT EXISTS "event_station_organization_id_idx" ON "event_station" USING btree ("organization_id");
CREATE INDEX IF NOT EXISTS "event_station_zone_id_idx" ON "event_station" USING btree ("zone_id");
CREATE INDEX IF NOT EXISTS "event_station_is_active_idx" ON "event_station" USING btree ("is_active");

-- Event station staff - staff assigned to specific stations
CREATE TABLE IF NOT EXISTS "event_station_staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"station_id" uuid NOT NULL,
	"staff_id" uuid NOT NULL,
	"role_at_station" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_station_staff_station_id_event_station_id_fk" FOREIGN KEY ("station_id") REFERENCES "event_station"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "event_station_staff_staff_id_event_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "event_staff"("id") ON DELETE cascade ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "event_station_staff_station_id_idx" ON "event_station_staff" USING btree ("station_id");
CREATE INDEX IF NOT EXISTS "event_station_staff_staff_id_idx" ON "event_station_staff" USING btree ("staff_id");
CREATE UNIQUE INDEX IF NOT EXISTS "event_station_staff_unique" ON "event_station_staff" USING btree ("station_id", "staff_id");

-- Event rotation schedule - master schedule configuration for an event
CREATE TABLE IF NOT EXISTS "event_rotation_schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL UNIQUE,
	"organization_id" uuid NOT NULL,
	"name" text DEFAULT 'Rotation Schedule' NOT NULL,
	"schedule_date" timestamp with time zone NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"default_rotation_duration" integer DEFAULT 30 NOT NULL,
	"total_rotations" integer,
	"is_published" boolean DEFAULT false NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_rotation_schedule_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "sports_event"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "event_rotation_schedule_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "event_rotation_schedule_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE set null ON UPDATE no action,
	CONSTRAINT "event_rotation_schedule_valid_time" CHECK ("end_time" > "start_time")
);

CREATE INDEX IF NOT EXISTS "event_rotation_schedule_event_id_idx" ON "event_rotation_schedule" USING btree ("event_id");
CREATE INDEX IF NOT EXISTS "event_rotation_schedule_organization_id_idx" ON "event_rotation_schedule" USING btree ("organization_id");

-- Event time blocks - individual time blocks in the rotation schedule
CREATE TABLE IF NOT EXISTS "event_time_block" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schedule_id" uuid NOT NULL,
	"block_type" text NOT NULL,
	"name" text,
	"description" text,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"duration_minutes" integer NOT NULL,
	"block_order" integer NOT NULL,
	"rotation_number" integer,
	"color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_time_block_schedule_id_event_rotation_schedule_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "event_rotation_schedule"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "event_time_block_valid_time" CHECK ("end_time" > "start_time")
);

CREATE INDEX IF NOT EXISTS "event_time_block_schedule_id_idx" ON "event_time_block" USING btree ("schedule_id");
CREATE INDEX IF NOT EXISTS "event_time_block_block_order_idx" ON "event_time_block" USING btree ("block_order");
CREATE INDEX IF NOT EXISTS "event_time_block_block_type_idx" ON "event_time_block" USING btree ("block_type");

-- Event rotation assignments - which group goes to which station for each time block
CREATE TABLE IF NOT EXISTS "event_rotation_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"time_block_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"station_id" uuid NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_rotation_assignment_time_block_id_event_time_block_id_fk" FOREIGN KEY ("time_block_id") REFERENCES "event_time_block"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "event_rotation_assignment_group_id_event_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "event_group"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "event_rotation_assignment_station_id_event_station_id_fk" FOREIGN KEY ("station_id") REFERENCES "event_station"("id") ON DELETE cascade ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "event_rotation_assignment_time_block_id_idx" ON "event_rotation_assignment" USING btree ("time_block_id");
CREATE INDEX IF NOT EXISTS "event_rotation_assignment_group_id_idx" ON "event_rotation_assignment" USING btree ("group_id");
CREATE INDEX IF NOT EXISTS "event_rotation_assignment_station_id_idx" ON "event_rotation_assignment" USING btree ("station_id");
CREATE UNIQUE INDEX IF NOT EXISTS "event_rotation_assignment_block_group_unique" ON "event_rotation_assignment" USING btree ("time_block_id", "group_id");
CREATE UNIQUE INDEX IF NOT EXISTS "event_rotation_assignment_block_station_unique" ON "event_rotation_assignment" USING btree ("time_block_id", "station_id");
