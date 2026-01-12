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
