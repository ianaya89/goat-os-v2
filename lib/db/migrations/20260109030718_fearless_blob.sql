CREATE TABLE "age_category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"min_age" integer,
	"max_age" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "event_coach" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"coach_id" uuid NOT NULL,
	"role" text DEFAULT 'coach',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
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
ALTER TABLE "age_category" ADD CONSTRAINT "age_category_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_age_category" ADD CONSTRAINT "event_age_category_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sports_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_age_category" ADD CONSTRAINT "event_age_category_age_category_id_age_category_id_fk" FOREIGN KEY ("age_category_id") REFERENCES "public"."age_category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_coach" ADD CONSTRAINT "event_coach_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sports_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_coach" ADD CONSTRAINT "event_coach_coach_id_coach_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE "sports_event" ADD CONSTRAINT "sports_event_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sports_event" ADD CONSTRAINT "sports_event_location_id_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sports_event" ADD CONSTRAINT "sports_event_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "age_category_organization_id_idx" ON "age_category" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "age_category_sort_order_idx" ON "age_category" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "age_category_is_active_idx" ON "age_category" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "age_category_org_name_unique" ON "age_category" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "event_age_category_event_id_idx" ON "event_age_category" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_age_category_age_category_id_idx" ON "event_age_category" USING btree ("age_category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_age_category_unique" ON "event_age_category" USING btree ("event_id","age_category_id");--> statement-breakpoint
CREATE INDEX "event_coach_event_id_idx" ON "event_coach" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_coach_coach_id_idx" ON "event_coach" USING btree ("coach_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_coach_unique" ON "event_coach" USING btree ("event_id","coach_id");--> statement-breakpoint
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
CREATE INDEX "sports_event_organization_id_idx" ON "sports_event" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "sports_event_status_idx" ON "sports_event" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sports_event_event_type_idx" ON "sports_event" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "sports_event_start_date_idx" ON "sports_event" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "sports_event_end_date_idx" ON "sports_event" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "sports_event_location_id_idx" ON "sports_event" USING btree ("location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sports_event_org_slug_unique" ON "sports_event" USING btree ("organization_id","slug");--> statement-breakpoint
CREATE INDEX "sports_event_org_status_idx" ON "sports_event" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "sports_event_org_date_range_idx" ON "sports_event" USING btree ("organization_id","start_date","end_date");