-- ============================================================================
-- TEAM / SQUAD MANAGEMENT TABLES
-- Migration for teams, seasons, competitions and matches
-- ============================================================================

-- Season table - organizes teams and competitions by time periods
CREATE TABLE IF NOT EXISTS "season" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
	"name" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_current" boolean DEFAULT false NOT NULL,
	"created_by" uuid REFERENCES "user"("id") ON DELETE SET NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "season_valid_dates" CHECK ("end_date" > "start_date")
);

CREATE INDEX IF NOT EXISTS "season_organization_id_idx" ON "season" USING btree ("organization_id");
CREATE INDEX IF NOT EXISTS "season_is_active_idx" ON "season" USING btree ("is_active");
CREATE INDEX IF NOT EXISTS "season_is_current_idx" ON "season" USING btree ("is_current");
CREATE UNIQUE INDEX IF NOT EXISTS "season_org_name_unique" ON "season" USING btree ("organization_id", "name");

-- Team table - competitive squads for competitions
CREATE TABLE IF NOT EXISTS "team" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
	"season_id" uuid REFERENCES "season"("id") ON DELETE SET NULL,
	"name" text NOT NULL,
	"description" text,
	"sport" text,
	"age_category_id" uuid REFERENCES "age_category"("id") ON DELETE SET NULL,
	"logo_key" text,
	"primary_color" text DEFAULT '#3B82F6',
	"secondary_color" text DEFAULT '#1E40AF',
	"status" text DEFAULT 'active' NOT NULL,
	"home_venue" text,
	"created_by" uuid REFERENCES "user"("id") ON DELETE SET NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "team_organization_id_idx" ON "team" USING btree ("organization_id");
CREATE INDEX IF NOT EXISTS "team_season_id_idx" ON "team" USING btree ("season_id");
CREATE INDEX IF NOT EXISTS "team_sport_idx" ON "team" USING btree ("sport");
CREATE INDEX IF NOT EXISTS "team_status_idx" ON "team" USING btree ("status");
CREATE INDEX IF NOT EXISTS "team_age_category_id_idx" ON "team" USING btree ("age_category_id");
CREATE UNIQUE INDEX IF NOT EXISTS "team_org_season_name_unique" ON "team" USING btree ("organization_id", "season_id", "name");

-- Team member table - athletes assigned to teams
CREATE TABLE IF NOT EXISTS "team_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL REFERENCES "team"("id") ON DELETE CASCADE,
	"athlete_id" uuid NOT NULL REFERENCES "athlete"("id") ON DELETE CASCADE,
	"jersey_number" integer,
	"position" text,
	"role" text DEFAULT 'player' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "team_member_team_id_idx" ON "team_member" USING btree ("team_id");
CREATE INDEX IF NOT EXISTS "team_member_athlete_id_idx" ON "team_member" USING btree ("athlete_id");
CREATE UNIQUE INDEX IF NOT EXISTS "team_member_team_athlete_unique" ON "team_member" USING btree ("team_id", "athlete_id");
CREATE UNIQUE INDEX IF NOT EXISTS "team_member_jersey_unique" ON "team_member" USING btree ("team_id", "jersey_number") WHERE jersey_number IS NOT NULL;

-- Team staff table - technical and support staff
CREATE TABLE IF NOT EXISTS "team_staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL REFERENCES "team"("id") ON DELETE CASCADE,
	"coach_id" uuid REFERENCES "coach"("id") ON DELETE CASCADE,
	"user_id" uuid REFERENCES "user"("id") ON DELETE CASCADE,
	"role" text NOT NULL,
	"title" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"start_date" timestamp with time zone DEFAULT now() NOT NULL,
	"end_date" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "team_staff_team_id_idx" ON "team_staff" USING btree ("team_id");
CREATE INDEX IF NOT EXISTS "team_staff_coach_id_idx" ON "team_staff" USING btree ("coach_id");
CREATE INDEX IF NOT EXISTS "team_staff_user_id_idx" ON "team_staff" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "team_staff_role_idx" ON "team_staff" USING btree ("role");

-- Competition table - tournaments, leagues, cups
CREATE TABLE IF NOT EXISTS "competition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
	"season_id" uuid REFERENCES "season"("id") ON DELETE SET NULL,
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
	"created_by" uuid REFERENCES "user"("id") ON DELETE SET NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "competition_organization_id_idx" ON "competition" USING btree ("organization_id");
CREATE INDEX IF NOT EXISTS "competition_season_id_idx" ON "competition" USING btree ("season_id");
CREATE INDEX IF NOT EXISTS "competition_type_idx" ON "competition" USING btree ("type");
CREATE INDEX IF NOT EXISTS "competition_status_idx" ON "competition" USING btree ("status");
CREATE INDEX IF NOT EXISTS "competition_sport_idx" ON "competition" USING btree ("sport");

-- Team competition table - team registrations in competitions
CREATE TABLE IF NOT EXISTS "team_competition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL REFERENCES "team"("id") ON DELETE CASCADE,
	"competition_id" uuid NOT NULL REFERENCES "competition"("id") ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS "team_competition_team_id_idx" ON "team_competition" USING btree ("team_id");
CREATE INDEX IF NOT EXISTS "team_competition_competition_id_idx" ON "team_competition" USING btree ("competition_id");
CREATE INDEX IF NOT EXISTS "team_competition_status_idx" ON "team_competition" USING btree ("status");
CREATE UNIQUE INDEX IF NOT EXISTS "team_competition_unique" ON "team_competition" USING btree ("team_id", "competition_id");

-- Match table - individual games/encounters
CREATE TABLE IF NOT EXISTS "match" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
	"competition_id" uuid REFERENCES "competition"("id") ON DELETE SET NULL,
	"home_team_id" uuid REFERENCES "team"("id") ON DELETE SET NULL,
	"away_team_id" uuid REFERENCES "team"("id") ON DELETE SET NULL,
	"opponent_name" text,
	"is_home_game" boolean DEFAULT true,
	"scheduled_at" timestamp with time zone NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"venue" text,
	"location_id" uuid REFERENCES "location"("id") ON DELETE SET NULL,
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
	"created_by" uuid REFERENCES "user"("id") ON DELETE SET NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "match_organization_id_idx" ON "match" USING btree ("organization_id");
CREATE INDEX IF NOT EXISTS "match_competition_id_idx" ON "match" USING btree ("competition_id");
CREATE INDEX IF NOT EXISTS "match_home_team_id_idx" ON "match" USING btree ("home_team_id");
CREATE INDEX IF NOT EXISTS "match_away_team_id_idx" ON "match" USING btree ("away_team_id");
CREATE INDEX IF NOT EXISTS "match_scheduled_at_idx" ON "match" USING btree ("scheduled_at");
CREATE INDEX IF NOT EXISTS "match_status_idx" ON "match" USING btree ("status");
CREATE INDEX IF NOT EXISTS "match_location_id_idx" ON "match" USING btree ("location_id");
