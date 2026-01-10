import { z } from "zod/v4";

// Rating validation (1-5)
const ratingSchema = z.number().int().min(1).max(5);

// Get evaluations for a session
export const getSessionEvaluationsSchema = z.object({
	sessionId: z.string().uuid(),
});

// Get evaluation history for an athlete
export const getAthleteEvaluationsSchema = z.object({
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

// Create or update evaluation
export const upsertEvaluationSchema = z.object({
	sessionId: z.string().uuid(),
	athleteId: z.string().uuid(),
	performanceRating: ratingSchema.optional().nullable(),
	performanceNotes: z
		.string()
		.trim()
		.max(2000, "Notes is too long")
		.optional()
		.nullable(),
	attitudeRating: ratingSchema.optional().nullable(),
	attitudeNotes: z
		.string()
		.trim()
		.max(2000, "Notes is too long")
		.optional()
		.nullable(),
	physicalFitnessRating: ratingSchema.optional().nullable(),
	physicalFitnessNotes: z
		.string()
		.trim()
		.max(2000, "Notes is too long")
		.optional()
		.nullable(),
	generalNotes: z
		.string()
		.trim()
		.max(5000, "Notes is too long")
		.optional()
		.nullable(),
});

// Bulk create/update evaluations for a session
export const bulkUpsertEvaluationsSchema = z.object({
	sessionId: z.string().uuid(),
	evaluations: z.array(
		z.object({
			athleteId: z.string().uuid(),
			performanceRating: ratingSchema.optional().nullable(),
			performanceNotes: z.string().trim().max(2000).optional().nullable(),
			attitudeRating: ratingSchema.optional().nullable(),
			attitudeNotes: z.string().trim().max(2000).optional().nullable(),
			physicalFitnessRating: ratingSchema.optional().nullable(),
			physicalFitnessNotes: z.string().trim().max(2000).optional().nullable(),
			generalNotes: z.string().trim().max(5000).optional().nullable(),
		}),
	),
});

// Delete evaluation
export const deleteEvaluationSchema = z.object({
	id: z.string().uuid(),
});

// Get evaluation by session and athlete
export const getEvaluationSchema = z.object({
	sessionId: z.string().uuid(),
	athleteId: z.string().uuid(),
});

// Get athlete average ratings
export const getAthleteAverageRatingsSchema = z.object({
	athleteId: z.string().uuid(),
	dateRange: z
		.object({
			from: z.coerce.date(),
			to: z.coerce.date(),
		})
		.optional(),
});

// Type exports
export type GetSessionEvaluationsInput = z.infer<
	typeof getSessionEvaluationsSchema
>;
export type GetAthleteEvaluationsInput = z.infer<
	typeof getAthleteEvaluationsSchema
>;
export type UpsertEvaluationInput = z.infer<typeof upsertEvaluationSchema>;
export type BulkUpsertEvaluationsInput = z.infer<
	typeof bulkUpsertEvaluationsSchema
>;
export type DeleteEvaluationInput = z.infer<typeof deleteEvaluationSchema>;
export type GetEvaluationInput = z.infer<typeof getEvaluationSchema>;
export type GetAthleteAverageRatingsInput = z.infer<
	typeof getAthleteAverageRatingsSchema
>;
