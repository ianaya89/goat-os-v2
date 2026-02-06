import { sql } from "drizzle-orm";
import {
	boolean,
	check,
	index,
	integer,
	jsonb,
	numeric,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import {
	AchievementScope,
	AchievementType,
	AthleteLevel,
	AthleteMedicalDocumentType,
	type AthleteOpportunityType,
	AthleteSport,
	AthleteStatus,
	AttendanceStatus,
	BillingInterval,
	CashMovementReferenceType,
	CashMovementType,
	CashRegisterStatus,
	CoachExperienceLevel,
	CoachPaymentType,
	CoachStatus,
	CompetitionStatus,
	CompetitionType,
	ConfirmationStatus,
	CreditTransactionType,
	DayOfWeek,
	DiscountMode,
	DiscountValueType,
	DominantSide,
	EquipmentAuditStatus,
	EquipmentAuditType,
	EquipmentCondition,
	EquipmentCountStatus,
	EventBudgetStatus,
	EventChecklistStatus,
	EventDocumentType,
	EventInventoryStatus,
	EventMilestoneStatus,
	EventNoteType,
	EventPaymentMethod,
	EventPaymentStatus,
	EventRegistrationStatus,
	EventRiskProbability,
	EventRiskSeverity,
	EventRiskStatus,
	EventSponsorBenefitStatus,
	EventSponsorTier,
	EventStaffRole,
	EventStaffType,
	EventStatus,
	EventTaskPriority,
	EventTaskStatus,
	EventTimeBlockType,
	EventType,
	ExpenseCategory,
	ExpenseCategoryType,
	enumToPgEnum,
	FitnessTestType,
	InvitationStatus,
	LanguageProficiencyLevel,
	MatchResultType,
	MatchStatus,
	MemberRole,
	NotificationChannel,
	OrderStatus,
	OrganizationFeature,
	PayrollPeriodType,
	PayrollStaffType,
	PayrollStatus,
	PriceModel,
	PriceType,
	PricingTierType,
	ProductCategory,
	ProductStatus,
	SaleStatus,
	ServiceStatus,
	SponsorStatus,
	StockTransactionType,
	SubscriptionStatus,
	TeamCompetitionStatus,
	TeamMemberRole,
	TeamStaffRole,
	TeamStatus,
	TrainingEquipmentCategory,
	TrainingEquipmentStatus,
	TrainingPaymentMethod,
	TrainingPaymentStatus,
	TrainingSessionStatus,
	UserRole,
	WaitlistEntryStatus,
	WaitlistPriority,
	WaitlistReferenceType,
} from "./enums";

export const accountTable = pgTable(
	"account",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: uuid("user_id")
			.notNull()
			.references(() => userTable.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		expiresAt: timestamp("expires_at", { withTimezone: true }),
		password: text("password"),
		accessTokenExpiresAt: timestamp("access_token_expires_at", {
			withTimezone: true,
		}),
		refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
			withTimezone: true,
		}),
		scope: text("scope"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("account_user_id_idx").on(table.userId),
		uniqueIndex("account_provider_account_idx").on(
			table.providerId,
			table.accountId,
		),
	],
);

export const invitationTable = pgTable(
	"invitation",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),
		email: text("email").notNull(),
		role: text("role", { enum: enumToPgEnum(MemberRole) })
			.$type<MemberRole>()
			.notNull()
			.default(MemberRole.member),
		status: text("status", { enum: enumToPgEnum(InvitationStatus) })
			.$type<InvitationStatus>()
			.notNull()
			.default(InvitationStatus.pending),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
		inviterId: uuid("inviter_id")
			.notNull()
			.references(() => userTable.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("invitation_organization_id_idx").on(table.organizationId),
		index("invitation_email_idx").on(table.email),
		index("invitation_status_idx").on(table.status),
		index("invitation_expires_at_idx").on(table.expiresAt),
		index("invitation_inviter_id_idx").on(table.inviterId),
	],
);

export const athleteSignupLinkTable = pgTable(
	"athlete_signup_link",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),
		token: text("token").notNull().unique(),
		name: text("name").notNull(),
		athleteGroupId: uuid("athlete_group_id").references(
			() => athleteGroupTable.id,
			{ onDelete: "set null" },
		),
		isActive: boolean("is_active").notNull().default(true),
		createdBy: uuid("created_by")
			.notNull()
			.references(() => userTable.id, { onDelete: "cascade" }),
		usageCount: integer("usage_count").notNull().default(0),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("athlete_signup_link_organization_id_idx").on(table.organizationId),
		index("athlete_signup_link_is_active_idx").on(table.isActive),
		index("athlete_signup_link_athlete_group_id_idx").on(table.athleteGroupId),
	],
);

export const memberTable = pgTable(
	"member",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),
		userId: uuid("user_id")
			.notNull()
			.references(() => userTable.id, { onDelete: "cascade" }),
		role: text("role", { enum: enumToPgEnum(MemberRole) })
			.$type<MemberRole>()
			.notNull()
			.default(MemberRole.member),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		uniqueIndex("member_user_org_idx").on(table.userId, table.organizationId),
		index("member_organization_id_idx").on(table.organizationId),
		index("member_user_id_idx").on(table.userId),
		index("member_role_idx").on(table.role),
	],
);

export const organizationTable = pgTable(
	"organization",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		name: text("name").notNull(),
		slug: text("slug"),
		logo: text("logo"),
		metadata: text("metadata"),
		stripeCustomerId: text("stripe_customer_id"),
		timezone: text("timezone")
			.notNull()
			.default("America/Argentina/Buenos_Aires"),
		locale: text("locale").notNull().default("es"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		uniqueIndex("organization_slug_idx").on(table.slug),
		index("organization_name_idx").on(table.name),
		index("organization_stripe_customer_id_idx").on(table.stripeCustomerId),
	],
);

// Organization feature flags - controls which modules are available per organization
export const organizationFeatureTable = pgTable(
	"organization_feature",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),
		feature: text("feature", { enum: enumToPgEnum(OrganizationFeature) })
			.$type<OrganizationFeature>()
			.notNull(),
		enabled: boolean("enabled").notNull().default(true),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		uniqueIndex("org_feature_unique_idx").on(
			table.organizationId,
			table.feature,
		),
		index("org_feature_org_idx").on(table.organizationId),
	],
);

export const sessionTable = pgTable(
	"session",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: uuid("user_id")
			.notNull()
			.references(() => userTable.id, { onDelete: "cascade" }),
		impersonatedBy: uuid("impersonated_by").references(() => userTable.id),
		activeOrganizationId: uuid("active_organization_id"),
		token: text("token").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		uniqueIndex("session_token_idx").on(table.token),
		index("session_user_id_idx").on(table.userId),
		index("session_expires_at_idx").on(table.expiresAt),
		index("session_active_organization_id_idx").on(table.activeOrganizationId),
	],
);

export const twoFactorTable = pgTable(
	"two_factor",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		secret: text("secret").notNull(),
		backupCodes: text("backup_codes").notNull(),
		userId: uuid("user_id")
			.notNull()
			.references(() => userTable.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [uniqueIndex("two_factor_user_id_idx").on(table.userId)],
);

export const userTable = pgTable(
	"user",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		name: text("name").notNull(),
		email: text("email").notNull().unique(),
		emailVerified: boolean("email_verified").notNull().default(false),
		image: text("image"), // OAuth profile image URL
		imageKey: text("image_key"), // S3 key for uploaded profile image
		username: text("username").unique(),
		role: text("role", { enum: enumToPgEnum(UserRole) })
			.$type<UserRole>()
			.notNull()
			.default(UserRole.user),
		banned: boolean("banned").default(false),
		banReason: text("ban_reason"),
		banExpires: timestamp("ban_expires", { withTimezone: true }),
		onboardingComplete: boolean("onboarding_complete").default(false).notNull(),
		twoFactorEnabled: boolean("two_factor_enabled").default(false),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		uniqueIndex("user_email_idx").on(table.email),
		uniqueIndex("user_username_idx").on(table.username),
		index("user_role_idx").on(table.role),
		index("user_banned_idx").on(table.banned),
	],
);

export const verificationTable = pgTable(
	"verification",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("verification_identifier_idx").on(table.identifier),
		index("verification_value_idx").on(table.value),
		index("verification_expires_at_idx").on(table.expiresAt),
	],
);

// ============================================================================
// BILLING TABLES
// ============================================================================

/**
 * Subscription table - stores active subscriptions from Stripe
 * This is a more detailed approach than a simple "order" table,
 * allowing for proper subscription lifecycle management.
 */
export const subscriptionTable = pgTable(
	"subscription",
	{
		id: text("id").primaryKey(), // Stripe subscription ID (sub_xxx)
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),
		stripeCustomerId: text("stripe_customer_id").notNull(),
		status: text("status", { enum: enumToPgEnum(SubscriptionStatus) })
			.$type<SubscriptionStatus>()
			.notNull(),
		// Price/Product info
		stripePriceId: text("stripe_price_id").notNull(),
		stripeProductId: text("stripe_product_id"),
		// Quantity (for per-seat billing)
		quantity: integer("quantity").notNull().default(1),
		// Billing interval
		interval: text("interval", { enum: enumToPgEnum(BillingInterval) })
			.$type<BillingInterval>()
			.notNull(),
		intervalCount: integer("interval_count").notNull().default(1),
		// Pricing
		unitAmount: integer("unit_amount"), // Amount in cents
		currency: text("currency").notNull().default("usd"),
		// Period dates
		currentPeriodStart: timestamp("current_period_start", {
			withTimezone: true,
		}).notNull(),
		currentPeriodEnd: timestamp("current_period_end", {
			withTimezone: true,
		}).notNull(),
		// Trial dates
		trialStart: timestamp("trial_start", { withTimezone: true }),
		trialEnd: timestamp("trial_end", { withTimezone: true }),
		// Cancellation
		cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
		canceledAt: timestamp("canceled_at", { withTimezone: true }),
		// Timestamps
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("subscription_organization_id_idx").on(table.organizationId),
		index("subscription_stripe_customer_id_idx").on(table.stripeCustomerId),
		index("subscription_status_idx").on(table.status),
		index("subscription_stripe_price_id_idx").on(table.stripePriceId),
		// Composite index for common query: active subscriptions by organization
		index("subscription_org_status_idx").on(table.organizationId, table.status),
	],
);

/**
 * Subscription item table - stores individual line items for a subscription
 * Supports per-seat pricing, metered billing, and multiple prices per subscription
 */
export const subscriptionItemTable = pgTable(
	"subscription_item",
	{
		id: text("id").primaryKey(), // Stripe subscription item ID (si_xxx)
		subscriptionId: text("subscription_id")
			.notNull()
			.references(() => subscriptionTable.id, { onDelete: "cascade" }),
		// Price/Product info
		stripePriceId: text("stripe_price_id").notNull(),
		stripeProductId: text("stripe_product_id"),
		// Quantity (for per-seat billing)
		quantity: integer("quantity").notNull().default(1),
		// Price details
		priceAmount: integer("price_amount"), // Amount in cents per unit
		// Pricing model
		priceType: text("price_type", { enum: enumToPgEnum(PriceType) })
			.$type<PriceType>()
			.notNull()
			.default(PriceType.recurring),
		priceModel: text("price_model", { enum: enumToPgEnum(PriceModel) })
			.$type<PriceModel>()
			.notNull()
			.default(PriceModel.flat),
		// Billing interval (for recurring)
		interval: text("interval", {
			enum: enumToPgEnum(BillingInterval),
		}).$type<BillingInterval>(),
		intervalCount: integer("interval_count").default(1),
		// Metered billing
		meterId: text("meter_id"), // Stripe meter ID for usage-based billing
		// Timestamps
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("subscription_item_subscription_id_idx").on(table.subscriptionId),
		index("subscription_item_stripe_price_id_idx").on(table.stripePriceId),
		index("subscription_item_price_model_idx").on(table.priceModel),
	],
);

/**
 * Order table - stores one-time payments (lifetime deals, credits, etc.)
 * This is the order header; individual items are stored in order_item
 */
export const orderTable = pgTable(
	"order",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),
		stripeCustomerId: text("stripe_customer_id").notNull(),
		stripePaymentIntentId: text("stripe_payment_intent_id"), // pi_xxx
		stripeCheckoutSessionId: text("stripe_checkout_session_id"), // cs_xxx
		// Totals (sum of all items)
		totalAmount: integer("total_amount").notNull(), // Total amount in cents
		currency: text("currency").notNull().default("usd"),
		// Status
		status: text("status", { enum: enumToPgEnum(OrderStatus) })
			.$type<OrderStatus>()
			.notNull()
			.default(OrderStatus.completed),
		// Timestamps
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("order_organization_id_idx").on(table.organizationId),
		index("order_stripe_customer_id_idx").on(table.stripeCustomerId),
		index("order_status_idx").on(table.status),
		index("order_payment_intent_id_idx").on(table.stripePaymentIntentId),
		index("order_checkout_session_id_idx").on(table.stripeCheckoutSessionId),
	],
);

/**
 * Order item table - stores individual line items for an order
 * Supports multiple products/prices per order
 */
export const orderItemTable = pgTable(
	"order_item",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		orderId: uuid("order_id")
			.notNull()
			.references(() => orderTable.id, { onDelete: "cascade" }),
		// Price/Product info
		stripePriceId: text("stripe_price_id").notNull(),
		stripeProductId: text("stripe_product_id"),
		// Quantity and pricing
		quantity: integer("quantity").notNull().default(1),
		unitAmount: integer("unit_amount").notNull(), // Price per unit in cents
		totalAmount: integer("total_amount").notNull(), // quantity * unitAmount
		// Description (from Stripe line item)
		description: text("description"),
		// Timestamps
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("order_item_order_id_idx").on(table.orderId),
		index("order_item_stripe_price_id_idx").on(table.stripePriceId),
	],
);

/**
 * Billing event log - audit trail for all billing events
 * Useful for debugging and customer support
 */
export const billingEventTable = pgTable(
	"billing_event",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id").references(
			() => organizationTable.id,
			{ onDelete: "set null" },
		),
		stripeEventId: text("stripe_event_id").notNull().unique(), // evt_xxx
		eventType: text("event_type").notNull(), // e.g., "customer.subscription.created"
		// Reference to related entities
		subscriptionId: text("subscription_id"),
		orderId: uuid("order_id"),
		// Raw event data for debugging
		eventData: text("event_data"), // JSON stringified
		// Processing status
		processed: boolean("processed").notNull().default(true),
		error: text("error"),
		// Timestamps
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("billing_event_organization_id_idx").on(table.organizationId),
		index("billing_event_event_type_idx").on(table.eventType),
		index("billing_event_subscription_id_idx").on(table.subscriptionId),
		index("billing_event_created_at_idx").on(table.createdAt),
	],
);

/**
 * Credit balance per organization
 * Denormalized for fast reads - single row per org
 */
export const creditBalanceTable = pgTable(
	"credit_balance",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.unique()
			.references(() => organizationTable.id, { onDelete: "cascade" }),
		// Current balance (can be large for high-volume orgs)
		balance: integer("balance").notNull().default(0),
		// Lifetime stats for analytics
		lifetimePurchased: integer("lifetime_purchased").notNull().default(0),
		lifetimeGranted: integer("lifetime_granted").notNull().default(0), // Free/promo
		lifetimeUsed: integer("lifetime_used").notNull().default(0),
		lifetimeExpired: integer("lifetime_expired").notNull().default(0),
		// Timestamps
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("credit_balance_organization_id_idx").on(table.organizationId),
	],
);

/**
 * Credit deduction failure log - tracks failed deductions for reconciliation
 * When credit deduction fails after AI response is already sent, we log it here
 */
export const creditDeductionFailureTable = pgTable(
	"credit_deduction_failure",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),
		// Amount that should have been deducted
		amount: integer("amount").notNull(),
		// Error details
		errorCode: text("error_code").notNull(), // 'INSUFFICIENT_CREDITS', 'DB_ERROR', etc.
		errorMessage: text("error_message"),
		// Context
		model: text("model"),
		inputTokens: integer("input_tokens"),
		outputTokens: integer("output_tokens"),
		referenceType: text("reference_type"), // 'ai_chat', etc.
		referenceId: text("reference_id"),
		// Who triggered the request
		userId: uuid("user_id").references(() => userTable.id, {
			onDelete: "set null",
		}),
		// Resolution tracking
		resolved: boolean("resolved").notNull().default(false),
		resolvedAt: timestamp("resolved_at", { withTimezone: true }),
		resolvedBy: uuid("resolved_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		resolutionNotes: text("resolution_notes"),
		// Timestamps
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("credit_deduction_failure_org_idx").on(table.organizationId),
		index("credit_deduction_failure_resolved_idx").on(table.resolved),
		index("credit_deduction_failure_created_idx").on(table.createdAt),
	],
);

/**
 * Credit transaction ledger - immutable audit trail
 * Every credit change is recorded here
 */
export const creditTransactionTable = pgTable(
	"credit_transaction",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),
		// Transaction type
		type: text("type", { enum: enumToPgEnum(CreditTransactionType) })
			.$type<CreditTransactionType>()
			.notNull(),
		// Amount: positive = add credits, negative = deduct credits
		amount: integer("amount").notNull(),
		// Running balance after this transaction
		balanceAfter: integer("balance_after").notNull(),
		// Description shown to user
		description: text("description"),
		// Reference to source (order, subscription, chat, etc.)
		referenceType: text("reference_type"), // 'order', 'subscription', 'ai_chat', 'admin', etc.
		referenceId: text("reference_id"),
		// AI usage details (for usage transactions)
		model: text("model"), // 'gpt-4o-mini', 'gpt-4o', etc.
		inputTokens: integer("input_tokens"),
		outputTokens: integer("output_tokens"),
		// Who initiated this transaction
		createdBy: uuid("created_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		// Metadata for additional context
		metadata: text("metadata"), // JSON stringified
		// Timestamps
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("credit_transaction_organization_id_idx").on(table.organizationId),
		index("credit_transaction_type_idx").on(table.type),
		index("credit_transaction_created_at_idx").on(table.createdAt),
		index("credit_transaction_reference_idx").on(
			table.referenceType,
			table.referenceId,
		),
		// Composite for org history queries
		index("credit_transaction_org_created_idx").on(
			table.organizationId,
			table.createdAt,
		),
		// Composite index for org+type filtering
		index("credit_transaction_org_type_idx").on(
			table.organizationId,
			table.type,
		),
		// Unique constraint for checkout session idempotency (partial index)
		// This prevents double-crediting from webhook retries
		uniqueIndex("credit_transaction_checkout_unique")
			.on(table.referenceType, table.referenceId)
			.where(sql`${table.referenceType} = 'checkout_session'`),
		// Unique constraint for bonus credits idempotency (partial index)
		// This prevents double bonus credits from webhook retries
		uniqueIndex("credit_transaction_bonus_unique")
			.on(table.referenceType, table.referenceId)
			.where(sql`${table.referenceType} = 'checkout_session_bonus'`),
	],
);

// ============================================================================
// AI CHAT TABLE
// ============================================================================

/**
 * AI Chat table - stores chat conversations with AI
 * Supports both user-level and organization-level chats
 * Note: At least one of organizationId or userId must be non-null (enforced by check constraint)
 */
export const aiChatTable = pgTable(
	"ai_chat",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id").references(
			() => organizationTable.id,
			{ onDelete: "cascade" },
		),
		userId: uuid("user_id").references(() => userTable.id, {
			onDelete: "cascade",
		}),
		title: text("title"),
		messages: text("messages"), // JSON stringified array of messages
		pinned: boolean("pinned").notNull().default(false),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("ai_chat_organization_id_idx").on(table.organizationId),
		index("ai_chat_user_id_idx").on(table.userId),
		index("ai_chat_created_at_idx").on(table.createdAt),
		// Ensure at least one owner is set - prevent orphaned chats
		check(
			"ai_chat_has_owner",
			sql`${table.organizationId} IS NOT NULL OR ${table.userId} IS NOT NULL`,
		),
	],
);

