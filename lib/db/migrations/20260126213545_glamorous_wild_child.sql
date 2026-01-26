CREATE TABLE "athlete_achievement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"scope" text NOT NULL,
	"year" integer NOT NULL,
	"organization" text,
	"team" text,
	"competition" text,
	"position" text,
	"description" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "athlete_education" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"institution" varchar(200) NOT NULL,
	"degree" varchar(100),
	"field_of_study" varchar(100),
	"academic_year" varchar(50),
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"expected_graduation_date" timestamp with time zone,
	"gpa" numeric(3, 2),
	"is_current" boolean DEFAULT false NOT NULL,
	"notes" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "athlete_language" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"language" text NOT NULL,
	"level" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "athlete_reference" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"name" text NOT NULL,
	"relationship" text NOT NULL,
	"organization" text,
	"position" text,
	"email" text,
	"phone" text,
	"testimonial" text,
	"skills_highlighted" jsonb DEFAULT '[]'::jsonb,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp with time zone,
	"is_public" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "athlete_sponsor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"name" text NOT NULL,
	"logo_key" text,
	"website" text,
	"description" text,
	"partnership_type" text,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"is_public" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"season_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"sport" text,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"status" text DEFAULT 'upcoming' NOT NULL,
	"logo_key" text,
	"external_id" text,
	"venue" text,
	"rules" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment_inventory_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"scheduled_date" timestamp with time zone NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"audit_type" text DEFAULT 'full' NOT NULL,
	"category_filter" text,
	"location_id" uuid,
	"total_items" integer DEFAULT 0 NOT NULL,
	"counted_items" integer DEFAULT 0 NOT NULL,
	"items_with_discrepancy" integer DEFAULT 0 NOT NULL,
	"total_expected_quantity" integer DEFAULT 0 NOT NULL,
	"total_counted_quantity" integer DEFAULT 0 NOT NULL,
	"title" text,
	"notes" text,
	"created_by" uuid,
	"performed_by" uuid,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment_inventory_count" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audit_id" uuid NOT NULL,
	"equipment_id" uuid NOT NULL,
	"expected_quantity" integer NOT NULL,
	"counted_quantity" integer,
	"discrepancy" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"observed_condition" text,
	"adjustment_approved" boolean DEFAULT false NOT NULL,
	"adjustment_reason" text,
	"adjusted_by" uuid,
	"adjusted_at" timestamp with time zone,
	"notes" text,
	"counted_by" uuid,
	"counted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_group_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"registration_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"assigned_by" uuid
);
--> statement-breakpoint
CREATE TABLE "event_group" (
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
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_rotation_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"time_block_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"station_id" uuid NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_rotation_schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
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
	CONSTRAINT "event_rotation_schedule_event_id_unique" UNIQUE("event_id"),
	CONSTRAINT "event_rotation_schedule_valid_time" CHECK ("event_rotation_schedule"."end_time" > "event_rotation_schedule"."start_time")
);
--> statement-breakpoint
CREATE TABLE "event_station_staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"station_id" uuid NOT NULL,
	"staff_id" uuid NOT NULL,
	"role_at_station" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_station" (
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
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"event_type" text DEFAULT 'campus' NOT NULL,
	"default_title" text,
	"default_description" text,
	"default_duration_days" integer DEFAULT 1,
	"max_capacity" integer,
	"enable_waitlist" boolean DEFAULT true NOT NULL,
	"max_waitlist_size" integer,
	"allow_public_registration" boolean DEFAULT true NOT NULL,
	"allow_early_access_for_members" boolean DEFAULT false NOT NULL,
	"member_early_access_days" integer DEFAULT 7,
	"requires_approval" boolean DEFAULT false NOT NULL,
	"currency" text DEFAULT 'ARS' NOT NULL,
	"accepted_payment_methods" text,
	"contact_email" text,
	"contact_phone" text,
	"cover_image_url" text,
	"template_data" text,
	"source_event_id" uuid,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_time_block" (
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
	"zone_id" uuid,
	"color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_time_block_valid_time" CHECK ("event_time_block"."end_time" > "event_time_block"."start_time")
);
--> statement-breakpoint
CREATE TABLE "event_zone_staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"zone_id" uuid NOT NULL,
	"staff_id" uuid NOT NULL,
	"role_at_zone" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"competition_id" uuid,
	"home_team_id" uuid,
	"away_team_id" uuid,
	"opponent_name" text,
	"is_home_game" boolean DEFAULT true,
	"scheduled_at" timestamp with time zone NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"venue" text,
	"location_id" uuid,
	"home_score" integer,
	"away_score" integer,
	"home_score_ht" integer,
	"away_score_ht" integer,
	"result" text,
	"round" text,
	"matchday" integer,
	"referee" text,
	"attendance" integer,
	"pre_match_notes" text,
	"post_match_notes" text,
	"highlights" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_feature" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"feature" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "season" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_current" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "season_valid_dates" CHECK ("season"."end_date" > "season"."start_date")
);
--> statement-breakpoint
CREATE TABLE "team_competition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"competition_id" uuid NOT NULL,
	"status" text DEFAULT 'registered' NOT NULL,
	"registered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"division" text,
	"seed_position" integer,
	"final_position" integer,
	"points" integer DEFAULT 0,
	"wins" integer DEFAULT 0,
	"draws" integer DEFAULT 0,
	"losses" integer DEFAULT 0,
	"goals_for" integer DEFAULT 0,
	"goals_against" integer DEFAULT 0,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"athlete_id" uuid NOT NULL,
	"jersey_number" integer,
	"position" text,
	"role" text DEFAULT 'player' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"coach_id" uuid,
	"user_id" uuid,
	"role" text NOT NULL,
	"title" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"start_date" timestamp with time zone DEFAULT now() NOT NULL,
	"end_date" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"season_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"sport" text,
	"age_category_id" uuid,
	"logo_key" text,
	"primary_color" text DEFAULT '#3B82F6',
	"secondary_color" text DEFAULT '#1E40AF',
	"status" text DEFAULT 'active' NOT NULL,
	"home_venue" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "age_category" ADD COLUMN "min_birth_year" integer;--> statement-breakpoint
