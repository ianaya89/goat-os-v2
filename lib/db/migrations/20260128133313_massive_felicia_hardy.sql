CREATE TABLE "coach_achievement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid NOT NULL,
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
ALTER TABLE "coach_achievement" ADD CONSTRAINT "coach_achievement_coach_id_coach_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coach_achievement_coach_id_idx" ON "coach_achievement" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "coach_achievement_year_idx" ON "coach_achievement" USING btree ("year");--> statement-breakpoint
CREATE INDEX "coach_achievement_type_idx" ON "coach_achievement" USING btree ("type");--> statement-breakpoint
CREATE INDEX "coach_achievement_is_public_idx" ON "coach_achievement" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "coach_achievement_coach_year_idx" ON "coach_achievement" USING btree ("coach_id","year");