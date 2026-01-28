CREATE TABLE "coach_education" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid NOT NULL,
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
ALTER TABLE "coach_education" ADD CONSTRAINT "coach_education_coach_id_coach_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coach_education_coach_id_idx" ON "coach_education" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "coach_education_display_order_idx" ON "coach_education" USING btree ("coach_id","display_order");