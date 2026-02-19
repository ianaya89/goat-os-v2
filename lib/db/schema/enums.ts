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
// Simplified to 4 roles for clearer authorization:
// - owner: Full access (billing, settings, everything)
// - admin: Management access (almost everything except billing)
// - staff: Operational access (coaches, day-to-day operations)
// - member: Basic access (athletes, parents, restricted view)
//
// Note: Coach/Athlete status is determined by coachTable/athleteTable profiles,
// not by the role. This eliminates redundancy and confusion.
export const MemberRole = {
	owner: "owner",
	admin: "admin",
	staff: "staff",
	member: "member",
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

// Coach experience level enum
export const CoachExperienceLevel = {
	amateur: "amateur",
	professional: "professional",
	nationalTeam: "national_team",
} as const;
export type CoachExperienceLevel =
	(typeof CoachExperienceLevel)[keyof typeof CoachExperienceLevel];
export const CoachExperienceLevels = Object.values(CoachExperienceLevel);

// Coach opportunity type enum (LinkedIn-style "Open to Work" for coaches)
export const CoachOpportunityType = {
	headCoach: "head_coach", // Buscando posición de entrenador principal
	assistantCoach: "assistant_coach", // Buscando posición de asistente
	youthCoach: "youth_coach", // Interesado en entrenar categorías juveniles
	privateCoaching: "private_coaching", // Disponible para clases particulares
	consultancy: "consultancy", // Disponible para consultorías
} as const;
export type CoachOpportunityType =
	(typeof CoachOpportunityType)[keyof typeof CoachOpportunityType];
export const CoachOpportunityTypes = Object.values(CoachOpportunityType);

// Athlete status enum
export const AthleteStatus = {
	active: "active",
	inactive: "inactive",
} as const;
export type AthleteStatus = (typeof AthleteStatus)[keyof typeof AthleteStatus];
export const AthleteStatuses = Object.values(AthleteStatus);

// Athlete opportunity type enum (LinkedIn-style "Open to Work")
export const AthleteOpportunityType = {
	professionalTeam: "professional_team", // Buscando equipo/club profesional
	universityScholarship: "university_scholarship", // Becas deportivas universitarias
	tryouts: "tryouts", // Abierto a pruebas
	sponsorship: "sponsorship", // Buscando sponsorship
	coaching: "coaching", // Abierto a coaching
} as const;
export type AthleteOpportunityType =
	(typeof AthleteOpportunityType)[keyof typeof AthleteOpportunityType];
export const AthleteOpportunityTypes = Object.values(AthleteOpportunityType);

// Athlete level enum
export const AthleteLevel = {
	beginner: "beginner",
	intermediate: "intermediate",
	advanced: "advanced",
	elite: "elite",
} as const;
export type AthleteLevel = (typeof AthleteLevel)[keyof typeof AthleteLevel];
export const AthleteLevels = Object.values(AthleteLevel);

// Athlete sport enum
export const AthleteSport = {
	soccer: "soccer",
	basketball: "basketball",
	volleyball: "volleyball",
	tennis: "tennis",
	swimming: "swimming",
	athletics: "athletics",
	rugby: "rugby",
	hockey: "hockey",
	baseball: "baseball",
	handball: "handball",
	padel: "padel",
	golf: "golf",
	boxing: "boxing",
	martialArts: "martial_arts",
	gymnastics: "gymnastics",
	cycling: "cycling",
	running: "running",
	fitness: "fitness",
	crossfit: "crossfit",
	other: "other",
} as const;
export type AthleteSport = (typeof AthleteSport)[keyof typeof AthleteSport];
export const AthleteSports = Object.values(AthleteSport);

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

// Training payment status enum (unified: covers both training and event payments)
export const TrainingPaymentStatus = {
	pending: "pending",
	processing: "processing",
	paid: "paid",
	partial: "partial",
	failed: "failed",
	refunded: "refunded",
	cancelled: "cancelled",
} as const;
export type TrainingPaymentStatus =
	(typeof TrainingPaymentStatus)[keyof typeof TrainingPaymentStatus];
export const TrainingPaymentStatuses = Object.values(TrainingPaymentStatus);

// Training payment method enum (unified: covers both training and event payments)
export const TrainingPaymentMethod = {
	cash: "cash",
	bankTransfer: "bank_transfer",
	mercadoPago: "mercado_pago",
	stripe: "stripe",
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

// Event payment enums (aliases for unified TrainingPayment* enums)
export const EventPaymentMethod = TrainingPaymentMethod;
export type EventPaymentMethod = TrainingPaymentMethod;
export const EventPaymentMethods = TrainingPaymentMethods;

export const EventPaymentStatus = TrainingPaymentStatus;
export type EventPaymentStatus = TrainingPaymentStatus;
export const EventPaymentStatuses = TrainingPaymentStatuses;

// Expense category type enum
export const ExpenseCategoryType = {
	operational: "operational", // Rent, utilities, equipment, materials
	personnel: "personnel", // Salaries, commissions, bonuses
	other: "other",
} as const;
export type ExpenseCategoryType =
	(typeof ExpenseCategoryType)[keyof typeof ExpenseCategoryType];
export const ExpenseCategoryTypes = Object.values(ExpenseCategoryType);

// Expense category enum (fixed list)
export const ExpenseCategory = {
	fieldRental: "field_rental", // Alquiler de canchas
	equipment: "equipment", // Equipamiento
	sportsMaterials: "sports_materials", // Material deportivo
	transport: "transport", // Transporte
	salaries: "salaries", // Salarios
	commissions: "commissions", // Comisiones
	utilities: "utilities", // Servicios (luz, gas, agua)
	marketing: "marketing", // Marketing y publicidad
	insurance: "insurance", // Seguros
	maintenance: "maintenance", // Mantenimiento
	facilities: "facilities", // Instalaciones
	medical: "medical", // Gastos médicos
	technology: "technology", // Tecnología
	other: "other",
} as const;
export type ExpenseCategory =
	(typeof ExpenseCategory)[keyof typeof ExpenseCategory];
export const ExpenseCategories = Object.values(ExpenseCategory);

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
	payment: "payment",
	eventPayment: "event_payment",
	expense: "expense",
	manual: "manual",
	productSale: "product_sale",
} as const;
export type CashMovementReferenceType =
	(typeof CashMovementReferenceType)[keyof typeof CashMovementReferenceType];
export const CashMovementReferenceTypes = Object.values(
	CashMovementReferenceType,
);

// Waitlist entry status enum
export const WaitlistEntryStatus = {
	waiting: "waiting",
	assigned: "assigned",
	cancelled: "cancelled",
	expired: "expired",
} as const;
export type WaitlistEntryStatus =
	(typeof WaitlistEntryStatus)[keyof typeof WaitlistEntryStatus];
export const WaitlistEntryStatuses = Object.values(WaitlistEntryStatus);

// Waitlist priority enum
export const WaitlistPriority = {
	high: "high",
	medium: "medium",
	low: "low",
} as const;
export type WaitlistPriority =
	(typeof WaitlistPriority)[keyof typeof WaitlistPriority];
export const WaitlistPriorities = Object.values(WaitlistPriority);

// Waitlist reference type enum (for polymorphic reference)
export const WaitlistReferenceType = {
	schedule: "schedule",
	athleteGroup: "athlete_group",
} as const;
export type WaitlistReferenceType =
	(typeof WaitlistReferenceType)[keyof typeof WaitlistReferenceType];
export const WaitlistReferenceTypes = Object.values(WaitlistReferenceType);

// Days of week enum for waitlist schedules
export const DayOfWeek = {
	monday: "monday",
	tuesday: "tuesday",
	wednesday: "wednesday",
	thursday: "thursday",
	friday: "friday",
	saturday: "saturday",
	sunday: "sunday",
} as const;
export type DayOfWeek = (typeof DayOfWeek)[keyof typeof DayOfWeek];
export const DaysOfWeek = Object.values(DayOfWeek);

// ============================================================================
// EVENT ORGANIZATION ENUMS
// ============================================================================

// Event checklist item status
export const EventChecklistStatus = {
	pending: "pending",
	completed: "completed",
} as const;
export type EventChecklistStatus =
	(typeof EventChecklistStatus)[keyof typeof EventChecklistStatus];
export const EventChecklistStatuses = Object.values(EventChecklistStatus);

// Event task status (Kanban columns)
export const EventTaskStatus = {
	todo: "todo",
	inProgress: "in_progress",
	done: "done",
} as const;
export type EventTaskStatus =
	(typeof EventTaskStatus)[keyof typeof EventTaskStatus];
export const EventTaskStatuses = Object.values(EventTaskStatus);

// Event task priority
export const EventTaskPriority = {
	low: "low",
	medium: "medium",
	high: "high",
	urgent: "urgent",
} as const;
export type EventTaskPriority =
	(typeof EventTaskPriority)[keyof typeof EventTaskPriority];
export const EventTaskPriorities = Object.values(EventTaskPriority);

// Event staff type (system user vs external)
export const EventStaffType = {
	systemUser: "system_user",
	external: "external",
} as const;
export type EventStaffType =
	(typeof EventStaffType)[keyof typeof EventStaffType];
export const EventStaffTypes = Object.values(EventStaffType);

// Event staff/volunteer role
export const EventStaffRole = {
	coordinator: "coordinator",
	volunteer: "volunteer",
	security: "security",
	medical: "medical",
	referee: "referee",
	photographer: "photographer",
	technician: "technician",
	catering: "catering",
	logistics: "logistics",
	registration: "registration",
	other: "other",
} as const;
export type EventStaffRole =
	(typeof EventStaffRole)[keyof typeof EventStaffRole];
export const EventStaffRoles = Object.values(EventStaffRole);

// Budget line item status
export const EventBudgetStatus = {
	planned: "planned",
	approved: "approved",
	spent: "spent",
	cancelled: "cancelled",
} as const;
export type EventBudgetStatus =
	(typeof EventBudgetStatus)[keyof typeof EventBudgetStatus];
export const EventBudgetStatuses = Object.values(EventBudgetStatus);

// Sponsor tier/level
export const EventSponsorTier = {
	platinum: "platinum",
	gold: "gold",
	silver: "silver",
	bronze: "bronze",
	partner: "partner",
	supporter: "supporter",
} as const;
export type EventSponsorTier =
	(typeof EventSponsorTier)[keyof typeof EventSponsorTier];
export const EventSponsorTiers = Object.values(EventSponsorTier);

// Sponsor status
export const SponsorStatus = {
	active: "active",
	inactive: "inactive",
	pending: "pending",
} as const;
export type SponsorStatus = (typeof SponsorStatus)[keyof typeof SponsorStatus];
export const SponsorStatuses = Object.values(SponsorStatus);

// Sponsor benefit status
export const EventSponsorBenefitStatus = {
	pending: "pending",
	delivered: "delivered",
	cancelled: "cancelled",
} as const;
export type EventSponsorBenefitStatus =
	(typeof EventSponsorBenefitStatus)[keyof typeof EventSponsorBenefitStatus];
export const EventSponsorBenefitStatuses = Object.values(
	EventSponsorBenefitStatus,
);

// Milestone status
export const EventMilestoneStatus = {
	pending: "pending",
	inProgress: "in_progress",
	completed: "completed",
	delayed: "delayed",
	cancelled: "cancelled",
} as const;
export type EventMilestoneStatus =
	(typeof EventMilestoneStatus)[keyof typeof EventMilestoneStatus];
export const EventMilestoneStatuses = Object.values(EventMilestoneStatus);

// Document type
export const EventDocumentType = {
	contract: "contract",
	permit: "permit",
	insurance: "insurance",
	floorPlan: "floor_plan",
	schedule: "schedule",
	budget: "budget",
	report: "report",
	photo: "photo",
	video: "video",
	other: "other",
} as const;
export type EventDocumentType =
	(typeof EventDocumentType)[keyof typeof EventDocumentType];
export const EventDocumentTypes = Object.values(EventDocumentType);

// Note/comment type
export const EventNoteType = {
	comment: "comment",
	update: "update",
	issue: "issue",
	decision: "decision",
	reminder: "reminder",
} as const;
export type EventNoteType = (typeof EventNoteType)[keyof typeof EventNoteType];
export const EventNoteTypes = Object.values(EventNoteType);

// Inventory item status
export const EventInventoryStatus = {
	needed: "needed",
	reserved: "reserved",
	acquired: "acquired",
	deployed: "deployed",
	returned: "returned",
} as const;
export type EventInventoryStatus =
	(typeof EventInventoryStatus)[keyof typeof EventInventoryStatus];
export const EventInventoryStatuses = Object.values(EventInventoryStatus);

// Risk severity level
export const EventRiskSeverity = {
	low: "low",
	medium: "medium",
	high: "high",
	critical: "critical",
} as const;
export type EventRiskSeverity =
	(typeof EventRiskSeverity)[keyof typeof EventRiskSeverity];
export const EventRiskSeverities = Object.values(EventRiskSeverity);

// Risk probability
export const EventRiskProbability = {
	unlikely: "unlikely",
	possible: "possible",
	likely: "likely",
	almostCertain: "almost_certain",
} as const;
export type EventRiskProbability =
	(typeof EventRiskProbability)[keyof typeof EventRiskProbability];
export const EventRiskProbabilities = Object.values(EventRiskProbability);

// Risk status
export const EventRiskStatus = {
	identified: "identified",
	mitigating: "mitigating",
	mitigated: "mitigated",
	occurred: "occurred",
	closed: "closed",
} as const;
export type EventRiskStatus =
	(typeof EventRiskStatus)[keyof typeof EventRiskStatus];
export const EventRiskStatuses = Object.values(EventRiskStatus);

// ============================================================================
// EVENT DISCOUNT ENUMS
// ============================================================================

// Discount value type (how the discount is calculated)
export const DiscountValueType = {
	percentage: "percentage", // Discount as percentage (1-100)
	fixed: "fixed", // Fixed amount in smallest currency unit
} as const;
export type DiscountValueType =
	(typeof DiscountValueType)[keyof typeof DiscountValueType];
export const DiscountValueTypes = Object.values(DiscountValueType);

// Discount mode (how the discount is activated)
export const DiscountMode = {
	code: "code", // Requires entering a promo code
	automatic: "automatic", // Applied automatically when conditions are met
} as const;
export type DiscountMode = (typeof DiscountMode)[keyof typeof DiscountMode];
export const DiscountModes = Object.values(DiscountMode);

// ============================================================================
// STOCK & PRODUCT ENUMS
// ============================================================================

// Product status
export const ProductStatus = {
	active: "active",
	inactive: "inactive",
	discontinued: "discontinued",
} as const;
export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];
export const ProductStatuses = Object.values(ProductStatus);

