import { z } from "zod/v4";
import {
	AthleteSport,
	TeamMemberRole,
	TeamStaffRole,
	TeamStatus,
} from "@/lib/db/schema/enums";

// Sortable fields for teams
export const TeamSortField = z.enum([
	"name",
	"sport",
	"status",
	"memberCount",
	"createdAt",
]);
export type TeamSortField = z.infer<typeof TeamSortField>;

// List teams with filters
export const listTeamsSchema = z.object({
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
	query: z.string().optional(),
	sortBy: TeamSortField.default("createdAt"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
	filters: z
		.object({
			status: z.array(z.nativeEnum(TeamStatus)).optional(),
			sport: z.array(z.nativeEnum(AthleteSport)).optional(),
			seasonId: z.string().uuid().optional().nullable(),
			ageCategoryId: z.string().uuid().optional(),
		})
		.optional(),
});

// Get single team
export const getTeamSchema = z.object({
	id: z.string().uuid(),
});

// Create team
export const createTeamSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Name is required")
		.max(200, "Name is too long"),
	description: z
		.string()
		.trim()
		.max(2000, "Description is too long")
		.optional()
		.nullable(),
	sport: z.nativeEnum(AthleteSport).optional().nullable(),
	seasonId: z.string().uuid().optional().nullable(),
	ageCategoryId: z.string().uuid().optional().nullable(),
	logoKey: z.string().optional().nullable(),
	primaryColor: z.string().optional().nullable(),
	secondaryColor: z.string().optional().nullable(),
	status: z.nativeEnum(TeamStatus).default(TeamStatus.active),
	homeVenue: z.string().max(500).optional().nullable(),
	// Initial member IDs (optional)
	memberIds: z.array(z.string().uuid()).optional(),
});

// Update team
export const updateTeamSchema = z.object({
	id: z.string().uuid(),
	name: z
		.string()
		.trim()
		.min(1, "Name is required")
		.max(200, "Name is too long")
		.optional(),
	description: z
		.string()
		.trim()
		.max(2000, "Description is too long")
		.optional()
		.nullable(),
	sport: z.nativeEnum(AthleteSport).optional().nullable(),
	seasonId: z.string().uuid().optional().nullable(),
	ageCategoryId: z.string().uuid().optional().nullable(),
	logoKey: z.string().optional().nullable(),
	primaryColor: z.string().optional().nullable(),
	secondaryColor: z.string().optional().nullable(),
	status: z.nativeEnum(TeamStatus).optional(),
	homeVenue: z.string().max(500).optional().nullable(),
});

// Delete team
export const deleteTeamSchema = z.object({
	id: z.string().uuid(),
});

// Bulk delete teams
export const bulkDeleteTeamsSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
});

// Bulk update teams status
export const bulkUpdateTeamsStatusSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
	status: z.nativeEnum(TeamStatus),
});

// ============================================================================
// TEAM MEMBERS
// ============================================================================

// Add members to team
export const addTeamMembersSchema = z.object({
	teamId: z.string().uuid(),
	members: z
		.array(
			z.object({
				athleteId: z.string().uuid(),
				jerseyNumber: z.number().int().positive().optional().nullable(),
				position: z.string().max(100).optional().nullable(),
				role: z.nativeEnum(TeamMemberRole).default(TeamMemberRole.player),
			}),
		)
		.min(1),
});

// Remove members from team
export const removeTeamMembersSchema = z.object({
	teamId: z.string().uuid(),
	athleteIds: z.array(z.string().uuid()).min(1),
});

// Update team member
export const updateTeamMemberSchema = z.object({
	id: z.string().uuid(),
	jerseyNumber: z.number().int().positive().optional().nullable(),
	position: z.string().max(100).optional().nullable(),
	role: z.nativeEnum(TeamMemberRole).optional(),
	notes: z.string().max(1000).optional().nullable(),
});

// Set team members (replace all)
export const setTeamMembersSchema = z.object({
	teamId: z.string().uuid(),
	members: z.array(
		z.object({
			athleteId: z.string().uuid(),
			jerseyNumber: z.number().int().positive().optional().nullable(),
			position: z.string().max(100).optional().nullable(),
			role: z.nativeEnum(TeamMemberRole).default(TeamMemberRole.player),
		}),
	),
});

// ============================================================================
// TEAM STAFF
// ============================================================================

// Add staff to team
export const addTeamStaffSchema = z.object({
	teamId: z.string().uuid(),
	coachId: z.string().uuid().optional().nullable(),
	userId: z.string().uuid().optional().nullable(),
	role: z.nativeEnum(TeamStaffRole),
	title: z.string().max(200).optional().nullable(),
	isPrimary: z.boolean().default(false),
	notes: z.string().max(1000).optional().nullable(),
});

// Remove staff from team
export const removeTeamStaffSchema = z.object({
	id: z.string().uuid(),
});

// Update team staff
export const updateTeamStaffSchema = z.object({
	id: z.string().uuid(),
	role: z.nativeEnum(TeamStaffRole).optional(),
	title: z.string().max(200).optional().nullable(),
	isPrimary: z.boolean().optional(),
	notes: z.string().max(1000).optional().nullable(),
});

// List teams by athlete
export const listTeamsByAthleteSchema = z.object({
	athleteId: z.string().uuid(),
});

// Type exports
export type ListTeamsByAthleteInput = z.infer<typeof listTeamsByAthleteSchema>;
export type ListTeamsInput = z.infer<typeof listTeamsSchema>;
export type GetTeamInput = z.infer<typeof getTeamSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type DeleteTeamInput = z.infer<typeof deleteTeamSchema>;
export type BulkDeleteTeamsInput = z.infer<typeof bulkDeleteTeamsSchema>;
export type BulkUpdateTeamsStatusInput = z.infer<
	typeof bulkUpdateTeamsStatusSchema
>;
export type AddTeamMembersInput = z.infer<typeof addTeamMembersSchema>;
export type RemoveTeamMembersInput = z.infer<typeof removeTeamMembersSchema>;
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;
export type SetTeamMembersInput = z.infer<typeof setTeamMembersSchema>;
export type AddTeamStaffInput = z.infer<typeof addTeamStaffSchema>;
export type RemoveTeamStaffInput = z.infer<typeof removeTeamStaffSchema>;
export type UpdateTeamStaffInput = z.infer<typeof updateTeamStaffSchema>;
