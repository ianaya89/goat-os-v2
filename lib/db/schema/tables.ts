import { sql } from "drizzle-orm";
import {
	boolean,
	check,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import {
	AthleteLevel,
	AthleteStatus,
	AttendanceStatus,
	BillingInterval,
	CashMovementReferenceType,
	CashMovementType,
	CashRegisterStatus,
	CoachStatus,
	CreditTransactionType,
	DominantSide,
	EventPaymentMethod,
	EventPaymentStatus,
	EventRegistrationStatus,
	EventStatus,
	EventType,
	ExpenseCategoryType,
	enumToPgEnum,
	FitnessTestType,
	InvitationStatus,
	MemberRole,
	OrderStatus,
	PriceModel,
	PriceType,
	PricingTierType,
	SubscriptionStatus,
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
		image: text("image"),
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
		specialty: text("specialty").notNull(),
		bio: text("bio"),
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
	},
	(table) => [
		index("coach_organization_id_idx").on(table.organizationId),
		index("coach_user_id_idx").on(table.userId),
		index("coach_status_idx").on(table.status),
		index("coach_created_at_idx").on(table.createdAt),
		// Composite index for common query: coaches by organization and status
		index("coach_org_status_idx").on(table.organizationId, table.status),
		// Unique constraint: one coach per user per organization
		uniqueIndex("coach_org_user_unique").on(table.organizationId, table.userId),
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

		// Contact information
		phone: text("phone"), // Phone number in E.164 format for SMS/WhatsApp notifications

		// Club and category information
		currentClub: text("current_club"), // Current club or team name
		category: text("category"), // Age category or division (e.g., "Sub-17", "Primera")

		// Profile information
		nationality: text("nationality"),
		position: text("position"), // Primary position (varies by sport)
		secondaryPosition: text("secondary_position"),
		jerseyNumber: integer("jersey_number"),
		profilePhotoUrl: text("profile_photo_url"),
		bio: text("bio"), // Scout notes or player bio
		yearsOfExperience: integer("years_of_experience"),

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
		index("athlete_organization_id_idx").on(table.organizationId),
		index("athlete_user_id_idx").on(table.userId),
		index("athlete_sport_idx").on(table.sport),
		index("athlete_level_idx").on(table.level),
		index("athlete_status_idx").on(table.status),
		index("athlete_created_at_idx").on(table.createdAt),
		// Composite index for common query: athletes by organization and status
		index("athlete_org_status_idx").on(table.organizationId, table.status),
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
		ageCategoryId: uuid("age_category_id"),
		maxCapacity: integer("max_capacity"),
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
		index("athlete_group_organization_id_idx").on(table.organizationId),
		index("athlete_group_name_idx").on(table.name),
		index("athlete_group_is_active_idx").on(table.isActive),
		index("athlete_group_age_category_id_idx").on(table.ageCategoryId),
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
		clubName: text("club_name").notNull(),
		startDate: timestamp("start_date", { withTimezone: true }),
		endDate: timestamp("end_date", { withTimezone: true }),
		position: text("position"),
		achievements: text("achievements"), // Can store JSON or comma-separated list
		wasNationalTeam: boolean("was_national_team").notNull().default(false),
		nationalTeamLevel: text("national_team_level"), // e.g., "U17", "U20", "Senior"
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
		name: text("name").notNull(), // e.g., "Sub-12", "Sub-15"
		displayName: text("display_name").notNull(), // e.g., "12 years and under"
		minAge: integer("min_age"), // Minimum age in years (inclusive)
		maxAge: integer("max_age"), // Maximum age in years (inclusive)
		sortOrder: integer("sort_order").notNull().default(0),
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
		index("age_category_sort_order_idx").on(table.sortOrder),
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

		// References (one must be non-null based on referenceType)
		trainingSessionId: uuid("training_session_id").references(
			() => trainingSessionTable.id,
			{ onDelete: "cascade" },
		),
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
		index("waitlist_entry_training_session_idx").on(table.trainingSessionId),
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
				(${table.referenceType} = 'training_session' AND ${table.trainingSessionId} IS NOT NULL AND ${table.athleteGroupId} IS NULL) OR
				(${table.referenceType} = 'athlete_group' AND ${table.athleteGroupId} IS NOT NULL AND ${table.trainingSessionId} IS NULL)
			`,
		),
	],
);
