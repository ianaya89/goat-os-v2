ALTER TABLE "event_payment" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "event_payment" CASCADE;--> statement-breakpoint
ALTER TABLE "training_payment" ADD COLUMN "receipt_image_uploaded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "training_payment" ADD COLUMN "type" text DEFAULT 'training' NOT NULL;--> statement-breakpoint
ALTER TABLE "training_payment" ADD COLUMN "registration_id" uuid;--> statement-breakpoint
ALTER TABLE "training_payment" ADD COLUMN "stripe_payment_intent_id" text;--> statement-breakpoint
ALTER TABLE "training_payment" ADD COLUMN "stripe_checkout_session_id" text;--> statement-breakpoint
ALTER TABLE "training_payment" ADD COLUMN "stripe_status" text;--> statement-breakpoint
ALTER TABLE "training_payment" ADD COLUMN "mercado_pago_external_reference" text;--> statement-breakpoint
ALTER TABLE "training_payment" ADD COLUMN "refunded_amount" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "training_payment" ADD COLUMN "refunded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "training_payment" ADD COLUMN "refund_reason" text;--> statement-breakpoint
ALTER TABLE "training_payment" ADD CONSTRAINT "training_payment_registration_id_event_registration_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."event_registration"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "training_payment_registration_id_idx" ON "training_payment" USING btree ("registration_id");--> statement-breakpoint
CREATE INDEX "training_payment_type_idx" ON "training_payment" USING btree ("type");--> statement-breakpoint
CREATE INDEX "training_payment_stripe_intent_id_idx" ON "training_payment" USING btree ("stripe_payment_intent_id");