// ============================================================================
// CLUB TABLE
// ============================================================================

/**
 * Club table - stores clubs/sports institutions for normalization
 * Each organization can define their own clubs catalog
 */
export const clubTable = pgTable(
	"club",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		shortName: text("short_name"), // Abbreviated name (e.g., "CARP" for Club Atlético River Plate)
		country: text("country"), // ISO 3166-1 alpha-2 code (e.g., "AR", "BR", "US")
		city: text("city"),
		logoKey: text("logo_key"), // S3 key for club logo
		website: text("website"),
		notes: text("notes"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("club_organization_id_idx").on(table.organizationId),
		index("club_country_idx").on(table.country),
		index("club_name_idx").on(table.name),
		uniqueIndex("club_org_name_unique").on(table.organizationId, table.name),
	],
);

// ============================================================================
// NATIONAL TEAM TABLE
// ============================================================================

/**
 * National Team table - stores national team selections for normalization
 * Each organization can define their own national teams catalog
 * Used for tracking athlete/coach participation in national selections
 */
export const nationalTeamTable = pgTable(
	"national_team",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),
		name: text("name").notNull(), // e.g., "Selección Argentina"
		country: text("country").notNull(), // ISO 3166-1 alpha-2 code (e.g., "AR", "BR", "US")
		category: text("category"), // e.g., "Sub-17", "Sub-20", "Senior", "Femenino"
		logoKey: text("logo_key"), // S3 key for national team logo
		notes: text("notes"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("national_team_organization_id_idx").on(table.organizationId),
		index("national_team_country_idx").on(table.country),
		uniqueIndex("national_team_org_country_category_unique").on(
			table.organizationId,
			table.country,
			table.category,
		),
	],
);

// ============================================================================
// COACH TABLE
// ============================================================================

/**
 * Coach table - stores coaches for an organization
 * Each coach is linked to a user account in the platform
 */
export const coachTable = pgTable(
	"coach",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),
		// Linked user account
		userId: uuid("user_id").references(() => userTable.id, {
			onDelete: "set null",
		}),
		// Coach details
		phone: text("phone"),
		birthDate: timestamp("birth_date", { withTimezone: true }),
		sport: text("sport", {
			enum: enumToPgEnum(AthleteSport),
		}).$type<AthleteSport>(),
		specialty: text("specialty").notNull(),
		bio: text("bio"),
		// Social media profiles
		socialInstagram: text("social_instagram"),
		socialTwitter: text("social_twitter"),
		socialTiktok: text("social_tiktok"),
		socialLinkedin: text("social_linkedin"),
		socialFacebook: text("social_facebook"),
		coverPhotoKey: text("cover_photo_key"), // S3 key for cover/banner image
		// Public profile settings
		isPublicProfile: boolean("is_public_profile").notNull().default(false),
		opportunityTypes: jsonb("opportunity_types")
			.$type<string[]>()
			.notNull()
			.default([]),
		status: text("status", { enum: enumToPgEnum(CoachStatus) })
			.$type<CoachStatus>()
			.notNull()
			.default(CoachStatus.active),
		// Timestamps
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
		// Archive timestamp - when set, the coach is archived (soft delete)
		archivedAt: timestamp("archived_at", { withTimezone: true }),
	},
	(table) => [
		index("coach_organization_id_idx").on(table.organizationId),
		index("coach_user_id_idx").on(table.userId),
		index("coach_status_idx").on(table.status),
		index("coach_created_at_idx").on(table.createdAt),
		index("coach_archived_at_idx").on(table.archivedAt),
		index("coach_is_public_profile_idx").on(table.isPublicProfile),
		// Composite index for common query: coaches by organization and status
		index("coach_org_status_idx").on(table.organizationId, table.status),
		// Unique constraint: one coach per user per organization
		uniqueIndex("coach_org_user_unique").on(table.organizationId, table.userId),
	],
);

// ============================================================================
// COACH SPORTS EXPERIENCE TABLE
// ============================================================================

/**
 * Coach sports experience - tracks coaching history at different clubs/institutions
 */
export const coachSportsExperienceTable = pgTable(
	"coach_sports_experience",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		coachId: uuid("coach_id")
			.notNull()
			.references(() => coachTable.id, { onDelete: "cascade" }),
		// Either clubId OR nationalTeamId should be set, not both
		clubId: uuid("club_id").references(() => clubTable.id, {
			onDelete: "set null",
		}),
		nationalTeamId: uuid("national_team_id").references(
			() => nationalTeamTable.id,
			{ onDelete: "set null" },
		),
		role: text("role").notNull(), // Position/Role (e.g., "Head Coach", "Assistant")
		sport: text("sport", {
			enum: enumToPgEnum(AthleteSport),
		}).$type<AthleteSport>(),
		level: text("level", {
			enum: enumToPgEnum(CoachExperienceLevel),
		}).$type<CoachExperienceLevel>(),
		startDate: timestamp("start_date", { withTimezone: true }),
		endDate: timestamp("end_date", { withTimezone: true }),
		achievements: text("achievements"), // Titles, awards, etc.
		description: text("description"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("coach_sports_experience_coach_id_idx").on(table.coachId),
		index("coach_sports_experience_club_id_idx").on(table.clubId),
		index("coach_sports_experience_national_team_id_idx").on(
			table.nationalTeamId,
		),
		index("coach_sports_experience_start_date_idx").on(table.startDate),
		// Composite index for timeline queries
		index("coach_sports_experience_coach_dates_idx").on(
			table.coachId,
			table.startDate,
			table.endDate,
		),
	],
);

// ============================================================================
// COACH ACHIEVEMENT TABLE
// ============================================================================

/**
 * Stores achievements and honors for coaches
 * e.g., championships won, awards, recognitions
 */
export const coachAchievementTable = pgTable(
	"coach_achievement",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		coachId: uuid("coach_id")
			.notNull()
			.references(() => coachTable.id, { onDelete: "cascade" }),
		// Achievement info
		title: text("title").notNull(), // e.g., "Campeón Liga Nacional"
		type: text("type", { enum: enumToPgEnum(AchievementType) })
			.$type<AchievementType>()
			.notNull(),
		scope: text("scope", { enum: enumToPgEnum(AchievementScope) })
			.$type<AchievementScope>()
			.notNull(),
		// Context
		year: integer("year").notNull(), // Year of the achievement
		organization: text("organization"), // e.g., "Liga Nacional de Fútbol"
		team: text("team"), // Team/club if collective achievement
		competition: text("competition"), // e.g., "Copa América Sub-20"
		position: text("position"), // e.g., "1er lugar", "Medalla de Oro"
		// Additional details
		description: text("description"), // Longer description of the achievement
		// Display settings
		isPublic: boolean("is_public").notNull().default(true),
		displayOrder: integer("display_order").notNull().default(0),
		// Timestamps
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("coach_achievement_coach_id_idx").on(table.coachId),
		index("coach_achievement_year_idx").on(table.year),
		index("coach_achievement_type_idx").on(table.type),
		index("coach_achievement_is_public_idx").on(table.isPublic),
		// Composite index for timeline queries
		index("coach_achievement_coach_year_idx").on(table.coachId, table.year),
	],
);

// ============================================================================
// COACH EDUCATION TABLE
// ============================================================================

/**
 * Coach education table - stores educational background for coaches
 * Similar to athleteEducationTable but for coaches
 */
export const coachEducationTable = pgTable(
	"coach_education",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		coachId: uuid("coach_id")
			.notNull()
			.references(() => coachTable.id, { onDelete: "cascade" }),
		institution: varchar("institution", { length: 200 }).notNull(),
		degree: varchar("degree", { length: 100 }),
		fieldOfStudy: varchar("field_of_study", { length: 100 }),
		academicYear: varchar("academic_year", { length: 50 }),
		startDate: timestamp("start_date", { withTimezone: true }),
		endDate: timestamp("end_date", { withTimezone: true }),
		expectedGraduationDate: timestamp("expected_graduation_date", {
			withTimezone: true,
		}),
		gpa: numeric("gpa", { precision: 3, scale: 2 }),
		isCurrent: boolean("is_current").notNull().default(false),
		notes: text("notes"),
		displayOrder: integer("display_order").notNull().default(0),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("coach_education_coach_id_idx").on(table.coachId),
		index("coach_education_display_order_idx").on(
			table.coachId,
			table.displayOrder,
		),
	],
);

// ============================================================================
// COACH LANGUAGE TABLE
// ============================================================================

/**
 * Coach language table - stores languages spoken by coaches
 * Used for matching coaches with athletes/teams that speak specific languages
 */
export const coachLanguageTable = pgTable(
	"coach_language",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		coachId: uuid("coach_id")
			.notNull()
			.references(() => coachTable.id, { onDelete: "cascade" }),
		language: text("language").notNull(), // ISO 639-1 code (e.g., "es", "en", "pt")
		level: text("level", { enum: enumToPgEnum(LanguageProficiencyLevel) })
			.$type<LanguageProficiencyLevel>()
			.notNull(),
		notes: text("notes"), // Additional notes (e.g., "regional dialect")
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("coach_language_coach_id_idx").on(table.coachId),
		index("coach_language_language_idx").on(table.language),
		// Unique constraint: one entry per language per coach
		uniqueIndex("coach_language_coach_lang_unique").on(
			table.coachId,
			table.language,
		),
	],
);

// ============================================================================
// COACH REFERENCE TABLE
// ============================================================================

/**
 * Coach reference table - professional references for coaches
 * Used to display testimonials and verify professional background
 */
export const coachReferenceTable = pgTable(
	"coach_reference",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		coachId: uuid("coach_id")
			.notNull()
			.references(() => coachTable.id, { onDelete: "cascade" }),
		// Reference person info
		name: text("name").notNull(),
		relationship: text("relationship").notNull(), // e.g., "Director", "Athlete", "Colleague"
		organization: text("organization"), // Where they work/worked together
		position: text("position"), // Their current position/title
		// Contact info (optional)
		email: text("email"),
		phone: text("phone"),
		// Reference content
		testimonial: text("testimonial"), // Quote/testimonial from the reference
		skillsHighlighted: jsonb("skills_highlighted")
			.$type<string[]>()
			.default([]),
		// Verification
		isVerified: boolean("is_verified").notNull().default(false),
		verifiedAt: timestamp("verified_at", { withTimezone: true }),
		// Display settings
		isPublic: boolean("is_public").notNull().default(true),
		displayOrder: integer("display_order").notNull().default(0),
		// Timestamps
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("coach_reference_coach_id_idx").on(table.coachId),
		index("coach_reference_is_public_idx").on(table.isPublic),
	],
);

// ============================================================================
// ATHLETE TABLE
// ============================================================================

/**
 * Athlete table - stores athletes for an organization
 * Each athlete is linked to a user account in the platform
 */
export const athleteTable = pgTable(
	"athlete",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		// Organization is optional - athletes can register publicly without an organization
		// and be assigned to one later
		organizationId: uuid("organization_id").references(
			() => organizationTable.id,
			{ onDelete: "cascade" },
		),
		// Linked user account
		userId: uuid("user_id").references(() => userTable.id, {
			onDelete: "set null",
		}),
		// Athlete details
		sport: text("sport").notNull(),
		birthDate: timestamp("birth_date", { withTimezone: true }),
		level: text("level", { enum: enumToPgEnum(AthleteLevel) })
			.$type<AthleteLevel>()
			.notNull()
			.default(AthleteLevel.beginner),
		status: text("status", { enum: enumToPgEnum(AthleteStatus) })
			.$type<AthleteStatus>()
			.notNull()
			.default(AthleteStatus.active),

		// Physical attributes
		height: integer("height"), // Height in centimeters
		weight: integer("weight"), // Weight in grams (e.g., 72500 = 72.5kg)
		dominantFoot: text("dominant_foot", {
			enum: enumToPgEnum(DominantSide),
		}).$type<DominantSide>(),
		dominantHand: text("dominant_hand", {
			enum: enumToPgEnum(DominantSide),
		}).$type<DominantSide>(),
		wingspan: integer("wingspan"), // Wingspan in centimeters
		standingReach: integer("standing_reach"), // Standing reach in centimeters

		// Contact information
		phone: text("phone"), // Phone number in E.164 format for SMS/WhatsApp notifications

		// Club and national team information
		currentClubId: uuid("current_club_id").references(() => clubTable.id, {
			onDelete: "set null",
		}),
		currentNationalTeamId: uuid("current_national_team_id").references(
			() => nationalTeamTable.id,
			{ onDelete: "set null" },
		),
		category: text("category"), // Age category or division (e.g., "Sub-17", "Primera")

		// Profile information
		nationality: text("nationality"),
		position: text("position"), // Primary position (varies by sport)
		secondaryPosition: text("secondary_position"),
		jerseyNumber: integer("jersey_number"),
		profilePhotoUrl: text("profile_photo_url"),
		bio: text("bio"), // Scout notes or player bio
		yearsOfExperience: integer("years_of_experience"),

		// Parent/Guardian contact (required for minors under 18)
		parentName: text("parent_name"),
		parentPhone: text("parent_phone"), // E.164 format
		parentEmail: text("parent_email"),
		parentRelationship: text("parent_relationship"), // "mother", "father", "guardian", etc.

		// Legal consents
		parentalConsentAt: timestamp("parental_consent_at", { withTimezone: true }), // When parental consent was given (for minors)
		termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }), // When terms & conditions were accepted
		medicalFitnessConfirmedAt: timestamp("medical_fitness_confirmed_at", {
			withTimezone: true,
		}), // When medical fitness was confirmed

		// Medical fitness certificate (special document - must show if exists or not)
		medicalCertificateKey: text("medical_certificate_key"), // S3 key for medical fitness certificate
		medicalCertificateUploadedAt: timestamp("medical_certificate_uploaded_at", {
			withTimezone: true,
		}),
		medicalCertificateExpiresAt: timestamp("medical_certificate_expires_at", {
			withTimezone: true,
		}), // Optional expiration

		// Extended profile - YouTube videos for highlight plays
		youtubeVideos: jsonb("youtube_videos").$type<string[]>().default([]),

		// Social media links
		socialInstagram: text("social_instagram"), // Instagram username
		socialTwitter: text("social_twitter"), // Twitter/X username
		socialTiktok: text("social_tiktok"), // TikTok username
		socialLinkedin: text("social_linkedin"), // LinkedIn profile URL
		socialFacebook: text("social_facebook"), // Facebook profile URL

		// Cover photo for public profile
		coverPhotoKey: text("cover_photo_key"), // S3 key for cover/banner image

		// Education information (for student athletes)
		educationInstitution: text("education_institution"), // School/University name
		educationYear: text("education_year"), // Academic year (e.g., "5to año", "Freshman")
		expectedGraduationDate: timestamp("expected_graduation_date", {
			withTimezone: true,
		}),
		gpa: numeric("gpa", { precision: 4, scale: 2 }), // Grade point average (0-10 scale)

		// Health & dietary information
		dietaryRestrictions: text("dietary_restrictions"), // Vegetarian, vegan, gluten-free, etc.
		allergies: text("allergies"), // Food and medical allergies

		// Residence information
		residenceCity: text("residence_city"),
		residenceCountry: text("residence_country"),

		// Public profile settings (athlete-controlled)
		isPublicProfile: boolean("is_public_profile").notNull().default(false),
		opportunityTypes: jsonb("opportunity_types")
			.$type<AthleteOpportunityType[]>()
			.default([]),
		publicProfileEnabledAt: timestamp("public_profile_enabled_at", {
			withTimezone: true,
		}),

		// Timestamps
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
		// Archive timestamp - when set, the athlete is archived (soft delete)
		archivedAt: timestamp("archived_at", { withTimezone: true }),
	},
	(table) => [
		index("athlete_organization_id_idx").on(table.organizationId),
		index("athlete_user_id_idx").on(table.userId),
		index("athlete_sport_idx").on(table.sport),
		index("athlete_level_idx").on(table.level),
		index("athlete_status_idx").on(table.status),
		index("athlete_created_at_idx").on(table.createdAt),
		index("athlete_archived_at_idx").on(table.archivedAt),
		// Composite index for common query: athletes by organization and status
		index("athlete_org_status_idx").on(table.organizationId, table.status),
		// Club and national team indexes
		index("athlete_current_club_id_idx").on(table.currentClubId),
		index("athlete_current_national_team_id_idx").on(
			table.currentNationalTeamId,
		),
		// Public profile indexes
		index("athlete_is_public_profile_idx").on(table.isPublicProfile),
		index("athlete_public_profile_enabled_at_idx").on(
			table.publicProfileEnabledAt,
		),
		// Unique constraint: one athlete per user per organization
		uniqueIndex("athlete_org_user_unique").on(
			table.organizationId,
			table.userId,
		),
	],
);

// ============================================================================
// LOCATION TABLE
// ============================================================================

/**
 * Location table - stores training locations for an organization
 */
export const locationTable = pgTable(
	"location",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		address: text("address"),
		city: text("city"),
		state: text("state"),
		country: text("country"),
		postalCode: text("postal_code"),
		capacity: integer("capacity"),
		notes: text("notes"),
		color: text("color"), // Hex color code for calendar display (e.g., "#3b82f6")
		isActive: boolean("is_active").notNull().default(true),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("location_organization_id_idx").on(table.organizationId),
		index("location_name_idx").on(table.name),
		index("location_is_active_idx").on(table.isActive),
		index("location_org_active_idx").on(table.organizationId, table.isActive),
	],
);

// ============================================================================
// ATHLETE GROUP TABLES
// ============================================================================

/**
 * Athlete group table - stores groups of athletes for an organization
 */
export const athleteGroupTable = pgTable(
	"athlete_group",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		description: text("description"),
		sport: text("sport", {
			enum: enumToPgEnum(AthleteSport),
		}).$type<AthleteSport>(),
		ageCategoryId: uuid("age_category_id"),
		maxCapacity: integer("max_capacity"),
		// Default service for sessions in this group
		serviceId: uuid("service_id"),
		isActive: boolean("is_active").notNull().default(true),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
		// Archive timestamp - when set, the group is archived (soft delete)
		archivedAt: timestamp("archived_at", { withTimezone: true }),
	},
	(table) => [
		index("athlete_group_organization_id_idx").on(table.organizationId),
		index("athlete_group_name_idx").on(table.name),
		index("athlete_group_sport_idx").on(table.sport),
		index("athlete_group_is_active_idx").on(table.isActive),
		index("athlete_group_age_category_id_idx").on(table.ageCategoryId),
		index("athlete_group_service_id_idx").on(table.serviceId),
		index("athlete_group_archived_at_idx").on(table.archivedAt),
		uniqueIndex("athlete_group_org_name_unique").on(
			table.organizationId,
			table.name,
		),
	],
);

/**
 * Athlete group member table - junction table for athletes in groups
 */
export const athleteGroupMemberTable = pgTable(
	"athlete_group_member",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		groupId: uuid("group_id")
			.notNull()
			.references(() => athleteGroupTable.id, { onDelete: "cascade" }),
		athleteId: uuid("athlete_id")
			.notNull()
			.references(() => athleteTable.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("athlete_group_member_group_id_idx").on(table.groupId),
		index("athlete_group_member_athlete_id_idx").on(table.athleteId),
		uniqueIndex("athlete_group_member_unique").on(
			table.groupId,
			table.athleteId,
		),
	],
);

// ============================================================================
// SERVICE TABLES (Training Service Catalog)
// ============================================================================

/**
 * Service table - reusable service catalog for organizations
 * Each service has a name, description, and current price.
 * Price history is tracked in servicePriceHistoryTable.
 */