// Product category
export const ProductCategory = {
	beverage: "beverage", // Bebidas
	food: "food", // Alimentos
	apparel: "apparel", // Indumentaria
	equipment: "equipment", // Equipamiento vendible
	merchandise: "merchandise", // Merchandising
	supplement: "supplement", // Suplementos
	other: "other",
} as const;
export type ProductCategory =
	(typeof ProductCategory)[keyof typeof ProductCategory];
export const ProductCategories = Object.values(ProductCategory);

// Stock transaction type
export const StockTransactionType = {
	purchase: "purchase", // Compra de stock
	sale: "sale", // Venta
	adjustment: "adjustment", // Ajuste de inventario
	damage: "damage", // Merma/daño
	return: "return", // Devolución
	transfer: "transfer", // Transferencia entre ubicaciones
} as const;
export type StockTransactionType =
	(typeof StockTransactionType)[keyof typeof StockTransactionType];
export const StockTransactionTypes = Object.values(StockTransactionType);

// Sale status
export const SaleStatus = {
	pending: "pending",
	completed: "completed",
	cancelled: "cancelled",
	refunded: "refunded",
} as const;
export type SaleStatus = (typeof SaleStatus)[keyof typeof SaleStatus];
export const SaleStatuses = Object.values(SaleStatus);

