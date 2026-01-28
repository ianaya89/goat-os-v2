DROP INDEX "age_category_sort_order_idx";--> statement-breakpoint
ALTER TABLE "expense" ADD COLUMN "category" text;--> statement-breakpoint
CREATE INDEX "expense_category_enum_idx" ON "expense" USING btree ("category");--> statement-breakpoint
ALTER TABLE "age_category" DROP COLUMN "sort_order";