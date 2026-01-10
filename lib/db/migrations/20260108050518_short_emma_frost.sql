CREATE TABLE "athlete_evaluation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"athlete_id" uuid NOT NULL,
	"performance_rating" integer,
	"attitude_rating" integer,
	"physical_fitness_rating" integer,
	"performance_notes" text,
	"attitude_notes" text,
	"physical_fitness_notes" text,
	"general_notes" text,
	"evaluated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "athlete_evaluation_performance_rating_check" CHECK ("athlete_evaluation"."performance_rating" IS NULL OR ("athlete_evaluation"."performance_rating" >= 1 AND "athlete_evaluation"."performance_rating" <= 5)),
	CONSTRAINT "athlete_evaluation_attitude_rating_check" CHECK ("athlete_evaluation"."attitude_rating" IS NULL OR ("athlete_evaluation"."attitude_rating" >= 1 AND "athlete_evaluation"."attitude_rating" <= 5)),
	CONSTRAINT "athlete_evaluation_fitness_rating_check" CHECK ("athlete_evaluation"."physical_fitness_rating" IS NULL OR ("athlete_evaluation"."physical_fitness_rating" >= 1 AND "athlete_evaluation"."physical_fitness_rating" <= 5))
);
--> statement-breakpoint
CREATE TABLE "athlete_group_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"athlete_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "athlete_group" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"athlete_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"checked_in_at" timestamp with time zone,
	"recorded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "location" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"city" text,
	"state" text,
	"country" text,
	"postal_code" text,
	"capacity" integer,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurring_session_exception" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recurring_session_id" uuid NOT NULL,
	"exception_date" timestamp with time zone NOT NULL,
	"replacement_session_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"session_id" uuid,
	"athlete_id" uuid,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'ARS' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_method" text,
	"paid_amount" integer DEFAULT 0 NOT NULL,
	"mercado_pago_payment_id" text,
	"mercado_pago_preference_id" text,
	"mercado_pago_status" text,
	"payment_date" timestamp with time zone,
	"receipt_number" text,
	"notes" text,
	"description" text,
	"recorded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_session_athlete" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"athlete_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_session_coach" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"coach_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"location_id" uuid,
	"athlete_group_id" uuid,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"rrule" text,
	"recurring_session_id" uuid,
	"original_start_time" timestamp with time zone,
	"objectives" text,
	"planning" text,
	"post_session_notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "training_session_valid_time_range" CHECK ("training_session"."end_time" > "training_session"."start_time")
);
--> statement-breakpoint
ALTER TABLE "athlete_evaluation" ADD CONSTRAINT "athlete_evaluation_session_id_training_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."training_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_evaluation" ADD CONSTRAINT "athlete_evaluation_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_evaluation" ADD CONSTRAINT "athlete_evaluation_evaluated_by_user_id_fk" FOREIGN KEY ("evaluated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_group_member" ADD CONSTRAINT "athlete_group_member_group_id_athlete_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."athlete_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_group_member" ADD CONSTRAINT "athlete_group_member_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_group" ADD CONSTRAINT "athlete_group_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_session_id_training_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."training_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_recorded_by_user_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location" ADD CONSTRAINT "location_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_session_exception" ADD CONSTRAINT "recurring_session_exception_recurring_session_id_training_session_id_fk" FOREIGN KEY ("recurring_session_id") REFERENCES "public"."training_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_session_exception" ADD CONSTRAINT "recurring_session_exception_replacement_session_id_training_session_id_fk" FOREIGN KEY ("replacement_session_id") REFERENCES "public"."training_session"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_payment" ADD CONSTRAINT "training_payment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_payment" ADD CONSTRAINT "training_payment_session_id_training_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."training_session"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_payment" ADD CONSTRAINT "training_payment_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_payment" ADD CONSTRAINT "training_payment_recorded_by_user_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_session_athlete" ADD CONSTRAINT "training_session_athlete_session_id_training_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."training_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_session_athlete" ADD CONSTRAINT "training_session_athlete_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_session_coach" ADD CONSTRAINT "training_session_coach_session_id_training_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."training_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_session_coach" ADD CONSTRAINT "training_session_coach_coach_id_coach_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_session" ADD CONSTRAINT "training_session_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_session" ADD CONSTRAINT "training_session_location_id_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_session" ADD CONSTRAINT "training_session_athlete_group_id_athlete_group_id_fk" FOREIGN KEY ("athlete_group_id") REFERENCES "public"."athlete_group"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_session" ADD CONSTRAINT "training_session_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "athlete_evaluation_session_id_idx" ON "athlete_evaluation" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "athlete_evaluation_athlete_id_idx" ON "athlete_evaluation" USING btree ("athlete_id");--> statement-breakpoint
CREATE UNIQUE INDEX "athlete_evaluation_session_athlete_unique" ON "athlete_evaluation" USING btree ("session_id","athlete_id");--> statement-breakpoint
CREATE INDEX "athlete_group_member_group_id_idx" ON "athlete_group_member" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "athlete_group_member_athlete_id_idx" ON "athlete_group_member" USING btree ("athlete_id");--> statement-breakpoint
CREATE UNIQUE INDEX "athlete_group_member_unique" ON "athlete_group_member" USING btree ("group_id","athlete_id");--> statement-breakpoint
CREATE INDEX "athlete_group_organization_id_idx" ON "athlete_group" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "athlete_group_name_idx" ON "athlete_group" USING btree ("name");--> statement-breakpoint
CREATE INDEX "athlete_group_is_active_idx" ON "athlete_group" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "athlete_group_org_name_unique" ON "athlete_group" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "attendance_session_id_idx" ON "attendance" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "attendance_athlete_id_idx" ON "attendance" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX "attendance_status_idx" ON "attendance" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_session_athlete_unique" ON "attendance" USING btree ("session_id","athlete_id");--> statement-breakpoint
CREATE INDEX "location_organization_id_idx" ON "location" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "location_name_idx" ON "location" USING btree ("name");--> statement-breakpoint
CREATE INDEX "location_is_active_idx" ON "location" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "location_org_active_idx" ON "location" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE INDEX "recurring_exception_recurring_id_idx" ON "recurring_session_exception" USING btree ("recurring_session_id");--> statement-breakpoint
CREATE INDEX "recurring_exception_date_idx" ON "recurring_session_exception" USING btree ("exception_date");--> statement-breakpoint
CREATE UNIQUE INDEX "recurring_exception_unique" ON "recurring_session_exception" USING btree ("recurring_session_id","exception_date");--> statement-breakpoint
CREATE INDEX "training_payment_organization_id_idx" ON "training_payment" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "training_payment_session_id_idx" ON "training_payment" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "training_payment_athlete_id_idx" ON "training_payment" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX "training_payment_status_idx" ON "training_payment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "training_payment_payment_date_idx" ON "training_payment" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "training_payment_mercado_pago_id_idx" ON "training_payment" USING btree ("mercado_pago_payment_id");--> statement-breakpoint
CREATE INDEX "training_payment_org_status_idx" ON "training_payment" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "training_payment_org_athlete_idx" ON "training_payment" USING btree ("organization_id","athlete_id");--> statement-breakpoint
CREATE INDEX "training_session_athlete_session_id_idx" ON "training_session_athlete" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "training_session_athlete_athlete_id_idx" ON "training_session_athlete" USING btree ("athlete_id");--> statement-breakpoint
CREATE UNIQUE INDEX "training_session_athlete_unique" ON "training_session_athlete" USING btree ("session_id","athlete_id");--> statement-breakpoint
CREATE INDEX "training_session_coach_session_id_idx" ON "training_session_coach" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "training_session_coach_coach_id_idx" ON "training_session_coach" USING btree ("coach_id");--> statement-breakpoint
CREATE UNIQUE INDEX "training_session_coach_unique" ON "training_session_coach" USING btree ("session_id","coach_id");--> statement-breakpoint
CREATE INDEX "training_session_organization_id_idx" ON "training_session" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "training_session_status_idx" ON "training_session" USING btree ("status");--> statement-breakpoint
CREATE INDEX "training_session_start_time_idx" ON "training_session" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "training_session_end_time_idx" ON "training_session" USING btree ("end_time");--> statement-breakpoint
CREATE INDEX "training_session_location_id_idx" ON "training_session" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "training_session_athlete_group_id_idx" ON "training_session" USING btree ("athlete_group_id");--> statement-breakpoint
CREATE INDEX "training_session_recurring_id_idx" ON "training_session" USING btree ("recurring_session_id");--> statement-breakpoint
CREATE INDEX "training_session_is_recurring_idx" ON "training_session" USING btree ("is_recurring");--> statement-breakpoint
CREATE INDEX "training_session_org_status_idx" ON "training_session" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "training_session_org_start_idx" ON "training_session" USING btree ("organization_id","start_time");--> statement-breakpoint
CREATE INDEX "training_session_org_date_range_idx" ON "training_session" USING btree ("organization_id","start_time","end_time");