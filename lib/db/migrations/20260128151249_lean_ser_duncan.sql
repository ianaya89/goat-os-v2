CREATE TABLE "session_confirmation_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"athlete_id" uuid NOT NULL,
	"channel" text NOT NULL,
	"status" text DEFAULT 'sent' NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"error_message" text,
	"trigger_job_id" text,
	"batch_id" uuid,
	"initiated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_notification_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"preferred_channel" text DEFAULT 'email' NOT NULL,
	"training_reminders" boolean DEFAULT true NOT NULL,
	"payment_reminders" boolean DEFAULT true NOT NULL,
	"marketing_notifications" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "session_confirmation_history" ADD CONSTRAINT "session_confirmation_history_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_confirmation_history" ADD CONSTRAINT "session_confirmation_history_session_id_training_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."training_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_confirmation_history" ADD CONSTRAINT "session_confirmation_history_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_confirmation_history" ADD CONSTRAINT "session_confirmation_history_initiated_by_user_id_fk" FOREIGN KEY ("initiated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notification_settings" ADD CONSTRAINT "user_notification_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notification_settings" ADD CONSTRAINT "user_notification_settings_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "confirmation_history_org_idx" ON "session_confirmation_history" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "confirmation_history_session_idx" ON "session_confirmation_history" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "confirmation_history_athlete_idx" ON "session_confirmation_history" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX "confirmation_history_batch_idx" ON "session_confirmation_history" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "confirmation_history_status_idx" ON "session_confirmation_history" USING btree ("status");--> statement-breakpoint
CREATE INDEX "confirmation_history_org_sent_idx" ON "session_confirmation_history" USING btree ("organization_id","sent_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_notification_settings_unique" ON "user_notification_settings" USING btree ("user_id","organization_id");--> statement-breakpoint
CREATE INDEX "user_notification_settings_user_idx" ON "user_notification_settings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_notification_settings_org_idx" ON "user_notification_settings" USING btree ("organization_id");