export const serviceTable = pgTable(
	"service",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),
		// Service details
		name: text("name").notNull(),
		description: text("description"),
		// Current price (denormalized for quick access, in smallest currency unit - centavos)
		currentPrice: integer("current_price").notNull(),
		currency: text("currency").notNull().default("ARS"),
		// Status
		status: text("status", { enum: enumToPgEnum(ServiceStatus) })
			.$type<ServiceStatus>()
			.notNull()
			.default(ServiceStatus.active),
		// Sort order for display
		sortOrder: integer("sort_order").notNull().default(0),
		// Metadata
		createdBy: uuid("created_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("service_organization_id_idx").on(table.organizationId),
		index("service_status_idx").on(table.status),
		index("service_org_status_idx").on(table.organizationId, table.status),
		uniqueIndex("service_org_name_unique").on(table.organizationId, table.name),
	],
);

/**
 * Service price history table - tracks all price changes for audit trail
 * When a service price changes, the old entry gets effectiveUntil set,
 * and a new entry is created with the new price.
 */
export const servicePriceHistoryTable = pgTable(
	"service_price_history",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		serviceId: uuid("service_id")
			.notNull()
			.references(() => serviceTable.id, { onDelete: "cascade" }),
		// Price at this point (in smallest currency unit - centavos)
		price: integer("price").notNull(),
		currency: text("currency").notNull().default("ARS"),
		// When this price became effective
		effectiveFrom: timestamp("effective_from", {
			withTimezone: true,
		}).notNull(),
		// When this price stopped being effective (null = currently active)
		effectiveUntil: timestamp("effective_until", { withTimezone: true }),
		// Who changed the price
		createdBy: uuid("created_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("service_price_history_service_id_idx").on(table.serviceId),
		index("service_price_history_effective_from_idx").on(table.effectiveFrom),
		index("service_price_history_service_effective_idx").on(
			table.serviceId,
			table.effectiveFrom,
		),
	],
);

// ============================================================================
// TRAINING SESSION TABLES
// ============================================================================

/**
 * Training session table - stores training sessions for an organization
 * Supports both single sessions and recurring session templates
 */
export const trainingSessionTable = pgTable(
	"training_session",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),
		// Session details
		title: text("title").notNull(),
		description: text("description"),
		// Date/Time
		startTime: timestamp("start_time", { withTimezone: true }).notNull(),
		endTime: timestamp("end_time", { withTimezone: true }).notNull(),
		// Status
		status: text("status", { enum: enumToPgEnum(TrainingSessionStatus) })
			.$type<TrainingSessionStatus>()
			.notNull()
			.default(TrainingSessionStatus.pending),
		// Location (optional)
		locationId: uuid("location_id").references(() => locationTable.id, {
			onDelete: "set null",
		}),
		// Assignment type - if athleteGroupId is set, it's a group session
		// Otherwise, athletes are individually assigned via junction table
		athleteGroupId: uuid("athlete_group_id").references(
			() => athleteGroupTable.id,
			{ onDelete: "set null" },
		),
		// Service assigned to this session (overrides group default if set)
		serviceId: uuid("service_id").references(() => serviceTable.id, {
			onDelete: "set null",
		}),
		// Price snapshot at time of session creation (for audit trail, in centavos)
		servicePriceAtCreation: integer("service_price_at_creation"),
		// Recurring session support
		isRecurring: boolean("is_recurring").notNull().default(false),
		rrule: text("rrule"), // iCal RRule string for recurrence pattern
		recurringSessionId: uuid("recurring_session_id"), // Self-reference to template
		originalStartTime: timestamp("original_start_time", { withTimezone: true }), // For modified instances
		// Training Content
		objectives: text("objectives"), // Goals for the session
		planning: text("planning"), // What will be done (pre-session)
		postSessionNotes: text("post_session_notes"), // What happened (post-session)
		// Attachment (PDF or image stored in S3)
		attachmentKey: text("attachment_key"), // S3 object key for attached file
		attachmentUploadedAt: timestamp("attachment_uploaded_at", {
			withTimezone: true,
		}),
		// Metadata
		createdBy: uuid("created_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("training_session_organization_id_idx").on(table.organizationId),
		index("training_session_status_idx").on(table.status),
		index("training_session_start_time_idx").on(table.startTime),
		index("training_session_end_time_idx").on(table.endTime),
		index("training_session_location_id_idx").on(table.locationId),
		index("training_session_athlete_group_id_idx").on(table.athleteGroupId),
		index("training_session_service_id_idx").on(table.serviceId),
		index("training_session_recurring_id_idx").on(table.recurringSessionId),
		index("training_session_is_recurring_idx").on(table.isRecurring),
		// Composite indexes for common queries
		index("training_session_org_status_idx").on(
			table.organizationId,
			table.status,
		),
		index("training_session_org_start_idx").on(
			table.organizationId,
			table.startTime,
		),
		index("training_session_org_date_range_idx").on(
			table.organizationId,
			table.startTime,
			table.endTime,
		),
		// Index for filtering by creator (coach sessions)
		index("training_session_org_created_by_idx").on(
			table.organizationId,
			table.createdBy,
		),
		// Check constraint: endTime > startTime
		check(
			"training_session_valid_time_range",
			sql`${table.endTime} > ${table.startTime}`,
		),
	],
);

/**
 * Training session coach table - junction table for coaches assigned to sessions
 */
export const trainingSessionCoachTable = pgTable(
	"training_session_coach",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		sessionId: uuid("session_id")
			.notNull()
			.references(() => trainingSessionTable.id, { onDelete: "cascade" }),
		coachId: uuid("coach_id")
			.notNull()
			.references(() => coachTable.id, { onDelete: "cascade" }),
		isPrimary: boolean("is_primary").notNull().default(false), // Primary coach for the session
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("training_session_coach_session_id_idx").on(table.sessionId),
		index("training_session_coach_coach_id_idx").on(table.coachId),
		uniqueIndex("training_session_coach_unique").on(
			table.sessionId,
			table.coachId,
		),
	],
);

/**
 * Training session athlete table - junction table for athletes assigned to sessions
 */
export const trainingSessionAthleteTable = pgTable(
	"training_session_athlete",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		sessionId: uuid("session_id")
			.notNull()
			.references(() => trainingSessionTable.id, { onDelete: "cascade" }),
		athleteId: uuid("athlete_id")
			.notNull()
			.references(() => athleteTable.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("training_session_athlete_session_id_idx").on(table.sessionId),
		index("training_session_athlete_athlete_id_idx").on(table.athleteId),
		uniqueIndex("training_session_athlete_unique").on(
			table.sessionId,
			table.athleteId,
		),
	],
);

/**
 * Recurring session exception table - stores exceptions for recurring sessions
 * An exception can be a cancelled occurrence or a modified occurrence
 */
export const recurringSessionExceptionTable = pgTable(
	"recurring_session_exception",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		recurringSessionId: uuid("recurring_session_id")
			.notNull()
			.references(() => trainingSessionTable.id, { onDelete: "cascade" }),
		exceptionDate: timestamp("exception_date", {
			withTimezone: true,
		}).notNull(),
		// If replacementSessionId is set, this occurrence was modified (not deleted)
		// If null, this occurrence was cancelled/deleted
		replacementSessionId: uuid("replacement_session_id").references(
			() => trainingSessionTable.id,
			{ onDelete: "set null" },
		),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("recurring_exception_recurring_id_idx").on(table.recurringSessionId),
		index("recurring_exception_date_idx").on(table.exceptionDate),
		uniqueIndex("recurring_exception_unique").on(
			table.recurringSessionId,
			table.exceptionDate,
		),
	],
);

// ============================================================================
// ATTENDANCE TABLE
// ============================================================================

/**
 * Attendance table - tracks athlete attendance for training sessions
 */
export const attendanceTable = pgTable(
	"attendance",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		sessionId: uuid("session_id")
			.notNull()
			.references(() => trainingSessionTable.id, { onDelete: "cascade" }),
		athleteId: uuid("athlete_id")
			.notNull()
			.references(() => athleteTable.id, { onDelete: "cascade" }),
		status: text("status", { enum: enumToPgEnum(AttendanceStatus) })
			.$type<AttendanceStatus>()
			.notNull()
			.default(AttendanceStatus.pending),
		notes: text("notes"),
		checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
		recordedBy: uuid("recorded_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("attendance_session_id_idx").on(table.sessionId),
		index("attendance_athlete_id_idx").on(table.athleteId),
		index("attendance_status_idx").on(table.status),
		uniqueIndex("attendance_session_athlete_unique").on(
			table.sessionId,
			table.athleteId,
		),
	],
);

// ============================================================================
// TRAINING PAYMENT TABLE
// ============================================================================

/**
 * Training payment table - stores payments for training sessions
 * Supports manual payments and future Mercado Pago integration
 */
export const trainingPaymentTable = pgTable(
	"training_payment",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),
		// Payment can be linked to a session, or be standalone (e.g., monthly fee)
		sessionId: uuid("session_id").references(() => trainingSessionTable.id, {
			onDelete: "set null",
		}),
		// Payment can be for a specific athlete or general
		athleteId: uuid("athlete_id").references(() => athleteTable.id, {
			onDelete: "set null",
		}),
		// Payment can be linked to a service directly (when not linked to a session)
		serviceId: uuid("service_id").references(() => serviceTable.id, {
			onDelete: "set null",
		}),
		// Amount in smallest currency unit (cents/centavos)
		amount: integer("amount").notNull(),
		currency: text("currency").notNull().default("ARS"),
		// Status
		status: text("status", { enum: enumToPgEnum(TrainingPaymentStatus) })
			.$type<TrainingPaymentStatus>()
			.notNull()
			.default(TrainingPaymentStatus.pending),
		// Payment method
		paymentMethod: text("payment_method", {
			enum: enumToPgEnum(TrainingPaymentMethod),
		}).$type<TrainingPaymentMethod>(),
		// For partial payments - amount already paid
		paidAmount: integer("paid_amount").notNull().default(0),
		// Discount percentage applied (0-100)
		discountPercentage: integer("discount_percentage").notNull().default(0),
		// Mercado Pago integration (for future use)
		mercadoPagoPaymentId: text("mercado_pago_payment_id"),
		mercadoPagoPreferenceId: text("mercado_pago_preference_id"),
		mercadoPagoStatus: text("mercado_pago_status"),
		// Manual payment tracking
		paymentDate: timestamp("payment_date", { withTimezone: true }),
		receiptNumber: text("receipt_number"),
		notes: text("notes"),
		// Description (e.g., "Monthly training fee - January 2024")
		description: text("description"),
		// Receipt/proof of payment (S3 key)
		receiptImageKey: text("receipt_image_key"),
		// Who recorded this payment
		recordedBy: uuid("recorded_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("training_payment_organization_id_idx").on(table.organizationId),
		index("training_payment_session_id_idx").on(table.sessionId),
		index("training_payment_athlete_id_idx").on(table.athleteId),
		index("training_payment_service_id_idx").on(table.serviceId),
		index("training_payment_status_idx").on(table.status),
		index("training_payment_payment_date_idx").on(table.paymentDate),
		index("training_payment_mercado_pago_id_idx").on(
			table.mercadoPagoPaymentId,
		),
		// Composite for common queries
		index("training_payment_org_status_idx").on(
			table.organizationId,
			table.status,
		),
		index("training_payment_org_athlete_idx").on(
			table.organizationId,
			table.athleteId,
		),
		// Composite index for payment reconciliation
		index("training_payment_org_athlete_date_idx").on(
			table.organizationId,
			table.athleteId,
			table.paymentDate,
		),
		// Unique constraint to prevent duplicate payments per session/athlete
		// Only applies when sessionId is not null
		uniqueIndex("training_payment_session_athlete_unique")
			.on(table.sessionId, table.athleteId)
			.where(sql`${table.sessionId} IS NOT NULL`),
	],
);

// ============================================================================
// TRAINING PAYMENT SESSION TABLE (Junction table for payment packages)
// ============================================================================

/**
 * Training payment session table - links payments to multiple sessions
 * Allows a single payment to cover multiple training sessions (packages)
 */
export const trainingPaymentSessionTable = pgTable(
	"training_payment_session",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		paymentId: uuid("payment_id")
			.notNull()
			.references(() => trainingPaymentTable.id, { onDelete: "cascade" }),
		sessionId: uuid("session_id")
			.notNull()
			.references(() => trainingSessionTable.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("training_payment_session_payment_id_idx").on(table.paymentId),
		index("training_payment_session_session_id_idx").on(table.sessionId),
		// Prevent duplicate payment-session links
		uniqueIndex("training_payment_session_unique").on(
			table.paymentId,
			table.sessionId,
		),
	],
);

// ============================================================================
// ATHLETE EVALUATION TABLE
// ============================================================================

/**
 * Athlete evaluation table - stores evaluations of athletes per training session
 * Includes ratings (1-5) and notes for performance, attitude, and physical fitness
 */
export const athleteEvaluationTable = pgTable(
	"athlete_evaluation",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		sessionId: uuid("session_id")
			.notNull()
			.references(() => trainingSessionTable.id, { onDelete: "cascade" }),
		athleteId: uuid("athlete_id")
			.notNull()
			.references(() => athleteTable.id, { onDelete: "cascade" }),
		// Ratings (1-5 scale)
		performanceRating: integer("performance_rating"),
		attitudeRating: integer("attitude_rating"),
		physicalFitnessRating: integer("physical_fitness_rating"),
		// Notes for each category
		performanceNotes: text("performance_notes"),
		attitudeNotes: text("attitude_notes"),
		physicalFitnessNotes: text("physical_fitness_notes"),
		// General notes
		generalNotes: text("general_notes"),
		// Who evaluated
		evaluatedBy: uuid("evaluated_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("athlete_evaluation_session_id_idx").on(table.sessionId),
		index("athlete_evaluation_athlete_id_idx").on(table.athleteId),
		index("athlete_evaluation_evaluated_by_idx").on(table.evaluatedBy),
		// Composite index for coach evaluation history queries
		index("athlete_evaluation_evaluator_created_idx").on(
			table.evaluatedBy,
			table.createdAt,
		),
		// Composite index for athlete evaluation history queries
		index("athlete_evaluation_athlete_created_idx").on(
			table.athleteId,
			table.createdAt,
		),
		uniqueIndex("athlete_evaluation_session_athlete_unique").on(
			table.sessionId,
			table.athleteId,
		),
		// Check constraints for valid ratings (1-5)
		check(
			"athlete_evaluation_performance_rating_check",
			sql`${table.performanceRating} IS NULL OR (${table.performanceRating} >= 1 AND ${table.performanceRating} <= 5)`,
		),
		check(
			"athlete_evaluation_attitude_rating_check",
			sql`${table.attitudeRating} IS NULL OR (${table.attitudeRating} >= 1 AND ${table.attitudeRating} <= 5)`,
		),
		check(
			"athlete_evaluation_fitness_rating_check",
			sql`${table.physicalFitnessRating} IS NULL OR (${table.physicalFitnessRating} >= 1 AND ${table.physicalFitnessRating} <= 5)`,
		),
	],
);

// ============================================================================
// ATHLETE PHYSICAL METRICS TABLE
// ============================================================================

/**
 * Athlete physical metrics - tracks body measurements over time
 * Allows tracking changes in height, weight, body composition, etc.
 */
export const athletePhysicalMetricsTable = pgTable(
	"athlete_physical_metrics",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		athleteId: uuid("athlete_id")
			.notNull()
			.references(() => athleteTable.id, { onDelete: "cascade" }),
		measuredAt: timestamp("measured_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		// Basic measurements
		height: integer("height"), // Height in centimeters
		weight: integer("weight"), // Weight in grams (e.g., 72500 = 72.5kg)
		// Body composition
		bodyFatPercentage: integer("body_fat_percentage"), // Stored as x10 (e.g., 125 = 12.5%)
		muscleMass: integer("muscle_mass"), // In grams
		// Reach measurements
		wingspan: integer("wingspan"), // In centimeters
		standingReach: integer("standing_reach"), // In centimeters
		// Notes
		notes: text("notes"),
		// Who recorded
		recordedBy: uuid("recorded_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("athlete_physical_metrics_athlete_id_idx").on(table.athleteId),
		index("athlete_physical_metrics_measured_at_idx").on(table.measuredAt),
	],
);

// ============================================================================
// ATHLETE FITNESS TEST TABLE
// ============================================================================

/**
 * Athlete fitness test - stores results of physical performance tests
 * Supports various test types (sprints, jumps, endurance tests, etc.)
 */
export const athleteFitnessTestTable = pgTable(
	"athlete_fitness_test",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		athleteId: uuid("athlete_id")
			.notNull()
			.references(() => athleteTable.id, { onDelete: "cascade" }),
		testDate: timestamp("test_date", { withTimezone: true })
			.notNull()
			.defaultNow(),
		testType: text("test_type", { enum: enumToPgEnum(FitnessTestType) })
			.$type<FitnessTestType>()
			.notNull(),
		// Result stored as integer for flexibility (interpretation depends on test type)
		// e.g., sprint: milliseconds, jump: millimeters, yo-yo: level x 10
		result: integer("result").notNull(),
		unit: text("unit").notNull(), // "seconds", "milliseconds", "cm", "level", "reps", etc.
		notes: text("notes"),
		// Who evaluated
		evaluatedBy: uuid("evaluated_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("athlete_fitness_test_athlete_id_idx").on(table.athleteId),
		index("athlete_fitness_test_test_date_idx").on(table.testDate),
		index("athlete_fitness_test_test_type_idx").on(table.testType),
		// Composite index for querying tests by athlete and type
		index("athlete_fitness_test_athlete_type_idx").on(
			table.athleteId,
			table.testType,
		),
	],
);

// ============================================================================
// ATHLETE CAREER HISTORY TABLE
// ============================================================================

/**
 * Athlete career history - tracks previous clubs, teams, and achievements
 */
export const athleteCareerHistoryTable = pgTable(
	"athlete_career_history",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		athleteId: uuid("athlete_id")
			.notNull()
			.references(() => athleteTable.id, { onDelete: "cascade" }),
		// Either clubId OR nationalTeamId should be set, not both
		clubId: uuid("club_id").references(() => clubTable.id, {
			onDelete: "set null",
		}),
		nationalTeamId: uuid("national_team_id").references(
			() => nationalTeamTable.id,
			{ onDelete: "set null" },
		),
		startDate: timestamp("start_date", { withTimezone: true }),
		endDate: timestamp("end_date", { withTimezone: true }),
		position: text("position"),
		achievements: text("achievements"), // Can store JSON or comma-separated list
		notes: text("notes"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("athlete_career_history_athlete_id_idx").on(table.athleteId),
		index("athlete_career_history_club_id_idx").on(table.clubId),
		index("athlete_career_history_national_team_id_idx").on(
			table.nationalTeamId,
		),
		index("athlete_career_history_start_date_idx").on(table.startDate),
		// Composite index for timeline queries
		index("athlete_career_history_athlete_dates_idx").on(
			table.athleteId,
			table.startDate,
			table.endDate,
		),
	],
);

// ============================================================================
// ATHLETE LANGUAGE TABLE
// ============================================================================

/**
 * Athlete languages - tracks languages spoken by an athlete and proficiency level
 */
export const athleteLanguageTable = pgTable(
	"athlete_language",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		athleteId: uuid("athlete_id")
			.notNull()
			.references(() => athleteTable.id, { onDelete: "cascade" }),
		language: text("language").notNull(), // ISO 639-1 code (e.g., "es", "en", "pt")
		level: text("level", { enum: enumToPgEnum(LanguageProficiencyLevel) })
			.$type<LanguageProficiencyLevel>()
			.notNull(),
		notes: text("notes"), // Additional notes (e.g., "regional dialect")
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("athlete_language_athlete_id_idx").on(table.athleteId),
		index("athlete_language_language_idx").on(table.language),
		// Unique constraint: one entry per language per athlete
		uniqueIndex("athlete_language_athlete_lang_unique").on(
			table.athleteId,
			table.language,
		),
	],
);

// ============================================================================
// ATHLETE EDUCATION TABLE
// ============================================================================

/**
 * Athlete education - tracks educational history for student athletes
 * Allows multiple education entries (e.g., high school, university)
 */