// ============================================================================
// TRAINING EQUIPMENT ENUMS
// ============================================================================

// Training equipment status
export const TrainingEquipmentStatus = {
	available: "available", // Disponible para uso
	inUse: "in_use", // En uso
	maintenance: "maintenance", // En mantenimiento
	damaged: "damaged", // Dañado
	retired: "retired", // Dado de baja
} as const;
export type TrainingEquipmentStatus =
	(typeof TrainingEquipmentStatus)[keyof typeof TrainingEquipmentStatus];
export const TrainingEquipmentStatuses = Object.values(TrainingEquipmentStatus);

// Training equipment category
export const TrainingEquipmentCategory = {
	balls: "balls", // Pelotas
	cones: "cones", // Conos
	goals: "goals", // Arcos
	nets: "nets", // Redes
	hurdles: "hurdles", // Vallas
	ladders: "ladders", // Escaleras de agilidad
	markers: "markers", // Marcadores/discos
	bibs: "bibs", // Pecheras
	poles: "poles", // Palos/postes
	mats: "mats", // Colchonetas
	weights: "weights", // Pesas
	bands: "bands", // Bandas elásticas
	medical: "medical", // Equipamiento médico
	electronics: "electronics", // Cronómetros, GPS, etc.
	storage: "storage", // Bolsos, cajas
	other: "other",
} as const;
export type TrainingEquipmentCategory =
	(typeof TrainingEquipmentCategory)[keyof typeof TrainingEquipmentCategory];
