CREATE TABLE "service_price_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"price" integer NOT NULL,
	"currency" text DEFAULT 'ARS' NOT NULL,
	"effective_from" timestamp with time zone NOT NULL,
	"effective_until" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"current_price" integer NOT NULL,
	"currency" text DEFAULT 'ARS' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "athlete_group" ADD COLUMN "service_id" uuid;--> statement-breakpoint
ALTER TABLE "training_session" ADD COLUMN "service_id" uuid;--> statement-breakpoint
ALTER TABLE "training_session" ADD COLUMN "service_price_at_creation" integer;--> statement-breakpoint
ALTER TABLE "service_price_history" ADD CONSTRAINT "service_price_history_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_price_history" ADD CONSTRAINT "service_price_history_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service" ADD CONSTRAINT "service_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service" ADD CONSTRAINT "service_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "service_price_history_service_id_idx" ON "service_price_history" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "service_price_history_effective_from_idx" ON "service_price_history" USING btree ("effective_from");--> statement-breakpoint
CREATE INDEX "service_price_history_service_effective_idx" ON "service_price_history" USING btree ("service_id","effective_from");--> statement-breakpoint
CREATE INDEX "service_organization_id_idx" ON "service" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "service_status_idx" ON "service" USING btree ("status");--> statement-breakpoint
CREATE INDEX "service_org_status_idx" ON "service" USING btree ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "service_org_name_unique" ON "service" USING btree ("organization_id","name");--> statement-breakpoint
ALTER TABLE "training_session" ADD CONSTRAINT "training_session_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "athlete_group_service_id_idx" ON "athlete_group" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "training_session_service_id_idx" ON "training_session" USING btree ("service_id");