export const athleteEducationTable = pgTable(
	"athlete_education",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		athleteId: uuid("athlete_id")
			.notNull()
			.references(() => athleteTable.id, { onDelete: "cascade" }),
		institution: varchar("institution", { length: 200 }).notNull(),
		degree: varchar("degree", { length: 100 }),
		fieldOfStudy: varchar("field_of_study", { length: 100 }),
		academicYear: varchar("academic_year", { length: 50 }),
		startDate: timestamp("start_date", { withTimezone: true }),
		endDate: timestamp("end_date", { withTimezone: true }),
		expectedGraduationDate: timestamp("expected_graduation_date", {
			withTimezone: true,
		}),
		gpa: numeric("gpa", { precision: 3, scale: 2 }),
		isCurrent: boolean("is_current").notNull().default(false),
		notes: text("notes"),
		displayOrder: integer("display_order").notNull().default(0),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("athlete_education_athlete_id_idx").on(table.athleteId),
		index("athlete_education_display_order_idx").on(
			table.athleteId,
			table.displayOrder,
		),
	],
);

// ============================================================================
// ATHLETE REFERENCE TABLE
// ============================================================================

/**
 * Athlete references - professional/personal references for public profiles
 * Allows athletes to showcase testimonials from coaches, managers, teachers, etc.
 */
export const athleteReferenceTable = pgTable(
	"athlete_reference",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		athleteId: uuid("athlete_id")
			.notNull()
			.references(() => athleteTable.id, { onDelete: "cascade" }),
		// Reference person info
		name: text("name").notNull(),
		relationship: text("relationship").notNull(), // e.g., "Coach", "Manager", "Teacher"
		organization: text("organization"), // Where they work/worked together
		position: text("position"), // Their current position/title
		// Contact info (optional)
		email: text("email"),
		phone: text("phone"),
		// Reference content
		testimonial: text("testimonial"), // Quote/testimonial from the reference
		skillsHighlighted: jsonb("skills_highlighted")
			.$type<string[]>()
			.default([]),
		// Verification
		isVerified: boolean("is_verified").notNull().default(false),
		verifiedAt: timestamp("verified_at", { withTimezone: true }),
		// Display settings
		isPublic: boolean("is_public").notNull().default(true),
		displayOrder: integer("display_order").notNull().default(0),
		// Timestamps
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("athlete_reference_athlete_id_idx").on(table.athleteId),
		index("athlete_reference_is_public_idx").on(table.isPublic),
	],
);

// ============================================================================
// ATHLETE SPONSOR TABLE
// ============================================================================

/**
 * Athlete sponsors - personal sponsorships and brand partnerships
 * Allows athletes to showcase their brand deals in their public profile
 */
export const athleteSponsorTable = pgTable(
	"athlete_sponsor",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		athleteId: uuid("athlete_id")
			.notNull()
			.references(() => athleteTable.id, { onDelete: "cascade" }),
		// Sponsor/Brand info
		name: text("name").notNull(),
		logoKey: text("logo_key"), // S3 key for logo
		website: text("website"), // Brand website URL
		description: text("description"), // Brief description of the partnership
		// Partnership details
		partnershipType: text("partnership_type"), // e.g., "equipment", "apparel", "nutrition", "financial"
		startDate: timestamp("start_date", { withTimezone: true }),
		endDate: timestamp("end_date", { withTimezone: true }), // NULL if ongoing
		// Display settings
		isPublic: boolean("is_public").notNull().default(true),
		displayOrder: integer("display_order").notNull().default(0),
		// Timestamps
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("athlete_sponsor_athlete_id_idx").on(table.athleteId),
		index("athlete_sponsor_is_public_idx").on(table.isPublic),
	],
);

// ============================================================================
// ATHLETE ACHIEVEMENT TABLE
// ============================================================================

/**
 * Athlete achievements - palmarés and sports accomplishments
 * Tracks individual and collective achievements, awards, titles, etc.
 */
export const athleteAchievementTable = pgTable(
	"athlete_achievement",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		athleteId: uuid("athlete_id")
			.notNull()
			.references(() => athleteTable.id, { onDelete: "cascade" }),
		// Achievement info
		title: text("title").notNull(), // e.g., "Campeón Liga Nacional"
		type: text("type", { enum: enumToPgEnum(AchievementType) })
			.$type<AchievementType>()
			.notNull(),
		scope: text("scope", { enum: enumToPgEnum(AchievementScope) })
			.$type<AchievementScope>()
			.notNull(),
		// Context
		year: integer("year").notNull(), // Year of the achievement
		organization: text("organization"), // e.g., "Liga Nacional de Fútbol"
		team: text("team"), // Team/club if collective achievement
		competition: text("competition"), // e.g., "Copa América Sub-20"
		position: text("position"), // e.g., "1er lugar", "Medalla de Oro"
		// Additional details
		description: text("description"), // Longer description of the achievement
		// Display settings
		isPublic: boolean("is_public").notNull().default(true),
		displayOrder: integer("display_order").notNull().default(0),
		// Timestamps
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("athlete_achievement_athlete_id_idx").on(table.athleteId),
		index("athlete_achievement_year_idx").on(table.year),
		index("athlete_achievement_type_idx").on(table.type),
		index("athlete_achievement_is_public_idx").on(table.isPublic),
		// Composite index for timeline queries
		index("athlete_achievement_athlete_year_idx").on(
			table.athleteId,
			table.year,
		),
	],
);

// ============================================================================
// ATHLETE MEDICAL DOCUMENTS TABLE
// ============================================================================

/**
 * Athlete medical documents - stores medical studies and reports (not fitness certificate)
 * The fitness certificate is stored in the athlete table itself as a special field
 * This table is for additional medical documents like blood tests, x-rays, etc.
 */
export const athleteMedicalDocumentTable = pgTable(
	"athlete_medical_document",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		athleteId: uuid("athlete_id")
			.notNull()
			.references(() => athleteTable.id, { onDelete: "cascade" }),
		// Document type
		documentType: text("document_type", {
			enum: enumToPgEnum(AthleteMedicalDocumentType),
		})
			.$type<AthleteMedicalDocumentType>()
			.notNull(),
		// Document details
		title: text("title").notNull(), // User-friendly name
		description: text("description"),
		// S3 storage
		fileKey: text("file_key").notNull(), // S3 key
		fileName: text("file_name").notNull(), // Original file name
		fileSize: integer("file_size"), // File size in bytes
		mimeType: text("mime_type"),
		// Document dates
		documentDate: timestamp("document_date", { withTimezone: true }), // When the study was performed
		expiresAt: timestamp("expires_at", { withTimezone: true }), // Optional expiration
		// Medical professional info
		doctorName: text("doctor_name"),
		medicalInstitution: text("medical_institution"),
		// Notes
		notes: text("notes"),
		// Audit
		uploadedBy: uuid("uploaded_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("athlete_medical_document_athlete_id_idx").on(table.athleteId),
		index("athlete_medical_document_type_idx").on(table.documentType),
		index("athlete_medical_document_date_idx").on(table.documentDate),
		// Composite for querying documents by athlete and type
		index("athlete_medical_document_athlete_type_idx").on(
			table.athleteId,
			table.documentType,
		),
	],
);

// ============================================================================
// ATHLETE WELLNESS SURVEY TABLE
// ============================================================================

/**
 * Daily wellness surveys for athletes to track their physical and mental state
 * Athletes fill this out daily to monitor recovery, fatigue, and readiness
 */
export const athleteWellnessSurveyTable = pgTable(
	"athlete_wellness_survey",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		athleteId: uuid("athlete_id")
			.notNull()
			.references(() => athleteTable.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),
		surveyDate: timestamp("survey_date", { withTimezone: true })
			.notNull()
			.defaultNow(),
		// Sleep metrics
		sleepHours: integer("sleep_hours").notNull(), // stored as minutes (e.g., 480 = 8 hours)
		sleepQuality: integer("sleep_quality").notNull(), // 1-10 scale
		// Physical state
		fatigue: integer("fatigue").notNull(), // 1-10 (1=fresh, 10=exhausted)
		muscleSoreness: integer("muscle_soreness").notNull(), // 1-10
		energy: integer("energy").notNull(), // 1-10
		// Mental state
		mood: integer("mood").notNull(), // 1-10
		stressLevel: integer("stress_level").notNull(), // 1-10
		// Optional notes
		notes: text("notes"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("athlete_wellness_athlete_id_idx").on(table.athleteId),
		index("athlete_wellness_survey_date_idx").on(table.surveyDate),
		index("athlete_wellness_org_date_idx").on(
			table.organizationId,
			table.surveyDate,
		),
		// Composite index for athlete timeline queries
		index("athlete_wellness_athlete_date_idx").on(
			table.athleteId,
			table.surveyDate,
		),
	],
);

// ============================================================================
// ATHLETE SESSION FEEDBACK TABLE
// ============================================================================

/**
 * Athlete session feedback - stores RPE (Rating of Perceived Exertion) and satisfaction
 * Athletes fill this out after training sessions to track perceived effort
 */
export const athleteSessionFeedbackTable = pgTable(
	"athlete_session_feedback",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		sessionId: uuid("session_id")
			.notNull()
			.references(() => trainingSessionTable.id, { onDelete: "cascade" }),
		athleteId: uuid("athlete_id")
			.notNull()
			.references(() => athleteTable.id, { onDelete: "cascade" }),
		// RPE Rating (1-10 Borg CR10 scale) - Only fillable when session is completed or date passed
		rpeRating: integer("rpe_rating"),
		// Satisfaction Rating (1-10) - Can be filled anytime
		satisfactionRating: integer("satisfaction_rating"),
		// Optional notes
		notes: text("notes"),
		// Timestamps
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("athlete_session_feedback_session_id_idx").on(table.sessionId),
		index("athlete_session_feedback_athlete_id_idx").on(table.athleteId),
		// Unique constraint: one feedback per athlete per session
		uniqueIndex("athlete_session_feedback_session_athlete_unique").on(
			table.sessionId,
			table.athleteId,
		),
		// Check constraints for valid ratings (1-10)
		check(
			"athlete_session_feedback_rpe_rating_check",
			sql`${table.rpeRating} IS NULL OR (${table.rpeRating} >= 1 AND ${table.rpeRating} <= 10)`,
		),
		check(
			"athlete_session_feedback_satisfaction_rating_check",
			sql`${table.satisfactionRating} IS NULL OR (${table.satisfactionRating} >= 1 AND ${table.satisfactionRating} <= 10)`,
		),
	],
);

// ============================================================================
// SPORTS EVENTS TABLES
// ============================================================================

/**
 * Age category table - configurable age categories per organization
 * Examples: Sub-12, Sub-15, Sub-18, Adultos
 */
export const ageCategoryTable = pgTable(
	"age_category",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),
		name: text("name").notNull(), // e.g., "Sub-12", "2012"
		displayName: text("display_name").notNull(), // e.g., "Nacidos en 2012"
		minBirthYear: integer("min_birth_year"), // Minimum birth year (inclusive), e.g., 2012
		maxBirthYear: integer("max_birth_year"), // Maximum birth year (inclusive), e.g., 2014
		isActive: boolean("is_active").notNull().default(true),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("age_category_organization_id_idx").on(table.organizationId),
		index("age_category_is_active_idx").on(table.isActive),
		uniqueIndex("age_category_org_name_unique").on(
			table.organizationId,
			table.name,
		),
	],
);

/**
 * Sports event table - main event entity
 * Supports campus, camps, clinics, showcases, etc.
 */
export const sportsEventTable = pgTable(
	"sports_event",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),

		// Basic info
		title: text("title").notNull(),
		slug: text("slug").notNull(), // URL-friendly slug for public pages
		description: text("description"),
		eventType: text("event_type", { enum: enumToPgEnum(EventType) })
			.$type<EventType>()
			.notNull()
			.default(EventType.campus),
		status: text("status", { enum: enumToPgEnum(EventStatus) })
			.$type<EventStatus>()
			.notNull()
			.default(EventStatus.draft),

		// Dates
		startDate: timestamp("start_date", { withTimezone: true }).notNull(),
		endDate: timestamp("end_date", { withTimezone: true }).notNull(),
		registrationOpenDate: timestamp("registration_open_date", {
			withTimezone: true,
		}),
		registrationCloseDate: timestamp("registration_close_date", {
			withTimezone: true,
		}),

		// Location
		locationId: uuid("location_id").references(() => locationTable.id, {
			onDelete: "set null",
		}),
		venueDetails: text("venue_details"), // Additional venue info

		// Capacity
		maxCapacity: integer("max_capacity"), // Total spots available
		currentRegistrations: integer("current_registrations").notNull().default(0),
		enableWaitlist: boolean("enable_waitlist").notNull().default(true),
		maxWaitlistSize: integer("max_waitlist_size"), // null = unlimited

		// Registration options
		allowPublicRegistration: boolean("allow_public_registration")
			.notNull()
			.default(true),
		allowEarlyAccessForMembers: boolean("allow_early_access_for_members")
			.notNull()
			.default(false),
		memberEarlyAccessDays: integer("member_early_access_days").default(7),
		requiresApproval: boolean("requires_approval").notNull().default(false),

		// Payment settings
		currency: text("currency").notNull().default("ARS"),
		acceptedPaymentMethods: text("accepted_payment_methods"), // JSON array of EventPaymentMethod

		// Contact info for public registration
		contactEmail: text("contact_email"),
		contactPhone: text("contact_phone"),

		// Media
		coverImageUrl: text("cover_image_url"),

		// Metadata
		createdBy: uuid("created_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("sports_event_organization_id_idx").on(table.organizationId),
		index("sports_event_status_idx").on(table.status),
		index("sports_event_event_type_idx").on(table.eventType),
		index("sports_event_start_date_idx").on(table.startDate),
		index("sports_event_end_date_idx").on(table.endDate),
		index("sports_event_location_id_idx").on(table.locationId),
		uniqueIndex("sports_event_org_slug_unique").on(
			table.organizationId,
			table.slug,
		),
		// Composite for common queries
		index("sports_event_org_status_idx").on(table.organizationId, table.status),
		index("sports_event_org_date_range_idx").on(
			table.organizationId,
			table.startDate,
			table.endDate,
		),
		// Check constraint: endDate >= startDate
		check(
			"sports_event_valid_date_range",
			sql`${table.endDate} >= ${table.startDate}`,
		),
	],
);

/**
 * Event age categories - links events to targeted age categories
 */
export const eventAgeCategoryTable = pgTable(
	"event_age_category",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		eventId: uuid("event_id")
			.notNull()
			.references(() => sportsEventTable.id, { onDelete: "cascade" }),
		ageCategoryId: uuid("age_category_id")
			.notNull()
			.references(() => ageCategoryTable.id, { onDelete: "cascade" }),
		// Optional capacity limit per age category
		maxCapacity: integer("max_capacity"),
		currentRegistrations: integer("current_registrations").notNull().default(0),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("event_age_category_event_id_idx").on(table.eventId),
		index("event_age_category_age_category_id_idx").on(table.ageCategoryId),
		uniqueIndex("event_age_category_unique").on(
			table.eventId,
			table.ageCategoryId,
		),
	],
);

/**
 * Event pricing tier table - supports both date-based and capacity-based tiers
 * Tiers can stack/combine for complex pricing scenarios
 */
export const eventPricingTierTable = pgTable(
	"event_pricing_tier",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		eventId: uuid("event_id")
			.notNull()
			.references(() => sportsEventTable.id, { onDelete: "cascade" }),

		// Tier identification
		name: text("name").notNull(), // e.g., "Early Bird", "First 50 spots"
		description: text("description"),
		tierType: text("tier_type", { enum: enumToPgEnum(PricingTierType) })
			.$type<PricingTierType>()
			.notNull(),

		// Pricing
		price: integer("price").notNull(), // Amount in smallest currency unit (centavos)
		currency: text("currency").notNull().default("ARS"),

		// Date-based tier conditions
		validFrom: timestamp("valid_from", { withTimezone: true }),
		validUntil: timestamp("valid_until", { withTimezone: true }),

		// Capacity-based tier conditions
		capacityStart: integer("capacity_start"), // Starting registration number (1-indexed)
		capacityEnd: integer("capacity_end"), // Ending registration number (inclusive)

		// Per-age-category pricing (optional)
		ageCategoryId: uuid("age_category_id").references(
			() => ageCategoryTable.id,
			{
				onDelete: "set null",
			},
		),

		// Status
		isActive: boolean("is_active").notNull().default(true),
		sortOrder: integer("sort_order").notNull().default(0),

		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("event_pricing_tier_event_id_idx").on(table.eventId),
		index("event_pricing_tier_tier_type_idx").on(table.tierType),
		index("event_pricing_tier_valid_from_idx").on(table.validFrom),
		index("event_pricing_tier_valid_until_idx").on(table.validUntil),
		index("event_pricing_tier_is_active_idx").on(table.isActive),
		index("event_pricing_tier_age_category_id_idx").on(table.ageCategoryId),
		// Composite for tier calculation
		index("event_pricing_tier_event_active_idx").on(
			table.eventId,
			table.isActive,
		),
	],
);

/**
 * Event registration table - tracks registrations for events
 * Supports both authenticated users and public registrations
 */
export const eventRegistrationTable = pgTable(
	"event_registration",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		eventId: uuid("event_id")
			.notNull()
			.references(() => sportsEventTable.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),

		// Registration sequence (for capacity-based pricing)
		registrationNumber: integer("registration_number").notNull(),

		// Registrant info - either linked to existing athlete OR public registration data
		athleteId: uuid("athlete_id").references(() => athleteTable.id, {
			onDelete: "set null",
		}),
		userId: uuid("user_id").references(() => userTable.id, {
			onDelete: "set null",
		}),

		// Public registration data (when no athlete/user exists)
		registrantName: text("registrant_name").notNull(),
		registrantEmail: text("registrant_email").notNull(),
		registrantPhone: text("registrant_phone"),
		registrantBirthDate: timestamp("registrant_birth_date", {
			withTimezone: true,
		}),

		// Emergency contact (important for events)
		emergencyContactName: text("emergency_contact_name"),
		emergencyContactPhone: text("emergency_contact_phone"),
		emergencyContactRelation: text("emergency_contact_relation"),

		// Age category
		ageCategoryId: uuid("age_category_id").references(
			() => ageCategoryTable.id,
			{
				onDelete: "set null",
			},
		),

		// Status
		status: text("status", { enum: enumToPgEnum(EventRegistrationStatus) })
			.$type<EventRegistrationStatus>()
			.notNull()
			.default(EventRegistrationStatus.pendingPayment),

		// Waitlist position (null if not on waitlist)
		waitlistPosition: integer("waitlist_position"),

		// Pricing at time of registration (denormalized for audit)
		appliedPricingTierId: uuid("applied_pricing_tier_id").references(
			() => eventPricingTierTable.id,
			{ onDelete: "set null" },
		),
		price: integer("price").notNull(), // Final price in smallest currency unit
		currency: text("currency").notNull().default("ARS"),

		// Payment tracking
		paidAmount: integer("paid_amount").notNull().default(0),

		// Discount tracking
		appliedDiscountId: uuid("applied_discount_id").references(
			() => eventDiscountTable.id,
			{ onDelete: "set null" },
		),
		discountAmount: integer("discount_amount").notNull().default(0), // Amount discounted in smallest currency unit

		// Additional info
		notes: text("notes"),
		internalNotes: text("internal_notes"), // Admin-only notes

		// Terms acceptance
		termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }),

		// Source tracking
		registrationSource: text("registration_source").default("public"), // "public", "admin", "member_portal"

		// Timestamps
		registeredAt: timestamp("registered_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
		cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("event_registration_event_id_idx").on(table.eventId),
		index("event_registration_organization_id_idx").on(table.organizationId),
		index("event_registration_athlete_id_idx").on(table.athleteId),
		index("event_registration_user_id_idx").on(table.userId),
		index("event_registration_status_idx").on(table.status),
		index("event_registration_email_idx").on(table.registrantEmail),
		index("event_registration_age_category_id_idx").on(table.ageCategoryId),
		index("event_registration_waitlist_position_idx").on(
			table.waitlistPosition,
		),
		// Composite indexes
		index("event_registration_event_status_idx").on(
			table.eventId,
			table.status,
		),
		index("event_registration_org_event_idx").on(
			table.organizationId,
			table.eventId,
		),
		// Unique registration number per event
		uniqueIndex("event_registration_event_number_unique").on(
			table.eventId,
			table.registrationNumber,
		),
	],
);