export const TrainingEquipmentCategories = Object.values(
	TrainingEquipmentCategory,
);

// Equipment condition
export const EquipmentCondition = {
	new: "new",
	excellent: "excellent",
	good: "good",
	fair: "fair",
	poor: "poor",
} as const;
export type EquipmentCondition =
	(typeof EquipmentCondition)[keyof typeof EquipmentCondition];
export const EquipmentConditions = Object.values(EquipmentCondition);

// ============================================================================
// STAFF PAYROLL ENUMS
// ============================================================================

// Payroll period type
export const PayrollPeriodType = {
	monthly: "monthly",
	biweekly: "biweekly",
	weekly: "weekly",
	event: "event", // For event-specific payments
} as const;
export type PayrollPeriodType =
	(typeof PayrollPeriodType)[keyof typeof PayrollPeriodType];
export const PayrollPeriodTypes = Object.values(PayrollPeriodType);

// Payroll status
export const PayrollStatus = {
	pending: "pending", // Created but not approved
	approved: "approved", // Approved, waiting for payment
	paid: "paid", // Payment completed
	cancelled: "cancelled", // Cancelled
} as const;
export type PayrollStatus = (typeof PayrollStatus)[keyof typeof PayrollStatus];
export const PayrollStatuses = Object.values(PayrollStatus);

