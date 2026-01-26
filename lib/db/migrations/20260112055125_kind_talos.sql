CREATE TABLE "equipment_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"equipment_id" uuid NOT NULL,
	"athlete_group_id" uuid,
	"training_session_id" uuid,
	"coach_id" uuid,
	"quantity" integer DEFAULT 1 NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"returned_at" timestamp with time zone,
	"expected_return_at" timestamp with time zone,
	"notes" text,
	"assigned_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment_maintenance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipment_id" uuid NOT NULL,
	"maintenance_type" text NOT NULL,
	"description" text,
	"cost" integer,
	"currency" text DEFAULT 'ARS' NOT NULL,
	"previous_condition" text,
	"new_condition" text,
	"performed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"performed_by" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sku" text,
	"barcode" text,
	"category" text DEFAULT 'other' NOT NULL,
	"cost_price" integer DEFAULT 0 NOT NULL,
	"selling_price" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'ARS' NOT NULL,
	"track_stock" boolean DEFAULT true NOT NULL,
	"low_stock_threshold" integer DEFAULT 5,
	"current_stock" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"image_url" text,
	"tax_rate" integer DEFAULT 0,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sale_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" integer NOT NULL,
	"total_price" integer NOT NULL,
	"discount_amount" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sale" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"sale_number" text,
	"athlete_id" uuid,
	"customer_name" text,
	"subtotal" integer DEFAULT 0 NOT NULL,
	"tax_amount" integer DEFAULT 0 NOT NULL,
	"discount_amount" integer DEFAULT 0 NOT NULL,
	"total_amount" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'ARS' NOT NULL,
	"payment_method" text,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp with time zone,
	"cash_movement_id" uuid,
	"notes" text,
	"sold_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"type" text NOT NULL,
	"quantity" integer NOT NULL,
	"previous_stock" integer NOT NULL,
	"new_stock" integer NOT NULL,
	"unit_cost" integer,
	"reference_type" text,
	"reference_id" uuid,
	"reason" text,
	"notes" text,
	"recorded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_equipment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"brand" text,
	"model" text,
	"serial_number" text,
	"category" text DEFAULT 'other' NOT NULL,
	"total_quantity" integer DEFAULT 1 NOT NULL,
	"available_quantity" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"condition" text DEFAULT 'good' NOT NULL,
	"purchase_price" integer,
	"purchase_date" timestamp with time zone,
	"currency" text DEFAULT 'ARS' NOT NULL,
	"location_id" uuid,
	"storage_location" text,
	"last_maintenance_date" timestamp with time zone,
	"next_maintenance_date" timestamp with time zone,
	"image_url" text,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "equipment_assignment" ADD CONSTRAINT "equipment_assignment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_assignment" ADD CONSTRAINT "equipment_assignment_equipment_id_training_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."training_equipment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_assignment" ADD CONSTRAINT "equipment_assignment_athlete_group_id_athlete_group_id_fk" FOREIGN KEY ("athlete_group_id") REFERENCES "public"."athlete_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_assignment" ADD CONSTRAINT "equipment_assignment_training_session_id_training_session_id_fk" FOREIGN KEY ("training_session_id") REFERENCES "public"."training_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_assignment" ADD CONSTRAINT "equipment_assignment_coach_id_coach_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_assignment" ADD CONSTRAINT "equipment_assignment_assigned_by_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_maintenance" ADD CONSTRAINT "equipment_maintenance_equipment_id_training_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."training_equipment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_maintenance" ADD CONSTRAINT "equipment_maintenance_performed_by_user_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_item" ADD CONSTRAINT "sale_item_sale_id_sale_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sale"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_item" ADD CONSTRAINT "sale_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale" ADD CONSTRAINT "sale_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale" ADD CONSTRAINT "sale_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale" ADD CONSTRAINT "sale_cash_movement_id_cash_movement_id_fk" FOREIGN KEY ("cash_movement_id") REFERENCES "public"."cash_movement"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale" ADD CONSTRAINT "sale_sold_by_user_id_fk" FOREIGN KEY ("sold_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transaction" ADD CONSTRAINT "stock_transaction_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transaction" ADD CONSTRAINT "stock_transaction_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transaction" ADD CONSTRAINT "stock_transaction_recorded_by_user_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_equipment" ADD CONSTRAINT "training_equipment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_equipment" ADD CONSTRAINT "training_equipment_location_id_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_equipment" ADD CONSTRAINT "training_equipment_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "equipment_assignment_organization_id_idx" ON "equipment_assignment" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "equipment_assignment_equipment_id_idx" ON "equipment_assignment" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "equipment_assignment_group_id_idx" ON "equipment_assignment" USING btree ("athlete_group_id");--> statement-breakpoint
CREATE INDEX "equipment_assignment_session_id_idx" ON "equipment_assignment" USING btree ("training_session_id");--> statement-breakpoint
CREATE INDEX "equipment_assignment_coach_id_idx" ON "equipment_assignment" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "equipment_assignment_returned_idx" ON "equipment_assignment" USING btree ("returned_at");--> statement-breakpoint
CREATE INDEX "equipment_maintenance_equipment_id_idx" ON "equipment_maintenance" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "equipment_maintenance_type_idx" ON "equipment_maintenance" USING btree ("maintenance_type");--> statement-breakpoint
CREATE INDEX "equipment_maintenance_performed_at_idx" ON "equipment_maintenance" USING btree ("performed_at");--> statement-breakpoint
CREATE INDEX "product_organization_id_idx" ON "product" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "product_category_idx" ON "product" USING btree ("category");--> statement-breakpoint
CREATE INDEX "product_status_idx" ON "product" USING btree ("status");--> statement-breakpoint
CREATE INDEX "product_sku_idx" ON "product" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "product_barcode_idx" ON "product" USING btree ("barcode");--> statement-breakpoint
CREATE INDEX "sale_item_sale_id_idx" ON "sale_item" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX "sale_item_product_id_idx" ON "sale_item" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "sale_organization_id_idx" ON "sale" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "sale_athlete_id_idx" ON "sale" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX "sale_payment_status_idx" ON "sale" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "sale_created_at_idx" ON "sale" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "sale_sale_number_idx" ON "sale" USING btree ("sale_number");--> statement-breakpoint
CREATE INDEX "stock_transaction_organization_id_idx" ON "stock_transaction" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "stock_transaction_product_id_idx" ON "stock_transaction" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "stock_transaction_type_idx" ON "stock_transaction" USING btree ("type");--> statement-breakpoint
CREATE INDEX "stock_transaction_created_at_idx" ON "stock_transaction" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "stock_transaction_reference_idx" ON "stock_transaction" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "training_equipment_organization_id_idx" ON "training_equipment" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "training_equipment_category_idx" ON "training_equipment" USING btree ("category");--> statement-breakpoint
CREATE INDEX "training_equipment_status_idx" ON "training_equipment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "training_equipment_location_id_idx" ON "training_equipment" USING btree ("location_id");