/**
 * Event payment table - tracks payments for event registrations
 * Supports multiple payment methods including MercadoPago, Stripe, manual
 */
export const eventPaymentTable = pgTable(
	"event_payment",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		registrationId: uuid("registration_id")
			.notNull()
			.references(() => eventRegistrationTable.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),

		// Amount
		amount: integer("amount").notNull(), // Amount in smallest currency unit
		currency: text("currency").notNull().default("ARS"),

		// Status
		status: text("status", { enum: enumToPgEnum(EventPaymentStatus) })
			.$type<EventPaymentStatus>()
			.notNull()
			.default(EventPaymentStatus.pending),

		// Payment method
		paymentMethod: text("payment_method", {
			enum: enumToPgEnum(EventPaymentMethod),
		})
			.$type<EventPaymentMethod>()
			.notNull(),

		// MercadoPago integration
		mercadoPagoPaymentId: text("mercado_pago_payment_id"),
		mercadoPagoPreferenceId: text("mercado_pago_preference_id"),
		mercadoPagoStatus: text("mercado_pago_status"),
		mercadoPagoExternalReference: text("mercado_pago_external_reference"),

		// Stripe integration
		stripePaymentIntentId: text("stripe_payment_intent_id"),
		stripeCheckoutSessionId: text("stripe_checkout_session_id"),
		stripeStatus: text("stripe_status"),

		// Manual payment tracking
		paymentDate: timestamp("payment_date", { withTimezone: true }),
		receiptNumber: text("receipt_number"),

		// Receipt image (stored in S3)
		receiptImageKey: text("receipt_image_key"), // S3 object key
		receiptImageUploadedAt: timestamp("receipt_image_uploaded_at", {
			withTimezone: true,
		}),

		// Refund tracking
		refundedAmount: integer("refunded_amount").default(0),
		refundedAt: timestamp("refunded_at", { withTimezone: true }),
		refundReason: text("refund_reason"),

		// Notes
		notes: text("notes"),

		// Who processed this payment
		processedBy: uuid("processed_by").references(() => userTable.id, {
			onDelete: "set null",
		}),

		// Timestamps
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("event_payment_registration_id_idx").on(table.registrationId),
		index("event_payment_organization_id_idx").on(table.organizationId),
		index("event_payment_status_idx").on(table.status),
		index("event_payment_payment_method_idx").on(table.paymentMethod),
		index("event_payment_mercado_pago_id_idx").on(table.mercadoPagoPaymentId),
		index("event_payment_stripe_intent_id_idx").on(table.stripePaymentIntentId),
		index("event_payment_payment_date_idx").on(table.paymentDate),
		// Composite indexes
		index("event_payment_org_status_idx").on(
			table.organizationId,
			table.status,
		),
	],
);

/**
 * Event coach assignment - coaches assigned to run events
 */
export const eventCoachTable = pgTable(
	"event_coach",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		eventId: uuid("event_id")
			.notNull()
			.references(() => sportsEventTable.id, { onDelete: "cascade" }),
		coachId: uuid("coach_id")
			.notNull()
			.references(() => coachTable.id, { onDelete: "cascade" }),
		role: text("role").default("coach"), // e.g., "lead", "assistant", "coach"
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("event_coach_event_id_idx").on(table.eventId),
		index("event_coach_coach_id_idx").on(table.coachId),
		uniqueIndex("event_coach_unique").on(table.eventId, table.coachId),
	],
);

// ============================================================================
// EVENT DISCOUNT TABLES
// ============================================================================

/**
 * Event discount - promotional codes and automatic discounts for events
 * Supports both code-based discounts (requires user to enter code) and
 * automatic discounts (applied automatically when conditions are met)
 */
export const eventDiscountTable = pgTable(
	"event_discount",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		eventId: uuid("event_id")
			.notNull()
			.references(() => sportsEventTable.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),

		// Identification
		name: text("name").notNull(), // Display name (e.g., "Black Friday", "Early Bird")
		description: text("description"), // Internal description

		// Activation mode
		discountMode: text("discount_mode", { enum: enumToPgEnum(DiscountMode) })
			.$type<DiscountMode>()
			.notNull(),
		code: text("code"), // Only required if mode = "code" (e.g., "EARLYBIRD20")

		// Discount type and value
		discountValueType: text("discount_value_type", {
			enum: enumToPgEnum(DiscountValueType),
		})
			.$type<DiscountValueType>()
			.notNull(),
		discountValue: integer("discount_value").notNull(), // Percentage (1-100) or amount in smallest currency unit

		// Usage limits
		maxUses: integer("max_uses"), // Total usage limit (null = unlimited)
		maxUsesPerUser: integer("max_uses_per_user"), // Per user/email limit (null = unlimited)
		currentUses: integer("current_uses").notNull().default(0),

		// Validity period
		validFrom: timestamp("valid_from", { withTimezone: true }),
		validUntil: timestamp("valid_until", { withTimezone: true }),

		// Optional restrictions
		minPurchaseAmount: integer("min_purchase_amount"), // Minimum amount to apply (in smallest currency unit)

		// Priority (for automatic discounts - highest priority is applied)
		priority: integer("priority").notNull().default(0),

		// Status
		isActive: boolean("is_active").notNull().default(true),

		// Timestamps
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("event_discount_event_id_idx").on(table.eventId),
		index("event_discount_organization_id_idx").on(table.organizationId),
		index("event_discount_mode_idx").on(table.discountMode),
		index("event_discount_code_idx").on(table.code),
		// Unique code per event (only when code is not null)
		uniqueIndex("event_discount_event_code_unique")
			.on(table.eventId, table.code)
			.where(sql`code IS NOT NULL`),
	],
);

/**
 * Event discount usage - tracks each use of a discount
 * Used to enforce usage limits and audit discount usage
 */
export const eventDiscountUsageTable = pgTable(
	"event_discount_usage",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		discountId: uuid("discount_id")
			.notNull()
			.references(() => eventDiscountTable.id, { onDelete: "cascade" }),
		registrationId: uuid("registration_id")
			.notNull()
			.references(() => eventRegistrationTable.id, { onDelete: "cascade" }),

		// User identifier who used the discount
		userEmail: text("user_email").notNull(),

		// Amount discounted in this usage
		discountAmount: integer("discount_amount").notNull(),

		usedAt: timestamp("used_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index("event_discount_usage_discount_id_idx").on(table.discountId),
		index("event_discount_usage_registration_id_idx").on(table.registrationId),
		index("event_discount_usage_user_email_idx").on(table.userEmail),
	],
);

// ============================================================================
// EXPENSE & CASH REGISTER TABLES
// ============================================================================

/**
 * Expense categories - configurable expense types per organization
 */
export const expenseCategoryTable = pgTable(
	"expense_category",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		description: text("description"),
		type: text("type", { enum: enumToPgEnum(ExpenseCategoryType) })
			.$type<ExpenseCategoryType>()
			.notNull()
			.default(ExpenseCategoryType.operational),
		isActive: boolean("is_active").notNull().default(true),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("expense_category_org_idx").on(table.organizationId),
		index("expense_category_type_idx").on(table.type),
		uniqueIndex("expense_category_org_name_unique").on(
			table.organizationId,
			table.name,
		),
	],
);

/**
 * Expenses - track all organization expenses
 */
export const expenseTable = pgTable(
	"expense",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),
		categoryId: uuid("category_id").references(() => expenseCategoryTable.id, {
			onDelete: "set null",
		}),
		category: text("category", {
			enum: enumToPgEnum(ExpenseCategory),
		}).$type<ExpenseCategory>(),

		// Amount in smallest currency unit (centavos)
		amount: integer("amount").notNull(),
		currency: text("currency").notNull().default("ARS"),

		description: text("description").notNull(),
		expenseDate: timestamp("expense_date", { withTimezone: true }).notNull(),
		paymentMethod: text("payment_method", {
			enum: enumToPgEnum(TrainingPaymentMethod),
		})
			.$type<TrainingPaymentMethod>()
			.notNull()
			.default(TrainingPaymentMethod.cash),

		// Receipt tracking
		receiptNumber: text("receipt_number"),
		receiptImageKey: text("receipt_image_key"), // S3 key

		// Vendor/Supplier info
		vendor: text("vendor"),
		notes: text("notes"),

		// Audit
		recordedBy: uuid("recorded_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("expense_org_idx").on(table.organizationId),
		index("expense_category_idx").on(table.categoryId),
		index("expense_category_enum_idx").on(table.category),
		index("expense_date_idx").on(table.expenseDate),
		index("expense_payment_method_idx").on(table.paymentMethod),
		index("expense_org_date_idx").on(table.organizationId, table.expenseDate),
	],
);

/**
 * Cash register - daily cash control with opening/closing
 */
export const cashRegisterTable = pgTable(
	"cash_register",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),

		// Date for this cash register (one per day per org)
		date: timestamp("date", { withTimezone: true }).notNull(),

		// Balances in smallest currency unit (centavos)
		openingBalance: integer("opening_balance").notNull().default(0),
		closingBalance: integer("closing_balance"),

		status: text("status", { enum: enumToPgEnum(CashRegisterStatus) })
			.$type<CashRegisterStatus>()
			.notNull()
			.default(CashRegisterStatus.open),

		// Who opened/closed
		openedBy: uuid("opened_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		closedBy: uuid("closed_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		openedAt: timestamp("opened_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		closedAt: timestamp("closed_at", { withTimezone: true }),

		notes: text("notes"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("cash_register_org_idx").on(table.organizationId),
		index("cash_register_date_idx").on(table.date),
		index("cash_register_status_idx").on(table.status),
		// Only one open cash register per org per day
		uniqueIndex("cash_register_org_date_unique").on(
			table.organizationId,
			table.date,
		),
	],
);

/**
 * Cash movements - individual transactions in the cash register
 */
export const cashMovementTable = pgTable(
	"cash_movement",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		cashRegisterId: uuid("cash_register_id")
			.notNull()
			.references(() => cashRegisterTable.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),

		// Movement type and amount (positive for income, negative for expense)
		type: text("type", { enum: enumToPgEnum(CashMovementType) })
			.$type<CashMovementType>()
			.notNull(),
		amount: integer("amount").notNull(), // Always positive, type determines direction

		description: text("description").notNull(),

		// Reference to source record (payment or expense)
		referenceType: text("reference_type", {
			enum: enumToPgEnum(CashMovementReferenceType),
		})
			.$type<CashMovementReferenceType>()
			.notNull()
			.default(CashMovementReferenceType.manual),
		referenceId: uuid("reference_id"), // ID of related payment/expense

		// Audit
		recordedBy: uuid("recorded_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("cash_movement_register_idx").on(table.cashRegisterId),
		index("cash_movement_org_idx").on(table.organizationId),
		index("cash_movement_type_idx").on(table.type),
		index("cash_movement_reference_idx").on(
			table.referenceType,
			table.referenceId,
		),
		index("cash_movement_created_idx").on(table.createdAt),
	],
);

// ============================================================================
// WAITLIST TABLE
// ============================================================================

/**
 * Waitlist entry table - stores athletes waiting for spots in sessions or groups
 * Supports polymorphic references to training sessions or athlete groups
 */
export const waitlistEntryTable = pgTable(
	"waitlist_entry",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),

		// Athlete reference
		athleteId: uuid("athlete_id")
			.notNull()
			.references(() => athleteTable.id, { onDelete: "cascade" }),

		// Polymorphic reference type
		referenceType: text("reference_type", {
			enum: enumToPgEnum(WaitlistReferenceType),
		})
			.$type<WaitlistReferenceType>()
			.notNull(),

		// Schedule preferences (for referenceType = 'schedule')
		preferredDays: text("preferred_days", { enum: enumToPgEnum(DayOfWeek) })
			.array()
			.$type<DayOfWeek[]>(),
		preferredStartTime: text("preferred_start_time"), // HH:MM format
		preferredEndTime: text("preferred_end_time"), // HH:MM format

		// Athlete group reference (for referenceType = 'athlete_group')
		athleteGroupId: uuid("athlete_group_id").references(
			() => athleteGroupTable.id,
			{ onDelete: "cascade" },
		),

		// Priority
		priority: text("priority", { enum: enumToPgEnum(WaitlistPriority) })
			.$type<WaitlistPriority>()
			.notNull()
			.default(WaitlistPriority.medium),

		// Status
		status: text("status", { enum: enumToPgEnum(WaitlistEntryStatus) })
			.$type<WaitlistEntryStatus>()
			.notNull()
			.default(WaitlistEntryStatus.waiting),

		// Reason and notes
		reason: text("reason"), // Why the athlete is on waitlist
		notes: text("notes"), // Admin notes

		// Position in queue (for ordering)
		position: integer("position"),

		// Assignment tracking
		assignedAt: timestamp("assigned_at", { withTimezone: true }),
		assignedBy: uuid("assigned_by").references(() => userTable.id, {
			onDelete: "set null",
		}),

		// Expiration (optional)
		expiresAt: timestamp("expires_at", { withTimezone: true }),

		// Audit
		createdBy: uuid("created_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("waitlist_entry_org_idx").on(table.organizationId),
		index("waitlist_entry_athlete_idx").on(table.athleteId),
		index("waitlist_entry_status_idx").on(table.status),
		index("waitlist_entry_priority_idx").on(table.priority),
		index("waitlist_entry_reference_type_idx").on(table.referenceType),
		index("waitlist_entry_athlete_group_idx").on(table.athleteGroupId),
		index("waitlist_entry_position_idx").on(table.position),
		// Composite indexes for common queries
		index("waitlist_entry_org_status_idx").on(
			table.organizationId,
			table.status,
		),
		index("waitlist_entry_org_type_status_idx").on(
			table.organizationId,
			table.referenceType,
			table.status,
		),
		// Check constraint: ensure correct reference based on type
		check(
			"waitlist_entry_valid_reference",
			sql`
				(${table.referenceType} = 'schedule' AND ${table.preferredDays} IS NOT NULL AND ${table.athleteGroupId} IS NULL) OR
				(${table.referenceType} = 'athlete_group' AND ${table.athleteGroupId} IS NOT NULL AND ${table.preferredDays} IS NULL)
			`,
		),
	],
);

// ============================================================================
// EVENT ORGANIZATION TABLES
// ============================================================================

// ============================================================================
// VENDORS (Base table - no dependencies on other new tables)
// ============================================================================

/**
 * Event vendor - supplier database for events (shared across organization)
 */
export const eventVendorTable = pgTable(
	"event_vendor",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),

		// Vendor details
		name: text("name").notNull(),
		description: text("description"),

		// Contact info
		contactName: text("contact_name"),
		email: text("email"),
		phone: text("phone"),

		// Address
		address: text("address"),
		city: text("city"),

		// Website
		websiteUrl: text("website_url"),

		// Vendor categories (JSON array)
		categories: text("categories"),

		// Rating (1-5)
		rating: integer("rating"),

		// Tax info
		taxId: text("tax_id"),

		// Payment terms
		paymentTerms: text("payment_terms"),

		// Notes
		notes: text("notes"),

		// Active status
		isActive: boolean("is_active").notNull().default(true),

		// Audit
		createdBy: uuid("created_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("event_vendor_org_id_idx").on(table.organizationId),
		index("event_vendor_name_idx").on(table.name),
		index("event_vendor_is_active_idx").on(table.isActive),
		uniqueIndex("event_vendor_org_name_unique").on(
			table.organizationId,
			table.name,
		),
		check(
			"event_vendor_rating_check",
			sql`${table.rating} IS NULL OR (${table.rating} >= 1 AND ${table.rating} <= 5)`,
		),
	],
);

// ============================================================================
// ZONES
// ============================================================================

/**
 * Event zone - areas/locations within the event venue
 */
export const eventZoneTable = pgTable(
	"event_zone",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		eventId: uuid("event_id")
			.notNull()
			.references(() => sportsEventTable.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),

		// Zone details
		name: text("name").notNull(),
		description: text("description"),
		zoneType: text("zone_type"),
		capacity: integer("capacity"),
		locationDescription: text("location_description"),

		// Map coordinates
		mapX: integer("map_x"),
		mapY: integer("map_y"),
		mapWidth: integer("map_width"),
		mapHeight: integer("map_height"),

		// Color for display
		color: text("color"),
		isActive: boolean("is_active").notNull().default(true),
		notes: text("notes"),

		// Audit
		createdBy: uuid("created_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("event_zone_event_id_idx").on(table.eventId),
		index("event_zone_org_id_idx").on(table.organizationId),
		index("event_zone_zone_type_idx").on(table.zoneType),
		index("event_zone_is_active_idx").on(table.isActive),
		uniqueIndex("event_zone_event_name_unique").on(table.eventId, table.name),
	],
);

/**
 * Event zone staff - staff assigned to specific zones
 */
export const eventZoneStaffTable = pgTable(
	"event_zone_staff",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		zoneId: uuid("zone_id")
			.notNull()
			.references(() => eventZoneTable.id, { onDelete: "cascade" }),
		staffId: uuid("staff_id")
			.notNull()
			.references(() => eventStaffTable.id, { onDelete: "cascade" }),

		// Role at this zone
		roleAtZone: text("role_at_zone"),
		isPrimary: boolean("is_primary").notNull().default(false),
		notes: text("notes"),

		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("event_zone_staff_zone_id_idx").on(table.zoneId),
		index("event_zone_staff_staff_id_idx").on(table.staffId),
		uniqueIndex("event_zone_staff_unique").on(table.zoneId, table.staffId),
	],
);

// ============================================================================
// CHECKLISTS
// ============================================================================

