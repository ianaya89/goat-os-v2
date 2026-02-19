ALTER TABLE "expense" ADD COLUMN "event_id" uuid;--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_event_id_sports_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sports_event"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expense_event_idx" ON "expense" USING btree ("event_id");