// Coach payment type (for coach payroll)
export const CoachPaymentType = {
	perSession: "per_session", // Pago por sesión dictada
	fixed: "fixed", // Monto fijo mensual
} as const;
export type CoachPaymentType =
	(typeof CoachPaymentType)[keyof typeof CoachPaymentType];
export const CoachPaymentTypes = Object.values(CoachPaymentType);

// Staff type for payroll (to differentiate between coaches and other staff)
export const PayrollStaffType = {
	coach: "coach",
	staff: "staff", // General staff (members with staff roles)
	external: "external", // External contractors
} as const;
export type PayrollStaffType =
	(typeof PayrollStaffType)[keyof typeof PayrollStaffType];
export const PayrollStaffTypes = Object.values(PayrollStaffType);

// Language proficiency level enum
export const LanguageProficiencyLevel = {
	native: "native", // Nativo
	fluent: "fluent", // Fluido
	advanced: "advanced", // Avanzado
	intermediate: "intermediate", // Intermedio
	basic: "basic", // Básico
} as const;
export type LanguageProficiencyLevel =
	(typeof LanguageProficiencyLevel)[keyof typeof LanguageProficiencyLevel];
export const LanguageProficiencyLevels = Object.values(
	LanguageProficiencyLevel,
);

// Athlete medical document type
export const AthleteMedicalDocumentType = {
	bloodTest: "blood_test", // Análisis de sangre
	cardiacStudy: "cardiac_study", // Estudio cardíaco / electrocardiograma
	xRay: "x_ray", // Radiografía
	mri: "mri", // Resonancia magnética
	ultrasound: "ultrasound", // Ecografía
	physicalExam: "physical_exam", // Examen físico
	injuryReport: "injury_report", // Informe de lesión
	surgeryReport: "surgery_report", // Informe quirúrgico
	rehabilitation: "rehabilitation", // Informe de rehabilitación
	vaccination: "vaccination", // Carnet de vacunación
	allergy: "allergy", // Informe de alergias
	other: "other", // Otro documento médico
} as const;
export type AthleteMedicalDocumentType =
	(typeof AthleteMedicalDocumentType)[keyof typeof AthleteMedicalDocumentType];
export const AthleteMedicalDocumentTypes = Object.values(
	AthleteMedicalDocumentType,
);

// ============================================================================
// EQUIPMENT INVENTORY AUDIT ENUMS
// ============================================================================

// Inventory audit status (workflow states)
export const EquipmentAuditStatus = {
	scheduled: "scheduled", // Auditoría programada
	inProgress: "in_progress", // En curso
	completed: "completed", // Completada
	cancelled: "cancelled", // Cancelada
} as const;
export type EquipmentAuditStatus =
	(typeof EquipmentAuditStatus)[keyof typeof EquipmentAuditStatus];