export const eventChecklistTable = pgTable(
	"event_checklist",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		eventId: uuid("event_id")
			.notNull()
			.references(() => sportsEventTable.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),

		title: text("title").notNull(),
		description: text("description"),
		category: text("category"),

		status: text("status", { enum: enumToPgEnum(EventChecklistStatus) })
			.$type<EventChecklistStatus>()
			.notNull()
			.default(EventChecklistStatus.pending),

		completedAt: timestamp("completed_at", { withTimezone: true }),
		completedBy: uuid("completed_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		dueDate: timestamp("due_date", { withTimezone: true }),
		sortOrder: integer("sort_order").notNull().default(0),

		createdBy: uuid("created_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("event_checklist_event_id_idx").on(table.eventId),
		index("event_checklist_org_id_idx").on(table.organizationId),
		index("event_checklist_status_idx").on(table.status),
		index("event_checklist_category_idx").on(table.category),
		index("event_checklist_due_date_idx").on(table.dueDate),
		index("event_checklist_event_status_idx").on(table.eventId, table.status),
	],
);

// ============================================================================
// TASKS (KANBAN)
// ============================================================================

export const eventTaskTable = pgTable(
	"event_task",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		eventId: uuid("event_id")
			.notNull()
			.references(() => sportsEventTable.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),

		title: text("title").notNull(),
		description: text("description"),

		status: text("status", { enum: enumToPgEnum(EventTaskStatus) })
			.$type<EventTaskStatus>()
			.notNull()
			.default(EventTaskStatus.todo),

		priority: text("priority", { enum: enumToPgEnum(EventTaskPriority) })
			.$type<EventTaskPriority>()
			.notNull()
			.default(EventTaskPriority.medium),

		assigneeId: uuid("assignee_id").references(() => userTable.id, {
			onDelete: "set null",
		}),

		dueDate: timestamp("due_date", { withTimezone: true }),
		startedAt: timestamp("started_at", { withTimezone: true }),
		completedAt: timestamp("completed_at", { withTimezone: true }),
		columnPosition: integer("column_position").notNull().default(0),
		tags: text("tags"),
		estimatedHours: integer("estimated_hours"),
		actualHours: integer("actual_hours"),

		createdBy: uuid("created_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("event_task_event_id_idx").on(table.eventId),
		index("event_task_org_id_idx").on(table.organizationId),
		index("event_task_status_idx").on(table.status),
		index("event_task_priority_idx").on(table.priority),
		index("event_task_assignee_id_idx").on(table.assigneeId),
		index("event_task_due_date_idx").on(table.dueDate),
		index("event_task_event_status_position_idx").on(
			table.eventId,
			table.status,
			table.columnPosition,
		),
	],
);

// ============================================================================
// STAFF/VOLUNTEERS
// ============================================================================

export const eventStaffTable = pgTable(
	"event_staff",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		eventId: uuid("event_id")
			.notNull()
			.references(() => sportsEventTable.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),

		staffType: text("staff_type", { enum: enumToPgEnum(EventStaffType) })
			.$type<EventStaffType>()
			.notNull(),

		// System user (if staffType is system_user)
		userId: uuid("user_id").references(() => userTable.id, {
			onDelete: "set null",
		}),

		// External person (if staffType is external)
		externalName: text("external_name"),
		externalEmail: text("external_email"),
		externalPhone: text("external_phone"),

		role: text("role", { enum: enumToPgEnum(EventStaffRole) })
			.$type<EventStaffRole>()
			.notNull()
			.default(EventStaffRole.volunteer),
		roleTitle: text("role_title"),

		isConfirmed: boolean("is_confirmed").notNull().default(false),
		confirmedAt: timestamp("confirmed_at", { withTimezone: true }),

		notes: text("notes"),
		specialSkills: text("special_skills"),
		emergencyContactName: text("emergency_contact_name"),
		emergencyContactPhone: text("emergency_contact_phone"),

		createdBy: uuid("created_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("event_staff_event_id_idx").on(table.eventId),
		index("event_staff_org_id_idx").on(table.organizationId),
		index("event_staff_staff_type_idx").on(table.staffType),
		index("event_staff_user_id_idx").on(table.userId),
		index("event_staff_role_idx").on(table.role),
		index("event_staff_is_confirmed_idx").on(table.isConfirmed),
		index("event_staff_event_role_idx").on(table.eventId, table.role),
	],
);

export const eventStaffShiftTable = pgTable(
	"event_staff_shift",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		staffId: uuid("staff_id")
			.notNull()
			.references(() => eventStaffTable.id, { onDelete: "cascade" }),
		eventId: uuid("event_id")
			.notNull()
			.references(() => sportsEventTable.id, { onDelete: "cascade" }),

		shiftDate: timestamp("shift_date", { withTimezone: true }).notNull(),
		startTime: timestamp("start_time", { withTimezone: true }).notNull(),
		endTime: timestamp("end_time", { withTimezone: true }).notNull(),

		zoneId: uuid("zone_id").references(() => eventZoneTable.id, {
			onDelete: "set null",
		}),

		checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
		checkedOutAt: timestamp("checked_out_at", { withTimezone: true }),
		notes: text("notes"),

		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("event_staff_shift_staff_id_idx").on(table.staffId),
		index("event_staff_shift_event_id_idx").on(table.eventId),
		index("event_staff_shift_shift_date_idx").on(table.shiftDate),
		index("event_staff_shift_zone_id_idx").on(table.zoneId),
		index("event_staff_shift_event_date_idx").on(
			table.eventId,
			table.shiftDate,
		),
		check(
			"event_staff_shift_valid_time",
			sql`${table.endTime} > ${table.startTime}`,
		),
	],
);

// ============================================================================
// BUDGET
// ============================================================================

export const eventBudgetLineTable = pgTable(
	"event_budget_line",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		eventId: uuid("event_id")
			.notNull()
			.references(() => sportsEventTable.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),

		categoryId: uuid("category_id").references(() => expenseCategoryTable.id, {
			onDelete: "set null",
		}),

		name: text("name").notNull(),
		description: text("description"),

		plannedAmount: integer("planned_amount").notNull().default(0),
		actualAmount: integer("actual_amount").notNull().default(0),
		currency: text("currency").notNull().default("ARS"),

		status: text("status", { enum: enumToPgEnum(EventBudgetStatus) })
			.$type<EventBudgetStatus>()
			.notNull()
			.default(EventBudgetStatus.planned),

		isRevenue: boolean("is_revenue").notNull().default(false),

		expenseId: uuid("expense_id").references(() => expenseTable.id, {
			onDelete: "set null",
		}),
		vendorId: uuid("vendor_id").references(() => eventVendorTable.id, {
			onDelete: "set null",
		}),

		notes: text("notes"),

		approvedBy: uuid("approved_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		approvedAt: timestamp("approved_at", { withTimezone: true }),
		createdBy: uuid("created_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("event_budget_line_event_id_idx").on(table.eventId),
		index("event_budget_line_org_id_idx").on(table.organizationId),
		index("event_budget_line_category_id_idx").on(table.categoryId),
		index("event_budget_line_status_idx").on(table.status),
		index("event_budget_line_vendor_id_idx").on(table.vendorId),
		index("event_budget_line_is_revenue_idx").on(table.isRevenue),
		index("event_budget_line_event_category_idx").on(
			table.eventId,
			table.categoryId,
		),
	],
);

// ============================================================================
// SPONSORS (Organization-level)
// ============================================================================

/**
 * Sponsor - organization-level sponsor database (reusable across events)
 */
export const sponsorTable = pgTable(
	"sponsor",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),

		// Sponsor details
		name: text("name").notNull(),
		description: text("description"),
		logoUrl: text("logo_url"),
		websiteUrl: text("website_url"),

		// Contact info
		contactName: text("contact_name"),
		contactEmail: text("contact_email"),
		contactPhone: text("contact_phone"),

		// Default tier (can be overridden per event)
		tier: text("tier", { enum: enumToPgEnum(EventSponsorTier) })
			.$type<EventSponsorTier>()
			.notNull()
			.default(EventSponsorTier.partner),

		// Contract details
		contractStartDate: timestamp("contract_start_date", { withTimezone: true }),
		contractEndDate: timestamp("contract_end_date", { withTimezone: true }),
		contractValue: integer("contract_value"),
		currency: text("currency").notNull().default("ARS"),
		contractNotes: text("contract_notes"),

		// Status
		status: text("status", { enum: enumToPgEnum(SponsorStatus) })
			.$type<SponsorStatus>()
			.notNull()
			.default(SponsorStatus.pending),

		notes: text("notes"),
		isActive: boolean("is_active").notNull().default(true),

		createdBy: uuid("created_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("sponsor_org_id_idx").on(table.organizationId),
		index("sponsor_status_idx").on(table.status),
		index("sponsor_tier_idx").on(table.tier),
		index("sponsor_is_active_idx").on(table.isActive),
		index("sponsor_org_status_idx").on(table.organizationId, table.status),
	],
);

/**
 * Event sponsor assignment - links sponsors to specific events
 */
export const eventSponsorAssignmentTable = pgTable(
	"event_sponsor_assignment",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		eventId: uuid("event_id")
			.notNull()
			.references(() => sportsEventTable.id, { onDelete: "cascade" }),
		sponsorId: uuid("sponsor_id")
			.notNull()
			.references(() => sponsorTable.id, { onDelete: "cascade" }),

		// Event-specific override (optional, defaults to sponsor's tier)
		tier: text("tier", {
			enum: enumToPgEnum(EventSponsorTier),
		}).$type<EventSponsorTier>(),

		// Event-specific sponsorship value
		sponsorshipValue: integer("sponsorship_value").notNull().default(0),
		currency: text("currency").notNull().default("ARS"),
		inKindDescription: text("in_kind_description"),

		// Display order for this event
		sortOrder: integer("sort_order").notNull().default(0),

		isConfirmed: boolean("is_confirmed").notNull().default(false),
		confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
		notes: text("notes"),

		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("event_sponsor_assignment_event_id_idx").on(table.eventId),
		index("event_sponsor_assignment_sponsor_id_idx").on(table.sponsorId),
		index("event_sponsor_assignment_sort_order_idx").on(table.sortOrder),
	],
);

// ============================================================================
// SPONSORS (Legacy - Event-specific, kept for backwards compatibility)
// ============================================================================

export const eventSponsorTable = pgTable(
	"event_sponsor",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		eventId: uuid("event_id")
			.notNull()
			.references(() => sportsEventTable.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),

		name: text("name").notNull(),
		description: text("description"),
		logoUrl: text("logo_url"),
		websiteUrl: text("website_url"),

		contactName: text("contact_name"),
		contactEmail: text("contact_email"),
		contactPhone: text("contact_phone"),

		tier: text("tier", { enum: enumToPgEnum(EventSponsorTier) })
			.$type<EventSponsorTier>()
			.notNull()
			.default(EventSponsorTier.partner),

		sponsorshipValue: integer("sponsorship_value").notNull().default(0),
		currency: text("currency").notNull().default("ARS"),
		inKindDescription: text("in_kind_description"),

		contractSigned: boolean("contract_signed").notNull().default(false),
		contractSignedAt: timestamp("contract_signed_at", { withTimezone: true }),

		sortOrder: integer("sort_order").notNull().default(0),
		notes: text("notes"),

		createdBy: uuid("created_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("event_sponsor_event_id_idx").on(table.eventId),
		index("event_sponsor_org_id_idx").on(table.organizationId),
		index("event_sponsor_tier_idx").on(table.tier),
		index("event_sponsor_sort_order_idx").on(table.sortOrder),
		index("event_sponsor_event_tier_idx").on(table.eventId, table.tier),
	],
);

export const eventSponsorBenefitTable = pgTable(
	"event_sponsor_benefit",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		sponsorId: uuid("sponsor_id")
			.notNull()
			.references(() => eventSponsorTable.id, { onDelete: "cascade" }),

		title: text("title").notNull(),
		description: text("description"),
		quantity: integer("quantity").notNull().default(1),
		estimatedValue: integer("estimated_value"),

		status: text("status", { enum: enumToPgEnum(EventSponsorBenefitStatus) })
			.$type<EventSponsorBenefitStatus>()
			.notNull()
			.default(EventSponsorBenefitStatus.pending),

		deliveredAt: timestamp("delivered_at", { withTimezone: true }),
		deliveryNotes: text("delivery_notes"),
		dueDate: timestamp("due_date", { withTimezone: true }),

		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("event_sponsor_benefit_sponsor_id_idx").on(table.sponsorId),
		index("event_sponsor_benefit_status_idx").on(table.status),
		index("event_sponsor_benefit_due_date_idx").on(table.dueDate),
	],
);

// ============================================================================
// MILESTONES
// ============================================================================

export const eventMilestoneTable = pgTable(
	"event_milestone",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		eventId: uuid("event_id")
			.notNull()
			.references(() => sportsEventTable.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),

		title: text("title").notNull(),
		description: text("description"),
		targetDate: timestamp("target_date", { withTimezone: true }).notNull(),
		completedAt: timestamp("completed_at", { withTimezone: true }),

		status: text("status", { enum: enumToPgEnum(EventMilestoneStatus) })
			.$type<EventMilestoneStatus>()
			.notNull()
			.default(EventMilestoneStatus.pending),

		responsibleId: uuid("responsible_id").references(() => userTable.id, {
			onDelete: "set null",
		}),

		dependsOn: text("depends_on"), // JSON array of milestone IDs
		color: text("color"),
		notes: text("notes"),

		createdBy: uuid("created_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("event_milestone_event_id_idx").on(table.eventId),
		index("event_milestone_org_id_idx").on(table.organizationId),
		index("event_milestone_target_date_idx").on(table.targetDate),
		index("event_milestone_status_idx").on(table.status),
		index("event_milestone_responsible_id_idx").on(table.responsibleId),
		index("event_milestone_event_date_idx").on(table.eventId, table.targetDate),
	],
);

// ============================================================================
// DOCUMENTS
// ============================================================================

export const eventDocumentTable = pgTable(
	"event_document",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		eventId: uuid("event_id")
			.notNull()
			.references(() => sportsEventTable.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),

		name: text("name").notNull(),
		description: text("description"),

		documentType: text("document_type", {
			enum: enumToPgEnum(EventDocumentType),
		})
			.$type<EventDocumentType>()
			.notNull()
			.default(EventDocumentType.other),

		storageKey: text("storage_key").notNull(),
		fileName: text("file_name").notNull(),
		fileSize: integer("file_size"),
		mimeType: text("mime_type"),

		version: integer("version").notNull().default(1),
		previousVersionId: uuid("previous_version_id"),
		tags: text("tags"),
		isPublic: boolean("is_public").notNull().default(false),

		uploadedBy: uuid("uploaded_by")
			.notNull()
			.references(() => userTable.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("event_document_event_id_idx").on(table.eventId),
		index("event_document_org_id_idx").on(table.organizationId),
		index("event_document_document_type_idx").on(table.documentType),
		index("event_document_uploaded_by_idx").on(table.uploadedBy),
		index("event_document_is_public_idx").on(table.isPublic),
		index("event_document_event_type_idx").on(
			table.eventId,
			table.documentType,
		),
	],
);

// ============================================================================
// NOTES/COMMENTS
// ============================================================================

export const eventNoteTable = pgTable(
	"event_note",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		eventId: uuid("event_id")
			.notNull()
			.references(() => sportsEventTable.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),

		content: text("content").notNull(),

		noteType: text("note_type", { enum: enumToPgEnum(EventNoteType) })
			.$type<EventNoteType>()
			.notNull()
			.default(EventNoteType.comment),

		parentNoteId: uuid("parent_note_id"),
		mentions: text("mentions"), // JSON array of user IDs

		isPinned: boolean("is_pinned").notNull().default(false),
		pinnedAt: timestamp("pinned_at", { withTimezone: true }),
		pinnedBy: uuid("pinned_by").references(() => userTable.id, {
			onDelete: "set null",
		}),

		relatedEntityType: text("related_entity_type"),
		relatedEntityId: uuid("related_entity_id"),

		authorId: uuid("author_id")
			.notNull()
			.references(() => userTable.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("event_note_event_id_idx").on(table.eventId),
		index("event_note_org_id_idx").on(table.organizationId),
		index("event_note_note_type_idx").on(table.noteType),
		index("event_note_parent_note_id_idx").on(table.parentNoteId),
		index("event_note_author_id_idx").on(table.authorId),
		index("event_note_is_pinned_idx").on(table.isPinned),
		index("event_note_created_at_idx").on(table.createdAt),
		index("event_note_event_created_idx").on(table.eventId, table.createdAt),
		index("event_note_related_entity_idx").on(
			table.relatedEntityType,
			table.relatedEntityId,
		),
	],
);

// ============================================================================
// INVENTORY
// ============================================================================

export const eventInventoryTable = pgTable(
	"event_inventory",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		eventId: uuid("event_id")
			.notNull()
			.references(() => sportsEventTable.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),

		name: text("name").notNull(),
		description: text("description"),
		category: text("category"),

		quantityNeeded: integer("quantity_needed").notNull().default(1),
		quantityAvailable: integer("quantity_available").notNull().default(0),

		status: text("status", { enum: enumToPgEnum(EventInventoryStatus) })
			.$type<EventInventoryStatus>()
			.notNull()
			.default(EventInventoryStatus.needed),

		source: text("source"),

		vendorId: uuid("vendor_id").references(() => eventVendorTable.id, {
			onDelete: "set null",
		}),

		unitCost: integer("unit_cost"),
		totalCost: integer("total_cost"),
		currency: text("currency").default("ARS"),

		zoneId: uuid("zone_id").references(() => eventZoneTable.id, {
			onDelete: "set null",
		}),
		storageLocation: text("storage_location"),

		responsibleId: uuid("responsible_id").references(() => userTable.id, {
			onDelete: "set null",
		}),

		notes: text("notes"),

		createdBy: uuid("created_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("event_inventory_event_id_idx").on(table.eventId),
		index("event_inventory_org_id_idx").on(table.organizationId),
		index("event_inventory_category_idx").on(table.category),
		index("event_inventory_status_idx").on(table.status),
		index("event_inventory_vendor_id_idx").on(table.vendorId),
		index("event_inventory_zone_id_idx").on(table.zoneId),
		index("event_inventory_responsible_id_idx").on(table.responsibleId),
		index("event_inventory_event_status_idx").on(table.eventId, table.status),
	],
);

// ============================================================================
// VENDOR ASSIGNMENTS
// ============================================================================

export const eventVendorAssignmentTable = pgTable(
	"event_vendor_assignment",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		eventId: uuid("event_id")
			.notNull()
			.references(() => sportsEventTable.id, { onDelete: "cascade" }),
		vendorId: uuid("vendor_id")
			.notNull()
			.references(() => eventVendorTable.id, { onDelete: "cascade" }),

		serviceDescription: text("service_description"),
		contractValue: integer("contract_value"),
		currency: text("currency").default("ARS"),

		isConfirmed: boolean("is_confirmed").notNull().default(false),
		confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
		notes: text("notes"),

		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("event_vendor_assignment_event_id_idx").on(table.eventId),
		index("event_vendor_assignment_vendor_id_idx").on(table.vendorId),
		uniqueIndex("event_vendor_assignment_unique").on(
			table.eventId,
			table.vendorId,
		),
	],
);

// ============================================================================
// RISKS
// ============================================================================

export const eventRiskTable = pgTable(
	"event_risk",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		eventId: uuid("event_id")
			.notNull()
			.references(() => sportsEventTable.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),

		title: text("title").notNull(),
		description: text("description"),
		category: text("category"),

		severity: text("severity", { enum: enumToPgEnum(EventRiskSeverity) })
			.$type<EventRiskSeverity>()
			.notNull()
			.default(EventRiskSeverity.medium),

		probability: text("probability", {
			enum: enumToPgEnum(EventRiskProbability),
		})
			.$type<EventRiskProbability>()
			.notNull()
			.default(EventRiskProbability.possible),

		riskScore: integer("risk_score"),

		status: text("status", { enum: enumToPgEnum(EventRiskStatus) })
			.$type<EventRiskStatus>()
			.notNull()
			.default(EventRiskStatus.identified),

		mitigationPlan: text("mitigation_plan"),
		mitigationCost: integer("mitigation_cost"),
		contingencyPlan: text("contingency_plan"),
		triggerConditions: text("trigger_conditions"),
		potentialImpact: text("potential_impact"),

		ownerId: uuid("owner_id").references(() => userTable.id, {
			onDelete: "set null",
		}),

		lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
		nextReviewDate: timestamp("next_review_date", { withTimezone: true }),
		notes: text("notes"),

		createdBy: uuid("created_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("event_risk_event_id_idx").on(table.eventId),
		index("event_risk_org_id_idx").on(table.organizationId),
		index("event_risk_category_idx").on(table.category),
		index("event_risk_severity_idx").on(table.severity),
		index("event_risk_probability_idx").on(table.probability),
		index("event_risk_status_idx").on(table.status),
		index("event_risk_owner_id_idx").on(table.ownerId),
		index("event_risk_risk_score_idx").on(table.riskScore),
		index("event_risk_event_status_idx").on(table.eventId, table.status),
	],
);

export const eventRiskLogTable = pgTable(
	"event_risk_log",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		riskId: uuid("risk_id")
			.notNull()
			.references(() => eventRiskTable.id, { onDelete: "cascade" }),

		action: text("action").notNull(),
		previousStatus: text("previous_status"),
		newStatus: text("new_status"),
		description: text("description"),

		userId: uuid("user_id")
			.notNull()
			.references(() => userTable.id, { onDelete: "cascade" }),

		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("event_risk_log_risk_id_idx").on(table.riskId),
		index("event_risk_log_action_idx").on(table.action),
		index("event_risk_log_created_at_idx").on(table.createdAt),
	],
);

