import { z } from "zod/v4";
import { AchievementScopes, AchievementTypes } from "@/lib/db/schema/enums";

// Create achievement
export const createCoachAchievementSchema = z.object({
	coachId: z.string().uuid(),
	title: z.string().min(1).max(200),
	type: z.enum(AchievementTypes as [string, ...string[]]),
	scope: z.enum(AchievementScopes as [string, ...string[]]),
	year: z.number().int().min(1900).max(2100),
	organization: z.string().max(200).optional(),
	team: z.string().max(200).optional(),
	competition: z.string().max(200).optional(),
	position: z.string().max(100).optional(),
	description: z.string().max(1000).optional(),
	isPublic: z.boolean().default(true),
	displayOrder: z.number().int().default(0),
});

// Update achievement
export const updateCoachAchievementSchema = z.object({
	id: z.string().uuid(),
	title: z.string().min(1).max(200).optional(),
	type: z.enum(AchievementTypes as [string, ...string[]]).optional(),
	scope: z.enum(AchievementScopes as [string, ...string[]]).optional(),
	year: z.number().int().min(1900).max(2100).optional(),
	organization: z.string().max(200).optional().nullable(),
	team: z.string().max(200).optional().nullable(),
	competition: z.string().max(200).optional().nullable(),
	position: z.string().max(100).optional().nullable(),
	description: z.string().max(1000).optional().nullable(),
	isPublic: z.boolean().optional(),
	displayOrder: z.number().int().optional(),
});

// Delete achievement
export const deleteCoachAchievementSchema = z.object({
	id: z.string().uuid(),
});

// List achievements for a coach
export const listCoachAchievementsSchema = z.object({
	coachId: z.string().uuid(),
	publicOnly: z.boolean().default(false),
});

// Reorder achievements (for drag-and-drop)
export const reorderCoachAchievementsSchema = z.object({
	coachId: z.string().uuid(),
	orderedIds: z.array(z.string().uuid()),
});

// Type exports
export type CreateCoachAchievementInput = z.infer<
	typeof createCoachAchievementSchema
>;
export type UpdateCoachAchievementInput = z.infer<
	typeof updateCoachAchievementSchema
>;
export type DeleteCoachAchievementInput = z.infer<
	typeof deleteCoachAchievementSchema
>;
export type ListCoachAchievementsInput = z.infer<
	typeof listCoachAchievementsSchema
>;
export type ReorderCoachAchievementsInput = z.infer<
	typeof reorderCoachAchievementsSchema
>;
