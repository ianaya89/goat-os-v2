import { z } from "zod/v4";

// Rating validation (1-10)
const rpeRatingSchema = z.number().int().min(1).max(10);
const satisfactionRatingSchema = z.number().int().min(1).max(10);

// Get my feedback for a session (athlete)
export const getMySessionFeedbackSchema = z.object({
	sessionId: z.string().uuid(),
});

// Submit/update feedback (athlete)
export const upsertSessionFeedbackSchema = z.object({
	sessionId: z.string().uuid(),
	rpeRating: rpeRatingSchema.nullish(),
	satisfactionRating: satisfactionRatingSchema.nullish(),
	notes: z.string().trim().max(2000, "Notes is too long").nullish(),
});

// Get all feedback for a session (coach view)
export const getSessionFeedbackListSchema = z.object({
	sessionId: z.string().uuid(),
});

// Get feedback history for an athlete (coach view)
export const getAthleteFeedbackHistorySchema = z.object({
	athleteId: z.string().uuid(),
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
	dateRange: z
		.object({
			from: z.coerce.date(),
			to: z.coerce.date(),
		})
		.optional(),
});

// Get average RPE/satisfaction for an athlete
export const getAthleteAverageFeedbackSchema = z.object({
	athleteId: z.string().uuid(),
	dateRange: z
		.object({
			from: z.coerce.date(),
			to: z.coerce.date(),
		})
		.optional(),
});

// Type exports
export type GetMySessionFeedbackInput = z.infer<
	typeof getMySessionFeedbackSchema
>;
export type UpsertSessionFeedbackInput = z.infer<
	typeof upsertSessionFeedbackSchema
>;
export type GetSessionFeedbackListInput = z.infer<
	typeof getSessionFeedbackListSchema
>;
export type GetAthleteFeedbackHistoryInput = z.infer<
	typeof getAthleteFeedbackHistorySchema
>;
export type GetAthleteAverageFeedbackInput = z.infer<
	typeof getAthleteAverageFeedbackSchema
>;
