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
ALTER TABLE "athlete" ADD COLUMN "parent_name" text;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "parent_phone" text;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "parent_email" text;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "parent_relationship" text;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "parental_consent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "terms_accepted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "medical_fitness_confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "medical_certificate_key" text;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "medical_certificate_uploaded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "athlete" ADD COLUMN "medical_certificate_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "athlete_medical_document" ADD CONSTRAINT "athlete_medical_document_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_medical_document" ADD CONSTRAINT "athlete_medical_document_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "athlete_medical_document_athlete_id_idx" ON "athlete_medical_document" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX "athlete_medical_document_type_idx" ON "athlete_medical_document" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "athlete_medical_document_date_idx" ON "athlete_medical_document" USING btree ("document_date");--> statement-breakpoint
CREATE INDEX "athlete_medical_document_athlete_type_idx" ON "athlete_medical_document" USING btree ("athlete_id","document_type");