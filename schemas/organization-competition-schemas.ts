import { z } from "zod/v4";
import {
	AthleteSport,
	CompetitionStatus,
	CompetitionType,
	TeamCompetitionStatus,
} from "@/lib/db/schema/enums";

// Sortable fields for competitions
export const CompetitionSortField = z.enum([
	"name",
	"type",
	"status",
	"startDate",
	"createdAt",
]);
export type CompetitionSortField = z.infer<typeof CompetitionSortField>;

// List competitions with filters
export const listCompetitionsSchema = z.object({
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
	query: z.string().optional(),
	sortBy: CompetitionSortField.default("startDate"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
	filters: z
		.object({
			type: z.array(z.nativeEnum(CompetitionType)).optional(),
			status: z.array(z.nativeEnum(CompetitionStatus)).optional(),
			sport: z.array(z.nativeEnum(AthleteSport)).optional(),
			seasonId: z.string().uuid().optional().nullable(),
		})
		.optional(),
});

// Get single competition
export const getCompetitionSchema = z.object({
	id: z.string().uuid(),
});

// Create competition
export const createCompetitionSchema = z.object({
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
	type: z.nativeEnum(CompetitionType),
	sport: z.nativeEnum(AthleteSport).optional().nullable(),
	seasonId: z.string().uuid().optional().nullable(),
	startDate: z.coerce.date().optional().nullable(),
	endDate: z.coerce.date().optional().nullable(),
	status: z.nativeEnum(CompetitionStatus).default(CompetitionStatus.upcoming),
	logoKey: z.string().optional().nullable(),
	externalId: z.string().max(200).optional().nullable(),
	venue: z.string().max(500).optional().nullable(),
	rules: z.string().max(5000).optional().nullable(),
});

// Update competition
export const updateCompetitionSchema = z.object({
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
	type: z.nativeEnum(CompetitionType).optional(),
	sport: z.nativeEnum(AthleteSport).optional().nullable(),
	seasonId: z.string().uuid().optional().nullable(),
	startDate: z.coerce.date().optional().nullable(),
	endDate: z.coerce.date().optional().nullable(),
	status: z.nativeEnum(CompetitionStatus).optional(),
	logoKey: z.string().optional().nullable(),
	externalId: z.string().max(200).optional().nullable(),
	venue: z.string().max(500).optional().nullable(),
	rules: z.string().max(5000).optional().nullable(),
});

// Delete competition
export const deleteCompetitionSchema = z.object({
	id: z.string().uuid(),
});

// ============================================================================
// TEAM COMPETITION (REGISTRATION)
// ============================================================================

// Register team to competition
export const registerTeamToCompetitionSchema = z.object({
	teamId: z.string().uuid(),
	competitionId: z.string().uuid(),
	division: z.string().max(100).optional().nullable(),
	seedPosition: z.number().int().positive().optional().nullable(),
});

// Withdraw team from competition
export const withdrawTeamFromCompetitionSchema = z.object({
	teamId: z.string().uuid(),
	competitionId: z.string().uuid(),
});

// Update team competition registration
export const updateTeamCompetitionSchema = z.object({
	id: z.string().uuid(),
	status: z.nativeEnum(TeamCompetitionStatus).optional(),
	division: z.string().max(100).optional().nullable(),
	seedPosition: z.number().int().positive().optional().nullable(),
	finalPosition: z.number().int().positive().optional().nullable(),
	notes: z.string().max(1000).optional().nullable(),
});

// Update team competition stats
export const updateTeamCompetitionStatsSchema = z.object({
	id: z.string().uuid(),
	points: z.number().int().optional(),
	wins: z.number().int().min(0).optional(),
	draws: z.number().int().min(0).optional(),
	losses: z.number().int().min(0).optional(),
	goalsFor: z.number().int().min(0).optional(),
	goalsAgainst: z.number().int().min(0).optional(),
});

// Get competition standings
export const getCompetitionStandingsSchema = z.object({
	competitionId: z.string().uuid(),
	division: z.string().optional(),
});

// Type exports
export type ListCompetitionsInput = z.infer<typeof listCompetitionsSchema>;
export type GetCompetitionInput = z.infer<typeof getCompetitionSchema>;
export type CreateCompetitionInput = z.infer<typeof createCompetitionSchema>;
export type UpdateCompetitionInput = z.infer<typeof updateCompetitionSchema>;
export type DeleteCompetitionInput = z.infer<typeof deleteCompetitionSchema>;
export type RegisterTeamToCompetitionInput = z.infer<
	typeof registerTeamToCompetitionSchema
>;
export type WithdrawTeamFromCompetitionInput = z.infer<
	typeof withdrawTeamFromCompetitionSchema
>;
export type UpdateTeamCompetitionInput = z.infer<
	typeof updateTeamCompetitionSchema
>;
export type UpdateTeamCompetitionStatsInput = z.infer<
	typeof updateTeamCompetitionStatsSchema
>;
export type GetCompetitionStandingsInput = z.infer<
	typeof getCompetitionStandingsSchema
>;
