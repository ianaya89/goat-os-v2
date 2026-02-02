CREATE TABLE "coach_language" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid NOT NULL,
	"language" text NOT NULL,
	"level" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_reference" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid NOT NULL,
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
ALTER TABLE "coach" ADD COLUMN "social_instagram" text;--> statement-breakpoint
ALTER TABLE "coach" ADD COLUMN "social_twitter" text;--> statement-breakpoint
ALTER TABLE "coach" ADD COLUMN "social_tiktok" text;--> statement-breakpoint
ALTER TABLE "coach" ADD COLUMN "social_linkedin" text;--> statement-breakpoint
ALTER TABLE "coach" ADD COLUMN "social_facebook" text;--> statement-breakpoint
ALTER TABLE "coach_language" ADD CONSTRAINT "coach_language_coach_id_coach_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_reference" ADD CONSTRAINT "coach_reference_coach_id_coach_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coach_language_coach_id_idx" ON "coach_language" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "coach_language_language_idx" ON "coach_language" USING btree ("language");--> statement-breakpoint
CREATE UNIQUE INDEX "coach_language_coach_lang_unique" ON "coach_language" USING btree ("coach_id","language");--> statement-breakpoint
CREATE INDEX "coach_reference_coach_id_idx" ON "coach_reference" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "coach_reference_is_public_idx" ON "coach_reference" USING btree ("is_public");