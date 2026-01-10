CREATE TABLE "athlete_career_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"club_name" text NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"position" text,
	"achievements" text,
	"was_national_team" boolean DEFAULT false NOT NULL,
	"national_team_level" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "athlete_fitness_test" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"test_date" timestamp with time zone DEFAULT now() NOT NULL,
	"test_type" text NOT NULL,
	"result" integer NOT NULL,
	"unit" text NOT NULL,
	"notes" text,
	"evaluated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "athlete_physical_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"measured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"height" integer,
	"weight" integer,
	"body_fat_percentage" integer,
	"muscle_mass" integer,
	"wingspan" integer,
	"standing_reach" integer,
	"notes" text,
	"recorded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "height" integer;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "weight" integer;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "dominant_foot" text;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "dominant_hand" text;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "nationality" text;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "position" text;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "secondary_position" text;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "jersey_number" integer;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "profile_photo_url" text;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "years_of_experience" integer;--> statement-breakpoint
ALTER TABLE "athlete_career_history" ADD CONSTRAINT "athlete_career_history_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_fitness_test" ADD CONSTRAINT "athlete_fitness_test_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_fitness_test" ADD CONSTRAINT "athlete_fitness_test_evaluated_by_user_id_fk" FOREIGN KEY ("evaluated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_physical_metrics" ADD CONSTRAINT "athlete_physical_metrics_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_physical_metrics" ADD CONSTRAINT "athlete_physical_metrics_recorded_by_user_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "athlete_career_history_athlete_id_idx" ON "athlete_career_history" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX "athlete_career_history_start_date_idx" ON "athlete_career_history" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "athlete_career_history_athlete_dates_idx" ON "athlete_career_history" USING btree ("athlete_id","start_date","end_date");--> statement-breakpoint
CREATE INDEX "athlete_fitness_test_athlete_id_idx" ON "athlete_fitness_test" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX "athlete_fitness_test_test_date_idx" ON "athlete_fitness_test" USING btree ("test_date");--> statement-breakpoint
CREATE INDEX "athlete_fitness_test_test_type_idx" ON "athlete_fitness_test" USING btree ("test_type");--> statement-breakpoint
CREATE INDEX "athlete_fitness_test_athlete_type_idx" ON "athlete_fitness_test" USING btree ("athlete_id","test_type");--> statement-breakpoint
CREATE INDEX "athlete_physical_metrics_athlete_id_idx" ON "athlete_physical_metrics" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX "athlete_physical_metrics_measured_at_idx" ON "athlete_physical_metrics" USING btree ("measured_at");