export const EquipmentAuditStatuses = Object.values(EquipmentAuditStatus);

// Inventory audit type (scope of audit)
export const EquipmentAuditType = {
	full: "full", // Auditoría completa
	partial: "partial", // Auditoría parcial (por categoría/ubicación)
	spot: "spot", // Auditoría puntual (items específicos)
} as const;
export type EquipmentAuditType =
	(typeof EquipmentAuditType)[keyof typeof EquipmentAuditType];
export const EquipmentAuditTypes = Object.values(EquipmentAuditType);

// Inventory count item status
export const EquipmentCountStatus = {
	pending: "pending", // Pendiente de conteo
	counted: "counted", // Contado
	verified: "verified", // Verificado (discrepancia revisada)
	adjusted: "adjusted", // Ajustado en inventario
	skipped: "skipped", // Omitido
} as const;
export type EquipmentCountStatus =
	(typeof EquipmentCountStatus)[keyof typeof EquipmentCountStatus];
export const EquipmentCountStatuses = Object.values(EquipmentCountStatus);

// ============================================================================
// EVENT ROTATION SCHEDULE ENUMS
// ============================================================================

// Time block type for event rotation schedule
export const EventTimeBlockType = {
	stationRotation: "station_rotation", // Groups rotate through stations
	break: "break", // Rest period for all groups
	generalActivity: "general_activity", // Event-wide activity (talks, ceremonies)
} as const;
export type EventTimeBlockType =
	(typeof EventTimeBlockType)[keyof typeof EventTimeBlockType];
export const EventTimeBlockTypes = Object.values(EventTimeBlockType);

// ============================================================================
// TEAM / SQUAD MANAGEMENT ENUMS
// ============================================================================

// Team status
export const TeamStatus = {
	active: "active",
	inactive: "inactive",
	archived: "archived",
} as const;
export type TeamStatus = (typeof TeamStatus)[keyof typeof TeamStatus];
export const TeamStatuses = Object.values(TeamStatus);

// Team member role (within the team)
export const TeamMemberRole = {
	captain: "captain",
	viceCaptain: "vice_captain",
	player: "player",
} as const;
export type TeamMemberRole =
	(typeof TeamMemberRole)[keyof typeof TeamMemberRole];
export const TeamMemberRoles = Object.values(TeamMemberRole);

// Team staff role (technical and support staff)
export const TeamStaffRole = {
	headCoach: "head_coach",
	assistantCoach: "assistant_coach",
	fitnessCoach: "fitness_coach",
	goalkeeperCoach: "goalkeeper_coach",
	analyst: "analyst",
	medic: "medic",
	physiotherapist: "physiotherapist",
	manager: "manager",
	kitManager: "kit_manager",
	other: "other",
} as const;
export type TeamStaffRole = (typeof TeamStaffRole)[keyof typeof TeamStaffRole];
export const TeamStaffRoles = Object.values(TeamStaffRole);

// Competition type
export const CompetitionType = {
	league: "league",
	tournament: "tournament",
	cup: "cup",
	friendly: "friendly",
	championship: "championship",
	playoff: "playoff",
	other: "other",
} as const;
export type CompetitionType =
	(typeof CompetitionType)[keyof typeof CompetitionType];
export const CompetitionTypes = Object.values(CompetitionType);

// Competition status
export const CompetitionStatus = {
	upcoming: "upcoming",
	inProgress: "in_progress",
	completed: "completed",
	cancelled: "cancelled",
} as const;
export type CompetitionStatus =
	(typeof CompetitionStatus)[keyof typeof CompetitionStatus];
export const CompetitionStatuses = Object.values(CompetitionStatus);

// Team competition status (inscription/registration status)
export const TeamCompetitionStatus = {
	registered: "registered",
	confirmed: "confirmed",
	withdrawn: "withdrawn",
	disqualified: "disqualified",
} as const;
export type TeamCompetitionStatus =
	(typeof TeamCompetitionStatus)[keyof typeof TeamCompetitionStatus];
export const TeamCompetitionStatuses = Object.values(TeamCompetitionStatus);

// Match status
export const MatchStatus = {
	scheduled: "scheduled",
	inProgress: "in_progress",
	completed: "completed",
	postponed: "postponed",
	cancelled: "cancelled",
} as const;
export type MatchStatus = (typeof MatchStatus)[keyof typeof MatchStatus];
export const MatchStatuses = Object.values(MatchStatus);