// ============================================================================
// STOCK & PRODUCT TABLES
// ============================================================================

// Product catalog - Items available for sale
export const productTable = pgTable(
	"product",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),

		// Product info
		name: text("name").notNull(),
		description: text("description"),
		sku: text("sku"), // Stock Keeping Unit
		barcode: text("barcode"),

		// Category
		category: text("category", { enum: enumToPgEnum(ProductCategory) })
			.$type<ProductCategory>()
			.notNull()
			.default(ProductCategory.other),

		// Pricing (in smallest currency unit - centavos)
		costPrice: integer("cost_price").notNull().default(0), // Costo
		sellingPrice: integer("selling_price").notNull().default(0), // Precio de venta
		currency: text("currency").notNull().default("ARS"),

		// Stock settings
		trackStock: boolean("track_stock").notNull().default(true),
		lowStockThreshold: integer("low_stock_threshold").default(5),
		currentStock: integer("current_stock").notNull().default(0),

		// Status
		status: text("status", { enum: enumToPgEnum(ProductStatus) })
			.$type<ProductStatus>()
			.notNull()
			.default(ProductStatus.active),

		// Media
		imageUrl: text("image_url"),

		// Tax
		taxRate: integer("tax_rate").default(0), // Percentage (e.g., 21 for 21%)

		notes: text("notes"),
		isActive: boolean("is_active").notNull().default(true),

		createdBy: uuid("created_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("product_organization_id_idx").on(table.organizationId),
		index("product_category_idx").on(table.category),
		index("product_status_idx").on(table.status),
		index("product_sku_idx").on(table.sku),
		index("product_barcode_idx").on(table.barcode),
	],
);

// Stock transactions - Audit trail for all stock movements
export const stockTransactionTable = pgTable(
	"stock_transaction",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),
		productId: uuid("product_id")
			.notNull()
			.references(() => productTable.id, { onDelete: "cascade" }),

		// Transaction details
		type: text("type", { enum: enumToPgEnum(StockTransactionType) })
			.$type<StockTransactionType>()
			.notNull(),
		quantity: integer("quantity").notNull(), // Positive or negative
		previousStock: integer("previous_stock").notNull(),
		newStock: integer("new_stock").notNull(),

		// Unit cost at time of transaction
		unitCost: integer("unit_cost"),

		// Reference to what caused this transaction
		referenceType: text("reference_type"), // 'sale', 'purchase', 'adjustment', etc.
		referenceId: uuid("reference_id"),

		reason: text("reason"),
		notes: text("notes"),

		recordedBy: uuid("recorded_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("stock_transaction_organization_id_idx").on(table.organizationId),
		index("stock_transaction_product_id_idx").on(table.productId),
		index("stock_transaction_type_idx").on(table.type),
		index("stock_transaction_created_at_idx").on(table.createdAt),
		index("stock_transaction_reference_idx").on(
			table.referenceType,
			table.referenceId,
		),
	],
);

// Sales - Records of product sales
export const saleTable = pgTable(
	"sale",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),

		// Sale number for receipts
		saleNumber: text("sale_number"),

		// Optional customer reference
		athleteId: uuid("athlete_id").references(() => athleteTable.id, {
			onDelete: "set null",
		}),
		customerName: text("customer_name"),

		// Totals (in smallest currency unit)
		subtotal: integer("subtotal").notNull().default(0),
		taxAmount: integer("tax_amount").notNull().default(0),
		discountAmount: integer("discount_amount").notNull().default(0),
		totalAmount: integer("total_amount").notNull().default(0),
		currency: text("currency").notNull().default("ARS"),

		// Payment info
		paymentMethod: text("payment_method", {
			enum: enumToPgEnum(TrainingPaymentMethod),
		}).$type<TrainingPaymentMethod>(),
		paymentStatus: text("payment_status", { enum: enumToPgEnum(SaleStatus) })
			.$type<SaleStatus>()
			.notNull()
			.default(SaleStatus.pending),
		paidAt: timestamp("paid_at", { withTimezone: true }),

		// Cash register link
		cashMovementId: uuid("cash_movement_id").references(
			() => cashMovementTable.id,
			{ onDelete: "set null" },
		),

		notes: text("notes"),

		soldBy: uuid("sold_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("sale_organization_id_idx").on(table.organizationId),
		index("sale_athlete_id_idx").on(table.athleteId),
		index("sale_payment_status_idx").on(table.paymentStatus),
		index("sale_created_at_idx").on(table.createdAt),
		index("sale_sale_number_idx").on(table.saleNumber),
	],
);

// Sale items - Line items in a sale
export const saleItemTable = pgTable(
	"sale_item",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		saleId: uuid("sale_id")
			.notNull()
			.references(() => saleTable.id, { onDelete: "cascade" }),
		productId: uuid("product_id")
			.notNull()
			.references(() => productTable.id, { onDelete: "restrict" }),

		// Snapshot of product at time of sale
		productName: text("product_name").notNull(),
		quantity: integer("quantity").notNull().default(1),
		unitPrice: integer("unit_price").notNull(), // Price at time of sale
		totalPrice: integer("total_price").notNull(),

		// Optional discount on this item
		discountAmount: integer("discount_amount").default(0),

		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("sale_item_sale_id_idx").on(table.saleId),
		index("sale_item_product_id_idx").on(table.productId),
	],
);

// ============================================================================
// TRAINING EQUIPMENT TABLES
// ============================================================================

// Training equipment - Organization's equipment inventory
export const trainingEquipmentTable = pgTable(
	"training_equipment",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),

		// Equipment info
		name: text("name").notNull(),
		description: text("description"),
		brand: text("brand"),
		model: text("model"),
		serialNumber: text("serial_number"),

		// Category
		category: text("category", {
			enum: enumToPgEnum(TrainingEquipmentCategory),
		})
			.$type<TrainingEquipmentCategory>()
			.notNull()
			.default(TrainingEquipmentCategory.other),

		// Quantity tracking
		totalQuantity: integer("total_quantity").notNull().default(1),
		availableQuantity: integer("available_quantity").notNull().default(1),

		// Status and condition
		status: text("status", { enum: enumToPgEnum(TrainingEquipmentStatus) })
			.$type<TrainingEquipmentStatus>()
			.notNull()
			.default(TrainingEquipmentStatus.available),
		condition: text("condition", { enum: enumToPgEnum(EquipmentCondition) })
			.$type<EquipmentCondition>()
			.notNull()
			.default(EquipmentCondition.good),

		// Value and purchase info
		purchasePrice: integer("purchase_price"), // In centavos
		purchaseDate: timestamp("purchase_date", { withTimezone: true }),
		currency: text("currency").notNull().default("ARS"),

		// Location
		locationId: uuid("location_id").references(() => locationTable.id, {
			onDelete: "set null",
		}),
		storageLocation: text("storage_location"), // Specific storage spot

		// Maintenance
		lastMaintenanceDate: timestamp("last_maintenance_date", {
			withTimezone: true,
		}),
		nextMaintenanceDate: timestamp("next_maintenance_date", {
			withTimezone: true,
		}),

		// Media
		imageUrl: text("image_url"),

		notes: text("notes"),
		isActive: boolean("is_active").notNull().default(true),

		createdBy: uuid("created_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("training_equipment_organization_id_idx").on(table.organizationId),
		index("training_equipment_category_idx").on(table.category),
		index("training_equipment_status_idx").on(table.status),
		index("training_equipment_location_id_idx").on(table.locationId),
	],
);

// Equipment assignments - Track where equipment is assigned
export const equipmentAssignmentTable = pgTable(
	"equipment_assignment",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),
		equipmentId: uuid("equipment_id")
			.notNull()
			.references(() => trainingEquipmentTable.id, { onDelete: "cascade" }),

		// Assignment target (one of these)
		athleteGroupId: uuid("athlete_group_id").references(
			() => athleteGroupTable.id,
			{ onDelete: "cascade" },
		),
		trainingSessionId: uuid("training_session_id").references(
			() => trainingSessionTable.id,
			{ onDelete: "cascade" },
		),
		coachId: uuid("coach_id").references(() => coachTable.id, {
			onDelete: "cascade",
		}),

		// Assignment details
		quantity: integer("quantity").notNull().default(1),
		assignedAt: timestamp("assigned_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		returnedAt: timestamp("returned_at", { withTimezone: true }),
		expectedReturnAt: timestamp("expected_return_at", { withTimezone: true }),

		notes: text("notes"),

		assignedBy: uuid("assigned_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("equipment_assignment_organization_id_idx").on(table.organizationId),
		index("equipment_assignment_equipment_id_idx").on(table.equipmentId),
		index("equipment_assignment_group_id_idx").on(table.athleteGroupId),
		index("equipment_assignment_session_id_idx").on(table.trainingSessionId),
		index("equipment_assignment_coach_id_idx").on(table.coachId),
		index("equipment_assignment_returned_idx").on(table.returnedAt),
	],
);

// Equipment maintenance log
export const equipmentMaintenanceTable = pgTable(
	"equipment_maintenance",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		equipmentId: uuid("equipment_id")
			.notNull()
			.references(() => trainingEquipmentTable.id, { onDelete: "cascade" }),

		// Maintenance details
		maintenanceType: text("maintenance_type").notNull(), // 'repair', 'cleaning', 'inspection', etc.
		description: text("description"),
		cost: integer("cost"), // In centavos
		currency: text("currency").notNull().default("ARS"),

		// Status
		previousCondition: text("previous_condition"),
		newCondition: text("new_condition"),

		performedAt: timestamp("performed_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		performedBy: uuid("performed_by").references(() => userTable.id, {
			onDelete: "set null",
		}),

		notes: text("notes"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("equipment_maintenance_equipment_id_idx").on(table.equipmentId),
		index("equipment_maintenance_type_idx").on(table.maintenanceType),
		index("equipment_maintenance_performed_at_idx").on(table.performedAt),
	],
);

// ============================================================================
// EQUIPMENT INVENTORY AUDIT TABLES
// ============================================================================

/**
 * Equipment inventory audit - Periodic inventory counts/audits
 * Tracks when audits are scheduled, performed, and their results
 */
export const equipmentInventoryAuditTable = pgTable(
	"equipment_inventory_audit",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),

		// Audit scheduling
		scheduledDate: timestamp("scheduled_date", {
			withTimezone: true,
		}).notNull(),
		startedAt: timestamp("started_at", { withTimezone: true }),
		completedAt: timestamp("completed_at", { withTimezone: true }),

		// Status and type
		status: text("status", { enum: enumToPgEnum(EquipmentAuditStatus) })
			.$type<EquipmentAuditStatus>()
			.notNull()
			.default(EquipmentAuditStatus.scheduled),
		auditType: text("audit_type", { enum: enumToPgEnum(EquipmentAuditType) })
			.$type<EquipmentAuditType>()
			.notNull()
			.default(EquipmentAuditType.full),

		// Filters for partial audits
		categoryFilter: text("category_filter", {
			enum: enumToPgEnum(TrainingEquipmentCategory),
		}).$type<TrainingEquipmentCategory>(),
		locationId: uuid("location_id").references(() => locationTable.id, {
			onDelete: "set null",
		}),

		// Audit summary (calculated on completion)
		totalItems: integer("total_items").notNull().default(0),
		countedItems: integer("counted_items").notNull().default(0),
		itemsWithDiscrepancy: integer("items_with_discrepancy")
			.notNull()
			.default(0),
		totalExpectedQuantity: integer("total_expected_quantity")
			.notNull()
			.default(0),
		totalCountedQuantity: integer("total_counted_quantity")
			.notNull()
			.default(0),

		// Audit details
		title: text("title"),
		notes: text("notes"),

		// Audit trail
		createdBy: uuid("created_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		performedBy: uuid("performed_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		approvedBy: uuid("approved_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		approvedAt: timestamp("approved_at", { withTimezone: true }),

		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("equipment_inventory_audit_org_idx").on(table.organizationId),
		index("equipment_inventory_audit_status_idx").on(table.status),
		index("equipment_inventory_audit_scheduled_idx").on(table.scheduledDate),
		index("equipment_inventory_audit_type_idx").on(table.auditType),
	],
);

/**
 * Equipment inventory count - Individual item counts within an audit
 * Each row represents one equipment item that needs to be counted
 */
export const equipmentInventoryCountTable = pgTable(
	"equipment_inventory_count",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		auditId: uuid("audit_id")
			.notNull()
			.references(() => equipmentInventoryAuditTable.id, {
				onDelete: "cascade",
			}),
		equipmentId: uuid("equipment_id")
			.notNull()
			.references(() => trainingEquipmentTable.id, { onDelete: "cascade" }),

		// Quantities
		expectedQuantity: integer("expected_quantity").notNull(), // From system at audit creation
		countedQuantity: integer("counted_quantity"), // Physical count (null until counted)
		discrepancy: integer("discrepancy"), // countedQuantity - expectedQuantity

		// Item status
		status: text("status", { enum: enumToPgEnum(EquipmentCountStatus) })
			.$type<EquipmentCountStatus>()
			.notNull()
			.default(EquipmentCountStatus.pending),

		// Observed condition (may differ from system)
		observedCondition: text("observed_condition", {
			enum: enumToPgEnum(EquipmentCondition),
		}).$type<EquipmentCondition>(),

		// Discrepancy resolution
		adjustmentApproved: boolean("adjustment_approved").notNull().default(false),
		adjustmentReason: text("adjustment_reason"),
		adjustedBy: uuid("adjusted_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		adjustedAt: timestamp("adjusted_at", { withTimezone: true }),

		// Count details
		notes: text("notes"),
		countedBy: uuid("counted_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		countedAt: timestamp("counted_at", { withTimezone: true }),

		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("equipment_inventory_count_audit_idx").on(table.auditId),
		index("equipment_inventory_count_equipment_idx").on(table.equipmentId),
		index("equipment_inventory_count_status_idx").on(table.status),
		// Unique constraint: one count per equipment per audit
		uniqueIndex("equipment_inventory_count_audit_equipment_unique").on(
			table.auditId,
			table.equipmentId,
		),
	],
);

// ============================================================================
// STAFF PAYROLL TABLE
// ============================================================================

/**
 * Staff payroll - liquidation of salaries and payments for staff/coaches
 */
export const staffPayrollTable = pgTable(
	"staff_payroll",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),

		// Staff recipient (one of these depending on staffType)
		staffType: text("staff_type", { enum: enumToPgEnum(PayrollStaffType) })
			.$type<PayrollStaffType>()
			.notNull()
			.default(PayrollStaffType.coach),
		coachId: uuid("coach_id").references(() => coachTable.id, {
			onDelete: "set null",
		}),
		userId: uuid("user_id").references(() => userTable.id, {
			onDelete: "set null",
		}),
		// For external staff (contractors without user account)
		externalName: text("external_name"),
		externalEmail: text("external_email"),

		// Period
		periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
		periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
		periodType: text("period_type", { enum: enumToPgEnum(PayrollPeriodType) })
			.$type<PayrollPeriodType>()
			.notNull()
			.default(PayrollPeriodType.monthly),

		// Coach payment type (only for coaches)
		coachPaymentType: text("coach_payment_type", {
			enum: enumToPgEnum(CoachPaymentType),
		}).$type<CoachPaymentType>(),

		// Session-based payment fields (for per_session type)
		sessionCount: integer("session_count"), // Number of sessions in period
		ratePerSession: integer("rate_per_session"), // Amount per session in centavos

		// Amounts (in centavos)
		baseSalary: integer("base_salary").notNull().default(0),
		bonuses: integer("bonuses").notNull().default(0),
		deductions: integer("deductions").notNull().default(0),
		totalAmount: integer("total_amount").notNull(),
		currency: text("currency").notNull().default("ARS"),

		// Concept/description
		concept: text("concept"), // e.g., "Sueldo Enero 2026", "Bono por campeonato"

		// Status and payment
		status: text("status", { enum: enumToPgEnum(PayrollStatus) })
			.$type<PayrollStatus>()
			.notNull()
			.default(PayrollStatus.pending),
		paymentMethod: text("payment_method", {
			enum: enumToPgEnum(TrainingPaymentMethod),
		}).$type<TrainingPaymentMethod>(),
		paymentDate: timestamp("payment_date", { withTimezone: true }),

		// Integration with expenses (when paid, an expense is created)
		expenseId: uuid("expense_id").references(() => expenseTable.id, {
			onDelete: "set null",
		}),

		// Notes
		notes: text("notes"),

		// Audit trail
		createdBy: uuid("created_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		approvedBy: uuid("approved_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		approvedAt: timestamp("approved_at", { withTimezone: true }),
		paidBy: uuid("paid_by").references(() => userTable.id, {
			onDelete: "set null",
		}),

		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("staff_payroll_org_idx").on(table.organizationId),
		index("staff_payroll_coach_idx").on(table.coachId),
		index("staff_payroll_user_idx").on(table.userId),
		index("staff_payroll_status_idx").on(table.status),
		index("staff_payroll_period_idx").on(table.periodStart, table.periodEnd),
		index("staff_payroll_staff_type_idx").on(table.staffType),
		// Constraint: period end must be after period start
		check(
			"staff_payroll_period_check",
			sql`${table.periodEnd} > ${table.periodStart}`,
		),
	],
);

// ============================================================================
// EVENT TEMPLATES
// ============================================================================

/**
 * Event templates - Reusable configurations for creating events
 * Templates store all event configuration as a JSON blob for flexibility
 * Dates are stored as day offsets from the event start date
 */
export const eventTemplateTable = pgTable(
	"event_template",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),

		// Template metadata
		name: text("name").notNull(),
		description: text("description"),
		category: text("category"), // e.g., "Summer Camps", "Tournaments", "Clinics"
		isActive: boolean("is_active").notNull().default(true),
		usageCount: integer("usage_count").notNull().default(0),

		// Base event config
		eventType: text("event_type", { enum: enumToPgEnum(EventType) })
			.$type<EventType>()
			.notNull()
			.default(EventType.campus),
		defaultTitle: text("default_title"),
		defaultDescription: text("default_description"),
		defaultDurationDays: integer("default_duration_days").default(1),

		// Capacity settings
		maxCapacity: integer("max_capacity"),
		enableWaitlist: boolean("enable_waitlist").notNull().default(true),
		maxWaitlistSize: integer("max_waitlist_size"),

		// Registration options
		allowPublicRegistration: boolean("allow_public_registration")
			.notNull()
			.default(true),
		allowEarlyAccessForMembers: boolean("allow_early_access_for_members")
			.notNull()
			.default(false),
		memberEarlyAccessDays: integer("member_early_access_days").default(7),
		requiresApproval: boolean("requires_approval").notNull().default(false),

		// Payment settings
		currency: text("currency").notNull().default("ARS"),
		acceptedPaymentMethods: text("accepted_payment_methods"), // JSON array

		// Contact info
		contactEmail: text("contact_email"),
		contactPhone: text("contact_phone"),
		coverImageUrl: text("cover_image_url"),

		// Template data - JSON containing all sub-entity configurations
		// Structure: { ageCategories, pricingTiers, discounts, checklists, tasks, staffRoles, budgetLines, milestones, zones, inventory, risks, sponsorTiers }
		templateData: text("template_data"),

		// Source event (if created from existing event)
		sourceEventId: uuid("source_event_id").references(
			() => sportsEventTable.id,
			{ onDelete: "set null" },
		),

		// Audit
		createdBy: uuid("created_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("event_template_org_id_idx").on(table.organizationId),
		index("event_template_category_idx").on(table.category),
		index("event_template_event_type_idx").on(table.eventType),
		index("event_template_is_active_idx").on(table.isActive),
		uniqueIndex("event_template_org_name_unique").on(
			table.organizationId,
			table.name,
		),
	],
);

// ============================================================================
// EVENT ROTATION SCHEDULE TABLES
// ============================================================================

/**
 * Event groups - groups of athletes specific to an event
 * Used for organizing rotations during sports events
 */
