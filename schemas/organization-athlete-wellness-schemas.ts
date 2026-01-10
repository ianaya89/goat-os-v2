import { z } from "zod/v4";

// Create wellness survey (athlete fills this out daily)
export const createWellnessSurveySchema = z.object({
	sleepHours: z.number().min(0).max(1440), // stored as minutes (e.g., 480 = 8 hours)
	sleepQuality: z.number().int().min(1).max(10),
	fatigue: z.number().int().min(1).max(10), // 1 = fresh, 10 = exhausted
	muscleSoreness: z.number().int().min(1).max(10),
	mood: z.number().int().min(1).max(10),
	stressLevel: z.number().int().min(1).max(10),
	energy: z.number().int().min(1).max(10),
	notes: z.string().max(1000).optional(),
});

// List wellness surveys for an athlete
export const listWellnessSurveysSchema = z.object({
	athleteId: z.string().uuid(),
	limit: z.number().min(1).max(100).default(30),
	offset: z.number().min(0).default(0),
});

// Get today's wellness survey for an athlete
export const getTodayWellnessSchema = z.object({
	athleteId: z.string().uuid(),
});

// Get wellness stats (averages) for an athlete
export const getWellnessStatsSchema = z.object({
	athleteId: z.string().uuid(),
	days: z.number().int().min(1).max(90).default(7), // Last N days
});

// Type exports
export type CreateWellnessSurveyInput = z.infer<typeof createWellnessSurveySchema>;
export type ListWellnessSurveysInput = z.infer<typeof listWellnessSurveysSchema>;
export type GetTodayWellnessInput = z.infer<typeof getTodayWellnessSchema>;
export type GetWellnessStatsInput = z.infer<typeof getWellnessStatsSchema>;
