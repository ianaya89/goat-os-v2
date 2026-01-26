/**
 * Generate a deterministic UUID for seeding.
 * Format: xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx
 * The prefix helps identify the entity type:
 * - 00000001 = users
 * - 00000002 = athletes
 * - 00000003 = coaches
 * - 00000004 = locations
 * - 00000005 = groups
 * - 00000006 = sessions
 * - 00000007 = payments
 * - 00000008 = events
 */
export function seedUUID(entityType: number, index: number): string {
	const typeHex = entityType.toString(16).padStart(8, "0");
	const indexHex = index.toString(16).padStart(12, "0");
	return `${typeHex}-0000-4000-8000-${indexHex}`;
}

// Entity type constants
export const ENTITY_USER = 1;
export const ENTITY_USER_MEMBER = 11;
export const ENTITY_ATHLETE = 2;
export const ENTITY_ATHLETE_USER = 21;
export const ENTITY_ATHLETE_MEMBER = 22;
export const ENTITY_COACH = 3;
export const ENTITY_COACH_USER = 31;
export const ENTITY_COACH_MEMBER = 32;
export const ENTITY_LOCATION = 4;
export const ENTITY_GROUP = 5;
export const ENTITY_GROUP_MEMBER = 51;
export const ENTITY_SESSION = 6;
export const ENTITY_SESSION_COACH = 61;
export const ENTITY_ATTENDANCE = 62;
export const ENTITY_PAYMENT = 7;
export const ENTITY_EVENT = 8;
export const ENTITY_EVENT_PRICING = 81;
export const ENTITY_EVENT_REGISTRATION = 82;
export const ENTITY_EVENT_PAYMENT = 83;
export const ENTITY_SPONSOR = 9;
export const ENTITY_SPONSOR_ASSIGNMENT = 91;
export const ENTITY_VENDOR = 10;
export const ENTITY_WAITLIST = 11;
export const ENTITY_EVENT_DISCOUNT = 84;

// Event organization entities
export const ENTITY_EVENT_ZONE = 100;
export const ENTITY_EVENT_CHECKLIST = 101;
export const ENTITY_EVENT_TASK = 102;
export const ENTITY_EVENT_STAFF = 103;
export const ENTITY_EVENT_STAFF_SHIFT = 104;
export const ENTITY_EVENT_BUDGET_LINE = 105;
export const ENTITY_EVENT_ORG_SPONSOR = 106;
export const ENTITY_EVENT_SPONSOR_BENEFIT = 107;
export const ENTITY_EVENT_MILESTONE = 108;
export const ENTITY_EVENT_DOCUMENT = 109;
export const ENTITY_EVENT_NOTE = 110;
export const ENTITY_EVENT_INVENTORY = 111;
export const ENTITY_EVENT_VENDOR_ASSIGNMENT = 112;
export const ENTITY_EVENT_RISK = 113;
export const ENTITY_EVENT_RISK_LOG = 114;
export const ENTITY_EVENT_ORG_VENDOR = 115;

// Stock and Equipment entities
export const ENTITY_PRODUCT = 120;
export const ENTITY_STOCK_TRANSACTION = 121;
export const ENTITY_SALE = 122;
export const ENTITY_SALE_ITEM = 123;
export const ENTITY_EQUIPMENT = 130;
export const ENTITY_EQUIPMENT_ASSIGNMENT = 131;
export const ENTITY_EQUIPMENT_MAINTENANCE = 132;