export const eventGroupTable = pgTable(
	"event_group",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		eventId: uuid("event_id")
			.notNull()
			.references(() => sportsEventTable.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),

		// Group info
		name: text("name").notNull(),
		description: text("description"),
		color: text("color").notNull().default("#6366f1"), // For visualization
		sortOrder: integer("sort_order").notNull().default(0),

		// Leader/coach (optional)
		leaderId: uuid("leader_id").references(() => eventStaffTable.id, {
			onDelete: "set null",
		}),

		// Capacity
		maxCapacity: integer("max_capacity"),

		// Audit
		createdBy: uuid("created_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("event_group_event_id_idx").on(table.eventId),
		index("event_group_organization_id_idx").on(table.organizationId),
		uniqueIndex("event_group_event_name_unique").on(table.eventId, table.name),
	],
);

/**
 * Event group members - athletes assigned to event groups
 * Links event registrations to groups
 */
export const eventGroupMemberTable = pgTable(
	"event_group_member",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		groupId: uuid("group_id")
			.notNull()
			.references(() => eventGroupTable.id, { onDelete: "cascade" }),
		registrationId: uuid("registration_id")
			.notNull()
			.references(() => eventRegistrationTable.id, { onDelete: "cascade" }),

		// Assignment order within group
		sortOrder: integer("sort_order").notNull().default(0),
		notes: text("notes"),

		assignedAt: timestamp("assigned_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		assignedBy: uuid("assigned_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
	},
	(table) => [
		index("event_group_member_group_id_idx").on(table.groupId),
		index("event_group_member_registration_id_idx").on(table.registrationId),
		uniqueIndex("event_group_member_unique").on(
			table.groupId,
			table.registrationId,
		),
	],
);

/**
 * Event stations - workstations/activity stations for event rotations
 * Athletes rotate through these stations during the event
 */
export const eventStationTable = pgTable(
	"event_station",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		eventId: uuid("event_id")
			.notNull()
			.references(() => sportsEventTable.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),

		// Station info
		name: text("name").notNull(),
		description: text("description"),
		color: text("color").notNull().default("#10b981"),

		// Structured content (JSON)
		// Format: { instructions, staffInstructions, materials: [{name, quantity, checked}], attachments: [{key, name, type}] }
		content: jsonb("content"),

		// Physical setup
		capacity: integer("capacity"),
		zoneId: uuid("zone_id").references(() => eventZoneTable.id, {
			onDelete: "set null",
		}),
		locationNotes: text("location_notes"),

		// Ordering
		sortOrder: integer("sort_order").notNull().default(0),
		isActive: boolean("is_active").notNull().default(true),

		// Audit
		createdBy: uuid("created_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("event_station_event_id_idx").on(table.eventId),
		index("event_station_organization_id_idx").on(table.organizationId),
		index("event_station_zone_id_idx").on(table.zoneId),
		index("event_station_is_active_idx").on(table.isActive),
	],
);

/**
 * Event station staff - staff assigned to specific stations
 */
export const eventStationStaffTable = pgTable(
	"event_station_staff",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		stationId: uuid("station_id")
			.notNull()
			.references(() => eventStationTable.id, { onDelete: "cascade" }),
		staffId: uuid("staff_id")
			.notNull()
			.references(() => eventStaffTable.id, { onDelete: "cascade" }),

		// Role at this station
		roleAtStation: text("role_at_station"), // e.g., "lead", "assistant"
		isPrimary: boolean("is_primary").notNull().default(false),
		notes: text("notes"),

		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("event_station_staff_station_id_idx").on(table.stationId),
		index("event_station_staff_staff_id_idx").on(table.staffId),
		uniqueIndex("event_station_staff_unique").on(
			table.stationId,
			table.staffId,
		),
	],
);

/**
 * Event rotation schedule - master schedule configuration for an event
 * One schedule per event
 */
export const eventRotationScheduleTable = pgTable(
	"event_rotation_schedule",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		eventId: uuid("event_id")
			.notNull()
			.references(() => sportsEventTable.id, { onDelete: "cascade" })
			.unique(), // One schedule per event
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),

		// Schedule configuration
		name: text("name").notNull().default("Rotation Schedule"),
		scheduleDate: timestamp("schedule_date", { withTimezone: true }).notNull(),
		startTime: timestamp("start_time", { withTimezone: true }).notNull(),
		endTime: timestamp("end_time", { withTimezone: true }).notNull(),

		// Default rotation duration (in minutes)
		defaultRotationDuration: integer("default_rotation_duration")
			.notNull()
			.default(30),

		// Number of rotations (auto-calculated or manual)
		totalRotations: integer("total_rotations"),

		// Status
		isPublished: boolean("is_published").notNull().default(false),
		isLocked: boolean("is_locked").notNull().default(false),

		notes: text("notes"),

		// Audit
		createdBy: uuid("created_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("event_rotation_schedule_event_id_idx").on(table.eventId),
		index("event_rotation_schedule_organization_id_idx").on(
			table.organizationId,
		),
		check(
			"event_rotation_schedule_valid_time",
			sql`${table.endTime} > ${table.startTime}`,
		),
	],
);

/**
 * Event time blocks - individual time blocks in the rotation schedule
 * Can be station rotations, breaks, or general activities
 */
export const eventTimeBlockTable = pgTable(
	"event_time_block",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		scheduleId: uuid("schedule_id")
			.notNull()
			.references(() => eventRotationScheduleTable.id, { onDelete: "cascade" }),

		// Block info
		blockType: text("block_type", { enum: enumToPgEnum(EventTimeBlockType) })
			.$type<EventTimeBlockType>()
			.notNull(),
		name: text("name"), // For breaks/activities: "Lunch Break", "Opening Ceremony"
		description: text("description"),

		// Timing
		startTime: timestamp("start_time", { withTimezone: true }).notNull(),
		endTime: timestamp("end_time", { withTimezone: true }).notNull(),
		durationMinutes: integer("duration_minutes").notNull(),

		// Sequence order
		blockOrder: integer("block_order").notNull(),

		// For station_rotation blocks: which rotation number is this?
		rotationNumber: integer("rotation_number"),

		// For break blocks: which zone is this break in?
		zoneId: uuid("zone_id").references(() => eventZoneTable.id, {
			onDelete: "set null",
		}),

		// Styling
		color: text("color"),

		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("event_time_block_schedule_id_idx").on(table.scheduleId),
		index("event_time_block_block_order_idx").on(table.blockOrder),
		index("event_time_block_block_type_idx").on(table.blockType),
		index("event_time_block_zone_id_idx").on(table.zoneId),
		check(
			"event_time_block_valid_time",
			sql`${table.endTime} > ${table.startTime}`,
		),
	],
);

/**
 * Event rotation assignments - which group goes to which station for each time block
 * One entry per group per station rotation time block
 */
export const eventRotationAssignmentTable = pgTable(
	"event_rotation_assignment",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		timeBlockId: uuid("time_block_id")
			.notNull()
			.references(() => eventTimeBlockTable.id, { onDelete: "cascade" }),
		groupId: uuid("group_id")
			.notNull()
			.references(() => eventGroupTable.id, { onDelete: "cascade" }),
		stationId: uuid("station_id")
			.notNull()
			.references(() => eventStationTable.id, { onDelete: "cascade" }),

		// Notes specific to this rotation assignment
		notes: text("notes"),

		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("event_rotation_assignment_time_block_id_idx").on(table.timeBlockId),
		index("event_rotation_assignment_group_id_idx").on(table.groupId),
		index("event_rotation_assignment_station_id_idx").on(table.stationId),
		// Each group can only be in one station per time block
		uniqueIndex("event_rotation_assignment_block_group_unique").on(
			table.timeBlockId,
			table.groupId,
		),
		// Each station can only have one group per time block
		uniqueIndex("event_rotation_assignment_block_station_unique").on(
			table.timeBlockId,
			table.stationId,
		),
	],
);

// ============================================================================
// TEAM / SQUAD MANAGEMENT TABLES
// ============================================================================

/**
 * Season - organizes teams and competitions by time periods
 */
export const seasonTable = pgTable(
	"season",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),

		name: text("name").notNull(), // e.g., "2024-2025", "Summer 2024"
		startDate: timestamp("start_date", { withTimezone: true }).notNull(),
		endDate: timestamp("end_date", { withTimezone: true }).notNull(),

		isActive: boolean("is_active").notNull().default(true),
		isCurrent: boolean("is_current").notNull().default(false), // Only one per org

		// Audit
		createdBy: uuid("created_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("season_organization_id_idx").on(table.organizationId),
		index("season_is_active_idx").on(table.isActive),
		index("season_is_current_idx").on(table.isCurrent),
		uniqueIndex("season_org_name_unique").on(table.organizationId, table.name),
		check("season_valid_dates", sql`${table.endDate} > ${table.startDate}`),
	],
);

/**
 * Team - competitive squads/planteles for competitions
 */
export const teamTable = pgTable(
	"team",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),
		seasonId: uuid("season_id").references(() => seasonTable.id, {
			onDelete: "set null",
		}),

		name: text("name").notNull(),
		description: text("description"),
		sport: text("sport", {
			enum: enumToPgEnum(AthleteSport),
		}).$type<AthleteSport>(),
		ageCategoryId: uuid("age_category_id").references(
			() => ageCategoryTable.id,
			{
				onDelete: "set null",
			},
		),

		// Branding
		logoKey: text("logo_key"), // S3 key for team logo
		primaryColor: text("primary_color").default("#3B82F6"),
		secondaryColor: text("secondary_color").default("#1E40AF"),

		// Status
		status: text("status", { enum: enumToPgEnum(TeamStatus) })
			.$type<TeamStatus>()
			.notNull()
			.default(TeamStatus.active),

		// Home venue
		homeVenue: text("home_venue"),

		// Audit
		createdBy: uuid("created_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("team_organization_id_idx").on(table.organizationId),
		index("team_season_id_idx").on(table.seasonId),
		index("team_sport_idx").on(table.sport),
		index("team_status_idx").on(table.status),
		index("team_age_category_id_idx").on(table.ageCategoryId),
		uniqueIndex("team_org_season_name_unique").on(
			table.organizationId,
			table.seasonId,
			table.name,
		),
	],
);

/**
 * Team member - athletes assigned to teams
 */
export const teamMemberTable = pgTable(
	"team_member",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teamTable.id, { onDelete: "cascade" }),
		athleteId: uuid("athlete_id")
			.notNull()
			.references(() => athleteTable.id, { onDelete: "cascade" }),

		jerseyNumber: integer("jersey_number"),
		position: text("position"), // Sport-specific position
		role: text("role", { enum: enumToPgEnum(TeamMemberRole) })
			.$type<TeamMemberRole>()
			.notNull()
			.default(TeamMemberRole.player),

		// Historical tracking
		joinedAt: timestamp("joined_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		leftAt: timestamp("left_at", { withTimezone: true }),

		notes: text("notes"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("team_member_team_id_idx").on(table.teamId),
		index("team_member_athlete_id_idx").on(table.athleteId),
		uniqueIndex("team_member_team_athlete_unique").on(
			table.teamId,
			table.athleteId,
		),
		// Jersey numbers unique per team (when not null)
		uniqueIndex("team_member_jersey_unique")
			.on(table.teamId, table.jerseyNumber)
			.where(sql`jersey_number IS NOT NULL`),
	],
);

/**
 * Team staff - technical and support staff assigned to teams
 */
export const teamStaffTable = pgTable(
	"team_staff",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teamTable.id, { onDelete: "cascade" }),
		coachId: uuid("coach_id").references(() => coachTable.id, {
			onDelete: "cascade",
		}),
		userId: uuid("user_id").references(() => userTable.id, {
			onDelete: "cascade",
		}), // For non-coach staff

		role: text("role", { enum: enumToPgEnum(TeamStaffRole) })
			.$type<TeamStaffRole>()
			.notNull(),
		title: text("title"), // Custom title if needed
		isPrimary: boolean("is_primary").notNull().default(false), // Primary contact for this role

		startDate: timestamp("start_date", { withTimezone: true })
			.notNull()
			.defaultNow(),
		endDate: timestamp("end_date", { withTimezone: true }),

		notes: text("notes"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("team_staff_team_id_idx").on(table.teamId),
		index("team_staff_coach_id_idx").on(table.coachId),
		index("team_staff_user_id_idx").on(table.userId),
		index("team_staff_role_idx").on(table.role),
	],
);

/**
 * Competition - tournaments, leagues, cups
 */
export const competitionTable = pgTable(
	"competition",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),
		seasonId: uuid("season_id").references(() => seasonTable.id, {
			onDelete: "set null",
		}),

		name: text("name").notNull(),
		description: text("description"),
		type: text("type", { enum: enumToPgEnum(CompetitionType) })
			.$type<CompetitionType>()
			.notNull(),
		sport: text("sport", {
			enum: enumToPgEnum(AthleteSport),
		}).$type<AthleteSport>(),

		startDate: timestamp("start_date", { withTimezone: true }),
		endDate: timestamp("end_date", { withTimezone: true }),
		status: text("status", { enum: enumToPgEnum(CompetitionStatus) })
			.$type<CompetitionStatus>()
			.notNull()
			.default(CompetitionStatus.upcoming),

		logoKey: text("logo_key"),
		externalId: text("external_id"), // For linking to external leagues
		venue: text("venue"),
		rules: text("rules"),

		// Audit
		createdBy: uuid("created_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("competition_organization_id_idx").on(table.organizationId),
		index("competition_season_id_idx").on(table.seasonId),
		index("competition_type_idx").on(table.type),
		index("competition_status_idx").on(table.status),
		index("competition_sport_idx").on(table.sport),
	],
);

/**
 * Team competition - team inscriptions/registrations in competitions
 */
export const teamCompetitionTable = pgTable(
	"team_competition",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teamTable.id, { onDelete: "cascade" }),
		competitionId: uuid("competition_id")
			.notNull()
			.references(() => competitionTable.id, { onDelete: "cascade" }),

		status: text("status", { enum: enumToPgEnum(TeamCompetitionStatus) })
			.$type<TeamCompetitionStatus>()
			.notNull()
			.default(TeamCompetitionStatus.registered),

		registeredAt: timestamp("registered_at", { withTimezone: true })
			.notNull()
			.defaultNow(),

		// Competition details
		division: text("division"), // e.g., "Group A", "Division 1"
		seedPosition: integer("seed_position"),
		finalPosition: integer("final_position"),

		// Statistics
		points: integer("points").default(0),
		wins: integer("wins").default(0),
		draws: integer("draws").default(0),
		losses: integer("losses").default(0),
		goalsFor: integer("goals_for").default(0),
		goalsAgainst: integer("goals_against").default(0),

		notes: text("notes"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("team_competition_team_id_idx").on(table.teamId),
		index("team_competition_competition_id_idx").on(table.competitionId),
		index("team_competition_status_idx").on(table.status),
		uniqueIndex("team_competition_unique").on(
			table.teamId,
			table.competitionId,
		),
	],
);

/**
 * Match - individual games/encounters
 */
export const matchTable = pgTable(
	"match",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),
		competitionId: uuid("competition_id").references(
			() => competitionTable.id,
			{
				onDelete: "set null",
			},
		),

		// Teams (one must be ours, other can be external)
		homeTeamId: uuid("home_team_id").references(() => teamTable.id, {
			onDelete: "set null",
		}),
		awayTeamId: uuid("away_team_id").references(() => teamTable.id, {
			onDelete: "set null",
		}),
		opponentName: text("opponent_name"), // For matches against external teams
		isHomeGame: boolean("is_home_game").default(true),

		// Scheduling
		scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
		startedAt: timestamp("started_at", { withTimezone: true }),
		endedAt: timestamp("ended_at", { withTimezone: true }),
		status: text("status", { enum: enumToPgEnum(MatchStatus) })
			.$type<MatchStatus>()
			.notNull()
			.default(MatchStatus.scheduled),

		// Location
		venue: text("venue"),
		locationId: uuid("location_id").references(() => locationTable.id, {
			onDelete: "set null",
		}),

		// Score
		homeScore: integer("home_score"),
		awayScore: integer("away_score"),
		homeScoreHT: integer("home_score_ht"), // Half-time
		awayScoreHT: integer("away_score_ht"),

		// Result (from our team's perspective)
		result: text("result", {
			enum: enumToPgEnum(MatchResultType),
		}).$type<MatchResultType>(),

		// Competition details
		round: text("round"), // e.g., "Round 5", "Quarter-final"
		matchday: integer("matchday"),

		// Additional info
		referee: text("referee"),
		attendance: integer("attendance"),

		// Notes and analysis
		preMatchNotes: text("pre_match_notes"),
		postMatchNotes: text("post_match_notes"),
		highlights: text("highlights"),

		// Audit
		createdBy: uuid("created_by").references(() => userTable.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("match_organization_id_idx").on(table.organizationId),
		index("match_competition_id_idx").on(table.competitionId),
		index("match_home_team_id_idx").on(table.homeTeamId),
		index("match_away_team_id_idx").on(table.awayTeamId),
		index("match_scheduled_at_idx").on(table.scheduledAt),
		index("match_status_idx").on(table.status),
		index("match_location_id_idx").on(table.locationId),
	],
);

// ============================================================================
// SESSION CONFIRMATION HISTORY
// ============================================================================

// Tracks every confirmation notification sent for training sessions
export const sessionConfirmationHistoryTable = pgTable(
	"session_confirmation_history",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),
		sessionId: uuid("session_id")
			.notNull()
			.references(() => trainingSessionTable.id, { onDelete: "cascade" }),
		athleteId: uuid("athlete_id")
			.notNull()
			.references(() => athleteTable.id, { onDelete: "cascade" }),

		// Notification details
		channel: text("channel", {
			enum: enumToPgEnum(NotificationChannel),
		})
			.$type<NotificationChannel>()
			.notNull(),
		status: text("status", {
			enum: enumToPgEnum(ConfirmationStatus),
		})
			.$type<ConfirmationStatus>()
			.notNull()
			.default(ConfirmationStatus.sent),

		// Timestamps
		sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
		confirmedAt: timestamp("confirmed_at", { withTimezone: true }),

		// Error tracking
		errorMessage: text("error_message"),

		// Trigger.dev job ID for tracking
		triggerJobId: text("trigger_job_id"),

		// Batch ID to group bulk sends
		batchId: uuid("batch_id"),

		// Who initiated the send
		initiatedBy: uuid("initiated_by").references(() => userTable.id, {
			onDelete: "set null",
		}),

		// Audit
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("confirmation_history_org_idx").on(table.organizationId),
		index("confirmation_history_session_idx").on(table.sessionId),
		index("confirmation_history_athlete_idx").on(table.athleteId),
		index("confirmation_history_batch_idx").on(table.batchId),
		index("confirmation_history_status_idx").on(table.status),
		index("confirmation_history_org_sent_idx").on(
			table.organizationId,
			table.sentAt,
		),
	],
);

// ============================================================================
// USER NOTIFICATION SETTINGS
// ============================================================================

// User notification preferences per organization
export const userNotificationSettingsTable = pgTable(
	"user_notification_settings",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: uuid("user_id")
			.notNull()
			.references(() => userTable.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationTable.id, { onDelete: "cascade" }),

		// Channel preferences
		preferredChannel: text("preferred_channel", {
			enum: enumToPgEnum(NotificationChannel),
		})
			.$type<NotificationChannel>()
			.notNull()
			.default(NotificationChannel.email),

		// Notification type toggles
		trainingReminders: boolean("training_reminders").notNull().default(true),
		paymentReminders: boolean("payment_reminders").notNull().default(true),
		marketingNotifications: boolean("marketing_notifications")
			.notNull()
			.default(false),

		// Audit
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		uniqueIndex("user_notification_settings_unique").on(
			table.userId,
			table.organizationId,
		),
		index("user_notification_settings_user_idx").on(table.userId),
		index("user_notification_settings_org_idx").on(table.organizationId),
	],
);
