CREATE TABLE "account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"expires_at" timestamp with time zone,
	"password" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "age_category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"min_birth_year" integer,
	"max_birth_year" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_chat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"user_id" uuid,
	"title" text,
	"messages" text,
	"pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_chat_has_owner" CHECK ("ai_chat"."organization_id" IS NOT NULL OR "ai_chat"."user_id" IS NOT NULL)
);
--> statement-breakpoint
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
	"sport" text,
	"age_category_id" uuid,
	"max_capacity" integer,
	"is_active" boolean DEFAULT true NOT NULL,
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
CREATE TABLE "athlete_medical_document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"document_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"file_key" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"document_date" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"doctor_name" text,
	"medical_institution" text,
	"notes" text,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "athlete_session_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"athlete_id" uuid NOT NULL,
	"rpe_rating" integer,
	"satisfaction_rating" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "athlete_session_feedback_rpe_rating_check" CHECK ("athlete_session_feedback"."rpe_rating" IS NULL OR ("athlete_session_feedback"."rpe_rating" >= 1 AND "athlete_session_feedback"."rpe_rating" <= 10)),
	CONSTRAINT "athlete_session_feedback_satisfaction_rating_check" CHECK ("athlete_session_feedback"."satisfaction_rating" IS NULL OR ("athlete_session_feedback"."satisfaction_rating" >= 1 AND "athlete_session_feedback"."satisfaction_rating" <= 10))
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
CREATE TABLE "athlete" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"user_id" uuid,
	"sport" text NOT NULL,
	"birth_date" timestamp with time zone,
	"level" text DEFAULT 'beginner' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"height" integer,
	"weight" integer,
	"dominant_foot" text,
	"dominant_hand" text,
	"phone" text,
	"current_club" text,
	"category" text,
	"nationality" text,
	"position" text,
	"secondary_position" text,
	"jersey_number" integer,
	"profile_photo_url" text,
	"bio" text,
	"years_of_experience" integer,
	"parent_name" text,
	"parent_phone" text,
	"parent_email" text,
	"parent_relationship" text,
	"parental_consent_at" timestamp with time zone,
	"terms_accepted_at" timestamp with time zone,
	"medical_fitness_confirmed_at" timestamp with time zone,
	"medical_certificate_key" text,
	"medical_certificate_uploaded_at" timestamp with time zone,
	"medical_certificate_expires_at" timestamp with time zone,
	"youtube_videos" jsonb DEFAULT '[]'::jsonb,
	"social_instagram" text,
	"social_twitter" text,
	"social_tiktok" text,
	"social_linkedin" text,
	"social_facebook" text,
	"cover_photo_key" text,
	"education_institution" text,
	"education_year" text,
	"expected_graduation_date" timestamp with time zone,
	"gpa" numeric(4, 2),
	"dietary_restrictions" text,
	"allergies" text,
	"residence_city" text,
	"residence_country" text,
	"is_public_profile" boolean DEFAULT false NOT NULL,
	"opportunity_types" jsonb DEFAULT '[]'::jsonb,
	"public_profile_enabled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "athlete_wellness_survey" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"survey_date" timestamp with time zone DEFAULT now() NOT NULL,
	"sleep_hours" integer NOT NULL,
	"sleep_quality" integer NOT NULL,
	"fatigue" integer NOT NULL,
	"muscle_soreness" integer NOT NULL,
	"energy" integer NOT NULL,
	"mood" integer NOT NULL,
	"stress_level" integer NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "billing_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"stripe_event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"subscription_id" text,
	"order_id" uuid,
	"event_data" text,
	"processed" boolean DEFAULT true NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_event_stripe_event_id_unique" UNIQUE("stripe_event_id")
);
--> statement-breakpoint
CREATE TABLE "cash_movement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cash_register_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"type" text NOT NULL,
	"amount" integer NOT NULL,
	"description" text NOT NULL,
	"reference_type" text DEFAULT 'manual' NOT NULL,
	"reference_id" uuid,
	"recorded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cash_register" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"opening_balance" integer DEFAULT 0 NOT NULL,
	"closing_balance" integer,
	"status" text DEFAULT 'open' NOT NULL,
	"opened_by" uuid,
	"closed_by" uuid,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid,
	"specialty" text NOT NULL,
	"bio" text,
	"status" text DEFAULT 'active' NOT NULL,
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
CREATE TABLE "credit_balance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"lifetime_purchased" integer DEFAULT 0 NOT NULL,
	"lifetime_granted" integer DEFAULT 0 NOT NULL,
	"lifetime_used" integer DEFAULT 0 NOT NULL,
	"lifetime_expired" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "credit_balance_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "credit_deduction_failure" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"error_code" text NOT NULL,
	"error_message" text,
	"model" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"reference_type" text,
	"reference_id" text,
	"user_id" uuid,
	"resolved" boolean DEFAULT false NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by" uuid,
	"resolution_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"type" text NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"description" text,
	"reference_type" text,
	"reference_id" text,
	"model" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"created_by" uuid,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"equipment_id" uuid NOT NULL,
	"athlete_group_id" uuid,
	"training_session_id" uuid,
	"coach_id" uuid,
	"quantity" integer DEFAULT 1 NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"returned_at" timestamp with time zone,
	"expected_return_at" timestamp with time zone,
	"notes" text,
	"assigned_by" uuid,
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
CREATE TABLE "equipment_maintenance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipment_id" uuid NOT NULL,
	"maintenance_type" text NOT NULL,
	"description" text,
	"cost" integer,
	"currency" text DEFAULT 'ARS' NOT NULL,
	"previous_condition" text,
	"new_condition" text,
	"performed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"performed_by" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_age_category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"age_category_id" uuid NOT NULL,
	"max_capacity" integer,
	"current_registrations" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_budget_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"category_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"planned_amount" integer DEFAULT 0 NOT NULL,
	"actual_amount" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'ARS' NOT NULL,
	"status" text DEFAULT 'planned' NOT NULL,
	"is_revenue" boolean DEFAULT false NOT NULL,
	"expense_id" uuid,
	"vendor_id" uuid,
	"notes" text,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_checklist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"completed_at" timestamp with time zone,
	"completed_by" uuid,
	"due_date" timestamp with time zone,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_coach" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"coach_id" uuid NOT NULL,
	"role" text DEFAULT 'coach',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_discount" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"discount_mode" text NOT NULL,
	"code" text,
	"discount_value_type" text NOT NULL,
	"discount_value" integer NOT NULL,
	"max_uses" integer,
	"max_uses_per_user" integer,
	"current_uses" integer DEFAULT 0 NOT NULL,
	"valid_from" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"min_purchase_amount" integer,
	"priority" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_discount_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"discount_id" uuid NOT NULL,
	"registration_id" uuid NOT NULL,
	"user_email" text NOT NULL,
	"discount_amount" integer NOT NULL,
	"used_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"document_type" text DEFAULT 'other' NOT NULL,
	"storage_key" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"version" integer DEFAULT 1 NOT NULL,
	"previous_version_id" uuid,
	"tags" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"uploaded_by" uuid NOT NULL,
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
CREATE TABLE "event_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text,
	"quantity_needed" integer DEFAULT 1 NOT NULL,
	"quantity_available" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'needed' NOT NULL,
	"source" text,
	"vendor_id" uuid,
	"unit_cost" integer,
	"total_cost" integer,
	"currency" text DEFAULT 'ARS',
	"zone_id" uuid,
	"storage_location" text,
	"responsible_id" uuid,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_milestone" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"target_date" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"status" text DEFAULT 'pending' NOT NULL,
	"responsible_id" uuid,
	"depends_on" text,
	"color" text,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_note" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"content" text NOT NULL,
	"note_type" text DEFAULT 'comment' NOT NULL,
	"parent_note_id" uuid,
	"mentions" text,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"pinned_at" timestamp with time zone,
	"pinned_by" uuid,
	"related_entity_type" text,
	"related_entity_id" uuid,
	"author_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'ARS' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_method" text NOT NULL,
	"mercado_pago_payment_id" text,
	"mercado_pago_preference_id" text,
	"mercado_pago_status" text,
	"mercado_pago_external_reference" text,
	"stripe_payment_intent_id" text,
	"stripe_checkout_session_id" text,
	"stripe_status" text,
	"payment_date" timestamp with time zone,
	"receipt_number" text,
	"receipt_image_key" text,
	"receipt_image_uploaded_at" timestamp with time zone,
	"refunded_amount" integer DEFAULT 0,
	"refunded_at" timestamp with time zone,
	"refund_reason" text,
	"notes" text,
	"processed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_pricing_tier" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"tier_type" text NOT NULL,
	"price" integer NOT NULL,
	"currency" text DEFAULT 'ARS' NOT NULL,
	"valid_from" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"capacity_start" integer,
	"capacity_end" integer,
	"age_category_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_registration" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"registration_number" integer NOT NULL,
	"athlete_id" uuid,
	"user_id" uuid,
	"registrant_name" text NOT NULL,
	"registrant_email" text NOT NULL,
	"registrant_phone" text,
	"registrant_birth_date" timestamp with time zone,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"emergency_contact_relation" text,
	"age_category_id" uuid,
	"status" text DEFAULT 'pending_payment' NOT NULL,
	"waitlist_position" integer,
	"applied_pricing_tier_id" uuid,
	"price" integer NOT NULL,
	"currency" text DEFAULT 'ARS' NOT NULL,
	"paid_amount" integer DEFAULT 0 NOT NULL,
	"applied_discount_id" uuid,
	"discount_amount" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"internal_notes" text,
	"terms_accepted_at" timestamp with time zone,
	"registration_source" text DEFAULT 'public',
	"registered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_risk_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"risk_id" uuid NOT NULL,
	"action" text NOT NULL,
	"previous_status" text,
	"new_status" text,
	"description" text,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_risk" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text,
	"severity" text DEFAULT 'medium' NOT NULL,
	"probability" text DEFAULT 'possible' NOT NULL,
	"risk_score" integer,
	"status" text DEFAULT 'identified' NOT NULL,
	"mitigation_plan" text,
	"mitigation_cost" integer,
	"contingency_plan" text,
	"trigger_conditions" text,
	"potential_impact" text,
	"owner_id" uuid,
	"last_reviewed_at" timestamp with time zone,
	"next_review_date" timestamp with time zone,
	"notes" text,
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
CREATE TABLE "event_sponsor_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"sponsor_id" uuid NOT NULL,
	"tier" text,
	"sponsorship_value" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'ARS' NOT NULL,
	"in_kind_description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_confirmed" boolean DEFAULT false NOT NULL,
	"confirmed_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_sponsor_benefit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sponsor_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"estimated_value" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"delivered_at" timestamp with time zone,
	"delivery_notes" text,
	"due_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_sponsor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"logo_url" text,
	"website_url" text,
	"contact_name" text,
	"contact_email" text,
	"contact_phone" text,
	"tier" text DEFAULT 'partner' NOT NULL,
	"sponsorship_value" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'ARS' NOT NULL,
	"in_kind_description" text,
	"contract_signed" boolean DEFAULT false NOT NULL,
	"contract_signed_at" timestamp with time zone,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_staff_shift" (
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
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_staff_shift_valid_time" CHECK ("event_staff_shift"."end_time" > "event_staff_shift"."start_time")
);
--> statement-breakpoint
CREATE TABLE "event_staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"staff_type" text NOT NULL,
	"user_id" uuid,
	"external_name" text,
	"external_email" text,
	"external_phone" text,
	"role" text DEFAULT 'volunteer' NOT NULL,
	"role_title" text,
	"is_confirmed" boolean DEFAULT false NOT NULL,
	"confirmed_at" timestamp with time zone,
	"notes" text,
	"special_skills" text,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "event_task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'todo' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"assignee_id" uuid,
	"due_date" timestamp with time zone,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"column_position" integer DEFAULT 0 NOT NULL,
	"tags" text,
	"estimated_hours" integer,
	"actual_hours" integer,
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
CREATE TABLE "event_vendor_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"service_description" text,
	"contract_value" integer,
	"currency" text DEFAULT 'ARS',
	"is_confirmed" boolean DEFAULT false NOT NULL,
	"confirmed_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_vendor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"contact_name" text,
	"email" text,
	"phone" text,
	"address" text,
	"city" text,
	"website_url" text,
	"categories" text,
	"rating" integer,
	"tax_id" text,
	"payment_terms" text,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_vendor_rating_check" CHECK ("event_vendor"."rating" IS NULL OR ("event_vendor"."rating" >= 1 AND "event_vendor"."rating" <= 5))
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
CREATE TABLE "event_zone" (
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
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text DEFAULT 'operational' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"category_id" uuid,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'ARS' NOT NULL,
	"description" text NOT NULL,
	"expense_date" timestamp with time zone NOT NULL,
	"payment_method" text DEFAULT 'cash' NOT NULL,
	"receipt_number" text,
	"receipt_image_key" text,
	"vendor" text,
	"notes" text,
	"recorded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"inviter_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
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
	"color" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"stripe_price_id" text NOT NULL,
	"stripe_product_id" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_amount" integer NOT NULL,
	"total_amount" integer NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"stripe_payment_intent_id" text,
	"stripe_checkout_session_id" text,
	"total_amount" integer NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
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
CREATE TABLE "organization" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"logo" text,
	"metadata" text,
	"stripe_customer_id" text,
	"timezone" text DEFAULT 'America/Argentina/Buenos_Aires' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sku" text,
	"barcode" text,
	"category" text DEFAULT 'other' NOT NULL,
	"cost_price" integer DEFAULT 0 NOT NULL,
	"selling_price" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'ARS' NOT NULL,
	"track_stock" boolean DEFAULT true NOT NULL,
	"low_stock_threshold" integer DEFAULT 5,
	"current_stock" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"image_url" text,
	"tax_rate" integer DEFAULT 0,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
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
CREATE TABLE "sale_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" integer NOT NULL,
	"total_price" integer NOT NULL,
	"discount_amount" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sale" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"sale_number" text,
	"athlete_id" uuid,
	"customer_name" text,
	"subtotal" integer DEFAULT 0 NOT NULL,
	"tax_amount" integer DEFAULT 0 NOT NULL,
	"discount_amount" integer DEFAULT 0 NOT NULL,
	"total_amount" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'ARS' NOT NULL,
	"payment_method" text,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp with time zone,
	"cash_movement_id" uuid,
	"notes" text,
	"sold_by" uuid,
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
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	"impersonated_by" uuid,
	"active_organization_id" uuid,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sponsor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"logo_url" text,
	"website_url" text,
	"contact_name" text,
	"contact_email" text,
	"contact_phone" text,
	"tier" text DEFAULT 'partner' NOT NULL,
	"contract_start_date" timestamp with time zone,
	"contract_end_date" timestamp with time zone,
	"contract_value" integer,
	"currency" text DEFAULT 'ARS' NOT NULL,
	"contract_notes" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sports_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"event_type" text DEFAULT 'campus' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"registration_open_date" timestamp with time zone,
	"registration_close_date" timestamp with time zone,
	"location_id" uuid,
	"venue_details" text,
	"max_capacity" integer,
	"current_registrations" integer DEFAULT 0 NOT NULL,
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
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sports_event_valid_date_range" CHECK ("sports_event"."end_date" >= "sports_event"."start_date")
);
--> statement-breakpoint
CREATE TABLE "staff_payroll" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"staff_type" text DEFAULT 'coach' NOT NULL,
	"coach_id" uuid,
	"user_id" uuid,
	"external_name" text,
	"external_email" text,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"period_type" text DEFAULT 'monthly' NOT NULL,
	"coach_payment_type" text,
	"session_count" integer,
	"rate_per_session" integer,
	"base_salary" integer DEFAULT 0 NOT NULL,
	"bonuses" integer DEFAULT 0 NOT NULL,
	"deductions" integer DEFAULT 0 NOT NULL,
	"total_amount" integer NOT NULL,
	"currency" text DEFAULT 'ARS' NOT NULL,
	"concept" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_method" text,
	"payment_date" timestamp with time zone,
	"expense_id" uuid,
	"notes" text,
	"created_by" uuid,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"paid_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_payroll_period_check" CHECK ("staff_payroll"."period_end" > "staff_payroll"."period_start")
);
--> statement-breakpoint
CREATE TABLE "stock_transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"type" text NOT NULL,
	"quantity" integer NOT NULL,
	"previous_stock" integer NOT NULL,
	"new_stock" integer NOT NULL,
	"unit_cost" integer,
	"reference_type" text,
	"reference_id" uuid,
	"reason" text,
	"notes" text,
	"recorded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_item" (
	"id" text PRIMARY KEY NOT NULL,
	"subscription_id" text NOT NULL,
	"stripe_price_id" text NOT NULL,
	"stripe_product_id" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price_amount" integer,
	"price_type" text DEFAULT 'recurring' NOT NULL,
	"price_model" text DEFAULT 'flat' NOT NULL,
	"interval" text,
	"interval_count" integer DEFAULT 1,
	"meter_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"status" text NOT NULL,
	"stripe_price_id" text NOT NULL,
	"stripe_product_id" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"interval" text NOT NULL,
	"interval_count" integer DEFAULT 1 NOT NULL,
	"unit_amount" integer,
	"currency" text DEFAULT 'usd' NOT NULL,
	"current_period_start" timestamp with time zone NOT NULL,
	"current_period_end" timestamp with time zone NOT NULL,
	"trial_start" timestamp with time zone,
	"trial_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"canceled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "training_equipment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"brand" text,
	"model" text,
	"serial_number" text,
	"category" text DEFAULT 'other' NOT NULL,
	"total_quantity" integer DEFAULT 1 NOT NULL,
	"available_quantity" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"condition" text DEFAULT 'good' NOT NULL,
	"purchase_price" integer,
	"purchase_date" timestamp with time zone,
	"currency" text DEFAULT 'ARS' NOT NULL,
	"location_id" uuid,
	"storage_location" text,
	"last_maintenance_date" timestamp with time zone,
	"next_maintenance_date" timestamp with time zone,
	"image_url" text,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
	"receipt_image_key" text,
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
	"attachment_key" text,
	"attachment_uploaded_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "training_session_valid_time_range" CHECK ("training_session"."end_time" > "training_session"."start_time")
);
--> statement-breakpoint
CREATE TABLE "two_factor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"image_key" text,
	"username" text,
	"role" text DEFAULT 'user' NOT NULL,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp with time zone,
	"onboarding_complete" boolean DEFAULT false NOT NULL,
	"two_factor_enabled" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "waitlist_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"athlete_id" uuid NOT NULL,
	"reference_type" text NOT NULL,
	"preferred_days" text[],
	"preferred_start_time" text,
	"preferred_end_time" text,
	"athlete_group_id" uuid,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'waiting' NOT NULL,
	"reason" text,
	"notes" text,
	"position" integer,
	"assigned_at" timestamp with time zone,
	"assigned_by" uuid,
	"expires_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "waitlist_entry_valid_reference" CHECK (
				("waitlist_entry"."reference_type" = 'schedule' AND "waitlist_entry"."preferred_days" IS NOT NULL AND "waitlist_entry"."athlete_group_id" IS NULL) OR
				("waitlist_entry"."reference_type" = 'athlete_group' AND "waitlist_entry"."athlete_group_id" IS NOT NULL AND "waitlist_entry"."preferred_days" IS NULL)
			)
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "age_category" ADD CONSTRAINT "age_category_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_chat" ADD CONSTRAINT "ai_chat_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_chat" ADD CONSTRAINT "ai_chat_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_achievement" ADD CONSTRAINT "athlete_achievement_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_career_history" ADD CONSTRAINT "athlete_career_history_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_education" ADD CONSTRAINT "athlete_education_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_evaluation" ADD CONSTRAINT "athlete_evaluation_session_id_training_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."training_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_evaluation" ADD CONSTRAINT "athlete_evaluation_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_evaluation" ADD CONSTRAINT "athlete_evaluation_evaluated_by_user_id_fk" FOREIGN KEY ("evaluated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_fitness_test" ADD CONSTRAINT "athlete_fitness_test_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_fitness_test" ADD CONSTRAINT "athlete_fitness_test_evaluated_by_user_id_fk" FOREIGN KEY ("evaluated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_group_member" ADD CONSTRAINT "athlete_group_member_group_id_athlete_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."athlete_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_group_member" ADD CONSTRAINT "athlete_group_member_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_group" ADD CONSTRAINT "athlete_group_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_language" ADD CONSTRAINT "athlete_language_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_medical_document" ADD CONSTRAINT "athlete_medical_document_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_medical_document" ADD CONSTRAINT "athlete_medical_document_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_physical_metrics" ADD CONSTRAINT "athlete_physical_metrics_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_physical_metrics" ADD CONSTRAINT "athlete_physical_metrics_recorded_by_user_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_reference" ADD CONSTRAINT "athlete_reference_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_session_feedback" ADD CONSTRAINT "athlete_session_feedback_session_id_training_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."training_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_session_feedback" ADD CONSTRAINT "athlete_session_feedback_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_sponsor" ADD CONSTRAINT "athlete_sponsor_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete" ADD CONSTRAINT "athlete_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete" ADD CONSTRAINT "athlete_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_wellness_survey" ADD CONSTRAINT "athlete_wellness_survey_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_wellness_survey" ADD CONSTRAINT "athlete_wellness_survey_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_session_id_training_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."training_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_recorded_by_user_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_event" ADD CONSTRAINT "billing_event_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_movement" ADD CONSTRAINT "cash_movement_cash_register_id_cash_register_id_fk" FOREIGN KEY ("cash_register_id") REFERENCES "public"."cash_register"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_movement" ADD CONSTRAINT "cash_movement_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_movement" ADD CONSTRAINT "cash_movement_recorded_by_user_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_register" ADD CONSTRAINT "cash_register_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_register" ADD CONSTRAINT "cash_register_opened_by_user_id_fk" FOREIGN KEY ("opened_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_register" ADD CONSTRAINT "cash_register_closed_by_user_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach" ADD CONSTRAINT "coach_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach" ADD CONSTRAINT "coach_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition" ADD CONSTRAINT "competition_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition" ADD CONSTRAINT "competition_season_id_season_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."season"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition" ADD CONSTRAINT "competition_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_balance" ADD CONSTRAINT "credit_balance_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_deduction_failure" ADD CONSTRAINT "credit_deduction_failure_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_deduction_failure" ADD CONSTRAINT "credit_deduction_failure_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_deduction_failure" ADD CONSTRAINT "credit_deduction_failure_resolved_by_user_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transaction" ADD CONSTRAINT "credit_transaction_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transaction" ADD CONSTRAINT "credit_transaction_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_assignment" ADD CONSTRAINT "equipment_assignment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_assignment" ADD CONSTRAINT "equipment_assignment_equipment_id_training_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."training_equipment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_assignment" ADD CONSTRAINT "equipment_assignment_athlete_group_id_athlete_group_id_fk" FOREIGN KEY ("athlete_group_id") REFERENCES "public"."athlete_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_assignment" ADD CONSTRAINT "equipment_assignment_training_session_id_training_session_id_fk" FOREIGN KEY ("training_session_id") REFERENCES "public"."training_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_assignment" ADD CONSTRAINT "equipment_assignment_coach_id_coach_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_assignment" ADD CONSTRAINT "equipment_assignment_assigned_by_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_inventory_audit" ADD CONSTRAINT "equipment_inventory_audit_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_inventory_audit" ADD CONSTRAINT "equipment_inventory_audit_location_id_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_inventory_audit" ADD CONSTRAINT "equipment_inventory_audit_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_inventory_audit" ADD CONSTRAINT "equipment_inventory_audit_performed_by_user_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_inventory_audit" ADD CONSTRAINT "equipment_inventory_audit_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_inventory_count" ADD CONSTRAINT "equipment_inventory_count_audit_id_equipment_inventory_audit_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."equipment_inventory_audit"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_inventory_count" ADD CONSTRAINT "equipment_inventory_count_equipment_id_training_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."training_equipment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_inventory_count" ADD CONSTRAINT "equipment_inventory_count_adjusted_by_user_id_fk" FOREIGN KEY ("adjusted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_inventory_count" ADD CONSTRAINT "equipment_inventory_count_counted_by_user_id_fk" FOREIGN KEY ("counted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_maintenance" ADD CONSTRAINT "equipment_maintenance_equipment_id_training_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."training_equipment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_maintenance" ADD CONSTRAINT "equipment_maintenance_performed_by_user_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_age_category" ADD CONSTRAINT "event_age_category_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sports_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_age_category" ADD CONSTRAINT "event_age_category_age_category_id_age_category_id_fk" FOREIGN KEY ("age_category_id") REFERENCES "public"."age_category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_budget_line" ADD CONSTRAINT "event_budget_line_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sports_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_budget_line" ADD CONSTRAINT "event_budget_line_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_budget_line" ADD CONSTRAINT "event_budget_line_category_id_expense_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."expense_category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_budget_line" ADD CONSTRAINT "event_budget_line_expense_id_expense_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expense"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_budget_line" ADD CONSTRAINT "event_budget_line_vendor_id_event_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."event_vendor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_budget_line" ADD CONSTRAINT "event_budget_line_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_budget_line" ADD CONSTRAINT "event_budget_line_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_checklist" ADD CONSTRAINT "event_checklist_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sports_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_checklist" ADD CONSTRAINT "event_checklist_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_checklist" ADD CONSTRAINT "event_checklist_completed_by_user_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_checklist" ADD CONSTRAINT "event_checklist_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_coach" ADD CONSTRAINT "event_coach_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sports_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_coach" ADD CONSTRAINT "event_coach_coach_id_coach_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_discount" ADD CONSTRAINT "event_discount_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sports_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_discount" ADD CONSTRAINT "event_discount_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_discount_usage" ADD CONSTRAINT "event_discount_usage_discount_id_event_discount_id_fk" FOREIGN KEY ("discount_id") REFERENCES "public"."event_discount"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_discount_usage" ADD CONSTRAINT "event_discount_usage_registration_id_event_registration_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."event_registration"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_document" ADD CONSTRAINT "event_document_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sports_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_document" ADD CONSTRAINT "event_document_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_document" ADD CONSTRAINT "event_document_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_group_member" ADD CONSTRAINT "event_group_member_group_id_event_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."event_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_group_member" ADD CONSTRAINT "event_group_member_registration_id_event_registration_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."event_registration"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_group_member" ADD CONSTRAINT "event_group_member_assigned_by_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_group" ADD CONSTRAINT "event_group_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sports_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_group" ADD CONSTRAINT "event_group_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_group" ADD CONSTRAINT "event_group_leader_id_event_staff_id_fk" FOREIGN KEY ("leader_id") REFERENCES "public"."event_staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_group" ADD CONSTRAINT "event_group_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_inventory" ADD CONSTRAINT "event_inventory_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sports_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_inventory" ADD CONSTRAINT "event_inventory_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_inventory" ADD CONSTRAINT "event_inventory_vendor_id_event_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."event_vendor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_inventory" ADD CONSTRAINT "event_inventory_zone_id_event_zone_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."event_zone"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_inventory" ADD CONSTRAINT "event_inventory_responsible_id_user_id_fk" FOREIGN KEY ("responsible_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_inventory" ADD CONSTRAINT "event_inventory_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_milestone" ADD CONSTRAINT "event_milestone_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sports_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_milestone" ADD CONSTRAINT "event_milestone_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_milestone" ADD CONSTRAINT "event_milestone_responsible_id_user_id_fk" FOREIGN KEY ("responsible_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_milestone" ADD CONSTRAINT "event_milestone_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_note" ADD CONSTRAINT "event_note_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sports_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_note" ADD CONSTRAINT "event_note_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_note" ADD CONSTRAINT "event_note_pinned_by_user_id_fk" FOREIGN KEY ("pinned_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_note" ADD CONSTRAINT "event_note_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_payment" ADD CONSTRAINT "event_payment_registration_id_event_registration_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."event_registration"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_payment" ADD CONSTRAINT "event_payment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_payment" ADD CONSTRAINT "event_payment_processed_by_user_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_pricing_tier" ADD CONSTRAINT "event_pricing_tier_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sports_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_pricing_tier" ADD CONSTRAINT "event_pricing_tier_age_category_id_age_category_id_fk" FOREIGN KEY ("age_category_id") REFERENCES "public"."age_category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registration" ADD CONSTRAINT "event_registration_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sports_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registration" ADD CONSTRAINT "event_registration_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registration" ADD CONSTRAINT "event_registration_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registration" ADD CONSTRAINT "event_registration_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registration" ADD CONSTRAINT "event_registration_age_category_id_age_category_id_fk" FOREIGN KEY ("age_category_id") REFERENCES "public"."age_category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registration" ADD CONSTRAINT "event_registration_applied_pricing_tier_id_event_pricing_tier_id_fk" FOREIGN KEY ("applied_pricing_tier_id") REFERENCES "public"."event_pricing_tier"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registration" ADD CONSTRAINT "event_registration_applied_discount_id_event_discount_id_fk" FOREIGN KEY ("applied_discount_id") REFERENCES "public"."event_discount"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_risk_log" ADD CONSTRAINT "event_risk_log_risk_id_event_risk_id_fk" FOREIGN KEY ("risk_id") REFERENCES "public"."event_risk"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_risk_log" ADD CONSTRAINT "event_risk_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_risk" ADD CONSTRAINT "event_risk_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sports_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_risk" ADD CONSTRAINT "event_risk_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_risk" ADD CONSTRAINT "event_risk_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_risk" ADD CONSTRAINT "event_risk_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_rotation_assignment" ADD CONSTRAINT "event_rotation_assignment_time_block_id_event_time_block_id_fk" FOREIGN KEY ("time_block_id") REFERENCES "public"."event_time_block"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_rotation_assignment" ADD CONSTRAINT "event_rotation_assignment_group_id_event_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."event_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_rotation_assignment" ADD CONSTRAINT "event_rotation_assignment_station_id_event_station_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."event_station"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_rotation_schedule" ADD CONSTRAINT "event_rotation_schedule_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sports_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_rotation_schedule" ADD CONSTRAINT "event_rotation_schedule_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_rotation_schedule" ADD CONSTRAINT "event_rotation_schedule_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_sponsor_assignment" ADD CONSTRAINT "event_sponsor_assignment_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sports_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_sponsor_assignment" ADD CONSTRAINT "event_sponsor_assignment_sponsor_id_sponsor_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_sponsor_benefit" ADD CONSTRAINT "event_sponsor_benefit_sponsor_id_event_sponsor_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."event_sponsor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_sponsor" ADD CONSTRAINT "event_sponsor_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sports_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_sponsor" ADD CONSTRAINT "event_sponsor_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_sponsor" ADD CONSTRAINT "event_sponsor_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_staff_shift" ADD CONSTRAINT "event_staff_shift_staff_id_event_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."event_staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_staff_shift" ADD CONSTRAINT "event_staff_shift_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sports_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_staff_shift" ADD CONSTRAINT "event_staff_shift_zone_id_event_zone_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."event_zone"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_staff" ADD CONSTRAINT "event_staff_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sports_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_staff" ADD CONSTRAINT "event_staff_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_staff" ADD CONSTRAINT "event_staff_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_staff" ADD CONSTRAINT "event_staff_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_station_staff" ADD CONSTRAINT "event_station_staff_station_id_event_station_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."event_station"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_station_staff" ADD CONSTRAINT "event_station_staff_staff_id_event_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."event_staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_station" ADD CONSTRAINT "event_station_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sports_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_station" ADD CONSTRAINT "event_station_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_station" ADD CONSTRAINT "event_station_zone_id_event_zone_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."event_zone"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_station" ADD CONSTRAINT "event_station_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_task" ADD CONSTRAINT "event_task_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sports_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_task" ADD CONSTRAINT "event_task_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_task" ADD CONSTRAINT "event_task_assignee_id_user_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_task" ADD CONSTRAINT "event_task_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_template" ADD CONSTRAINT "event_template_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_template" ADD CONSTRAINT "event_template_source_event_id_sports_event_id_fk" FOREIGN KEY ("source_event_id") REFERENCES "public"."sports_event"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_template" ADD CONSTRAINT "event_template_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_time_block" ADD CONSTRAINT "event_time_block_schedule_id_event_rotation_schedule_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."event_rotation_schedule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_time_block" ADD CONSTRAINT "event_time_block_zone_id_event_zone_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."event_zone"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_vendor_assignment" ADD CONSTRAINT "event_vendor_assignment_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sports_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_vendor_assignment" ADD CONSTRAINT "event_vendor_assignment_vendor_id_event_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."event_vendor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_vendor" ADD CONSTRAINT "event_vendor_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_vendor" ADD CONSTRAINT "event_vendor_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_zone_staff" ADD CONSTRAINT "event_zone_staff_zone_id_event_zone_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."event_zone"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_zone_staff" ADD CONSTRAINT "event_zone_staff_staff_id_event_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."event_staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_zone" ADD CONSTRAINT "event_zone_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sports_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_zone" ADD CONSTRAINT "event_zone_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_zone" ADD CONSTRAINT "event_zone_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_category" ADD CONSTRAINT "expense_category_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_category_id_expense_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."expense_category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_recorded_by_user_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location" ADD CONSTRAINT "location_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_competition_id_competition_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competition"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_home_team_id_team_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_away_team_id_team_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_location_id_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_feature" ADD CONSTRAINT "organization_feature_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_session_exception" ADD CONSTRAINT "recurring_session_exception_recurring_session_id_training_session_id_fk" FOREIGN KEY ("recurring_session_id") REFERENCES "public"."training_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_session_exception" ADD CONSTRAINT "recurring_session_exception_replacement_session_id_training_session_id_fk" FOREIGN KEY ("replacement_session_id") REFERENCES "public"."training_session"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_item" ADD CONSTRAINT "sale_item_sale_id_sale_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sale"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_item" ADD CONSTRAINT "sale_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale" ADD CONSTRAINT "sale_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale" ADD CONSTRAINT "sale_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale" ADD CONSTRAINT "sale_cash_movement_id_cash_movement_id_fk" FOREIGN KEY ("cash_movement_id") REFERENCES "public"."cash_movement"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale" ADD CONSTRAINT "sale_sold_by_user_id_fk" FOREIGN KEY ("sold_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season" ADD CONSTRAINT "season_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season" ADD CONSTRAINT "season_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_impersonated_by_user_id_fk" FOREIGN KEY ("impersonated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsor" ADD CONSTRAINT "sponsor_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsor" ADD CONSTRAINT "sponsor_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sports_event" ADD CONSTRAINT "sports_event_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sports_event" ADD CONSTRAINT "sports_event_location_id_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sports_event" ADD CONSTRAINT "sports_event_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_payroll" ADD CONSTRAINT "staff_payroll_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_payroll" ADD CONSTRAINT "staff_payroll_coach_id_coach_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_payroll" ADD CONSTRAINT "staff_payroll_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_payroll" ADD CONSTRAINT "staff_payroll_expense_id_expense_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expense"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_payroll" ADD CONSTRAINT "staff_payroll_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_payroll" ADD CONSTRAINT "staff_payroll_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_payroll" ADD CONSTRAINT "staff_payroll_paid_by_user_id_fk" FOREIGN KEY ("paid_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transaction" ADD CONSTRAINT "stock_transaction_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transaction" ADD CONSTRAINT "stock_transaction_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transaction" ADD CONSTRAINT "stock_transaction_recorded_by_user_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_item" ADD CONSTRAINT "subscription_item_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE "training_equipment" ADD CONSTRAINT "training_equipment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_equipment" ADD CONSTRAINT "training_equipment_location_id_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_equipment" ADD CONSTRAINT "training_equipment_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist_entry" ADD CONSTRAINT "waitlist_entry_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist_entry" ADD CONSTRAINT "waitlist_entry_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist_entry" ADD CONSTRAINT "waitlist_entry_athlete_group_id_athlete_group_id_fk" FOREIGN KEY ("athlete_group_id") REFERENCES "public"."athlete_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist_entry" ADD CONSTRAINT "waitlist_entry_assigned_by_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist_entry" ADD CONSTRAINT "waitlist_entry_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_account_idx" ON "account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "age_category_organization_id_idx" ON "age_category" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "age_category_sort_order_idx" ON "age_category" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "age_category_is_active_idx" ON "age_category" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "age_category_org_name_unique" ON "age_category" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "ai_chat_organization_id_idx" ON "ai_chat" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "ai_chat_user_id_idx" ON "ai_chat" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_chat_created_at_idx" ON "ai_chat" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "athlete_achievement_athlete_id_idx" ON "athlete_achievement" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX "athlete_achievement_year_idx" ON "athlete_achievement" USING btree ("year");--> statement-breakpoint
CREATE INDEX "athlete_achievement_type_idx" ON "athlete_achievement" USING btree ("type");--> statement-breakpoint
CREATE INDEX "athlete_achievement_is_public_idx" ON "athlete_achievement" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "athlete_achievement_athlete_year_idx" ON "athlete_achievement" USING btree ("athlete_id","year");--> statement-breakpoint
CREATE INDEX "athlete_career_history_athlete_id_idx" ON "athlete_career_history" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX "athlete_career_history_start_date_idx" ON "athlete_career_history" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "athlete_career_history_athlete_dates_idx" ON "athlete_career_history" USING btree ("athlete_id","start_date","end_date");--> statement-breakpoint
CREATE INDEX "athlete_education_athlete_id_idx" ON "athlete_education" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX "athlete_education_display_order_idx" ON "athlete_education" USING btree ("athlete_id","display_order");--> statement-breakpoint
CREATE INDEX "athlete_evaluation_session_id_idx" ON "athlete_evaluation" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "athlete_evaluation_athlete_id_idx" ON "athlete_evaluation" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX "athlete_evaluation_evaluated_by_idx" ON "athlete_evaluation" USING btree ("evaluated_by");--> statement-breakpoint
CREATE INDEX "athlete_evaluation_evaluator_created_idx" ON "athlete_evaluation" USING btree ("evaluated_by","created_at");--> statement-breakpoint
CREATE INDEX "athlete_evaluation_athlete_created_idx" ON "athlete_evaluation" USING btree ("athlete_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "athlete_evaluation_session_athlete_unique" ON "athlete_evaluation" USING btree ("session_id","athlete_id");--> statement-breakpoint
CREATE INDEX "athlete_fitness_test_athlete_id_idx" ON "athlete_fitness_test" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX "athlete_fitness_test_test_date_idx" ON "athlete_fitness_test" USING btree ("test_date");--> statement-breakpoint
CREATE INDEX "athlete_fitness_test_test_type_idx" ON "athlete_fitness_test" USING btree ("test_type");--> statement-breakpoint
CREATE INDEX "athlete_fitness_test_athlete_type_idx" ON "athlete_fitness_test" USING btree ("athlete_id","test_type");--> statement-breakpoint
CREATE INDEX "athlete_group_member_group_id_idx" ON "athlete_group_member" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "athlete_group_member_athlete_id_idx" ON "athlete_group_member" USING btree ("athlete_id");--> statement-breakpoint
CREATE UNIQUE INDEX "athlete_group_member_unique" ON "athlete_group_member" USING btree ("group_id","athlete_id");--> statement-breakpoint
CREATE INDEX "athlete_group_organization_id_idx" ON "athlete_group" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "athlete_group_name_idx" ON "athlete_group" USING btree ("name");--> statement-breakpoint
CREATE INDEX "athlete_group_sport_idx" ON "athlete_group" USING btree ("sport");--> statement-breakpoint
CREATE INDEX "athlete_group_is_active_idx" ON "athlete_group" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "athlete_group_age_category_id_idx" ON "athlete_group" USING btree ("age_category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "athlete_group_org_name_unique" ON "athlete_group" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "athlete_language_athlete_id_idx" ON "athlete_language" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX "athlete_language_language_idx" ON "athlete_language" USING btree ("language");--> statement-breakpoint
CREATE UNIQUE INDEX "athlete_language_athlete_lang_unique" ON "athlete_language" USING btree ("athlete_id","language");--> statement-breakpoint
CREATE INDEX "athlete_medical_document_athlete_id_idx" ON "athlete_medical_document" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX "athlete_medical_document_type_idx" ON "athlete_medical_document" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "athlete_medical_document_date_idx" ON "athlete_medical_document" USING btree ("document_date");--> statement-breakpoint
CREATE INDEX "athlete_medical_document_athlete_type_idx" ON "athlete_medical_document" USING btree ("athlete_id","document_type");--> statement-breakpoint
CREATE INDEX "athlete_physical_metrics_athlete_id_idx" ON "athlete_physical_metrics" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX "athlete_physical_metrics_measured_at_idx" ON "athlete_physical_metrics" USING btree ("measured_at");--> statement-breakpoint
CREATE INDEX "athlete_reference_athlete_id_idx" ON "athlete_reference" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX "athlete_reference_is_public_idx" ON "athlete_reference" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "athlete_session_feedback_session_id_idx" ON "athlete_session_feedback" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "athlete_session_feedback_athlete_id_idx" ON "athlete_session_feedback" USING btree ("athlete_id");--> statement-breakpoint
CREATE UNIQUE INDEX "athlete_session_feedback_session_athlete_unique" ON "athlete_session_feedback" USING btree ("session_id","athlete_id");--> statement-breakpoint
CREATE INDEX "athlete_sponsor_athlete_id_idx" ON "athlete_sponsor" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX "athlete_sponsor_is_public_idx" ON "athlete_sponsor" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "athlete_organization_id_idx" ON "athlete" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "athlete_user_id_idx" ON "athlete" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "athlete_sport_idx" ON "athlete" USING btree ("sport");--> statement-breakpoint
CREATE INDEX "athlete_level_idx" ON "athlete" USING btree ("level");--> statement-breakpoint
CREATE INDEX "athlete_status_idx" ON "athlete" USING btree ("status");--> statement-breakpoint
CREATE INDEX "athlete_created_at_idx" ON "athlete" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "athlete_org_status_idx" ON "athlete" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "athlete_is_public_profile_idx" ON "athlete" USING btree ("is_public_profile");--> statement-breakpoint
CREATE INDEX "athlete_public_profile_enabled_at_idx" ON "athlete" USING btree ("public_profile_enabled_at");--> statement-breakpoint
CREATE UNIQUE INDEX "athlete_org_user_unique" ON "athlete" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "athlete_wellness_athlete_id_idx" ON "athlete_wellness_survey" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX "athlete_wellness_survey_date_idx" ON "athlete_wellness_survey" USING btree ("survey_date");--> statement-breakpoint
CREATE INDEX "athlete_wellness_org_date_idx" ON "athlete_wellness_survey" USING btree ("organization_id","survey_date");--> statement-breakpoint
CREATE INDEX "athlete_wellness_athlete_date_idx" ON "athlete_wellness_survey" USING btree ("athlete_id","survey_date");--> statement-breakpoint
CREATE INDEX "attendance_session_id_idx" ON "attendance" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "attendance_athlete_id_idx" ON "attendance" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX "attendance_status_idx" ON "attendance" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_session_athlete_unique" ON "attendance" USING btree ("session_id","athlete_id");--> statement-breakpoint
CREATE INDEX "billing_event_organization_id_idx" ON "billing_event" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "billing_event_event_type_idx" ON "billing_event" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "billing_event_subscription_id_idx" ON "billing_event" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "billing_event_created_at_idx" ON "billing_event" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "cash_movement_register_idx" ON "cash_movement" USING btree ("cash_register_id");--> statement-breakpoint
CREATE INDEX "cash_movement_org_idx" ON "cash_movement" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "cash_movement_type_idx" ON "cash_movement" USING btree ("type");--> statement-breakpoint
CREATE INDEX "cash_movement_reference_idx" ON "cash_movement" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "cash_movement_created_idx" ON "cash_movement" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "cash_register_org_idx" ON "cash_register" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "cash_register_date_idx" ON "cash_register" USING btree ("date");--> statement-breakpoint
CREATE INDEX "cash_register_status_idx" ON "cash_register" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "cash_register_org_date_unique" ON "cash_register" USING btree ("organization_id","date");--> statement-breakpoint
CREATE INDEX "coach_organization_id_idx" ON "coach" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "coach_user_id_idx" ON "coach" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "coach_status_idx" ON "coach" USING btree ("status");--> statement-breakpoint
CREATE INDEX "coach_created_at_idx" ON "coach" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "coach_org_status_idx" ON "coach" USING btree ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "coach_org_user_unique" ON "coach" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "competition_organization_id_idx" ON "competition" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "competition_season_id_idx" ON "competition" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX "competition_type_idx" ON "competition" USING btree ("type");--> statement-breakpoint
CREATE INDEX "competition_status_idx" ON "competition" USING btree ("status");--> statement-breakpoint
CREATE INDEX "competition_sport_idx" ON "competition" USING btree ("sport");--> statement-breakpoint
CREATE INDEX "credit_balance_organization_id_idx" ON "credit_balance" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "credit_deduction_failure_org_idx" ON "credit_deduction_failure" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "credit_deduction_failure_resolved_idx" ON "credit_deduction_failure" USING btree ("resolved");--> statement-breakpoint
CREATE INDEX "credit_deduction_failure_created_idx" ON "credit_deduction_failure" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "credit_transaction_organization_id_idx" ON "credit_transaction" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "credit_transaction_type_idx" ON "credit_transaction" USING btree ("type");--> statement-breakpoint
CREATE INDEX "credit_transaction_created_at_idx" ON "credit_transaction" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "credit_transaction_reference_idx" ON "credit_transaction" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "credit_transaction_org_created_idx" ON "credit_transaction" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "credit_transaction_org_type_idx" ON "credit_transaction" USING btree ("organization_id","type");--> statement-breakpoint
CREATE UNIQUE INDEX "credit_transaction_checkout_unique" ON "credit_transaction" USING btree ("reference_type","reference_id") WHERE "credit_transaction"."reference_type" = 'checkout_session';--> statement-breakpoint
CREATE UNIQUE INDEX "credit_transaction_bonus_unique" ON "credit_transaction" USING btree ("reference_type","reference_id") WHERE "credit_transaction"."reference_type" = 'checkout_session_bonus';--> statement-breakpoint
CREATE INDEX "equipment_assignment_organization_id_idx" ON "equipment_assignment" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "equipment_assignment_equipment_id_idx" ON "equipment_assignment" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "equipment_assignment_group_id_idx" ON "equipment_assignment" USING btree ("athlete_group_id");--> statement-breakpoint
CREATE INDEX "equipment_assignment_session_id_idx" ON "equipment_assignment" USING btree ("training_session_id");--> statement-breakpoint
CREATE INDEX "equipment_assignment_coach_id_idx" ON "equipment_assignment" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "equipment_assignment_returned_idx" ON "equipment_assignment" USING btree ("returned_at");--> statement-breakpoint
CREATE INDEX "equipment_inventory_audit_org_idx" ON "equipment_inventory_audit" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "equipment_inventory_audit_status_idx" ON "equipment_inventory_audit" USING btree ("status");--> statement-breakpoint
CREATE INDEX "equipment_inventory_audit_scheduled_idx" ON "equipment_inventory_audit" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "equipment_inventory_audit_type_idx" ON "equipment_inventory_audit" USING btree ("audit_type");--> statement-breakpoint
CREATE INDEX "equipment_inventory_count_audit_idx" ON "equipment_inventory_count" USING btree ("audit_id");--> statement-breakpoint
CREATE INDEX "equipment_inventory_count_equipment_idx" ON "equipment_inventory_count" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "equipment_inventory_count_status_idx" ON "equipment_inventory_count" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "equipment_inventory_count_audit_equipment_unique" ON "equipment_inventory_count" USING btree ("audit_id","equipment_id");--> statement-breakpoint
CREATE INDEX "equipment_maintenance_equipment_id_idx" ON "equipment_maintenance" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "equipment_maintenance_type_idx" ON "equipment_maintenance" USING btree ("maintenance_type");--> statement-breakpoint
CREATE INDEX "equipment_maintenance_performed_at_idx" ON "equipment_maintenance" USING btree ("performed_at");--> statement-breakpoint
CREATE INDEX "event_age_category_event_id_idx" ON "event_age_category" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_age_category_age_category_id_idx" ON "event_age_category" USING btree ("age_category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_age_category_unique" ON "event_age_category" USING btree ("event_id","age_category_id");--> statement-breakpoint
CREATE INDEX "event_budget_line_event_id_idx" ON "event_budget_line" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_budget_line_org_id_idx" ON "event_budget_line" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "event_budget_line_category_id_idx" ON "event_budget_line" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "event_budget_line_status_idx" ON "event_budget_line" USING btree ("status");--> statement-breakpoint
CREATE INDEX "event_budget_line_vendor_id_idx" ON "event_budget_line" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "event_budget_line_is_revenue_idx" ON "event_budget_line" USING btree ("is_revenue");--> statement-breakpoint
CREATE INDEX "event_budget_line_event_category_idx" ON "event_budget_line" USING btree ("event_id","category_id");--> statement-breakpoint
CREATE INDEX "event_checklist_event_id_idx" ON "event_checklist" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_checklist_org_id_idx" ON "event_checklist" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "event_checklist_status_idx" ON "event_checklist" USING btree ("status");--> statement-breakpoint
CREATE INDEX "event_checklist_category_idx" ON "event_checklist" USING btree ("category");--> statement-breakpoint
CREATE INDEX "event_checklist_due_date_idx" ON "event_checklist" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "event_checklist_event_status_idx" ON "event_checklist" USING btree ("event_id","status");--> statement-breakpoint
CREATE INDEX "event_coach_event_id_idx" ON "event_coach" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_coach_coach_id_idx" ON "event_coach" USING btree ("coach_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_coach_unique" ON "event_coach" USING btree ("event_id","coach_id");--> statement-breakpoint
CREATE INDEX "event_discount_event_id_idx" ON "event_discount" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_discount_organization_id_idx" ON "event_discount" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "event_discount_mode_idx" ON "event_discount" USING btree ("discount_mode");--> statement-breakpoint
CREATE INDEX "event_discount_code_idx" ON "event_discount" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "event_discount_event_code_unique" ON "event_discount" USING btree ("event_id","code") WHERE code IS NOT NULL;--> statement-breakpoint
CREATE INDEX "event_discount_usage_discount_id_idx" ON "event_discount_usage" USING btree ("discount_id");--> statement-breakpoint
CREATE INDEX "event_discount_usage_registration_id_idx" ON "event_discount_usage" USING btree ("registration_id");--> statement-breakpoint
CREATE INDEX "event_discount_usage_user_email_idx" ON "event_discount_usage" USING btree ("user_email");--> statement-breakpoint
CREATE INDEX "event_document_event_id_idx" ON "event_document" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_document_org_id_idx" ON "event_document" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "event_document_document_type_idx" ON "event_document" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "event_document_uploaded_by_idx" ON "event_document" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "event_document_is_public_idx" ON "event_document" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "event_document_event_type_idx" ON "event_document" USING btree ("event_id","document_type");--> statement-breakpoint
CREATE INDEX "event_group_member_group_id_idx" ON "event_group_member" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "event_group_member_registration_id_idx" ON "event_group_member" USING btree ("registration_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_group_member_unique" ON "event_group_member" USING btree ("group_id","registration_id");--> statement-breakpoint
CREATE INDEX "event_group_event_id_idx" ON "event_group" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_group_organization_id_idx" ON "event_group" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_group_event_name_unique" ON "event_group" USING btree ("event_id","name");--> statement-breakpoint
CREATE INDEX "event_inventory_event_id_idx" ON "event_inventory" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_inventory_org_id_idx" ON "event_inventory" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "event_inventory_category_idx" ON "event_inventory" USING btree ("category");--> statement-breakpoint
CREATE INDEX "event_inventory_status_idx" ON "event_inventory" USING btree ("status");--> statement-breakpoint
CREATE INDEX "event_inventory_vendor_id_idx" ON "event_inventory" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "event_inventory_zone_id_idx" ON "event_inventory" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "event_inventory_responsible_id_idx" ON "event_inventory" USING btree ("responsible_id");--> statement-breakpoint
CREATE INDEX "event_inventory_event_status_idx" ON "event_inventory" USING btree ("event_id","status");--> statement-breakpoint
CREATE INDEX "event_milestone_event_id_idx" ON "event_milestone" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_milestone_org_id_idx" ON "event_milestone" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "event_milestone_target_date_idx" ON "event_milestone" USING btree ("target_date");--> statement-breakpoint
CREATE INDEX "event_milestone_status_idx" ON "event_milestone" USING btree ("status");--> statement-breakpoint
CREATE INDEX "event_milestone_responsible_id_idx" ON "event_milestone" USING btree ("responsible_id");--> statement-breakpoint
CREATE INDEX "event_milestone_event_date_idx" ON "event_milestone" USING btree ("event_id","target_date");--> statement-breakpoint
CREATE INDEX "event_note_event_id_idx" ON "event_note" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_note_org_id_idx" ON "event_note" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "event_note_note_type_idx" ON "event_note" USING btree ("note_type");--> statement-breakpoint
CREATE INDEX "event_note_parent_note_id_idx" ON "event_note" USING btree ("parent_note_id");--> statement-breakpoint
CREATE INDEX "event_note_author_id_idx" ON "event_note" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "event_note_is_pinned_idx" ON "event_note" USING btree ("is_pinned");--> statement-breakpoint
CREATE INDEX "event_note_created_at_idx" ON "event_note" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "event_note_event_created_idx" ON "event_note" USING btree ("event_id","created_at");--> statement-breakpoint
CREATE INDEX "event_note_related_entity_idx" ON "event_note" USING btree ("related_entity_type","related_entity_id");--> statement-breakpoint
CREATE INDEX "event_payment_registration_id_idx" ON "event_payment" USING btree ("registration_id");--> statement-breakpoint
CREATE INDEX "event_payment_organization_id_idx" ON "event_payment" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "event_payment_status_idx" ON "event_payment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "event_payment_payment_method_idx" ON "event_payment" USING btree ("payment_method");--> statement-breakpoint
CREATE INDEX "event_payment_mercado_pago_id_idx" ON "event_payment" USING btree ("mercado_pago_payment_id");--> statement-breakpoint
CREATE INDEX "event_payment_stripe_intent_id_idx" ON "event_payment" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE INDEX "event_payment_payment_date_idx" ON "event_payment" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "event_payment_org_status_idx" ON "event_payment" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "event_pricing_tier_event_id_idx" ON "event_pricing_tier" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_pricing_tier_tier_type_idx" ON "event_pricing_tier" USING btree ("tier_type");--> statement-breakpoint
CREATE INDEX "event_pricing_tier_valid_from_idx" ON "event_pricing_tier" USING btree ("valid_from");--> statement-breakpoint
CREATE INDEX "event_pricing_tier_valid_until_idx" ON "event_pricing_tier" USING btree ("valid_until");--> statement-breakpoint
CREATE INDEX "event_pricing_tier_is_active_idx" ON "event_pricing_tier" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "event_pricing_tier_age_category_id_idx" ON "event_pricing_tier" USING btree ("age_category_id");--> statement-breakpoint
CREATE INDEX "event_pricing_tier_event_active_idx" ON "event_pricing_tier" USING btree ("event_id","is_active");--> statement-breakpoint
CREATE INDEX "event_registration_event_id_idx" ON "event_registration" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_registration_organization_id_idx" ON "event_registration" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "event_registration_athlete_id_idx" ON "event_registration" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX "event_registration_user_id_idx" ON "event_registration" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "event_registration_status_idx" ON "event_registration" USING btree ("status");--> statement-breakpoint
CREATE INDEX "event_registration_email_idx" ON "event_registration" USING btree ("registrant_email");--> statement-breakpoint
CREATE INDEX "event_registration_age_category_id_idx" ON "event_registration" USING btree ("age_category_id");--> statement-breakpoint
CREATE INDEX "event_registration_waitlist_position_idx" ON "event_registration" USING btree ("waitlist_position");--> statement-breakpoint
CREATE INDEX "event_registration_event_status_idx" ON "event_registration" USING btree ("event_id","status");--> statement-breakpoint
CREATE INDEX "event_registration_org_event_idx" ON "event_registration" USING btree ("organization_id","event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_registration_event_number_unique" ON "event_registration" USING btree ("event_id","registration_number");--> statement-breakpoint
CREATE INDEX "event_risk_log_risk_id_idx" ON "event_risk_log" USING btree ("risk_id");--> statement-breakpoint
CREATE INDEX "event_risk_log_action_idx" ON "event_risk_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "event_risk_log_created_at_idx" ON "event_risk_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "event_risk_event_id_idx" ON "event_risk" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_risk_org_id_idx" ON "event_risk" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "event_risk_category_idx" ON "event_risk" USING btree ("category");--> statement-breakpoint
CREATE INDEX "event_risk_severity_idx" ON "event_risk" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "event_risk_probability_idx" ON "event_risk" USING btree ("probability");--> statement-breakpoint
CREATE INDEX "event_risk_status_idx" ON "event_risk" USING btree ("status");--> statement-breakpoint
CREATE INDEX "event_risk_owner_id_idx" ON "event_risk" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "event_risk_risk_score_idx" ON "event_risk" USING btree ("risk_score");--> statement-breakpoint
CREATE INDEX "event_risk_event_status_idx" ON "event_risk" USING btree ("event_id","status");--> statement-breakpoint
CREATE INDEX "event_rotation_assignment_time_block_id_idx" ON "event_rotation_assignment" USING btree ("time_block_id");--> statement-breakpoint
CREATE INDEX "event_rotation_assignment_group_id_idx" ON "event_rotation_assignment" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "event_rotation_assignment_station_id_idx" ON "event_rotation_assignment" USING btree ("station_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_rotation_assignment_block_group_unique" ON "event_rotation_assignment" USING btree ("time_block_id","group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_rotation_assignment_block_station_unique" ON "event_rotation_assignment" USING btree ("time_block_id","station_id");--> statement-breakpoint
CREATE INDEX "event_rotation_schedule_event_id_idx" ON "event_rotation_schedule" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_rotation_schedule_organization_id_idx" ON "event_rotation_schedule" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "event_sponsor_assignment_event_id_idx" ON "event_sponsor_assignment" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_sponsor_assignment_sponsor_id_idx" ON "event_sponsor_assignment" USING btree ("sponsor_id");--> statement-breakpoint
CREATE INDEX "event_sponsor_assignment_sort_order_idx" ON "event_sponsor_assignment" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "event_sponsor_benefit_sponsor_id_idx" ON "event_sponsor_benefit" USING btree ("sponsor_id");--> statement-breakpoint
CREATE INDEX "event_sponsor_benefit_status_idx" ON "event_sponsor_benefit" USING btree ("status");--> statement-breakpoint
CREATE INDEX "event_sponsor_benefit_due_date_idx" ON "event_sponsor_benefit" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "event_sponsor_event_id_idx" ON "event_sponsor" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_sponsor_org_id_idx" ON "event_sponsor" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "event_sponsor_tier_idx" ON "event_sponsor" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "event_sponsor_sort_order_idx" ON "event_sponsor" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "event_sponsor_event_tier_idx" ON "event_sponsor" USING btree ("event_id","tier");--> statement-breakpoint
CREATE INDEX "event_staff_shift_staff_id_idx" ON "event_staff_shift" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "event_staff_shift_event_id_idx" ON "event_staff_shift" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_staff_shift_shift_date_idx" ON "event_staff_shift" USING btree ("shift_date");--> statement-breakpoint
CREATE INDEX "event_staff_shift_zone_id_idx" ON "event_staff_shift" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "event_staff_shift_event_date_idx" ON "event_staff_shift" USING btree ("event_id","shift_date");--> statement-breakpoint
CREATE INDEX "event_staff_event_id_idx" ON "event_staff" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_staff_org_id_idx" ON "event_staff" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "event_staff_staff_type_idx" ON "event_staff" USING btree ("staff_type");--> statement-breakpoint
CREATE INDEX "event_staff_user_id_idx" ON "event_staff" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "event_staff_role_idx" ON "event_staff" USING btree ("role");--> statement-breakpoint
CREATE INDEX "event_staff_is_confirmed_idx" ON "event_staff" USING btree ("is_confirmed");--> statement-breakpoint
CREATE INDEX "event_staff_event_role_idx" ON "event_staff" USING btree ("event_id","role");--> statement-breakpoint
CREATE INDEX "event_station_staff_station_id_idx" ON "event_station_staff" USING btree ("station_id");--> statement-breakpoint
CREATE INDEX "event_station_staff_staff_id_idx" ON "event_station_staff" USING btree ("staff_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_station_staff_unique" ON "event_station_staff" USING btree ("station_id","staff_id");--> statement-breakpoint
CREATE INDEX "event_station_event_id_idx" ON "event_station" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_station_organization_id_idx" ON "event_station" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "event_station_zone_id_idx" ON "event_station" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "event_station_is_active_idx" ON "event_station" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "event_task_event_id_idx" ON "event_task" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_task_org_id_idx" ON "event_task" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "event_task_status_idx" ON "event_task" USING btree ("status");--> statement-breakpoint
CREATE INDEX "event_task_priority_idx" ON "event_task" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "event_task_assignee_id_idx" ON "event_task" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX "event_task_due_date_idx" ON "event_task" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "event_task_event_status_position_idx" ON "event_task" USING btree ("event_id","status","column_position");--> statement-breakpoint
CREATE INDEX "event_template_org_id_idx" ON "event_template" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "event_template_category_idx" ON "event_template" USING btree ("category");--> statement-breakpoint
CREATE INDEX "event_template_event_type_idx" ON "event_template" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "event_template_is_active_idx" ON "event_template" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "event_template_org_name_unique" ON "event_template" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "event_time_block_schedule_id_idx" ON "event_time_block" USING btree ("schedule_id");--> statement-breakpoint
CREATE INDEX "event_time_block_block_order_idx" ON "event_time_block" USING btree ("block_order");--> statement-breakpoint
CREATE INDEX "event_time_block_block_type_idx" ON "event_time_block" USING btree ("block_type");--> statement-breakpoint
CREATE INDEX "event_time_block_zone_id_idx" ON "event_time_block" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "event_vendor_assignment_event_id_idx" ON "event_vendor_assignment" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_vendor_assignment_vendor_id_idx" ON "event_vendor_assignment" USING btree ("vendor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_vendor_assignment_unique" ON "event_vendor_assignment" USING btree ("event_id","vendor_id");--> statement-breakpoint
CREATE INDEX "event_vendor_org_id_idx" ON "event_vendor" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "event_vendor_name_idx" ON "event_vendor" USING btree ("name");--> statement-breakpoint
CREATE INDEX "event_vendor_is_active_idx" ON "event_vendor" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "event_vendor_org_name_unique" ON "event_vendor" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "event_zone_staff_zone_id_idx" ON "event_zone_staff" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "event_zone_staff_staff_id_idx" ON "event_zone_staff" USING btree ("staff_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_zone_staff_unique" ON "event_zone_staff" USING btree ("zone_id","staff_id");--> statement-breakpoint
CREATE INDEX "event_zone_event_id_idx" ON "event_zone" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_zone_org_id_idx" ON "event_zone" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "event_zone_zone_type_idx" ON "event_zone" USING btree ("zone_type");--> statement-breakpoint
CREATE INDEX "event_zone_is_active_idx" ON "event_zone" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "event_zone_event_name_unique" ON "event_zone" USING btree ("event_id","name");--> statement-breakpoint
CREATE INDEX "expense_category_org_idx" ON "expense_category" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "expense_category_type_idx" ON "expense_category" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "expense_category_org_name_unique" ON "expense_category" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "expense_org_idx" ON "expense" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "expense_category_idx" ON "expense" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "expense_date_idx" ON "expense" USING btree ("expense_date");--> statement-breakpoint
CREATE INDEX "expense_payment_method_idx" ON "expense" USING btree ("payment_method");--> statement-breakpoint
CREATE INDEX "expense_org_date_idx" ON "expense" USING btree ("organization_id","expense_date");--> statement-breakpoint
CREATE INDEX "invitation_organization_id_idx" ON "invitation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" USING btree ("email");--> statement-breakpoint
CREATE INDEX "invitation_status_idx" ON "invitation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invitation_expires_at_idx" ON "invitation" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "invitation_inviter_id_idx" ON "invitation" USING btree ("inviter_id");--> statement-breakpoint
CREATE INDEX "location_organization_id_idx" ON "location" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "location_name_idx" ON "location" USING btree ("name");--> statement-breakpoint
CREATE INDEX "location_is_active_idx" ON "location" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "location_org_active_idx" ON "location" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE INDEX "match_organization_id_idx" ON "match" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "match_competition_id_idx" ON "match" USING btree ("competition_id");--> statement-breakpoint
CREATE INDEX "match_home_team_id_idx" ON "match" USING btree ("home_team_id");--> statement-breakpoint
CREATE INDEX "match_away_team_id_idx" ON "match" USING btree ("away_team_id");--> statement-breakpoint
CREATE INDEX "match_scheduled_at_idx" ON "match" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "match_status_idx" ON "match" USING btree ("status");--> statement-breakpoint
CREATE INDEX "match_location_id_idx" ON "match" USING btree ("location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "member_user_org_idx" ON "member" USING btree ("user_id","organization_id");--> statement-breakpoint
CREATE INDEX "member_organization_id_idx" ON "member" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "member_user_id_idx" ON "member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "member_role_idx" ON "member" USING btree ("role");--> statement-breakpoint
CREATE INDEX "order_item_order_id_idx" ON "order_item" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_item_stripe_price_id_idx" ON "order_item" USING btree ("stripe_price_id");--> statement-breakpoint
CREATE INDEX "order_organization_id_idx" ON "order" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "order_stripe_customer_id_idx" ON "order" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "order_status_idx" ON "order" USING btree ("status");--> statement-breakpoint
CREATE INDEX "order_payment_intent_id_idx" ON "order" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE INDEX "order_checkout_session_id_idx" ON "order" USING btree ("stripe_checkout_session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "org_feature_unique_idx" ON "organization_feature" USING btree ("organization_id","feature");--> statement-breakpoint
CREATE INDEX "org_feature_org_idx" ON "organization_feature" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_slug_idx" ON "organization" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "organization_name_idx" ON "organization" USING btree ("name");--> statement-breakpoint
CREATE INDEX "organization_stripe_customer_id_idx" ON "organization" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "product_organization_id_idx" ON "product" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "product_category_idx" ON "product" USING btree ("category");--> statement-breakpoint
CREATE INDEX "product_status_idx" ON "product" USING btree ("status");--> statement-breakpoint
CREATE INDEX "product_sku_idx" ON "product" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "product_barcode_idx" ON "product" USING btree ("barcode");--> statement-breakpoint
CREATE INDEX "recurring_exception_recurring_id_idx" ON "recurring_session_exception" USING btree ("recurring_session_id");--> statement-breakpoint
CREATE INDEX "recurring_exception_date_idx" ON "recurring_session_exception" USING btree ("exception_date");--> statement-breakpoint
CREATE UNIQUE INDEX "recurring_exception_unique" ON "recurring_session_exception" USING btree ("recurring_session_id","exception_date");--> statement-breakpoint
CREATE INDEX "sale_item_sale_id_idx" ON "sale_item" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX "sale_item_product_id_idx" ON "sale_item" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "sale_organization_id_idx" ON "sale" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "sale_athlete_id_idx" ON "sale" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX "sale_payment_status_idx" ON "sale" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "sale_created_at_idx" ON "sale" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "sale_sale_number_idx" ON "sale" USING btree ("sale_number");--> statement-breakpoint
CREATE INDEX "season_organization_id_idx" ON "season" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "season_is_active_idx" ON "season" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "season_is_current_idx" ON "season" USING btree ("is_current");--> statement-breakpoint
CREATE UNIQUE INDEX "season_org_name_unique" ON "season" USING btree ("organization_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_idx" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_expires_at_idx" ON "session" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "session_active_organization_id_idx" ON "session" USING btree ("active_organization_id");--> statement-breakpoint
CREATE INDEX "sponsor_org_id_idx" ON "sponsor" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "sponsor_status_idx" ON "sponsor" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sponsor_tier_idx" ON "sponsor" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "sponsor_is_active_idx" ON "sponsor" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "sponsor_org_status_idx" ON "sponsor" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "sports_event_organization_id_idx" ON "sports_event" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "sports_event_status_idx" ON "sports_event" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sports_event_event_type_idx" ON "sports_event" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "sports_event_start_date_idx" ON "sports_event" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "sports_event_end_date_idx" ON "sports_event" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "sports_event_location_id_idx" ON "sports_event" USING btree ("location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sports_event_org_slug_unique" ON "sports_event" USING btree ("organization_id","slug");--> statement-breakpoint
CREATE INDEX "sports_event_org_status_idx" ON "sports_event" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "sports_event_org_date_range_idx" ON "sports_event" USING btree ("organization_id","start_date","end_date");--> statement-breakpoint
CREATE INDEX "staff_payroll_org_idx" ON "staff_payroll" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "staff_payroll_coach_idx" ON "staff_payroll" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "staff_payroll_user_idx" ON "staff_payroll" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "staff_payroll_status_idx" ON "staff_payroll" USING btree ("status");--> statement-breakpoint
CREATE INDEX "staff_payroll_period_idx" ON "staff_payroll" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "staff_payroll_staff_type_idx" ON "staff_payroll" USING btree ("staff_type");--> statement-breakpoint
CREATE INDEX "stock_transaction_organization_id_idx" ON "stock_transaction" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "stock_transaction_product_id_idx" ON "stock_transaction" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "stock_transaction_type_idx" ON "stock_transaction" USING btree ("type");--> statement-breakpoint
CREATE INDEX "stock_transaction_created_at_idx" ON "stock_transaction" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "stock_transaction_reference_idx" ON "stock_transaction" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "subscription_item_subscription_id_idx" ON "subscription_item" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "subscription_item_stripe_price_id_idx" ON "subscription_item" USING btree ("stripe_price_id");--> statement-breakpoint
CREATE INDEX "subscription_item_price_model_idx" ON "subscription_item" USING btree ("price_model");--> statement-breakpoint
CREATE INDEX "subscription_organization_id_idx" ON "subscription" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "subscription_stripe_customer_id_idx" ON "subscription" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "subscription_status_idx" ON "subscription" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscription_stripe_price_id_idx" ON "subscription" USING btree ("stripe_price_id");--> statement-breakpoint
CREATE INDEX "subscription_org_status_idx" ON "subscription" USING btree ("organization_id","status");--> statement-breakpoint
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
CREATE INDEX "training_equipment_organization_id_idx" ON "training_equipment" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "training_equipment_category_idx" ON "training_equipment" USING btree ("category");--> statement-breakpoint
CREATE INDEX "training_equipment_status_idx" ON "training_equipment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "training_equipment_location_id_idx" ON "training_equipment" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "training_payment_organization_id_idx" ON "training_payment" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "training_payment_session_id_idx" ON "training_payment" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "training_payment_athlete_id_idx" ON "training_payment" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX "training_payment_status_idx" ON "training_payment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "training_payment_payment_date_idx" ON "training_payment" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "training_payment_mercado_pago_id_idx" ON "training_payment" USING btree ("mercado_pago_payment_id");--> statement-breakpoint
CREATE INDEX "training_payment_org_status_idx" ON "training_payment" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "training_payment_org_athlete_idx" ON "training_payment" USING btree ("organization_id","athlete_id");--> statement-breakpoint
CREATE INDEX "training_payment_org_athlete_date_idx" ON "training_payment" USING btree ("organization_id","athlete_id","payment_date");--> statement-breakpoint
CREATE UNIQUE INDEX "training_payment_session_athlete_unique" ON "training_payment" USING btree ("session_id","athlete_id") WHERE "training_payment"."session_id" IS NOT NULL;--> statement-breakpoint
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
CREATE INDEX "training_session_org_date_range_idx" ON "training_session" USING btree ("organization_id","start_time","end_time");--> statement-breakpoint
CREATE INDEX "training_session_org_created_by_idx" ON "training_session" USING btree ("organization_id","created_by");--> statement-breakpoint
CREATE UNIQUE INDEX "two_factor_user_id_idx" ON "two_factor" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_idx" ON "user" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "user_username_idx" ON "user" USING btree ("username");--> statement-breakpoint
CREATE INDEX "user_role_idx" ON "user" USING btree ("role");--> statement-breakpoint
CREATE INDEX "user_banned_idx" ON "user" USING btree ("banned");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "verification_value_idx" ON "verification" USING btree ("value");--> statement-breakpoint
CREATE INDEX "verification_expires_at_idx" ON "verification" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "waitlist_entry_org_idx" ON "waitlist_entry" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "waitlist_entry_athlete_idx" ON "waitlist_entry" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX "waitlist_entry_status_idx" ON "waitlist_entry" USING btree ("status");--> statement-breakpoint
CREATE INDEX "waitlist_entry_priority_idx" ON "waitlist_entry" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "waitlist_entry_reference_type_idx" ON "waitlist_entry" USING btree ("reference_type");--> statement-breakpoint
CREATE INDEX "waitlist_entry_athlete_group_idx" ON "waitlist_entry" USING btree ("athlete_group_id");--> statement-breakpoint
CREATE INDEX "waitlist_entry_position_idx" ON "waitlist_entry" USING btree ("position");--> statement-breakpoint
CREATE INDEX "waitlist_entry_org_status_idx" ON "waitlist_entry" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "waitlist_entry_org_type_status_idx" ON "waitlist_entry" USING btree ("organization_id","reference_type","status");