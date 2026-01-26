import type { MemberRole } from "@/lib/db/schema/enums";

/**
 * User capabilities for permission checking.
 * This interface represents the minimum info needed to determine permissions.
 */
export interface UserCapabilities {
	role: MemberRole;
	isCoach: boolean;
	isAthlete: boolean;
}

/**
 * Centralized permission helpers for organization-level authorization.
 *
 * These helpers provide a single source of truth for permission logic,
 * eliminating duplicated checks across components and routers.
 *
 * Role hierarchy (from most to least privileged):
 * - owner: Full access (billing, settings, everything)
 * - admin: Management access (almost everything except billing)
 * - staff: Operational access (manage sessions, athletes, day-to-day operations)
 * - member: Basic access (restricted view, only "My" pages)
 *
 * Note: isCoach/isAthlete are determined by the existence of profiles
 * in coachTable/athleteTable, not by the role in memberTable.
 */
export const Permissions = {
	/**
	 * Check if user has organization admin access (owner or admin role).
	 * Use for: settings, user management, billing, organization config.
	 */
	isOrgAdmin: (c: UserCapabilities): boolean =>
		c.role === "owner" || c.role === "admin",

	/**
	 * Check if user has staff-level access.
	 * Staff can manage day-to-day operations like sessions, athletes, etc.
	 * This includes: owner, admin, staff roles, OR anyone with a coach profile.
	 */
	isStaff: (c: UserCapabilities): boolean =>
		c.role === "owner" || c.role === "admin" || c.role === "staff" || c.isCoach,

	/**
	 * Check if user is a restricted member (athlete-only view).
	 * Restricted members can only access "My" pages (calendar, sessions, payments, etc.)
	 * A member with a coach profile is NOT restricted.
	 */
	isRestrictedMember: (c: UserCapabilities): boolean =>
		c.role === "member" && !c.isCoach,

	/**
	 * Check if user is the organization owner.
	 * Use for: billing, dangerous operations, ownership transfer.
	 */
	isOwner: (c: UserCapabilities): boolean => c.role === "owner",

	// Specific capability checks (for clarity and future extensibility)

	/**
	 * Can manage athletes (create, edit, delete).
	 */
	canManageAthletes: (c: UserCapabilities): boolean => Permissions.isStaff(c),

	/**
	 * Can manage training sessions.
	 */
	canManageSessions: (c: UserCapabilities): boolean => Permissions.isStaff(c),

	/**
	 * Can manage coaches.
	 */
	canManageCoaches: (c: UserCapabilities): boolean => Permissions.isOrgAdmin(c),

	/**
	 * Can manage events (create, edit, delete events).
	 */
	canManageEvents: (c: UserCapabilities): boolean => Permissions.isOrgAdmin(c),

	/**
	 * Can manage organization settings.
	 */
	canManageSettings: (c: UserCapabilities): boolean =>
		Permissions.isOrgAdmin(c),

	/**
	 * Can manage organization users (invite, remove, change roles).
	 */
	canManageUsers: (c: UserCapabilities): boolean => Permissions.isOrgAdmin(c),

	/**
	 * Can manage billing (subscriptions, payments).
	 * Only owners can manage billing.
	 */
	canManageBilling: (c: UserCapabilities): boolean => c.role === "owner",

	/**
	 * Can view reports and analytics.
	 */
	canViewReports: (c: UserCapabilities): boolean => Permissions.isOrgAdmin(c),

	/**
	 * Can manage cash register.
	 */
	canManageCashRegister: (c: UserCapabilities): boolean =>
		Permissions.isOrgAdmin(c),

	/**
	 * Can manage expenses.
	 */
	canManageExpenses: (c: UserCapabilities): boolean =>
		Permissions.isOrgAdmin(c),

	/**
	 * Can view their own coach sessions (if they are a coach).
	 */
	canViewOwnCoachSessions: (c: UserCapabilities): boolean => c.isCoach,

	/**
	 * Can view their own athlete data (if they are an athlete).
	 */
	canViewOwnAthleteData: (c: UserCapabilities): boolean => c.isAthlete,
} as const;

/**
 * Computed capabilities interface for use in React context.
 * These are pre-calculated values to avoid repeated permission checks in components.
 */
export interface ComputedCapabilities {
	isAdmin: boolean;
	isStaff: boolean;
	isRestrictedMember: boolean;
	isOwner: boolean;
}

/**
 * Calculate all capabilities for a user.
 * Use this in layouts to provide pre-computed permissions to components.
 */
export function computeCapabilities(c: UserCapabilities): ComputedCapabilities {
	return {
		isAdmin: Permissions.isOrgAdmin(c),
		isStaff: Permissions.isStaff(c),
		isRestrictedMember: Permissions.isRestrictedMember(c),
		isOwner: Permissions.isOwner(c),
	};
}