// Match result type (for our team perspective)
export const MatchResultType = {
	win: "win",
	loss: "loss",
	draw: "draw",
} as const;
export type MatchResultType =
	(typeof MatchResultType)[keyof typeof MatchResultType];
export const MatchResultTypes = Object.values(MatchResultType);

// ============================================================================
// SERVICE ENUMS
// ============================================================================

// Service status (for training service catalog)
export const ServiceStatus = {
	active: "active",
	inactive: "inactive",
	archived: "archived",
} as const;
export type ServiceStatus = (typeof ServiceStatus)[keyof typeof ServiceStatus];
export const ServiceStatuses = Object.values(ServiceStatus);

// ============================================================================
// ORGANIZATION FEATURE FLAGS
// ============================================================================

// Organization features that can be enabled/disabled per organization
// Used for feature flags to control which modules are available
export const OrganizationFeature = {
	// Sports
	athletes: "athletes",
	athleteGroups: "athlete_groups",
	coaches: "coaches",
	trainingSessions: "training_sessions",
	events: "events",
	eventTemplates: "event_templates",
	ageCategories: "age_categories",
	waitlist: "waitlist",
	equipment: "equipment",
	equipmentAudit: "equipment_audit",

	// Competitions
	teams: "teams",
	competitions: "competitions",
	matches: "matches",

	// Finance
	services: "services",
	payments: "payments",
	expenses: "expenses",
	cashRegister: "cash_register",
	products: "products",
	payroll: "payroll",

	// Reports
	financialReports: "financial_reports",
	sportsReports: "sports_reports",
	pendingReports: "pending_reports",

	// General
	locations: "locations",
	vendors: "vendors",
	sponsors: "sponsors",
	chatbot: "chatbot",
} as const;
export type OrganizationFeature =
	(typeof OrganizationFeature)[keyof typeof OrganizationFeature];
export const OrganizationFeatures = Object.values(OrganizationFeature);

// ============================================================================
// ATHLETE ACHIEVEMENT ENUMS
// ============================================================================

// Achievement type - the kind of accomplishment
export const AchievementType = {
	championship: "championship", // Campeonato/título
	award: "award", // Premio individual
	selection: "selection", // Selección (nacional, regional, etc.)
	record: "record", // Récord (personal, club, etc.)
	recognition: "recognition", // Reconocimiento/mención
	mvp: "mvp", // Jugador más valioso
	topScorer: "top_scorer", // Goleador/máximo anotador
	bestPlayer: "best_player", // Mejor jugador (de torneo, etc.)
	allStar: "all_star", // Selección de estrellas
	scholarship: "scholarship", // Beca deportiva
	other: "other",
} as const;
export type AchievementType =
	(typeof AchievementType)[keyof typeof AchievementType];
export const AchievementTypes = Object.values(AchievementType);

// Achievement scope - individual vs team/collective
export const AchievementScope = {
	individual: "individual", // Logro individual
	collective: "collective", // Logro colectivo (equipo/selección)
} as const;
export type AchievementScope =
	(typeof AchievementScope)[keyof typeof AchievementScope];
export const AchievementScopes = Object.values(AchievementScope);

// ============================================================================
// SESSION CONFIRMATION ENUMS
// ============================================================================

// Confirmation status for session reminders
export const ConfirmationStatus = {
	sent: "sent", // Notification sent
	delivered: "delivered", // Delivered (optional, if provider supports)
	failed: "failed", // Failed to send
	confirmed: "confirmed", // Athlete confirmed attendance
} as const;
export type ConfirmationStatus =
	(typeof ConfirmationStatus)[keyof typeof ConfirmationStatus];
export const ConfirmationStatuses = Object.values(ConfirmationStatus);

// Notification channel for confirmations
export const NotificationChannel = {
	email: "email",
	sms: "sms",
	whatsapp: "whatsapp",
} as const;
export type NotificationChannel =
	(typeof NotificationChannel)[keyof typeof NotificationChannel];
export const NotificationChannels = Object.values(NotificationChannel);

export function enumToPgEnum<T extends Record<string, string>>(myEnum: T) {
	return Object.values(myEnum).map((value) => value) as [
		T[keyof T],
		...T[keyof T][],
	];
}
