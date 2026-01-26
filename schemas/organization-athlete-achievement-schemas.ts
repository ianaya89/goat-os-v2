import { z } from "zod/v4";
import { AchievementScopes, AchievementTypes } from "@/lib/db/schema/enums";

// Create achievement
export const createAchievementSchema = z.object({
	athleteId: z.string().uuid(),
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
export const updateAchievementSchema = z.object({
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
export const deleteAchievementSchema = z.object({
	id: z.string().uuid(),
});

// List achievements for an athlete
export const listAchievementsSchema = z.object({
	athleteId: z.string().uuid(),
	publicOnly: z.boolean().default(false),
});

// Reorder achievements (for drag-and-drop)
export const reorderAchievementsSchema = z.object({
	athleteId: z.string().uuid(),
	orderedIds: z.array(z.string().uuid()),
});

// Type exports
export type CreateAchievementInput = z.infer<typeof createAchievementSchema>;
export type UpdateAchievementInput = z.infer<typeof updateAchievementSchema>;
export type DeleteAchievementInput = z.infer<typeof deleteAchievementSchema>;
export type ListAchievementsInput = z.infer<typeof listAchievementsSchema>;
export type ReorderAchievementsInput = z.infer<
	typeof reorderAchievementsSchema
>;
