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
ALTER TABLE "coach" ADD CONSTRAINT "coach_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach" ADD CONSTRAINT "coach_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coach_organization_id_idx" ON "coach" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "coach_user_id_idx" ON "coach" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "coach_status_idx" ON "coach" USING btree ("status");--> statement-breakpoint
CREATE INDEX "coach_created_at_idx" ON "coach" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "coach_org_status_idx" ON "coach" USING btree ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "coach_org_user_unique" ON "coach" USING btree ("organization_id","user_id");