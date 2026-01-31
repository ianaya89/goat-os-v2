ALTER TABLE "training_payment" ADD COLUMN "service_id" uuid;--> statement-breakpoint
ALTER TABLE "training_payment" ADD CONSTRAINT "training_payment_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "training_payment_service_id_idx" ON "training_payment" USING btree ("service_id");