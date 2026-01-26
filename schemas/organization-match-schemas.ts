import { z } from "zod/v4";
import { MatchResultType, MatchStatus } from "@/lib/db/schema/enums";

// Sortable fields for matches
export const MatchSortField = z.enum(["scheduledAt", "status", "createdAt"]);
export type MatchSortField = z.infer<typeof MatchSortField>;

// List matches with filters
export const listMatchesSchema = z.object({
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
	query: z.string().optional(),
	sortBy: MatchSortField.default("scheduledAt"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
	filters: z
		.object({
			status: z.array(z.nativeEnum(MatchStatus)).optional(),
			competitionId: z.string().uuid().optional().nullable(),
			teamId: z.string().uuid().optional(),
			dateFrom: z.coerce.date().optional(),
			dateTo: z.coerce.date().optional(),
		})
		.optional(),
});

// List matches by team
export const listMatchesByTeamSchema = z.object({
	teamId: z.string().uuid(),
	limit: z.number().min(1).max(100).default(20),
	offset: z.number().min(0).default(0),
	status: z.array(z.nativeEnum(MatchStatus)).optional(),
});

// List upcoming matches
export const listUpcomingMatchesSchema = z.object({
	limit: z.number().min(1).max(50).default(10),
	teamId: z.string().uuid().optional(),
});

// List recent matches
export const listRecentMatchesSchema = z.object({
	limit: z.number().min(1).max(50).default(10),
	teamId: z.string().uuid().optional(),
});

// Get single match
export const getMatchSchema = z.object({
	id: z.string().uuid(),
});

// Create match
export const createMatchSchema = z.object({
	competitionId: z.string().uuid().optional().nullable(),
	homeTeamId: z.string().uuid().optional().nullable(),
	awayTeamId: z.string().uuid().optional().nullable(),
	opponentName: z.string().max(200).optional().nullable(),
	isHomeGame: z.boolean().default(true),
	scheduledAt: z.coerce.date(),
	status: z.nativeEnum(MatchStatus).default(MatchStatus.scheduled),
	venue: z.string().max(500).optional().nullable(),
	locationId: z.string().uuid().optional().nullable(),
	round: z.string().max(100).optional().nullable(),
	matchday: z.number().int().positive().optional().nullable(),
	referee: z.string().max(200).optional().nullable(),
	preMatchNotes: z.string().max(2000).optional().nullable(),
});

// Update match
export const updateMatchSchema = z.object({
	id: z.string().uuid(),
	competitionId: z.string().uuid().optional().nullable(),
	homeTeamId: z.string().uuid().optional().nullable(),
	awayTeamId: z.string().uuid().optional().nullable(),
	opponentName: z.string().max(200).optional().nullable(),
	isHomeGame: z.boolean().optional(),
	scheduledAt: z.coerce.date().optional(),
	status: z.nativeEnum(MatchStatus).optional(),
	venue: z.string().max(500).optional().nullable(),
	locationId: z.string().uuid().optional().nullable(),
	round: z.string().max(100).optional().nullable(),
	matchday: z.number().int().positive().optional().nullable(),
	referee: z.string().max(200).optional().nullable(),
	preMatchNotes: z.string().max(2000).optional().nullable(),
	postMatchNotes: z.string().max(2000).optional().nullable(),
	highlights: z.string().max(5000).optional().nullable(),
});

// Update match result
export const updateMatchResultSchema = z.object({
	id: z.string().uuid(),
	homeScore: z.number().int().min(0),
	awayScore: z.number().int().min(0),
	homeScoreHT: z.number().int().min(0).optional().nullable(),
	awayScoreHT: z.number().int().min(0).optional().nullable(),
	result: z.nativeEnum(MatchResultType).optional().nullable(),
	attendance: z.number().int().min(0).optional().nullable(),
	postMatchNotes: z.string().max(2000).optional().nullable(),
});

// Start match
export const startMatchSchema = z.object({
	id: z.string().uuid(),
});

// End match
export const endMatchSchema = z.object({
	id: z.string().uuid(),
	homeScore: z.number().int().min(0),
	awayScore: z.number().int().min(0),
	result: z.nativeEnum(MatchResultType).optional().nullable(),
});

// Delete match
export const deleteMatchSchema = z.object({
	id: z.string().uuid(),
});

// Get team calendar (matches and events)
export const getTeamCalendarSchema = z.object({
	teamId: z.string().uuid(),
	startDate: z.coerce.date(),
	endDate: z.coerce.date(),
});

// Type exports
export type ListMatchesInput = z.infer<typeof listMatchesSchema>;
export type ListMatchesByTeamInput = z.infer<typeof listMatchesByTeamSchema>;
export type ListUpcomingMatchesInput = z.infer<
	typeof listUpcomingMatchesSchema
>;
export type ListRecentMatchesInput = z.infer<typeof listRecentMatchesSchema>;
export type GetMatchInput = z.infer<typeof getMatchSchema>;
export type CreateMatchInput = z.infer<typeof createMatchSchema>;
export type UpdateMatchInput = z.infer<typeof updateMatchSchema>;
export type UpdateMatchResultInput = z.infer<typeof updateMatchResultSchema>;
export type StartMatchInput = z.infer<typeof startMatchSchema>;
export type EndMatchInput = z.infer<typeof endMatchSchema>;
export type DeleteMatchInput = z.infer<typeof deleteMatchSchema>;
export type GetTeamCalendarInput = z.infer<typeof getTeamCalendarSchema>;
