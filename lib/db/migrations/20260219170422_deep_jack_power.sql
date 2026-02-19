ALTER TABLE "sports_event" ADD COLUMN "service_id" uuid;--> statement-breakpoint
ALTER TABLE "sports_event" ADD CONSTRAINT "sports_event_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sports_event_service_id_idx" ON "sports_event" USING btree ("service_id");