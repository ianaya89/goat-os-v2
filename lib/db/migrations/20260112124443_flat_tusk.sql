CREATE TABLE "staff_payroll" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"staff_type" text DEFAULT 'coach' NOT NULL,
	"coach_id" uuid,
	"user_id" uuid,
	"external_name" text,
	"external_email" text,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"period_type" text DEFAULT 'monthly' NOT NULL,
	"base_salary" integer DEFAULT 0 NOT NULL,
	"bonuses" integer DEFAULT 0 NOT NULL,
	"deductions" integer DEFAULT 0 NOT NULL,
	"total_amount" integer NOT NULL,
	"currency" text DEFAULT 'ARS' NOT NULL,
	"concept" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_method" text,
	"payment_date" timestamp with time zone,
	"expense_id" uuid,
	"notes" text,
	"created_by" uuid,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"paid_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_payroll_period_check" CHECK ("staff_payroll"."period_end" > "staff_payroll"."period_start")
);
--> statement-breakpoint
ALTER TABLE "staff_payroll" ADD CONSTRAINT "staff_payroll_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_payroll" ADD CONSTRAINT "staff_payroll_coach_id_coach_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_payroll" ADD CONSTRAINT "staff_payroll_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_payroll" ADD CONSTRAINT "staff_payroll_expense_id_expense_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expense"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_payroll" ADD CONSTRAINT "staff_payroll_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_payroll" ADD CONSTRAINT "staff_payroll_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_payroll" ADD CONSTRAINT "staff_payroll_paid_by_user_id_fk" FOREIGN KEY ("paid_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "staff_payroll_org_idx" ON "staff_payroll" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "staff_payroll_coach_idx" ON "staff_payroll" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "staff_payroll_user_idx" ON "staff_payroll" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "staff_payroll_status_idx" ON "staff_payroll" USING btree ("status");--> statement-breakpoint
CREATE INDEX "staff_payroll_period_idx" ON "staff_payroll" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "staff_payroll_staff_type_idx" ON "staff_payroll" USING btree ("staff_type");