ALTER TABLE "age_category" ADD COLUMN "max_birth_year" integer;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "youtube_videos" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "social_instagram" text;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "social_twitter" text;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "social_tiktok" text;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "social_linkedin" text;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "social_facebook" text;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "cover_photo_key" text;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "education_institution" text;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "education_year" text;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "expected_graduation_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "gpa" numeric(4, 2);--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "dietary_restrictions" text;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "allergies" text;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "residence_city" text;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "residence_country" text;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "is_public_profile" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "opportunity_types" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "public_profile_enabled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "training_payment" ADD COLUMN "receipt_image_key" text;--> statement-breakpoint
ALTER TABLE "athlete_achievement" ADD CONSTRAINT "athlete_achievement_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_education" ADD CONSTRAINT "athlete_education_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_language" ADD CONSTRAINT "athlete_language_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_reference" ADD CONSTRAINT "athlete_reference_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_sponsor" ADD CONSTRAINT "athlete_sponsor_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition" ADD CONSTRAINT "competition_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition" ADD CONSTRAINT "competition_season_id_season_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."season"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition" ADD CONSTRAINT "competition_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_inventory_audit" ADD CONSTRAINT "equipment_inventory_audit_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_inventory_audit" ADD CONSTRAINT "equipment_inventory_audit_location_id_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_inventory_audit" ADD CONSTRAINT "equipment_inventory_audit_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_inventory_audit" ADD CONSTRAINT "equipment_inventory_audit_performed_by_user_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_inventory_audit" ADD CONSTRAINT "equipment_inventory_audit_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_inventory_count" ADD CONSTRAINT "equipment_inventory_count_audit_id_equipment_inventory_audit_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."equipment_inventory_audit"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_inventory_count" ADD CONSTRAINT "equipment_inventory_count_equipment_id_training_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."training_equipment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_inventory_count" ADD CONSTRAINT "equipment_inventory_count_adjusted_by_user_id_fk" FOREIGN KEY ("adjusted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_inventory_count" ADD CONSTRAINT "equipment_inventory_count_counted_by_user_id_fk" FOREIGN KEY ("counted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_group_member" ADD CONSTRAINT "event_group_member_group_id_event_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."event_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_group_member" ADD CONSTRAINT "event_group_member_registration_id_event_registration_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."event_registration"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_group_member" ADD CONSTRAINT "event_group_member_assigned_by_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_group" ADD CONSTRAINT "event_group_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sports_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_group" ADD CONSTRAINT "event_group_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_group" ADD CONSTRAINT "event_group_leader_id_event_staff_id_fk" FOREIGN KEY ("leader_id") REFERENCES "public"."event_staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_group" ADD CONSTRAINT "event_group_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_rotation_assignment" ADD CONSTRAINT "event_rotation_assignment_time_block_id_event_time_block_id_fk" FOREIGN KEY ("time_block_id") REFERENCES "public"."event_time_block"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_rotation_assignment" ADD CONSTRAINT "event_rotation_assignment_group_id_event_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."event_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_rotation_assignment" ADD CONSTRAINT "event_rotation_assignment_station_id_event_station_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."event_station"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_rotation_schedule" ADD CONSTRAINT "event_rotation_schedule_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sports_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_rotation_schedule" ADD CONSTRAINT "event_rotation_schedule_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_rotation_schedule" ADD CONSTRAINT "event_rotation_schedule_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_station_staff" ADD CONSTRAINT "event_station_staff_station_id_event_station_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."event_station"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_station_staff" ADD CONSTRAINT "event_station_staff_staff_id_event_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."event_staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_station" ADD CONSTRAINT "event_station_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sports_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_station" ADD CONSTRAINT "event_station_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_station" ADD CONSTRAINT "event_station_zone_id_event_zone_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."event_zone"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_station" ADD CONSTRAINT "event_station_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_template" ADD CONSTRAINT "event_template_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_template" ADD CONSTRAINT "event_template_source_event_id_sports_event_id_fk" FOREIGN KEY ("source_event_id") REFERENCES "public"."sports_event"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_template" ADD CONSTRAINT "event_template_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_time_block" ADD CONSTRAINT "event_time_block_schedule_id_event_rotation_schedule_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."event_rotation_schedule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_time_block" ADD CONSTRAINT "event_time_block_zone_id_event_zone_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."event_zone"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_zone_staff" ADD CONSTRAINT "event_zone_staff_zone_id_event_zone_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."event_zone"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_zone_staff" ADD CONSTRAINT "event_zone_staff_staff_id_event_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."event_staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_competition_id_competition_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competition"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_home_team_id_team_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_away_team_id_team_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_location_id_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_feature" ADD CONSTRAINT "organization_feature_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season" ADD CONSTRAINT "season_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season" ADD CONSTRAINT "season_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_competition" ADD CONSTRAINT "team_competition_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_competition" ADD CONSTRAINT "team_competition_competition_id_competition_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competition"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_staff" ADD CONSTRAINT "team_staff_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_staff" ADD CONSTRAINT "team_staff_coach_id_coach_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_staff" ADD CONSTRAINT "team_staff_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_season_id_season_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."season"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_age_category_id_age_category_id_fk" FOREIGN KEY ("age_category_id") REFERENCES "public"."age_category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "athlete_achievement_athlete_id_idx" ON "athlete_achievement" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX "athlete_achievement_year_idx" ON "athlete_achievement" USING btree ("year");--> statement-breakpoint
CREATE INDEX "athlete_achievement_type_idx" ON "athlete_achievement" USING btree ("type");--> statement-breakpoint
CREATE INDEX "athlete_achievement_is_public_idx" ON "athlete_achievement" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "athlete_achievement_athlete_year_idx" ON "athlete_achievement" USING btree ("athlete_id","year");--> statement-breakpoint
CREATE INDEX "athlete_education_athlete_id_idx" ON "athlete_education" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX "athlete_education_display_order_idx" ON "athlete_education" USING btree ("athlete_id","display_order");--> statement-breakpoint
CREATE INDEX "athlete_language_athlete_id_idx" ON "athlete_language" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX "athlete_language_language_idx" ON "athlete_language" USING btree ("language");--> statement-breakpoint
CREATE UNIQUE INDEX "athlete_language_athlete_lang_unique" ON "athlete_language" USING btree ("athlete_id","language");--> statement-breakpoint
CREATE INDEX "athlete_reference_athlete_id_idx" ON "athlete_reference" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX "athlete_reference_is_public_idx" ON "athlete_reference" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "athlete_sponsor_athlete_id_idx" ON "athlete_sponsor" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX "athlete_sponsor_is_public_idx" ON "athlete_sponsor" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "competition_organization_id_idx" ON "competition" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "competition_season_id_idx" ON "competition" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX "competition_type_idx" ON "competition" USING btree ("type");--> statement-breakpoint
CREATE INDEX "competition_status_idx" ON "competition" USING btree ("status");--> statement-breakpoint
CREATE INDEX "competition_sport_idx" ON "competition" USING btree ("sport");--> statement-breakpoint
CREATE INDEX "equipment_inventory_audit_org_idx" ON "equipment_inventory_audit" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "equipment_inventory_audit_status_idx" ON "equipment_inventory_audit" USING btree ("status");--> statement-breakpoint
CREATE INDEX "equipment_inventory_audit_scheduled_idx" ON "equipment_inventory_audit" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "equipment_inventory_audit_type_idx" ON "equipment_inventory_audit" USING btree ("audit_type");--> statement-breakpoint
CREATE INDEX "equipment_inventory_count_audit_idx" ON "equipment_inventory_count" USING btree ("audit_id");--> statement-breakpoint
CREATE INDEX "equipment_inventory_count_equipment_idx" ON "equipment_inventory_count" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "equipment_inventory_count_status_idx" ON "equipment_inventory_count" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "equipment_inventory_count_audit_equipment_unique" ON "equipment_inventory_count" USING btree ("audit_id","equipment_id");--> statement-breakpoint
CREATE INDEX "event_group_member_group_id_idx" ON "event_group_member" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "event_group_member_registration_id_idx" ON "event_group_member" USING btree ("registration_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_group_member_unique" ON "event_group_member" USING btree ("group_id","registration_id");--> statement-breakpoint
CREATE INDEX "event_group_event_id_idx" ON "event_group" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_group_organization_id_idx" ON "event_group" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_group_event_name_unique" ON "event_group" USING btree ("event_id","name");--> statement-breakpoint
CREATE INDEX "event_rotation_assignment_time_block_id_idx" ON "event_rotation_assignment" USING btree ("time_block_id");--> statement-breakpoint
CREATE INDEX "event_rotation_assignment_group_id_idx" ON "event_rotation_assignment" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "event_rotation_assignment_station_id_idx" ON "event_rotation_assignment" USING btree ("station_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_rotation_assignment_block_group_unique" ON "event_rotation_assignment" USING btree ("time_block_id","group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_rotation_assignment_block_station_unique" ON "event_rotation_assignment" USING btree ("time_block_id","station_id");--> statement-breakpoint
CREATE INDEX "event_rotation_schedule_event_id_idx" ON "event_rotation_schedule" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_rotation_schedule_organization_id_idx" ON "event_rotation_schedule" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "event_station_staff_station_id_idx" ON "event_station_staff" USING btree ("station_id");--> statement-breakpoint
CREATE INDEX "event_station_staff_staff_id_idx" ON "event_station_staff" USING btree ("staff_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_station_staff_unique" ON "event_station_staff" USING btree ("station_id","staff_id");--> statement-breakpoint
CREATE INDEX "event_station_event_id_idx" ON "event_station" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_station_organization_id_idx" ON "event_station" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "event_station_zone_id_idx" ON "event_station" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "event_station_is_active_idx" ON "event_station" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "event_template_org_id_idx" ON "event_template" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "event_template_category_idx" ON "event_template" USING btree ("category");--> statement-breakpoint
CREATE INDEX "event_template_event_type_idx" ON "event_template" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "event_template_is_active_idx" ON "event_template" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "event_template_org_name_unique" ON "event_template" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "event_time_block_schedule_id_idx" ON "event_time_block" USING btree ("schedule_id");--> statement-breakpoint
CREATE INDEX "event_time_block_block_order_idx" ON "event_time_block" USING btree ("block_order");--> statement-breakpoint
CREATE INDEX "event_time_block_block_type_idx" ON "event_time_block" USING btree ("block_type");--> statement-breakpoint
CREATE INDEX "event_time_block_zone_id_idx" ON "event_time_block" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "event_zone_staff_zone_id_idx" ON "event_zone_staff" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "event_zone_staff_staff_id_idx" ON "event_zone_staff" USING btree ("staff_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_zone_staff_unique" ON "event_zone_staff" USING btree ("zone_id","staff_id");--> statement-breakpoint
CREATE INDEX "match_organization_id_idx" ON "match" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "match_competition_id_idx" ON "match" USING btree ("competition_id");--> statement-breakpoint
CREATE INDEX "match_home_team_id_idx" ON "match" USING btree ("home_team_id");--> statement-breakpoint
CREATE INDEX "match_away_team_id_idx" ON "match" USING btree ("away_team_id");--> statement-breakpoint
CREATE INDEX "match_scheduled_at_idx" ON "match" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "match_status_idx" ON "match" USING btree ("status");--> statement-breakpoint
CREATE INDEX "match_location_id_idx" ON "match" USING btree ("location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "org_feature_unique_idx" ON "organization_feature" USING btree ("organization_id","feature");--> statement-breakpoint
CREATE INDEX "org_feature_org_idx" ON "organization_feature" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "season_organization_id_idx" ON "season" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "season_is_active_idx" ON "season" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "season_is_current_idx" ON "season" USING btree ("is_current");--> statement-breakpoint
CREATE UNIQUE INDEX "season_org_name_unique" ON "season" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "team_competition_team_id_idx" ON "team_competition" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_competition_competition_id_idx" ON "team_competition" USING btree ("competition_id");--> statement-breakpoint
CREATE INDEX "team_competition_status_idx" ON "team_competition" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "team_competition_unique" ON "team_competition" USING btree ("team_id","competition_id");--> statement-breakpoint
CREATE INDEX "team_member_team_id_idx" ON "team_member" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_member_athlete_id_idx" ON "team_member" USING btree ("athlete_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_member_team_athlete_unique" ON "team_member" USING btree ("team_id","athlete_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_member_jersey_unique" ON "team_member" USING btree ("team_id","jersey_number") WHERE jersey_number IS NOT NULL;--> statement-breakpoint
CREATE INDEX "team_staff_team_id_idx" ON "team_staff" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_staff_coach_id_idx" ON "team_staff" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "team_staff_user_id_idx" ON "team_staff" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "team_staff_role_idx" ON "team_staff" USING btree ("role");--> statement-breakpoint
CREATE INDEX "team_organization_id_idx" ON "team" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "team_season_id_idx" ON "team" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX "team_sport_idx" ON "team" USING btree ("sport");--> statement-breakpoint
CREATE INDEX "team_status_idx" ON "team" USING btree ("status");--> statement-breakpoint
CREATE INDEX "team_age_category_id_idx" ON "team" USING btree ("age_category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_org_season_name_unique" ON "team" USING btree ("organization_id","season_id","name");--> statement-breakpoint
CREATE INDEX "athlete_is_public_profile_idx" ON "athlete" USING btree ("is_public_profile");--> statement-breakpoint
CREATE INDEX "athlete_public_profile_enabled_at_idx" ON "athlete" USING btree ("public_profile_enabled_at");--> statement-breakpoint
ALTER TABLE "age_category" DROP COLUMN "min_age";--> statement-breakpoint
ALTER TABLE "age_category" DROP COLUMN "max_age";