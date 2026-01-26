-- Athlete Education Table
CREATE TABLE IF NOT EXISTS "athlete_education" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL REFERENCES "athlete"("id") ON DELETE CASCADE,
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

-- Indexes
CREATE INDEX IF NOT EXISTS "athlete_education_athlete_id_idx" ON "athlete_education" ("athlete_id");
CREATE INDEX IF NOT EXISTS "athlete_education_display_order_idx" ON "athlete_education" ("athlete_id", "display_order");
