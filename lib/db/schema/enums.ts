// Invitation status enum (matches Better Auth)
export const InvitationStatus = {
	pending: "pending",
	accepted: "accepted",
	rejected: "rejected",
	canceled: "canceled",
} as const;
export type InvitationStatus =
	(typeof InvitationStatus)[keyof typeof InvitationStatus];
export const InvitationStatuses = Object.values(InvitationStatus);

// Member role enum
export const MemberRole = {
	owner: "owner",
	admin: "admin",
	member: "member",
	coach: "coach",
	athlete: "athlete",
} as const;
export type MemberRole = (typeof MemberRole)[keyof typeof MemberRole];
export const MemberRoles = Object.values(MemberRole);

// User role enum
export const UserRole = {
	user: "user",
	admin: "admin",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
export const UserRoles = Object.values(UserRole);

// Order type enum (for billing)
export const OrderType = {
	subscription: "subscription",
	oneTime: "one_time",
} as const;
export type OrderType = (typeof OrderType)[keyof typeof OrderType];
export const OrderTypes = Object.values(OrderType);

// Subscription status enum (matches Stripe subscription statuses)
export const SubscriptionStatus = {
	active: "active",
	canceled: "canceled",
	incomplete: "incomplete",
	incompleteExpired: "incomplete_expired",
	pastDue: "past_due",
	paused: "paused",
	trialing: "trialing",
	unpaid: "unpaid",
} as const;
export type SubscriptionStatus =
	(typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];
export const SubscriptionStatuses = Object.values(SubscriptionStatus);

// Billing interval enum
export const BillingInterval = {
	month: "month",
	year: "year",
	week: "week",
	day: "day",
} as const;
export type BillingInterval =
	(typeof BillingInterval)[keyof typeof BillingInterval];
export const BillingIntervals = Object.values(BillingInterval);

// Price type enum (recurring vs one-time)
export const PriceType = {
	recurring: "recurring",
	oneTime: "one_time",
} as const;
export type PriceType = (typeof PriceType)[keyof typeof PriceType];
export const PriceTypes = Object.values(PriceType);

// Price model enum (flat, per-seat, metered)
export const PriceModel = {
	flat: "flat",
	perSeat: "per_seat",
	metered: "metered",
} as const;
export type PriceModel = (typeof PriceModel)[keyof typeof PriceModel];
export const PriceModels = Object.values(PriceModel);

// Order status enum (for one-time payments)
export const OrderStatus = {
	pending: "pending",
	completed: "completed",
	failed: "failed",
	refunded: "refunded",
	partiallyRefunded: "partially_refunded",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];
export const OrderStatuses = Object.values(OrderStatus);

// Credit transaction type enum
export const CreditTransactionType = {
	purchase: "purchase", // User bought credits
	subscriptionGrant: "subscription_grant", // Monthly subscription allocation
	bonus: "bonus", // Bonus from package purchase
	promo: "promo", // Promotional credits (coupon, referral)
	usage: "usage", // Credits consumed by AI
	refund: "refund", // Credits refunded
	expire: "expire", // Credits expired
	adjustment: "adjustment", // Manual admin adjustment
} as const;
export type CreditTransactionType =
	(typeof CreditTransactionType)[keyof typeof CreditTransactionType];
export const CreditTransactionTypes = Object.values(CreditTransactionType);

// Coach status enum
export const CoachStatus = {
	active: "active",
	inactive: "inactive",
} as const;
export type CoachStatus = (typeof CoachStatus)[keyof typeof CoachStatus];
export const CoachStatuses = Object.values(CoachStatus);

// Athlete status enum
export const AthleteStatus = {
	active: "active",
	inactive: "inactive",
} as const;
export type AthleteStatus = (typeof AthleteStatus)[keyof typeof AthleteStatus];
export const AthleteStatuses = Object.values(AthleteStatus);

// Athlete level enum
export const AthleteLevel = {
	beginner: "beginner",
	intermediate: "intermediate",
	advanced: "advanced",
	elite: "elite",
} as const;
export type AthleteLevel = (typeof AthleteLevel)[keyof typeof AthleteLevel];
export const AthleteLevels = Object.values(AthleteLevel);

// Dominant side enum (for foot/hand preference)
export const DominantSide = {
	right: "right",
	left: "left",
	both: "both",
} as const;
export type DominantSide = (typeof DominantSide)[keyof typeof DominantSide];
export const DominantSides = Object.values(DominantSide);

// Fitness test type enum
export const FitnessTestType = {
	sprint40m: "sprint_40m",
	sprint60m: "sprint_60m",
	sprint100m: "sprint_100m",
	verticalJump: "vertical_jump",
	standingLongJump: "standing_long_jump",
	yoYoTest: "yo_yo_test",
	beepTest: "beep_test",
	cooperTest: "cooper_test",
	agilityTTest: "agility_t_test",
	illinoisAgility: "illinois_agility",
	maxSpeed: "max_speed",
	reactionTime: "reaction_time",
	flexibility: "flexibility",
	plankHold: "plank_hold",
	pushUps: "push_ups",
	sitUps: "sit_ups",
	other: "other",
} as const;
export type FitnessTestType =
	(typeof FitnessTestType)[keyof typeof FitnessTestType];
export const FitnessTestTypes = Object.values(FitnessTestType);

// Training session status enum
export const TrainingSessionStatus = {
	pending: "pending",
	confirmed: "confirmed",
	completed: "completed",
	cancelled: "cancelled",
} as const;
export type TrainingSessionStatus =
	(typeof TrainingSessionStatus)[keyof typeof TrainingSessionStatus];
export const TrainingSessionStatuses = Object.values(TrainingSessionStatus);

// Attendance status enum
export const AttendanceStatus = {
	pending: "pending",
	present: "present",
	absent: "absent",
	late: "late",
	excused: "excused",
} as const;
export type AttendanceStatus =
	(typeof AttendanceStatus)[keyof typeof AttendanceStatus];
export const AttendanceStatuses = Object.values(AttendanceStatus);

// Training payment status enum
export const TrainingPaymentStatus = {
	pending: "pending",
	paid: "paid",
	partial: "partial",
	cancelled: "cancelled",
} as const;
export type TrainingPaymentStatus =
	(typeof TrainingPaymentStatus)[keyof typeof TrainingPaymentStatus];
export const TrainingPaymentStatuses = Object.values(TrainingPaymentStatus);

// Training payment method enum
export const TrainingPaymentMethod = {
	cash: "cash",
	bankTransfer: "bank_transfer",
	mercadoPago: "mercado_pago",
	card: "card",
	other: "other",
} as const;
export type TrainingPaymentMethod =
	(typeof TrainingPaymentMethod)[keyof typeof TrainingPaymentMethod];
export const TrainingPaymentMethods = Object.values(TrainingPaymentMethod);

// Sports event type enum
export const EventType = {
	campus: "campus",
	camp: "camp",
	clinic: "clinic",
	showcase: "showcase",
	tournament: "tournament",
	tryout: "tryout",
	other: "other",
} as const;
export type EventType = (typeof EventType)[keyof typeof EventType];
export const EventTypes = Object.values(EventType);

// Sports event status enum
export const EventStatus = {
	draft: "draft",
	published: "published",
	registrationOpen: "registration_open",
	registrationClosed: "registration_closed",
	inProgress: "in_progress",
	completed: "completed",
	cancelled: "cancelled",
} as const;
export type EventStatus = (typeof EventStatus)[keyof typeof EventStatus];
export const EventStatuses = Object.values(EventStatus);

// Event registration status enum
export const EventRegistrationStatus = {
	pendingPayment: "pending_payment",
	confirmed: "confirmed",
	waitlist: "waitlist",
	cancelled: "cancelled",
	refunded: "refunded",
	noShow: "no_show",
} as const;
export type EventRegistrationStatus =
	(typeof EventRegistrationStatus)[keyof typeof EventRegistrationStatus];
export const EventRegistrationStatuses = Object.values(EventRegistrationStatus);

// Pricing tier type enum
export const PricingTierType = {
	dateBased: "date_based",
	capacityBased: "capacity_based",
} as const;
export type PricingTierType =
	(typeof PricingTierType)[keyof typeof PricingTierType];
export const PricingTierTypes = Object.values(PricingTierType);

// Event payment method enum
export const EventPaymentMethod = {
	cash: "cash",
	bankTransfer: "bank_transfer",
	mercadoPago: "mercado_pago",
	stripe: "stripe",
	card: "card",
	other: "other",
} as const;
export type EventPaymentMethod =
	(typeof EventPaymentMethod)[keyof typeof EventPaymentMethod];
export const EventPaymentMethods = Object.values(EventPaymentMethod);

// Event payment status enum
export const EventPaymentStatus = {
	pending: "pending",
	processing: "processing",
	paid: "paid",
	partial: "partial",
	failed: "failed",
	refunded: "refunded",
	cancelled: "cancelled",
} as const;
export type EventPaymentStatus =
	(typeof EventPaymentStatus)[keyof typeof EventPaymentStatus];
export const EventPaymentStatuses = Object.values(EventPaymentStatus);

// Expense category type enum
export const ExpenseCategoryType = {
	operational: "operational", // Rent, utilities, equipment, materials
	personnel: "personnel", // Salaries, commissions, bonuses
	other: "other",
} as const;
export type ExpenseCategoryType =
	(typeof ExpenseCategoryType)[keyof typeof ExpenseCategoryType];
export const ExpenseCategoryTypes = Object.values(ExpenseCategoryType);

// Cash register status enum
export const CashRegisterStatus = {
	open: "open",
	closed: "closed",
} as const;
export type CashRegisterStatus =
	(typeof CashRegisterStatus)[keyof typeof CashRegisterStatus];
export const CashRegisterStatuses = Object.values(CashRegisterStatus);

// Cash movement type enum
export const CashMovementType = {
	income: "income",
	expense: "expense",
	adjustment: "adjustment",
} as const;
export type CashMovementType =
	(typeof CashMovementType)[keyof typeof CashMovementType];
export const CashMovementTypes = Object.values(CashMovementType);

// Cash movement reference type enum
export const CashMovementReferenceType = {
	trainingPayment: "training_payment",
	eventPayment: "event_payment",
	expense: "expense",
	manual: "manual",
} as const;
export type CashMovementReferenceType =
	(typeof CashMovementReferenceType)[keyof typeof CashMovementReferenceType];
export const CashMovementReferenceTypes = Object.values(
	CashMovementReferenceType,
);

export function enumToPgEnum<T extends Record<string, string>>(myEnum: T) {
	return Object.values(myEnum).map((value) => value) as [
		T[keyof T],
		...T[keyof T][],
	];
}
