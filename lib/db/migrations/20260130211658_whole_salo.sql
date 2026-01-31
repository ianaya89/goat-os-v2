CREATE TABLE "training_payment_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "training_payment_session" ADD CONSTRAINT "training_payment_session_payment_id_training_payment_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."training_payment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_payment_session" ADD CONSTRAINT "training_payment_session_session_id_training_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."training_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "training_payment_session_payment_id_idx" ON "training_payment_session" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "training_payment_session_session_id_idx" ON "training_payment_session" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "training_payment_session_unique" ON "training_payment_session" USING btree ("payment_id","session_id");